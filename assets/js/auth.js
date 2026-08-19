/* ===========================================
   恋爱日记 - 本地账户系统 v2.0
   支持手机号/验证码/微信授权/配对绑定
   =========================================== */
var Auth = {
  USERS_KEY: 'loveDiary_users',
  SESSION_KEY: 'loveDiary_session',
  CODES_KEY: 'loveDiary_sms_codes', // 模拟短信验证码

  getUsers: function() {
    try { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; }
    catch(e) { return []; }
  },

  saveUsers: function(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  getCurrentUser: function() {
    try {
      var session = localStorage.getItem(this.SESSION_KEY);
      if (!session) return null;
      var data = JSON.parse(session);
      if (Date.now() - data.loginTime > 30 * 24 * 3600 * 1000) {
        this.logout();
        return null;
      }
      return data;
    } catch(e) { return null; }
  },

  /* 生成6位配对码 */
  generateBindCode: function() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = '';
    for (var i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /* 获取或创建配对码 */
  getBindCode: function(username) {
    var codes = {};
    try { codes = JSON.parse(localStorage.getItem('loveDiary_bindCodes')) || {}; } catch(e) {}
    if (!codes[username]) {
      codes[username] = this.generateBindCode();
      localStorage.setItem('loveDiary_bindCodes', JSON.stringify(codes));
    }
    return codes[username];
  },

  /* 通过配对码查找用户 */
  findUserByBindCode: function(code) {
    var codes = {};
    try { codes = JSON.parse(localStorage.getItem('loveDiary_bindCodes')) || {}; } catch(e) {}
    for (var username in codes) {
      if (codes[username] === code) return username;
    }
    return null;
  },

  /* 发送验证码（模拟） */
  sendSmsCode: function(phone) {
    var code = '';
    for (var i = 0; i < 6; i++) { code += Math.floor(Math.random() * 10).toString(); }
    var codes = {};
    try { codes = JSON.parse(localStorage.getItem(this.CODES_KEY)) || {}; } catch(e) {}
    codes[phone] = { code: code, time: Date.now() };
    localStorage.setItem(this.CODES_KEY, JSON.stringify(codes));
    // 实际项目中这里调用短信API（阿里云/腾讯云）
    console.log('SMS code for ' + phone + ': ' + code);
    return code; // 开发模式返回验证码
  },

  /* 验证短信码 */
  verifySmsCode: function(phone, code) {
    var codes = {};
    try { codes = JSON.parse(localStorage.getItem(this.CODES_KEY)) || {}; } catch(e) {}
    var record = codes[phone];
    if (!record) return false;
    if (Date.now() - record.time > 5 * 60 * 1000) return false; // 5分钟过期
    return record.code === code;
  },

  /* 手机号+验证码登录 */
  loginByCode: function(phone, code) {
    if (!phone || !/^\d{11}$/.test(phone)) return { ok: false, msg: '请输入正确的手机号' };
    if (!code) return { ok: false, msg: '请输入验证码' };
    if (!this.verifySmsCode(phone, code)) return { ok: false, msg: '验证码错误或已过期' };

    var users = this.getUsers();
    var user = users.find(function(u) { return u.phone === phone; });
    if (!user) {
      // 自动注册
      user = { username: phone, phone: phone, nickname: '用户' + phone.slice(-4), avatar: '👤', createdAt: Date.now() };
      users.push(user);
      this.saveUsers(users);
    }
    this._startSession(user);
    return { ok: true, msg: '登录成功', user: this._safeUser(user) };
  },

  /* 手机号+密码登录 */
  loginByPassword: function(phone, password) {
    if (!phone || !password) return { ok: false, msg: '请输入手机号和密码' };
    var users = this.getUsers();
    var user = users.find(function(u) { return u.phone === phone || u.username === phone; });
    if (!user) return { ok: false, msg: '账号不存在' };
    if (user.password !== this._hash(password)) return { ok: false, msg: '密码错误' };
    this._startSession(user);
    return { ok: true, msg: '登录成功', user: this._safeUser(user) };
  },

  /* 微信登录（模拟，实际需接入微信SDK） */
  loginByWeChat: function() {
    // 实际项目中使用微信JS-SDK或OAuth2.0
    // 这里模拟微信授权流程
    var mockOpenid = 'wx_' + Date.now().toString(36);
    var users = this.getUsers();
    var user = users.find(function(u) { return u.wxOpenid === mockOpenid; });
    if (!user) {
      user = { username: mockOpenid, phone: '', nickname: '微信用户', avatar: '😊', wxOpenid: mockOpenid, createdAt: Date.now() };
      users.push(user);
      this.saveUsers(users);
    }
    this._startSession(user);
    return { ok: true, msg: '微信登录成功', user: this._safeUser(user) };
  },

  /* 注册 */
  register: function(phone, code, nickname, password) {
    if (!phone || !/^\d{11}$/.test(phone)) return { ok: false, msg: '请输入正确的手机号' };
    if (!code) return { ok: false, msg: '请输入验证码' };
    if (!this.verifySmsCode(phone, code)) return { ok: false, msg: '验证码错误或已过期' };
    if (!password || password.length < 6) return { ok: false, msg: '密码至少6位' };

    var users = this.getUsers();
    var exists = users.find(function(u) { return u.phone === phone; });
    if (exists) return { ok: false, msg: '该手机号已注册' };

    var user = {
      username: phone,
      phone: phone,
      password: this._hash(password),
      nickname: nickname || ('用户' + phone.slice(-4)),
      avatar: '👤',
      createdAt: Date.now()
    };
    users.push(user);
    this.saveUsers(users);
    this._startSession(user);
    return { ok: true, msg: '注册成功', user: this._safeUser(user) };
  },

  /* 绑定爱人 */
  bindPartner: function(myUsername, partnerCode) {
    if (!partnerCode || partnerCode.length !== 6) return { ok: false, msg: '请输入正确的配对码' };
    var partnerUsername = this.findUserByBindCode(partnerCode);
    if (!partnerUsername) return { ok: false, msg: '配对码不存在' };
    if (partnerUsername === myUsername) return { ok: false, msg: '不能绑定自己' };

    var users = this.getUsers();
    var me = users.find(function(u) { return u.username === myUsername; });
    var partner = users.find(function(u) { return u.username === partnerUsername; });
    if (!me || !partner) return { ok: false, msg: '用户不存在' };

    me.partner = partnerUsername;
    partner.partner = myUsername;
    this.saveUsers(users);

    // 更新session
    var session = this.getCurrentUser();
    if (session) {
      session.partner = partnerUsername;
      session.partnerNickname = partner.nickname;
      session.partnerAvatar = partner.avatar;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
    return { ok: true, msg: '绑定成功！', partner: { username: partnerUsername, nickname: partner.nickname, avatar: partner.avatar } };
  },

  /* 解除绑定 */
  unbindPartner: function() {
    var session = this.getCurrentUser();
    if (!session) return { ok: false, msg: '请先登录' };
    var users = this.getUsers();
    var me = users.find(function(u) { return u.username === session.username; });
    if (me && me.partner) {
      var partner = users.find(function(u) { return u.username === me.partner; });
      if (partner) { delete partner.partner; }
      delete me.partner;
      this.saveUsers(users);
    }
    delete session.partner;
    delete session.partnerNickname;
    delete session.partnerAvatar;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return { ok: true, msg: '已解除绑定' };
  },

  /* 修改密码 */
  changePassword: function(oldPwd, newPwd) {
    var session = this.getCurrentUser();
    if (!session) return { ok: false, msg: '请先登录' };
    var users = this.getUsers();
    var idx = users.findIndex(function(u) { return u.username === session.username; });
    if (users[idx].password && users[idx].password !== this._hash(oldPwd)) return { ok: false, msg: '原密码错误' };
    users[idx].password = this._hash(newPwd);
    this.saveUsers(users);
    return { ok: true, msg: '密码修改成功' };
  },

  /* 更新资料 */
  updateProfile: function(data) {
    var session = this.getCurrentUser();
    if (!session) return { ok: false, msg: '请先登录' };
    var users = this.getUsers();
    var idx = users.findIndex(function(u) { return u.username === session.username; });
    if (data.nickname) users[idx].nickname = data.nickname;
    if (data.avatar) users[idx].avatar = data.avatar;
    if (data.phone) users[idx].phone = data.phone;
    this.saveUsers(users);
    session.nickname = users[idx].nickname;
    session.avatar = users[idx].avatar;
    session.phone = users[idx].phone;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return { ok: true, msg: '资料已更新' };
  },

  logout: function() {
    localStorage.removeItem(this.SESSION_KEY);
  },

  _hash: function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
  },

  _startSession: function(user) {
    var session = {
      username: user.username,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      partner: user.partner || null,
      loginTime: Date.now()
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  },

  _safeUser: function(user) {
    return { username: user.username, phone: user.phone, nickname: user.nickname, avatar: user.avatar, partner: user.partner };
  }
};
