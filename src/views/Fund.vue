<template>
  <div class="fund-container">
    <div class="fund-header">
      <div class="header-left" @click="goBack">
        <span class="back-icon">←</span>
      </div>
      <div class="header-center">
        <h1 class="page-title">恋爱基金</h1>
      </div>
      <div class="header-right"></div>
    </div>

    <div class="fund-content">
      <div class="total-card">
        <div class="total-bg"></div>
        <div class="total-content">
          <div class="total-label">共同基金余额</div>
          <div class="total-amount">
            <span class="currency">¥</span>
            <span class="amount">{{ formatMoney(totalAmount) }}</span>
          </div>
          <div class="total-info">
            <div class="info-item">
              <span class="info-label">我的贡献</span>
              <span class="info-value">¥{{ formatMoney(myContribution) }}</span>
            </div>
            <div class="info-divider"></div>
            <div class="info-item">
              <span class="info-label">TA的贡献</span>
              <span class="info-value">¥{{ formatMoney(partnerContribution) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-card">
        <button @click="openAddModal" class="add-btn">
          <span class="add-icon">➕</span>
          <span class="add-text">添加资金</span>
        </button>
        <button @click="openWithdrawModal" class="withdraw-btn">
          <span class="withdraw-icon">➖</span>
          <span class="withdraw-text">提取资金</span>
        </button>
      </div>

      <div class="account-card">
        <div class="history-header"><h2 class="history-title">💳 存钱类型</h2><button class="goal-add-btn" @click="showAccountModal = true">+ 新建</button></div>
        <div class="account-list">
          <button v-for="account in accounts" :key="account.id" :class="{ active: selectedAccountId === account.id }" @click="selectedAccountId = account.id">
            <span>{{ account.icon }}</span><strong>{{ account.name }}</strong><small>¥{{ formatMoney(account.balance) }}</small>
          </button>
        </div>
      </div>

      <div class="goal-card">
        <div class="goal-header">
          <h2 class="goal-title">💰 存钱目标</h2>
          <button @click="openGoalModal" class="goal-add-btn">+ 添加</button>
        </div>
        <div v-if="currentGoal" class="goal-progress">
          <div class="goal-info">
            <div class="goal-name">{{ currentGoal.name }}</div>
            <div class="goal-target">目标: ¥{{ formatMoney(currentGoal.target) }}</div>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
          <div class="progress-info">
            <span class="progress-current">¥{{ formatMoney(totalAmount) }}</span>
            <span class="progress-percent">{{ progressPercent }}%</span>
          </div>
        </div>
        <div v-else class="goal-empty">
          <span class="empty-icon">🎯</span>
          <span class="empty-text">还没有设置存钱目标</span>
        </div>
      </div>

      <div class="history-card">
        <div class="history-header">
          <h2 class="history-title">📋 交易记录</h2>
        </div>
        <div class="history-tools">
          <input v-model="searchKeyword" placeholder="搜索备注、类型或日期">
          <select v-model="transactionFilter"><option value="all">全部</option><option value="add">存入</option><option value="withdraw">支出</option></select>
        </div>
        <div v-if="filteredTransactions.length > 0" class="transaction-list">
          <div 
            v-for="transaction in filteredTransactions"
            :key="transaction.id"
            class="transaction-item"
            @click="selectedTransaction = transaction"
          >
            <div class="transaction-icon" :class="transaction.type">
              <span>{{ transaction.type === 'add' ? '💵' : '💳' }}</span>
            </div>
            <div class="transaction-info">
              <div class="transaction-desc">{{ transaction.description }}</div>
              <div class="transaction-date">{{ accountName(transaction.accountId) }} · {{ transaction.category || '其他' }} · {{ transaction.date }}</div>
            </div>
            <div class="transaction-amount" :class="transaction.type">
              {{ transaction.type === 'add' ? '+' : '-' }}¥{{ formatMoney(transaction.amount) }}
            </div>
            <button class="transaction-delete" @click.stop="deleteTransaction(transaction)">删除</button>
          </div>
        </div>
        <div v-else class="history-empty">
          <span class="empty-icon">📝</span>
          <span class="empty-text">还没有交易记录</span>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3 class="modal-title">添加资金</h3>
        <div class="amount-input-group">
          <span class="input-currency">¥</span>
          <input 
            v-model="addAmount" 
            type="number" 
            class="amount-input" 
            placeholder="输入金额"
          />
        </div>
        <select v-model="addAccountId" class="goal-name-input"><option v-for="account in accounts" :key="account.id" :value="account.id">存入到：{{ account.name }}</option></select>
        <select v-model="addCategory" class="goal-name-input"><option>日常储蓄</option><option>旅行基金</option><option>礼物基金</option><option>应急备用</option><option>其他</option></select>
        <div class="quick-amounts">
          <button 
            v-for="amount in quickAmounts" 
            :key="amount"
            @click="addAmount = amount"
            class="quick-btn"
          >
            ¥{{ amount }}
          </button>
        </div>
        <textarea 
          v-model="addNote" 
          class="note-input" 
          placeholder="添加备注（可选）"
        ></textarea>
        <button @click="submitAdd" class="submit-btn add-submit">确认添加</button>
      </div>
    </div>

    <div v-if="showWithdrawModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3 class="modal-title">提取资金</h3>
        <div class="amount-input-group">
          <span class="input-currency">¥</span>
          <input 
            v-model="withdrawAmount" 
            type="number" 
            class="amount-input" 
            placeholder="输入金额"
            :max="totalAmount"
          />
        </div>
        <select v-model="withdrawAccountId" class="goal-name-input"><option v-for="account in accounts" :key="account.id" :value="account.id">从 {{ account.name }} 提取</option></select>
        <textarea 
          v-model="withdrawNote" 
          class="note-input" 
          placeholder="提取原因（可选）"
        ></textarea>
        <button @click="submitWithdraw" class="submit-btn withdraw-submit">确认提取</button>
      </div>
    </div>

    <div v-if="showAccountModal" class="modal-overlay" @click.self="showAccountModal = false">
      <div class="modal-content">
        <h3 class="modal-title">新建存钱类型</h3>
        <input v-model="accountNameInput" class="goal-name-input" maxlength="16" placeholder="例如：旅行基金">
        <select v-model="accountIcon" class="goal-name-input"><option>💰</option><option>✈️</option><option>🏠</option><option>🎁</option><option>💍</option><option>🌱</option></select>
        <button class="submit-btn add-submit" @click="createAccount">创建</button>
      </div>
    </div>

    <div v-if="selectedTransaction" class="modal-overlay" @click.self="selectedTransaction = null">
      <div class="modal-content">
        <h3 class="modal-title">账目详情</h3>
        <p class="detail-row"><span>金额</span><strong>{{ selectedTransaction.type === 'add' ? '+' : '-' }}¥{{ formatMoney(selectedTransaction.amount) }}</strong></p>
        <p class="detail-row"><span>存钱类型</span><strong>{{ accountName(selectedTransaction.accountId) }}</strong></p>
        <p class="detail-row"><span>分类</span><strong>{{ selectedTransaction.category || '其他' }}</strong></p>
        <p class="detail-row"><span>备注</span><strong>{{ selectedTransaction.description }}</strong></p>
        <p class="detail-row"><span>时间</span><strong>{{ selectedTransaction.date }}</strong></p>
        <button class="submit-btn goal-submit" @click="selectedTransaction = null">关闭</button>
      </div>
    </div>

    <div v-if="showGoalModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3 class="modal-title">设置存钱目标</h3>
        <input 
          v-model="goalName" 
          type="text" 
          class="goal-name-input" 
          placeholder="目标名称"
        />
        <div class="amount-input-group">
          <span class="input-currency">¥</span>
          <input 
            v-model="goalTarget" 
            type="number" 
            class="amount-input" 
            placeholder="目标金额"
          />
        </div>
        <button @click="submitGoal" class="submit-btn goal-submit">确认设置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { hydrateSharedState, pushSharedState } from '@/api/sharedState'

const router = useRouter()

const accounts = ref([{ id: 'joint', name: '共同基金', icon: '💰', balance: 0 }])
const selectedAccountId = ref('joint')
const totalAmount = computed(() => accounts.value.reduce((sum, account) => sum + Number(account.balance || 0), 0))
const myContribution = ref(0)
const partnerContribution = ref(0)

const currentGoal = ref(null)

const transactions = ref([])

const showAddModal = ref(false)
const showWithdrawModal = ref(false)
const showGoalModal = ref(false)
const showAccountModal = ref(false)
const accountNameInput = ref('')
const accountIcon = ref('💰')
const searchKeyword = ref('')
const transactionFilter = ref('all')
const selectedTransaction = ref(null)

const addAmount = ref('')
const addNote = ref('')
const addAccountId = ref('joint')
const addCategory = ref('日常储蓄')
const withdrawAmount = ref('')
const withdrawNote = ref('')
const withdrawAccountId = ref('joint')
const goalName = ref('')
const goalTarget = ref('')

const quickAmounts = [520, 1314, 2000, 5000]
const filteredTransactions = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return transactions.value.filter(item => {
    const matchesType = transactionFilter.value === 'all' || item.type === transactionFilter.value
    const haystack = `${item.description} ${item.category || ''} ${item.date} ${accountName(item.accountId)}`.toLowerCase()
    return matchesType && (!keyword || haystack.includes(keyword))
  })
})

