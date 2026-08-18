const { spawn } = require('child_process');
const { io } = require('socket.io-client');
const { query, pool } = require('../config/db');

const port = 3101;
const baseUrl = `http://127.0.0.1:${port}/api`;
const phone = `199${String(Date.now()).slice(-8)}`;
const partnerPhone = `198${String(Date.now() + 1).slice(-8)}`;
let server;
let callerSocket;
let receiverSocket;

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  return data;
};

const waitForServer = async () => {
  for (let i = 0; i < 100; i += 1) {
    try {
      await request('/health');
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error('测试服务器启动超时');
};

const connectCallSocket = token => new Promise((resolve, reject) => {
  const socket = io(`http://127.0.0.1:${port}`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false
  });
  socket.once('connect', () => resolve(socket));
  socket.once('connect_error', reject);
});

const onceEvent = (socket, event) => new Promise(resolve => socket.once(event, resolve));
const emitAck = (socket, event, payload) => new Promise(resolve => socket.emit(event, payload, resolve));

const run = async () => {
  server = spawn(process.execPath, ['server.js'], {
    cwd: require('path').resolve(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SMS_PROVIDER: 'console',
      PORT: String(port)
    },
    stdio: ['ignore', 'inherit', 'inherit']
  });

  await waitForServer();
  const sent = await request('/auth/sms/send', {
    method: 'POST',
    body: JSON.stringify({ phone, purpose: 'login' })
  });
  if (!sent.devCode) throw new Error('测试模式没有返回验证码');

  const login = await request('/auth/sms/login', {
    method: 'POST',
    body: JSON.stringify({ phone, code: sent.devCode })
  });
  if (!login.token || !login.user?.id) throw new Error('登录响应不完整');

  const profile = await request('/auth/profile', {
    headers: { authorization: `Bearer ${login.token}` }
  });
  if (!profile.user?.id) throw new Error('鉴权接口未返回用户');

  const partnerSent = await request('/auth/sms/send', {
    method: 'POST',
    body: JSON.stringify({ phone: partnerPhone, purpose: 'login' })
  });
  const partnerLogin = await request('/auth/sms/login', {
    method: 'POST',
    body: JSON.stringify({ phone: partnerPhone, code: partnerSent.devCode })
  });
  const partnerProfile = await request('/auth/profile', {
    headers: { authorization: `Bearer ${partnerLogin.token}` }
  });
  await request('/auth/partner/bind', {
    method: 'POST',
    headers: { authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ partnerCode: partnerProfile.user.invite_code })
  });
  await request('/auth/profile', {
    method: 'PUT',
    headers: { authorization: `Bearer ${login.token}` },
    body: JSON.stringify({
      nickname: '同步测试用户',
      avatar: 'data:image/png;base64,dGVzdA==',
      profile_data: {
        gender: 'female',
        birthday: '2000-05-20',
        signature: '个人资料保存测试',
        city: '杭州',
        sleepTime: '23:30',
        wakeTime: '07:30',
        communicationStyle: '随时分享',
        conflictStyle: '先抱抱再聊',
        datePreference: '吃喝探店',
        loveLanguages: ['专注陪伴'],
        hobbies: ['电影', '旅行'],
        favoriteFood: '火锅',
        dislikes: '香菜'
      }
    })
  });
  const updatedProfile = await request('/auth/profile', {
    headers: { authorization: `Bearer ${login.token}` }
  });
  if (
    updatedProfile.user?.profile_data?.signature !== '个人资料保存测试'
    || updatedProfile.user?.profile_data?.hobbies?.[1] !== '旅行'
    || !updatedProfile.user?.avatar
  ) {
    throw new Error('个人资料保存或重新读取失败');
  }
  const syncedPartnerProfile = await request('/auth/profile', {
    headers: { authorization: `Bearer ${partnerLogin.token}` }
  });
  if (
    syncedPartnerProfile.user?.partner?.nickname !== '同步测试用户'
    || syncedPartnerProfile.user?.partner?.profile_data?.communicationStyle !== '随时分享'
  ) {
    throw new Error('情侣绑定资料没有双向同步');
  }

  const sentMessage = await request('/chat', {
    method: 'POST',
    headers: { authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ type: 'text', content: '双账号聊天联调消息' })
  });
  const receivedMessages = await request('/chat', {
    headers: { authorization: `Bearer ${partnerLogin.token}` }
  });
  if (!receivedMessages.messages?.some((item) => item.id === sentMessage.message.id && !item.isMine)) {
    throw new Error('另一半没有收到聊天消息');
  }

  const sharing = await request('/sharing/preferences', {
    headers: { authorization: `Bearer ${login.token}` }
  });
  if (!sharing.effective?.fund || sharing.effective?.diary || sharing.effective?.device_activity) {
    throw new Error('默认共享与隐私策略不正确');
  }
  await request('/sharing/state/fund', {
    method: 'PUT',
    headers: { authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ payload: { accounts: [{ id: 'joint', balance: 520 }] } })
  });
  const partnerFund = await request('/sharing/state/fund', {
    headers: { authorization: `Bearer ${partnerLogin.token}` }
  });
  if (partnerFund.payload?.accounts?.[0]?.balance !== 520) {
    throw new Error('情侣共享内容没有同步');
  }

  await request('/sharing/preferences', {
    method: 'PUT',
    headers: { authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ device_activity: true })
  });
  const partnerGuardianSharing = await request('/sharing/preferences', {
    method: 'PUT',
    headers: { authorization: `Bearer ${partnerLogin.token}` },
    body: JSON.stringify({ device_activity: true })
  });
  if (!partnerGuardianSharing.effective?.device_activity) {
    throw new Error('守护动态没有等待双方授权');
  }
  await request('/sharing/state/device_activity', {
    method: 'PUT',
    headers: { authorization: `Bearer ${login.token}` },
    body: JSON.stringify({
      payload: {
        [String(login.user.id)]: {
          collectedAt: Date.now(),
          totalDurationMs: 1_200_000,
          apps: [{ appName: '测试应用', durationMs: 1_200_000 }],
          screenEvents: []
        }
      }
    })
  });
  const partnerGuardianState = await request('/sharing/state/device_activity', {
    headers: { authorization: `Bearer ${partnerLogin.token}` }
  });
  if (partnerGuardianState.payload?.[String(login.user.id)]?.apps?.[0]?.appName !== '测试应用') {
    throw new Error('守护动态没有同步给另一半');
  }

  // 覆盖单人数据模块的完整增删改查，并验证情侣共享权限与双向读取。
  const auth = { authorization: `Bearer ${login.token}` };
  const partnerAuth = { authorization: `Bearer ${partnerLogin.token}` };
  const createUpdateDelete = async (path, payload, updatePayload, key) => {
    const created = await request(path, { method: 'POST', headers: auth, body: JSON.stringify(payload) });
    const item = created[key];
    if (!item?.id) throw new Error(`${path} 创建未返回记录`);
    const updated = await request(`${path}/${item.id}`, { method: 'PUT', headers: auth, body: JSON.stringify(updatePayload) });
    if (updated[key]?.title !== updatePayload.title && updated[key]?.name !== updatePayload.name) {
      throw new Error(`${path} 更新未生效`);
    }
    await request(`${path}/${item.id}`, { method: 'DELETE', headers: auth });
  };

  const diary = await request('/diaries', { method: 'POST', headers: auth, body: JSON.stringify({ title: '测试日记', content: '初始内容' }) });
  await request(`/diaries/${diary.diary.id}`, { method: 'PUT', headers: auth, body: JSON.stringify({ title: '已更新日记', content: '已更新内容' }) });
  const fetchedDiary = await request(`/diaries/${diary.diary.id}`, { headers: auth });
  if (fetchedDiary.content !== '已更新内容') throw new Error('日记读取或更新失败');
  await request(`/diaries/${diary.diary.id}`, { method: 'DELETE', headers: auth });

  const mood = await request('/moods', { method: 'POST', headers: auth, body: JSON.stringify({ score: 5, emoji: '😊', note: '测试心情' }) });
  await request('/moods', { method: 'POST', headers: auth, body: JSON.stringify({ score: 4, emoji: '🙂', note: '更新心情' }) });
  const moodStats = await request('/moods/stats', { headers: auth });
  if (mood.mood?.id === undefined || moodStats.total !== 1 || moodStats.avgScore === undefined) throw new Error('心情记录或统计失败');

  const checkin = await request('/checkins', { method: 'POST', headers: auth });
  const repeatCheckin = await request('/checkins', { method: 'POST', headers: auth });
  const checkinStats = await request('/checkins/stats', { headers: auth });
  if (!checkin.success || repeatCheckin.success || checkinStats.total !== 1) throw new Error('打卡或重复打卡校验失败');

  await createUpdateDelete('/wishes', { title: '测试愿望', description: '初始描述', targetDate: '2030-01-01' }, { title: '已更新愿望' }, 'wish');
  await createUpdateDelete('/plans', { title: '测试计划', description: '初始描述', targetDate: '2030-01-01' }, { title: '已更新计划' }, 'plan');
  await createUpdateDelete('/anniversaries', { name: '测试纪念日', date: '2030-05-20', type: 'custom' }, { name: '已更新纪念日' }, 'anniversary');
  const photo = await request('/photos', { method: 'POST', headers: auth, body: JSON.stringify({ url: 'data:image/png;base64,dGVzdA==', title: '测试照片' }) });
  await request(`/photos/${photo.photo.id}`, { method: 'PUT', headers: auth, body: JSON.stringify({ title: '已更新照片' }) });
  await request(`/photos/${photo.photo.id}`, { method: 'DELETE', headers: auth });

  await request('/locations', { method: 'POST', headers: auth, body: JSON.stringify({ latitude: 30.2741, longitude: 120.1551, address: '测试位置', shared: true }) });
  const deniedLocation = await fetch(`${baseUrl}/locations/partner`, { headers: partnerAuth });
  if (deniedLocation.status !== 403) throw new Error('位置共享未正确阻止未授权读取');
  await request('/sharing/preferences', { method: 'PUT', headers: auth, body: JSON.stringify({ location: true }) });
  await request('/sharing/preferences', { method: 'PUT', headers: partnerAuth, body: JSON.stringify({ location: true }) });
  const partnerLocation = await request('/locations/partner', { headers: partnerAuth });
  if (Number(partnerLocation?.latitude) !== 30.2741) throw new Error('情侣位置共享失败');

  for (const moduleKey of ['anniversary', 'wishes', 'plans', 'photos', 'checkin', 'location']) {
    await request(`/sharing/state/${moduleKey}`, { method: 'PUT', headers: auth, body: JSON.stringify({ payload: { moduleKey, synced: true } }) });
    const state = await request(`/sharing/state/${moduleKey}`, { headers: partnerAuth });
    if (!state.payload?.synced) throw new Error(`情侣 ${moduleKey} 共享状态未同步`);
  }

  const privateDiary = await fetch(`${baseUrl}/sharing/state/diary`, { headers: partnerAuth });
  if (privateDiary.status !== 403) throw new Error('日记默认隐私权限失效');
  await request('/sharing/preferences', { method: 'PUT', headers: auth, body: JSON.stringify({ diary: true, mood: true }) });
  await request('/sharing/preferences', { method: 'PUT', headers: partnerAuth, body: JSON.stringify({ diary: true, mood: true }) });
  for (const moduleKey of ['diary', 'mood']) {
    await request(`/sharing/state/${moduleKey}`, { method: 'PUT', headers: auth, body: JSON.stringify({ payload: { moduleKey, privateOptIn: true } }) });
    const state = await request(`/sharing/state/${moduleKey}`, { headers: partnerAuth });
    if (!state.payload?.privateOptIn) throw new Error(`情侣 ${moduleKey} 授权后未同步`);
  }

  callerSocket = await connectCallSocket(login.token);
  receiverSocket = await connectCallSocket(partnerLogin.token);
  const incomingCallPromise = onceEvent(receiverSocket, 'call:incoming');
  const inviteResult = await emitAck(callerSocket, 'call:invite', { callType: 'video' });
  if (!inviteResult.ok || !inviteResult.call?.id) throw new Error('视频通话呼叫失败');
  const incomingCall = await incomingCallPromise;
  if (incomingCall.call?.id !== inviteResult.call.id) throw new Error('另一半没有收到视频来电');

  const acceptedPromise = onceEvent(callerSocket, 'call:accepted');
  const acceptResult = await emitAck(receiverSocket, 'call:accept', { callId: inviteResult.call.id });
  if (!acceptResult.ok) throw new Error('视频通话接听失败');
  await acceptedPromise;

  const signalPromise = onceEvent(receiverSocket, 'call:signal');
  callerSocket.emit('call:signal', {
    callId: inviteResult.call.id,
    signal: { type: 'offer', sdp: 'smoke-test-offer' }
  });
  const relayedSignal = await signalPromise;
  if (relayedSignal.signal?.sdp !== 'smoke-test-offer') throw new Error('WebRTC 信令没有转发');

  const endedPromise = onceEvent(receiverSocket, 'call:ended');
  const endResult = await emitAck(callerSocket, 'call:end', { callId: inviteResult.call.id });
  if (!endResult.ok) throw new Error('挂断通话失败');
  await endedPromise;
  const callHistory = await request('/calls', {
    headers: { authorization: `Bearer ${partnerLogin.token}` }
  });
  if (!callHistory.calls?.some(call => call.id === inviteResult.call.id && call.status === 'ended')) {
    throw new Error('通话结束后没有生成聊天记录');
  }

  await request('/calm-mode/request', {
    method: 'POST',
    headers: { authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ durationHours: 1 })
  });
  const pending = await request('/calm-mode', {
    headers: { authorization: `Bearer ${partnerLogin.token}` }
  });
  if (pending.calmMode?.status !== 'pending') throw new Error('冷静模式邀请状态错误');
  await request(`/calm-mode/${pending.calmMode.id}/accept`, {
    method: 'POST',
    headers: { authorization: `Bearer ${partnerLogin.token}` }
  });
  await request(`/calm-mode/${pending.calmMode.id}/exit`, {
    method: 'POST',
    headers: { authorization: `Bearer ${login.token}` }
  });

  console.log('Mobile auth smoke test passed.');
};

run()
  .catch((error) => {
    console.error('Mobile auth smoke test failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    callerSocket?.disconnect();
    receiverSocket?.disconnect();
    if (server) server.kill();
    await query('DELETE FROM sms_verification_codes WHERE phone IN (?, ?)', [phone, partnerPhone]);
    await query('DELETE FROM users WHERE phone IN (?, ?)', [phone, partnerPhone]);
    await pool.end();
  });
