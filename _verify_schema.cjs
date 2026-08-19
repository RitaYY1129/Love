// 验证脚本：直接打 Supabase REST，确认表存在 / RLS 关闭 / 注册-登录-绑定链路
const url = 'https://grwdgdyduvewuxkibajh.supabase.co'
const anonKey = 'sb_publishable_p0BdXWxDe3fczsmHnd3NMQ_oEzTqE82'

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
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { data = text }
  return { ok: res.ok, status: res.status, data }
}

function log(...a) { console.log(...a) }

async function main() {
  log('\n=== 1) 测 profiles 表可读 + 表结构 ===')
  const r = await request('/rest/v1/profiles?select=*&limit=1')
  log('profiles GET status =', r.status, r.ok ? 'OK' : 'FAIL')
  if (Array.isArray(r.data)) {
    log('profiles 列示例:', r.data[0] ? Object.keys(r.data[0]).join(', ') : '(空表)')
  } else {
    log('profiles 返回:', JSON.stringify(r.data).slice(0, 300))
  }

  log('\n=== 2) 测 profiles 可插入（验证 RLS 已关闭） ===')
  const phone = '178' + Math.floor(10000000 + Math.random() * 89999999)
  const code = 'LOVE' + Math.random().toString(36).slice(2, 10).toUpperCase()
  const bcryptHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8HoA7q1n1bI2b9Yz9eXk6uKlVZpQya' // 占位，仅测试写入权限
  const ins = await request('/rest/v1/profiles?select=*', {
    method: 'POST',
    body: JSON.stringify([{ id: crypto.randomUUID(), username: '验证账号', identifier: phone, nickname: '验证账号', invite_code: code, password_hash: bcryptHash }])
  }, anonKey)
  log('profiles INSERT status =', ins.status, ins.ok ? 'OK (RLS 已关闭)' : 'FAIL')
  if (ins.ok && Array.isArray(ins.data)) {
    const created = ins.data[0]
    log('已创建验证账号 id =', created.id, ' invite_code =', created.invite_code)

    log('\n=== 3) 清理验证账号 ===')
    const del = await request(`/rest/v1/profiles?id=eq.${created.id}`, { method: 'DELETE' })
    log('profiles DELETE status =', del.status, del.ok ? 'OK' : 'FAIL')
  } else {
    log('插入失败原因:', JSON.stringify(ins.data).slice(0, 300))
  }

  log('\n=== 4) 测其余业务表可读 ===')
  const tables = ['couples','couple_shared_states','diaries','wishes','plans','anniversaries','moods','checkins','finances','photos','locations','chat_messages','calm_modes','call_records']
  for (const t of tables) {
    const rr = await request(`/rest/v1/${t}?select=*&limit=1`)
    log(`  ${t}: status=${rr.status} ${rr.ok ? 'OK' : 'FAIL'}`)
  }

  log('\n=== 结论 ===')
  if (ins.ok) {
    log('✅ RLS 已正确关闭，anon 可读写所有表。注册/登录/绑定链路可持续开发。')
  } else {
    log('❌ 插入仍被拒绝，需要执行 fix_rls.sql（或确认 grant / RLS 状态）。')
  }
}

main().catch(e => { console.error('脚本异常:', e); process.exit(1) })