const progressPercent = computed(() => {
  if (!currentGoal.value) return 0
  return Math.min(Math.round((totalAmount.value / currentGoal.value.target) * 100), 100)
})

const formatMoney = (amount) => {
  return Number(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
const accountName = id => accounts.value.find(account => account.id === (id || 'joint'))?.name || '共同基金'

const goBack = () => {
  router.push('/home')
}

const openAddModal = () => {
  addAccountId.value = selectedAccountId.value
  showAddModal.value = true
}

const openWithdrawModal = () => {
  withdrawAccountId.value = selectedAccountId.value
  showWithdrawModal.value = true
}

const openGoalModal = () => {
  showGoalModal.value = true
}

const closeModal = () => {
  showAddModal.value = false
  showWithdrawModal.value = false
  showGoalModal.value = false
  addAmount.value = ''
  addNote.value = ''
  withdrawAmount.value = ''
  withdrawNote.value = ''
  goalName.value = ''
  goalTarget.value = ''
}

const fundPayload = () => ({
    totalAmount: totalAmount.value,
    myContribution: myContribution.value,
    partnerContribution: partnerContribution.value,
    currentGoal: currentGoal.value,
    transactions: transactions.value,
    accounts: accounts.value
})
const persistFund = () => {
  const payload = fundPayload()
  localStorage.setItem('loveDiary_fund', JSON.stringify(payload))
  pushSharedState('fund', payload)
}

const submitAdd = () => {
  if (!addAmount.value || addAmount.value <= 0) return
  const amount = Number(addAmount.value)
  const account = accounts.value.find(item => item.id === addAccountId.value)
  if (!account) return
  account.balance += amount
  myContribution.value += amount
  transactions.value.unshift({
    id: Date.now(),
    type: 'add',
    amount: amount,
    accountId: account.id,
    category: addCategory.value,
    description: addNote.value || '存入资金',
    date: new Date().toLocaleString('zh-CN')
  })
  persistFund()
  closeModal()
}

const submitWithdraw = () => {
  const account = accounts.value.find(item => item.id === withdrawAccountId.value)
  if (!account || !withdrawAmount.value || withdrawAmount.value <= 0 || withdrawAmount.value > account.balance) return
  const amount = Number(withdrawAmount.value)
  account.balance -= amount
  transactions.value.unshift({
    id: Date.now(),
    type: 'withdraw',
    amount: amount,
    accountId: account.id,
    category: '支出',
    description: withdrawNote.value || '提取资金',
    date: new Date().toLocaleString('zh-CN')
  })
  persistFund()
  closeModal()
}

const submitGoal = () => {
  if (!goalName.value || !goalTarget.value || goalTarget.value <= 0) return
  currentGoal.value = {
    name: goalName.value,
    target: Number(goalTarget.value)
  }
  persistFund()
  closeModal()
}

const createAccount = () => {
  const name = accountNameInput.value.trim()
  if (!name) return
  const account = { id: `account_${Date.now()}`, name, icon: accountIcon.value, balance: 0 }
  accounts.value.push(account); selectedAccountId.value = account.id
  addAccountId.value = account.id; withdrawAccountId.value = account.id
  accountNameInput.value = ''; showAccountModal.value = false; persistFund()
}

const deleteTransaction = transaction => {
  if (!confirm('删除这笔账目并同步修正余额吗？')) return
  const account = accounts.value.find(item => item.id === (transaction.accountId || 'joint'))
  if (account) account.balance += transaction.type === 'add' ? -Number(transaction.amount) : Number(transaction.amount)
  if (transaction.type === 'add') myContribution.value = Math.max(0, myContribution.value - Number(transaction.amount))
  transactions.value = transactions.value.filter(item => item.id !== transaction.id)
  selectedTransaction.value = null; persistFund()
}

const applyFundData = data => {
  accounts.value = Array.isArray(data?.accounts) && data.accounts.length
    ? data.accounts.map(account => ({ ...account, balance: Number(account.balance) || 0 }))
    : [{ id: 'joint', name: '共同基金', icon: '💰', balance: Number(data?.totalAmount) || 0 }]
  myContribution.value = Number(data?.myContribution) || 0
  partnerContribution.value = Number(data?.partnerContribution) || 0
  currentGoal.value = data?.currentGoal || null
  transactions.value = Array.isArray(data?.transactions) ? data.transactions.map(item => ({ ...item, accountId: item.accountId || 'joint' })) : []
  selectedAccountId.value = accounts.value[0].id
  addAccountId.value = accounts.value[0].id
  withdrawAccountId.value = accounts.value[0].id
}

onMounted(async () => {
  let localData = fundPayload()
  try { localData = JSON.parse(localStorage.getItem('loveDiary_fund') || JSON.stringify(localData)) } catch {}
  applyFundData(localData)
  const shared = await hydrateSharedState('fund', fundPayload())
  if (shared.enabled && shared.payload && typeof shared.payload === 'object') {
    applyFundData(shared.payload)
    localStorage.setItem('loveDiary_fund', JSON.stringify(fundPayload()))
  }
})
</script>

<style scoped>
.fund-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.fund-header {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  padding-top: 50px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 20px;
  color: #333;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.fund-content {
  padding: 20px;
  padding-bottom: 30px;
}

.total-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 20px;
}

.total-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #f8b500 100%);
}

