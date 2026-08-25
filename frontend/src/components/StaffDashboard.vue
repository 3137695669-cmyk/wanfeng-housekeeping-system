<template>
  <div class="staff-dashboard">
    <div class="container">

      <!-- 顶部信息栏 -->
      <div class="dash-header">
        <div class="dash-welcome">
          <span class="dash-avatar" @click="triggerAvatarUpload" title="点击更换头像">
            <img v-if="isPhotoUrl(currentStaff.photo)" :src="'http://localhost:3000/uploads/' + currentStaff.photo" alt="头像" class="avatar-img" />
            <span v-else>{{ currentStaff.photo || '👨‍🔧' }}</span>
          </span>
          <input type="file" ref="avatarInput" accept="image/*" style="display:none" @change="handleAvatarUpload" />
          <div>
            <h2>{{ currentStaff.name }} 的工作台</h2>
            <p>{{ currentStaff.role }} · {{ currentStaff.badge || '新人' }} · ⭐{{ currentStaff.rate }} · 已接{{ currentStaff.orders }}单</p>
          </div>
        </div>
        <div class="dash-earnings">
          <button class="btn-change-photo" @click="triggerDisplayUpload">📷 更改展示图片</button>
          <input type="file" ref="displayInput" accept="image/*" style="display:none" @change="handleDisplayUpload" />
          <span class="earning-label">今日收入</span>
          <span class="earning-amount">¥{{ earnings }}</span>
        </div>
      </div>

      <!-- 双栏 -->
      <div class="dash-grid">
        <!-- 左：待处理订单 -->
        <div class="dash-card">
          <div class="card-title">📋 待处理订单 <span class="refresh-badge">{{ newOrders.length }}条</span></div>
          <div v-if="newOrders.length === 0" class="empty">暂无新订单，休息一下吧～</div>
          <div v-for="o in newOrders" :key="o.id" class="order-card new-order">
            <div class="oc-top">
              <span class="oc-service">{{ o.service }}</span>
              <span class="oc-price">¥{{ o.price || '—' }}</span>
            </div>
            <div class="oc-mid">
              <span>{{ o.user_name }} · {{ o.user_phone }}</span>
              <span>{{ o.service_date || '时间待定' }}</span>
            </div>
            <div class="oc-bot">
              <span class="oc-addr">📍 {{ o.address }}</span>
              <button class="btn btn-primary btn-sm" @click="claimOrder(o)">✅ 接单</button>
            </div>
            <div v-if="o.remark" class="oc-remark">💬 {{ o.remark }}</div>
          </div>
        </div>

        <!-- 右：我的订单 -->
        <div class="dash-card">
          <div class="card-title">📦 我的订单 <span class="refresh-badge">{{ myOrders.length }}条</span></div>
          <div v-if="myOrders.length === 0" class="empty">还没有接过单</div>
          <div
            v-for="o in myOrders"
            :key="o.id"
            :class="['order-card', 'my-order', statusBg(o.status)]"
          >
            <div class="oc-top">
              <span class="oc-service">{{ o.service }}</span>
              <span :class="['oc-status', statusBg(o.status)]">{{ statusText(o.status) }}</span>
            </div>
            <div class="oc-mid">
              <span>{{ o.user_name }} · {{ o.user_phone }}</span>
              <span>{{ o.service_date || '时间待定' }}</span>
            </div>
            <div class="oc-bot">
              <span class="oc-addr">📍 {{ o.address }}</span>
              <span class="oc-price">¥{{ o.price || '—' }}</span>
            </div>
            <div v-if="o.status === 'claimed'" class="oc-actions">
              <button class="btn btn-primary btn-sm" @click="completeOrder(o)">✔ 完成</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { bookingsAPI, staffAPI } from '../api'
import Toast from './Toast.vue'

const props = defineProps(['currentStaff', 'services'])
const emit = defineEmits(['refresh', 'photoUpdated', 'displayPhotoUpdated'])

const newOrders = ref([])
const myOrders = ref([])
let timer = null

const fileInput = ref(null)
const avatarInput = ref(null)
const displayInput = ref(null)

const isPhotoUrl = (val) => {
  const p = val || ''
  return p.startsWith('photos/') || p.startsWith('icons/') || p.startsWith('backgrounds/')
}

