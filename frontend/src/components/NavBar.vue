<template>
  <nav class="navbar">
    <div class="container">
      <a href="#" class="logo">
        <img src="/logo.jpg" alt="晚枫家政" class="logo-icon" />
        <span class="text-shine">晚枫家政</span>
      </a>
      <ul class="nav-links">
        <li><a href="#services">服务项目</a></li>
        <li><a href="#staff">家政团队</a></li>
        <li><a href="#about">关于我们</a></li>
        <li><a href="#booking">在线预约</a></li>
        <li><a href="#reviews">客户评价</a></li>
        <li><a href="#booking" class="nav-cta">立即预约</a></li>
        <li v-if="currentUser" class="user-menu-wrapper">
          <span class="nav-user-btn" @click.stop="toggleMenu">👤 {{ currentUser.name }}</span>
          <!-- 下拉面板 -->
          <div v-if="menuOpen" ref="dropdownRef" class="user-dropdown" @click.stop>
            <div class="dropdown-header">
              <div class="dropdown-avatar">{{ currentUser.name.charAt(0) }}</div>
              <div class="dropdown-userinfo">
                <div class="dropdown-username">{{ currentUser.name }}</div>
                <div class="dropdown-phone">{{ currentUser.phone }}</div>
              </div>
            </div>

            <div class="dropdown-section">
              <div class="dropdown-section-title">📋 我的订单</div>
              <div v-if="loadingOrders" class="dropdown-loading">加载中...</div>
              <div v-else-if="myBookings.length === 0" class="dropdown-empty">暂无订单</div>
              <div v-else class="dropdown-order-list">
                <div
                  v-for="b in myBookings"
                  :key="b.id"
                  class="dropdown-order-item"
                >
                  <div class="order-top">
                    <span class="order-service">{{ b.service }}</span>
                    <span class="order-status" :class="statusClass(b.status)">{{ statusLabel(b.status) }}</span>
                  </div>
                  <div class="order-bottom">
                    <span class="order-date">{{ b.service_date || '待定' }}</span>
                    <span class="order-addr">{{ b.address }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="dropdown-section">
              <div class="dropdown-section-title">🎨 背景主题</div>
              <div class="theme-grid">
                <button
                  v-for="t in themes"
                  :key="t.key"
                  :class="['theme-btn', { active: currentTheme === t.key && !isCustomBg }]"
                  @click="handleThemeChange(t.key)"
                  :title="t.label"
                >{{ t.icon }}</button>
                <button
                  class="theme-btn upload-btn"
                  :class="{ active: isCustomBg }"
                  title="上传自定义图片"
                  @click="triggerUpload"
                >📷</button>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  style="display:none"
                  @change="handleFileChange"
                />
              </div>
            </div>

            <div class="dropdown-actions">
              <button class="dropdown-btn logout-btn" @click="handleLogout">🚪 退出登录</button>
              <button class="dropdown-btn danger-btn" @click="handleDelete">🗑️ 注销账号</button>
            </div>
          </div>
        </li>
        <template v-else-if="!currentStaff">
          <li>
            <span class="nav-user-btn" @click="emit('login')">🔑 用户登录</span>
          </li>
          <li>
            <span class="nav-user-btn" @click="emit('register')">📝 用户注册</span>
          </li>
        </template>
        <!-- 员工按钮 -->
        <template v-if="currentStaff">
          <li class="user-menu-wrapper">
            <span class="nav-staff-btn" @click.stop="toggleStaffMenu">👨‍🔧 {{ currentStaff.name }}</span>
            <!-- 员工下拉面板 -->
            <div v-if="staffMenuOpen" ref="staffDropdownRef" class="user-dropdown" @click.stop>
              <div class="dropdown-header">
                <div class="dropdown-avatar" style="background:linear-gradient(135deg, #2a5290, #3b6eb5);">{{ currentStaff.name.charAt(0) }}</div>
                <div class="dropdown-userinfo">
                  <div class="dropdown-username">{{ currentStaff.name }}</div>
                  <div class="dropdown-phone">{{ currentStaff.role }} · ⭐{{ currentStaff.rate }}</div>
                </div>
              </div>

              <div class="dropdown-section">
                <div class="dropdown-section-title">💰 收入统计</div>
                <div class="staff-earnings-big">¥ {{ staffEarnings }}</div>
                <div class="staff-earnings-sub">已完成 {{ completedCount }} 单</div>
              </div>

              <div class="dropdown-section">
                <div class="dropdown-section-title">📦 已完成订单</div>
                <div v-if="staffCompletedOrders.length === 0" class="dropdown-empty">暂无完成订单</div>
                <div v-else class="dropdown-order-list" style="max-height:160px;">
                  <div v-for="o in staffCompletedOrders.slice(0, 5)" :key="o.id" class="dropdown-order-item">
                    <div class="order-top">
                      <span class="order-service">{{ o.service }}</span>
                      <span style="font-weight:700;color:var(--maple);">¥{{ o.price }}</span>
                    </div>
                    <div class="order-bottom">
                      <span>{{ o.user_name }}</span>
                      <span>{{ o.service_date }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="dropdown-actions">
                <button class="dropdown-btn logout-btn" @click="handleStaffLogout">🚪 退出工作台</button>
              </div>
            </div>
          </li>
        </template>
        <template v-else-if="!currentUser">
          <li>
            <span class="nav-staff-login" @click="emit('staffRegister')">🏠 家政入驻</span>
          </li>
          <li>
            <span class="nav-staff-login" @click="emit('staffLogin')">👨‍🔧 员工登录</span>
          </li>
        </template>
      </ul>
    </div>

  </nav>
</template>

<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'
import { bookingsAPI, usersAPI } from '../api'

const props = defineProps(['currentUser', 'currentStaff'])
const emit = defineEmits(['login', 'register', 'logout', 'deleteAccount', 'themeChange', 'staffLogin', 'staffRegister', 'staffLogout'])

const menuOpen = ref(false)
const dropdownRef = ref(null)
const myBookings = ref([])
const loadingOrders = ref(false)

const themes = [
  { key: 'maple',  icon: '🍁', label: '枫叶暖' },
  { key: 'mint',   icon: '🌿', label: '薄荷绿' },
  { key: 'sakura', icon: '🌸', label: '樱花粉' },
  { key: 'ocean',  icon: '🌊', label: '深海蓝' },
  { key: 'galaxy', icon: '✨', label: '星空紫' },
  { key: 'pure',   icon: '🤍', label: '极简白' }
]

const currentTheme = ref(props.currentUser?.background || 'maple')
const isCustomBg = ref(false)
const fileInput = ref(null)

// 判断是否为自定义图片背景
const checkCustomBg = (bg) => {
  return bg && !['maple', 'mint', 'sakura', 'ocean', 'galaxy', 'pure'].includes(bg)
}

// 当用户登录后同步主题
watch(() => props.currentUser, (user) => {
  if (user) {
    const bg = user.background || 'maple'
    currentTheme.value = bg
    isCustomBg.value = checkCustomBg(bg)
  }
})

const statusLabel = (s) => {
  const map = {
    new: '待处理',
    claimed: '已接单',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[s] || s
}

const statusClass = (s) => {
  const map = {
    new: 's-new',
    claimed: 's-claimed',
    completed: 's-done',
    cancelled: 's-cancel'
  }
  return map[s] || ''
}

const toggleMenu = async () => {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value && props.currentUser) {
    const bg = props.currentUser.background || 'maple'
    currentTheme.value = bg
    isCustomBg.value = checkCustomBg(bg)
    loadingOrders.value = true
    try {
      const res = await bookingsAPI.getByUser(props.currentUser.phone)
      myBookings.value = res.data
    } catch (e) {
      console.error('获取订单失败:', e)
    } finally {
      loadingOrders.value = false
    }
  }
}

const handleLogout = () => {
  menuOpen.value = false
  emit('logout')
}

const handleDelete = () => {
  if (!confirm('⚠️ 注销后所有数据将被永久删除，无法恢复！\n确定要继续吗？')) return
  menuOpen.value = false
  emit('deleteAccount')
}

const handleThemeChange = async (theme) => {
  currentTheme.value = theme
  isCustomBg.value = false
  emit('themeChange', theme)
  // 同步保存到后端
  if (props.currentUser) {
    try {
      await usersAPI.updateBackground(props.currentUser.id, theme)
    } catch (e) {
      console.error('保存主题失败:', e)
    }
  }
}

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file || !props.currentUser) return

  try {
    const res = await usersAPI.uploadBackground(props.currentUser.id, file)
    const bgPath = res.data.background
    currentTheme.value = bgPath
    isCustomBg.value = true
    emit('themeChange', bgPath)
  } catch (err) {
    alert(err.response?.data?.error || '上传失败')
  } finally {
    // 清空 input 以允许重复选同一文件
    e.target.value = ''
  }
}