.total-content {
  position: relative;
  padding: 30px 25px;
}

.total-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10px;
}

.total-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 25px;
}

.currency {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-right: 5px;
}

.amount {
  font-size: 48px;
  font-weight: bold;
  color: white;
}

.total-info {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 15px;
}

.info-item {
  text-align: center;
}

.info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 5px;
}

.info-value {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.info-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.action-card {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.add-btn, .withdraw-btn {
  flex: 1;
  border: none;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.add-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.withdraw-btn {
  background: linear-gradient(135deg, #f5a623 0%, #f7b731 100%);
}

.add-btn:active, .withdraw-btn:active {
  transform: scale(0.98);
}

.add-icon, .withdraw-icon {
  font-size: 28px;
}

.add-text, .withdraw-text {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.goal-card, .history-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.goal-header, .history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.goal-title, .history-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.goal-add-btn {
  font-size: 13px;
  color: #ff6b9d;
  border: none;
  background: none;
}

.goal-progress {
  padding: 15px;
  background: #fff5f7;
  border-radius: 12px;
}

.goal-info {
  margin-bottom: 15px;
}

.goal-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.goal-target {
  font-size: 13px;
  color: #999;
}

.progress-bar {
  height: 8px;
  background: #ffeef2;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d 0%, #c44569 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
}

.progress-current {
  font-size: 14px;
  font-weight: 600;
  color: #ff6b9d;
}

.progress-percent {
  font-size: 14px;
  color: #999;
}

.goal-empty, .history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  gap: 10px;
}

.empty-icon {
  font-size: 40px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-icon {
  width: 45px;
  height: 45px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.transaction-icon.add {
  background: #f0fff4;
}

.transaction-icon.withdraw {
  background: #fff7e6;
}

.transaction-info {
  flex: 1;
}

.transaction-desc {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.transaction-date {
  font-size: 11px;
  color: #999;
}

.transaction-amount {
  font-size: 15px;
  font-weight: 600;
}

.transaction-amount.add {
  color: #67c23a;
}

.transaction-amount.withdraw {
  color: #f5a623;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: white;
  border-radius: 24px;
  padding: 25px;
  width: 320px;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.amount-input-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.input-currency {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b9d;
  margin-right: 10px;
}

.amount-input {
  flex: 1;
  height: 50px;
  font-size: 24px;
  font-weight: bold;
  border: none;
  border-bottom: 2px solid #eee;
  outline: none;
}

.quick-amounts {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.quick-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  color: #666;
  transition: all 0.3s ease;
}

.quick-btn:active {
  background: #f5f5f5;
}

.note-input {
  width: 100%;
  height: 70px;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  resize: none;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.goal-name-input {
  width: 100%;
  height: 45px;
  border: none;
  border-bottom: 2px solid #eee;
  font-size: 16px;
  outline: none;
  margin-bottom: 15px;
}

.submit-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
}

.add-submit {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.withdraw-submit {
  background: linear-gradient(135deg, #f5a623 0%, #f7b731 100%);
  color: white;
}

.goal-submit {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
}
</style>
<style scoped>
.account-card{background:#fff;border-radius:18px;padding:18px;margin-bottom:18px}.account-list{display:flex;gap:9px;overflow:auto;margin-top:12px}.account-list button{flex:0 0 125px;padding:13px;border:1px solid #eee;border-radius:15px;background:#fafafa;text-align:left;color:#555}.account-list button.active{background:linear-gradient(135deg,#fff0f2,#fff8ec);border-color:#edb7c1}.account-list span,.account-list strong,.account-list small{display:block}.account-list span{font-size:20px}.account-list strong{font-size:12px;margin:6px 0}.account-list small{font-size:11px;color:#cc5e73}.history-tools{display:flex;gap:8px;margin:12px 0}.history-tools input,.history-tools select{min-width:0;border:1px solid #eee;border-radius:11px;background:#fafafa;padding:9px;font-size:11px}.history-tools input{flex:1}.transaction-delete{border:0;background:#fff0f2;color:#c15a6e;border-radius:8px;padding:6px;font-size:9px}.detail-row{display:flex;justify-content:space-between;gap:20px;padding:11px 0;border-bottom:1px solid #f3eeee;font-size:11px}.detail-row span{color:#999}.detail-row strong{text-align:right}
</style>