// 头像上传
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const res = await staffAPI.uploadPhoto(props.currentStaff.id, file)
    emit('photoUpdated', res.data.photo)
  } catch (err) {
    const msg = err.response?.data?.error || err.message || '上传失败'
    alert('头像上传失败：' + msg)
  }
}

// 展示图片上传
const triggerDisplayUpload = () => {
  displayInput.value?.click()
}

const handleDisplayUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const res = await staffAPI.uploadDisplayPhoto(props.currentStaff.id, file)
    emit('displayPhotoUpdated', res.data.display_photo)
  } catch (err) {
    const msg = err.response?.data?.error || err.message || '上传失败'
    alert('展示图片上传失败：' + msg)
  }
}

const earnings = computed(() => {
  return myOrders.value
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.price || 0), 0)
})

const statusText = (s) => {
  const m = { new: '待处理', claimed: '进行中', completed: '已完成', cancelled: '已取消' }
  return m[s] || s
}

const statusBg = (s) => {
  const m = { new: 's-new', claimed: 's-claimed', completed: 's-done', cancelled: 's-cancel' }
  return m[s] || ''
}

const loadOrders = async () => {
  try {
    const [newRes, myRes] = await Promise.all([
      bookingsAPI.getAll('new'),
      bookingsAPI.getByStaff(props.currentStaff.id)
    ])
    newOrders.value = newRes.data
    myOrders.value = myRes.data
  } catch (e) {
    console.error('加载订单失败:', e)
  }
}

const claimOrder = async (order) => {
  try {
    await bookingsAPI.claim(order.id, props.currentStaff.id, props.currentStaff.name)
    emit('refresh')
    loadOrders()
  } catch (e) {
    alert(e.response?.data?.error || '接单失败')
  }
}

const completeOrder = async (order) => {
  try {
    await bookingsAPI.updateStatus(order.id, { status: 'completed' })
    loadOrders()
  } catch (e) {
    alert(e.response?.data?.error || '操作失败')
  }
}

onMounted(() => {
  loadOrders()
  // 每5秒自动刷新
  timer = setInterval(loadOrders, 5000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.staff-dashboard {
  padding-top: 100px;
  padding-bottom: 60px;
  min-height: 100vh;
  background: var(--warm-bg);
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 16px;
  padding: 24px 32px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}

.dash-welcome {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dash-avatar {
  font-size: 2.8rem;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--warm-bg);
}
.dash-avatar:hover {
  opacity: 0.8;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.dash-welcome h2 {
  font-size: 1.3rem;
  margin-bottom: 4px;
}

.dash-welcome p {
  font-size: 0.82rem;
  color: var(--text-light);
}

.dash-earnings {
  text-align: center;
}

.btn-change-photo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1.5px solid var(--maple);
  background: #fff;
  color: var(--maple);
  border-radius: 20px;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.btn-change-photo:hover {
  background: var(--maple);
  color: #fff;
}

.earning-label {
  display: block;
  font-size: 0.78rem;
  color: var(--text-light);
  margin-bottom: 4px;
}

.earning-amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--maple);
}

.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
}

.dash-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow);
}

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.refresh-badge {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-light);
  background: var(--warm-bg);
  padding: 2px 10px;
  border-radius: 10px;
}

.empty {
  text-align: center;
  color: var(--text-light);
  padding: 40px 0;
  font-size: 0.9rem;
}

.order-card {
  background: var(--warm-bg);
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 10px;
}

.new-order {
  border-left: 4px solid var(--maple);
}

.my-order {
  border-left: 4px solid var(--blue);
}

.my-order.s-done {
  border-left-color: var(--green);
}

.my-order.s-cancel {
  border-left-color: var(--red);
}

.oc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.oc-service {
  font-weight: 600;
  color: var(--text);
}

.oc-price {
  font-weight: 700;
  color: var(--maple);
}

.oc-mid {
  font-size: 0.78rem;
  color: var(--text-light);
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.oc-bot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.oc-addr {
  font-size: 0.78rem;
  color: var(--text-light);
}

.oc-remark {
  font-size: 0.76rem;
  color: var(--text-light);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}

.oc-status {
  font-size: 0.7rem;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.oc-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.s-new      { background: #fff3cd; color: #856404; }
.s-claimed  { background: #cce5ff; color: #004085; }
.s-done     { background: #d4edda; color: #155724; }
.s-cancel   { background: #f8d7da; color: #721c24; }
</style>
