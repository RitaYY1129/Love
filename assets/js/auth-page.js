/* ===========================================
   登录页面交互逻辑 v2.0
   =========================================== */
(function() {
  // 如果已登录，直接进 App
  if (Auth.getCurrentUser() && !location.search.includes('logout')) {
    document.addEventListener('DOMContentLoaded', function() { showApp(); });
    return;
  }

  document.addEventListener('DOMContentLoaded', function() { initAuthPage(); });

  var loginMode = 'code'; // 'code' | 'password'

  function initAuthPage() {
    // Tab 切换
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var target = tab.getAttribute('data-tab');
        document.querySelectorAll('.auth-form, #form-bind').forEach(function(f) { f.classList.add('hidden'); });
        if (target === 'login') {
          document.getElementById('form-login').classList.remove('hidden');
        } else {
          document.getElementById('form-register').classList.remove('hidden');
        }
        hideMsg();
      });
    });

    // 登录模式切换
    document.getElementById('switchToPwd').addEventListener('click', function(e) {
      e.preventDefault();
      loginMode = 'password';
      document.getElementById('loginCode').style.display = 'none';
      document.getElementById('btnSendCode').style.display = 'none';
      document.getElementById('loginPwdGroup').style.display = 'block';
      document.getElementById('switchToPwd').style.color = 'var(--color-primary)';
      document.getElementById('switchToCode').style.color = 'var(--text-secondary)';
    });
    document.getElementById('switchToCode').addEventListener('click', function(e) {
      e.preventDefault();
      loginMode = 'code';
      document.getElementById('loginCode').style.display = 'block';
      document.getElementById('btnSendCode').style.display = 'block';
      document.getElementById('loginPwdGroup').style.display = 'none';
      document.getElementById('switchToCode').style.color = 'var(--color-primary)';
      document.getElementById('switchToPwd').style.color = 'var(--text-secondary)';
    });

    // 发送验证码 - 登录
    document.getElementById('btnSendCode').addEventListener('click', function() {
      var phone = document.getElementById('loginPhone').value.trim();
      if (!/^\d{11}$/.test(phone)) { showMsg('loginMsg', '请输入正确的手机号', 'error'); return; }
      var code = Auth.sendSmsCode(phone);
      showMsg('loginMsg', '验证码已发送：' + code, 'success'); // 开发模式显示验证码
      this.disabled = true;
      var sec = 60;
      this.textContent = sec + 's后重试';
      var timer = setInterval(function() {
        sec--;
        if (sec <= 0) { clearInterval(timer); document.getElementById('btnSendCode').disabled = false; document.getElementById('btnSendCode').textContent = '获取验证码'; }
        else { document.getElementById('btnSendCode').textContent = sec + 's后重试'; }
      }, 1000);
    });

    // 发送验证码 - 注册
    document.getElementById('btnSendCodeReg').addEventListener('click', function() {
      var phone = document.getElementById('regPhone').value.trim();
      if (!/^\d{11}$/.test(phone)) { showMsg('regMsg', '请输入正确的手机号', 'error'); return; }
      var code = Auth.sendSmsCode(phone);
      showMsg('regMsg', '验证码已发送：' + code, 'success');
      this.disabled = true;
      var sec = 60;
      this.textContent = sec + 's后重试';
      var timer = setInterval(function() {
        sec--;
        if (sec <= 0) { clearInterval(timer); document.getElementById('btnSendCodeReg').disabled = false; document.getElementById('btnSendCodeReg').textContent = '获取验证码'; }
        else { document.getElementById('btnSendCodeReg').textContent = sec + 's后重试'; }
      }, 1000);
    });

    // 登录
    document.getElementById('btnLogin').addEventListener('click', function() {
      var phone = document.getElementById('loginPhone').value.trim();
      if (loginMode === 'code') {
        var code = document.getElementById('loginCode').value.trim();
        var res = Auth.loginByCode(phone, code);
        if (res.ok) { showMsg('loginMsg', '登录成功！', 'success'); setTimeout(function() { showApp(); }, 800); }
        else { showMsg('loginMsg', res.msg, 'error'); }
      } else {
        var pwd = document.getElementById('loginPwd').value;
        var res = Auth.loginByPassword(phone, pwd);
        if (res.ok) { showMsg('loginMsg', '登录成功！', 'success'); setTimeout(function() { showApp(); }, 800); }
        else { showMsg('loginMsg', res.msg, 'error'); }
      }
    });

    // 注册
    document.getElementById('btnRegister').addEventListener('click', function() {
      var phone = document.getElementById('regPhone').value.trim();
      var code = document.getElementById('regCode').value.trim();
      var nick = document.getElementById('regNick').value.trim();
      var pwd = document.getElementById('regPwd').value;
      var res = Auth.register(phone, code, nick, pwd);
      if (res.ok) { showMsg('regMsg', '注册成功！', 'success'); setTimeout(function() { showApp(); }, 800); }
      else { showMsg('regMsg', res.msg, 'error'); }
    });

    // 微信登录
    document.getElementById('btnWeChatLogin').addEventListener('click', function() {
      var res = Auth.loginByWeChat();
      if (res.ok) { showMsg('loginMsg', '微信登录成功！', 'success'); setTimeout(function() { showApp(); }, 800); }
    });
    document.getElementById('btnWeChatRegister').addEventListener('click', function() {
      var res = Auth.loginByWeChat();
      if (res.ok) { showMsg('regMsg', '微信注册成功！', 'success'); setTimeout(function() { showApp(); }, 800); }
    });

    // 绑定
    document.getElementById('btnBind').addEventListener('click', function() {
      var session = Auth.getCurrentUser();
      if (!session) { showMsg('bindMsg', '请先登录', 'error'); return; }
      var code = document.getElementById('bindCode').value.trim().toUpperCase();
      var res = Auth.bindPartner(session.username, code);
      if (res.ok) { showMsg('bindMsg', '绑定成功！💕', 'success'); setTimeout(function() { location.reload(); }, 1500); }
      else { showMsg('bindMsg', res.msg, 'error'); }
    });

    // 复制配对码
    document.getElementById('btnCopyCode').addEventListener('click', function() {
      var code = document.getElementById('myBindCode').textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(function() {
          document.getElementById('btnCopyCode').textContent = '已复制！';
          setTimeout(function() { document.getElementById('btnCopyCode').textContent = '复制配对码发给TA'; }, 2000);
        });
      }
    });

    // 回车提交
    document.getElementById('loginCode').addEventListener('keydown', function(e) { if (e.key === 'Enter') document.getElementById('btnLogin').click(); });
    document.getElementById('loginPwd').addEventListener('keydown', function(e) { if (e.key === 'Enter') document.getElementById('btnLogin').click(); });
    document.getElementById('regPwd').addEventListener('keydown', function(e) { if (e.key === 'Enter') document.getElementById('btnRegister').click(); });
  }

  function showMsg(id, text, type) {
    var el = document.getElementById(id);
    el.textContent = text;
    el.className = 'auth-msg show ' + type;
  }

  function hideMsg() {
    document.querySelectorAll('.auth-msg').forEach(function(m) { m.classList.remove('show'); });
  }

  function showApp() {
    var authPage = document.getElementById('authPage');
    if (authPage) {
      authPage.classList.add('hidden');
      setTimeout(function() { authPage.style.display = 'none'; }, 400);
    }
    var app = document.getElementById('app');
    if (app) app.style.display = 'flex';
    window.__authComplete = true;
    if (typeof App !== 'undefined') App.init();
  }

  
function showBindPage() {
  // Hide all forms and show bind form
  var forms = document.querySelectorAll('.auth-form, #form-bind');
  forms.forEach(function(f) { f.classList.add('hidden'); });
  var bindForm = document.getElementById('form-bind');
  if (bindForm) bindForm.classList.remove('hidden');
  
  // Hide tabs
  var tabs = document.querySelector('.auth-tabs');
  if (tabs) tabs.style.display = 'none';
  
  // Generate bind code
  var session = Auth.getCurrentUser();
  if (session) {
    var code = Auth.getBindCode(session.username);
    var el = document.getElementById('myBindCode');
    if (el) el.textContent = code;
  }
  
  // Add back button if not exists
  if (!document.getElementById('bindBackBtn')) {
    var backBtn = document.createElement('button');
    backBtn.id = 'bindBackBtn';
    backBtn.className = 'auth-back';
    backBtn.textContent = '? ??';
    backBtn.onclick = function() {
      tabs.style.display = 'flex';
      bindForm.classList.add('hidden');
      document.getElementById('form-login').classList.remove('hidden');
      backBtn.remove();
    };
    document.querySelector('.auth-card').prepend(backBtn);
  }
}
window.AuthPage = { showApp: showApp, showBindPage: showBindPage };
})();
