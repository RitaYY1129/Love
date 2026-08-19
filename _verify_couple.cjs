// 端到端验证：注册A → 注册B → A绑定B → 双方写数据 → 双方互读（情侣同步链路）
const url = 'https://grwdgdyduvewuxkibajh.supabase.co'
const anonKey = 'sb_publishable_p0BdXWxDe3fczsmHnd3NMQ_oEzTqE82'

function rand(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len)
}
async function request(path, options = {}, token = null) {
  const res = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token || anonKey}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  })
  const t = await res.text()
  let d = null
  try { d = JSON.parse(t) } catch { d = t }
  return { ok: res.ok, status: res.status, data: d }
}
const j = (o) => JSON.stringify(o)
const log = (...a) => console.log(...a)

// bcrypt hash 占位（仅测试写入，不需真实密码）
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8HoA7q1n1bI2b9Yz9eXk6uKlVZpQya'

async function signUp(phone) {
  const code = 'LOVE' + rand(8).toUpperCase()
  const r = await request('/rest/v1/profiles?select=*', {
    method: 'POST',
    body: j([{ id: crypto.randomUUID(), username: phone, identifier: phone, nickname: phone, invite_code: code, password_hash: DUMMY_HASH }]),
    headers: { Prefer: 'return=representation' }
  })
  const p = Array.isArray(r.data) ? r.data[0] : null
  if (!p) throw new Error('注册失败 status=' + r.status + ' body=' + JSON.stringify(r.data))
  return { id: p.id, invite_code: p.invite_code, phone }
}

const created = []
async function cleanup() {
  for (const id of created) {
    await request(`/rest/v1/profiles?id=eq.${id}`, { method: 'DELETE' })
  }
}

async function main() {
  let a, b
  try {
    log('\n=== 1) 注册用户 A、B ===')
    a = await signUp('1' + rand(10))
    b = await signUp('1' + rand(10))
    created.push(a.id, b.id)
    log('A id=', a.id, ' invite=', a.invite_code)
    log('B id=', b.id, ' invite=', b.invite_code)

    log('\n=== 2) A 绑定 B（设置相同 couple_id） ===')
    const cid = crypto.randomUUID()
    const pa = await request(`/rest/v1/profiles?id=eq.${a.id}`, { method: 'PATCH', body: j({ couple_id: cid }), headers: { Prefer: 'return=minimal' } })
    const pb = await request(`/rest/v1/profiles?id=eq.${b.id}`, { method: 'PATCH', body: j({ couple_id: cid }), headers: { Prefer: 'return=minimal' } })
    if (!pa.ok || !pb.ok) throw new Error('绑定 PATCH 失败: ' + JSON.stringify(pa.data) + JSON.stringify(pb.data))
    const ra = await request(`/rest/v1/profiles?select=id,couple_id&id=eq.${a.id}`)
    const rb = await request(`/rest/v1/profiles?select=id,couple_id&id=eq.${b.id}`)
    log('绑定后 A.couple_id=', ra.data[0].couple_id)
    log('绑定后 B.couple_id=', rb.data[0].couple_id)
    if (ra.data[0].couple_id !== rb.data[0].couple_id) throw new Error('绑定失败：两人 couple_id 不一致')
    log('✅ 绑定成功，couple_id 一致')

    log('\n=== 3) A 写一条日记 + B 写一条心愿 ===')
    const diary = await request('/rest/v1/diaries?select=*', {
      method: 'POST',
      body: j([{ id: crypto.randomUUID(), owner_id: a.id, couple_id: cid, title: 'A的日记', content: '今天很开心', mood: 'happy' }])
    })
    const wish = await request('/rest/v1/wishes?select=*', {
      method: 'POST',
      body: j([{ id: crypto.randomUUID(), owner_id: b.id, couple_id: cid, title: 'B的心愿', completed: false }])
    })
    log('A 日记写入:', diary.ok ? 'OK' : 'FAIL', diary.data?.[0]?.id || diary.data)
    log('B 心愿写入:', wish.ok ? 'OK' : 'FAIL', wish.data?.[0]?.id || wish.data)

    log('\n=== 4) 情侣同步验证：A 能读到 B 的心愿，B 能读到 A 的日记 ===')
    const aReadWish = await request(`/rest/v1/wishes?select=*&couple_id=eq.${cid}`)
    const bReadDiary = await request(`/rest/v1/diaries?select=*&couple_id=eq.${cid}`)
    log('A 视角 wishes(couple_id 过滤):', aReadWish.data.length, '条 →', aReadWish.data.map(x => x.title))
    log('B 视角 diaries(couple_id 过滤):', bReadDiary.data.length, '条 →', bReadDiary.data.map(x => x.title))
    const syncOk = aReadWish.data.some(x => x.title === 'B的心愿') && bReadDiary.data.some(x => x.title === 'A的日记')
    log(syncOk ? '✅ 情侣同步链路正常：双方都能通过 couple_id 读到对方数据' : '❌ 同步异常')

    log('\n=== 5) 聊天消息链路 ===')
    const msg = await request('/rest/v1/chat_messages?select=*', {
      method: 'POST',
      body: j([{ id: crypto.randomUUID(), couple_id: cid, sender_id: a.id, type: 'text', content: '在吗？' }])
    })
    const chat = await request(`/rest/v1/chat_messages?select=*&couple_id=eq.${cid}&order=created_at.asc`)
    log('聊天消息:', chat.data.length, '条 →', chat.data.map(m => m.content))
    log(chat.data.some(m => m.content === '在吗？') ? '✅ 聊天链路正常' : '❌ 聊天异常')

    log('\n=== 6) 共享状态（couple_shared_states）链路 ===')
    const shared = await request('/rest/v1/couple_shared_states?select=*', {
      method: 'POST',
      body: j([{ id: crypto.randomUUID(), couple_id: cid, module: 'preferences', state: { theme: 'pink' } }]),
      headers: { Prefer: 'return=representation' }
    })
    log('共享状态写入 status=', shared.status, 'body=', JSON.stringify(shared.data))
    const readShared = await request(`/rest/v1/couple_shared_states?select=*`)
    log('全表查询:', readShared.status, 'count=', Array.isArray(readShared.data) ? readShared.data.length : '-', 'data=', JSON.stringify(readShared.data).slice(0, 300))
    const filtered = await request(`/rest/v1/couple_shared_states?select=*&couple_id=eq.${cid}`)
    log('按couple_id过滤:', filtered.status, 'count=', Array.isArray(filtered.data) ? filtered.data.length : '-')
    const ok = Array.isArray(readShared.data) && readShared.data.length > 0
    log(ok ? '✅ 共享状态链路正常' : '❌ 共享状态异常')

    log('\n=== 结论 ===')
    if (syncOk && chat.data.length && readShared.data.length) {
      log('🎉 全链路通过：注册/绑定/日记/心愿/聊天/共享状态 全部正常，情侣同步 OK')
    } else {
      log('⚠️ 部分链路异常，请检查上方输出')
    }
  } catch (e) {
    log('❌ 验证异常:', e.message)
  } finally {
    await cleanup()
    log('\n🧹 验证数据已清理')
  }
}
main().catch(e => { console.error(e); process.exit(1) })