// 点击面板外部自动关闭
const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}

watch(menuOpen, (val) => {
  if (val) {
    // setTimeout 防止打开面板的同一点击被当做外部点击
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ---- 员工下拉面板 ----
const staffMenuOpen = ref(false)
const staffDropdownRef = ref(null)
const staffCompletedOrders = ref([])
const completedCount = computed(() => staffCompletedOrders.value.length)
const staffEarnings = computed(() => staffCompletedOrders.value.reduce((s, o) => s + (o.price || 0), 0))

const toggleStaffMenu = async () => {
  staffMenuOpen.value = !staffMenuOpen.value
  if (staffMenuOpen.value && props.currentStaff) {
    try {
      const res = await bookingsAPI.getByStaff(props.currentStaff.id)
      staffCompletedOrders.value = res.data.filter(o => o.status === 'completed')
    } catch (e) {
      console.error('获取订单失败:', e)
    }
  }
}

const handleStaffLogout = () => {
  staffMenuOpen.value = false
  emit('staffLogout')
}

// 员工面板外部点击关闭
const handleStaffClickOutside = (e) => {
  if (staffDropdownRef.value && !staffDropdownRef.value.contains(e.target)) {
    staffMenuOpen.value = false
  }
}

watch(staffMenuOpen, (val) => {
  if (val) {
    setTimeout(() => document.addEventListener('click', handleStaffClickOutside), 0)
  } else {
    document.removeEventListener('click', handleStaffClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('click', handleStaffClickOutside)
})
</script>

<style scoped>
/* ---- 原有导航栏样式 ---- */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  transition: var(--transition);
}

.navbar .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--maple);
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: contain;
}

.nav-links {
  display: flex;
  gap: 16px;
  align-items: center;
}

.nav-links a {
  font-size: 0.82rem;
  color: var(--text-light);
  transition: color var(--transition);
  white-space: nowrap;
}

.nav-links a:hover {
  color: var(--maple);
}

.nav-cta {
  background: var(--maple);
  color: #fff !important;
  padding: 8px 18px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.8rem !important;
  transition: background var(--transition) !important;
}

.nav-cta:hover {
  background: var(--maple-dark) !important;
}

.nav-staff-login {
  font-size: 0.78rem;
  color: var(--maple);
  cursor: pointer;
  padding: 5px 10px;
  border: 1.3px solid var(--maple);
  border-radius: 16px;
  transition: all var(--transition);
  white-space: nowrap;
}

.nav-staff-login:hover {
  background: var(--cream);
}

.nav-staff-btn {
  font-size: 0.78rem;
  color: #fff;
  background: var(--blue);
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 16px;
  transition: all var(--transition);
  white-space: nowrap;
}

.nav-staff-btn:hover {
  background: #2a5290;
}

.nav-user-btn {
  font-size: 0.78rem;
  color: var(--text-light);
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 16px;
  transition: all var(--transition);
  white-space: nowrap;
  user-select: none;
}

.nav-user-btn:hover {
  color: var(--maple);
  background: rgba(199, 81, 26, 0.04);
}

/* ---- 用户菜单容器 ---- */
.user-menu-wrapper {
  position: relative;
}

/* ---- 下拉面板 ---- */
.user-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 360px;
  max-height: 480px;
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- 头部 ---- */
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}

.dropdown-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--maple), var(--maple-light));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  flex-shrink: 0;
}

.dropdown-username {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.dropdown-phone {
  font-size: 0.78rem;
  color: var(--text-light);
  margin-top: 2px;
}

/* ---- 订单区域 ---- */
.dropdown-section {
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
}

.dropdown-section-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
}

.dropdown-loading,
.dropdown-empty {
  font-size: 0.78rem;
  color: var(--text-light);
  text-align: center;
  padding: 16px 0;
}

.staff-earnings-big {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--maple);
  text-align: center;
}

.staff-earnings-sub {
  font-size: 0.75rem;
  color: var(--text-light);
  text-align: center;
  margin-top: 2px;
}

.dropdown-order-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-order-item {
  background: var(--warm-bg);
  border-radius: 10px;
  padding: 10px 14px;
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.order-service {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
}

.order-status {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.s-new      { background: #fff3cd; color: #856404; }
.s-claimed  { background: #cce5ff; color: #004085; }
.s-done     { background: #d4edda; color: #155724; }
.s-cancel   { background: #f8d7da; color: #721c24; }

.order-bottom {
  display: flex;
  gap: 12px;
  font-size: 0.72rem;
  color: var(--text-light);
}

/* ---- 操作按钮 ---- */
.dropdown-actions {
  padding: 12px 24px 20px;
  display: flex;
  gap: 10px;
}

.dropdown-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 10px;
  font-size: 0.82rem;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition);
}

.logout-btn {
  background: var(--cream);
  color: var(--text);
}

.logout-btn:hover {
  background: #f5e6d8;
}

.danger-btn {
  background: #fff;
  color: var(--red);
  border: 1.5px solid var(--red);
}

.danger-btn:hover {
  background: #fff5f5;
}

/* ---- 文字动画 ---- */
.text-shine {
  background: linear-gradient(120deg, var(--maple) 0%, #f0a030 25%, #f7c873 50%, #f0a030 75%, var(--maple) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shine 3s linear infinite;
}

@keyframes shine {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ---- 主题选择 ---- */
.theme-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.theme-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: var(--warm-bg);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-btn:hover {
  background: var(--cream);
  transform: scale(1.1);
}

.theme-btn.active {
  border-color: var(--maple);
  background: var(--cream);
  box-shadow: 0 0 0 3px rgba(199, 81, 26, 0.15);
}

.upload-btn {
  border-style: dashed;
  border-color: var(--border);
}

.upload-btn:hover {
  border-color: var(--maple-light);
  background: var(--cream);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .user-dropdown {
    width: 300px;
    right: -20px;
  }
}
</style>
