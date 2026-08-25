<template>
  <div id="app">
    <!-- 自定义背景图层 -->
    <div v-if="customBgUrl" class="custom-bg-layer" :style="{ backgroundImage: 'url(' + customBgUrl + ')' }"></div>

    <NavBar v-if="!currentAdmin" :currentUser="currentUser" :currentStaff="currentStaff" @login="showLogin = true" @register="showRegister = true" @logout="logout" @deleteAccount="handleDeleteAccount" @themeChange="handleThemeChange" @staffLogin="showStaffLogin = true" @staffRegister="showStaffRegister = true" @staffLogout="handleStaffLogout" />

    <!-- 管理员 → 数据看板 -->
    <template v-if="currentAdmin">
      <AdminPanel @logout="handleAdminLogout" />
    </template>
    <!-- 员工登录 → 工作台视图 -->
    <template v-else-if="currentStaff">
      <StaffDashboard :currentStaff="currentStaff" :services="services" @refresh="loadData" @photoUpdated="handleStaffPhotoUpdated" @displayPhotoUpdated="handleDisplayPhotoUpdated" />
    </template>
    <!-- 普通用户 → 首页视图 -->
    <template v-else>
      <HeroSection />
      <ServicesSection :services="services" @serviceClick="handleServiceClick" />
      <StaffSection :staff="staffList" />
      <AboutSection :aboutData="aboutData" />
      <BookingSection
        :services="services"
        :staff="staffList"
        :currentUser="currentUser"
        @bookingSubmit="handleBookingSubmit"
      />
      <ReviewsSection :reviews="reviews" @reviewSubmit="handleReviewSubmit" />
      <Footer @openAdmin="showAdminLogin = true" />
    </template>

    <LoginModal v-if="showLogin" @close="showLogin = false" @success="handleLoginSuccess" />
    <RegisterModal v-if="showRegister" @close="showRegister = false" @success="handleRegisterSuccess" />
    <StaffLoginModal v-if="showStaffLogin" @close="showStaffLogin = false" @success="handleStaffLoginSuccess" @switchToRegister="showStaffLogin = false; showStaffRegister = true" />
    <StaffRegisterModal v-if="showStaffRegister" @close="showStaffRegister = false" @success="handleStaffRegisterSuccess" @switchToLogin="showStaffRegister = false; showStaffLogin = true" />
    <AdminLoginModal v-if="showAdminLogin" @close="showAdminLogin = false" @success="handleAdminLoginSuccess" />
    <Toast :message="toastMessage" :show="showToast" :error="toastError" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import ServicesSection from './components/ServicesSection.vue'
import StaffSection from './components/StaffSection.vue'
import AboutSection from './components/AboutSection.vue'
import BookingSection from './components/BookingSection.vue'
import ReviewsSection from './components/ReviewsSection.vue'
import Footer from './components/Footer.vue'
import LoginModal from './components/LoginModal.vue'
import RegisterModal from './components/RegisterModal.vue'
import StaffLoginModal from './components/StaffLoginModal.vue'
import StaffRegisterModal from './components/StaffRegisterModal.vue'
import StaffDashboard from './components/StaffDashboard.vue'
import AdminPanel from './components/AdminPanel.vue'
import AdminLoginModal from './components/AdminLoginModal.vue'
import Toast from './components/Toast.vue'
import { servicesAPI, staffAPI, bookingsAPI, reviewsAPI, usersAPI, settingsAPI } from './api'

const services = ref([])
const staffList = ref([])
const reviews = ref([])
const aboutData = ref({})
const currentUser = ref(null)
const currentStaff = ref(null)
const currentAdmin = ref(false)
const showLogin = ref(false)
const showRegister = ref(false)
const showStaffLogin = ref(false)
const showStaffRegister = ref(false)
const showAdminLogin = ref(false)
const toastMessage = ref('')
const showToast = ref(false)
const toastError = ref(false)
const customBgUrl = ref('')

const loadData = async () => {
  try {
    const [servicesRes, staffRes, reviewsRes, aboutRes] = await Promise.all([
      servicesAPI.getAll(),
      staffAPI.getAll(),
      reviewsAPI.getAll(),
      settingsAPI.getAbout()
    ])
    services.value = servicesRes.data
    staffList.value = staffRes.data
    reviews.value = reviewsRes.data
    aboutData.value = aboutRes.data
  } catch (err) {
    console.error('加载数据失败:', err)
    useLocalStorageFallback()
  }
}

const useLocalStorageFallback = () => {
  services.value = [
    { id: 1, name: '日常保洁', icon: '🧹', description: '全屋除尘、地面清洁、厨卫擦拭，让家每天焕然一新', price: 99, price_unit: '起' },
    { id: 2, name: '深度清洁', icon: '✨', description: '彻底清洁每一处角落，包含油烟机拆洗、玻璃擦拭等', price: 199, price_unit: '起' },
    { id: 3, name: '月嫂服务', icon: '👶', description: '持证上岗的金牌月嫂，科学护理产妇和新生儿', price: 8880, price_unit: '起/26天' },
    { id: 4, name: '养老护理', icon: '❤️', description: '专业陪伴与照护，给长辈最温暖的关怀与关爱', price: 4500, price_unit: '起/月' },
    { id: 5, name: '家电清洗', icon: '🔧', description: '空调、洗衣机、油烟机等家电深度拆洗，专业设备保障', price: 129, price_unit: '起' },
    { id: 6, name: '收纳整理', icon: '📦', description: '科学规划空间，告别杂乱，让生活井井有条', price: 159, price_unit: '起' }
  ]
  staffList.value = [
    { id: 1, name: '李秀芳', role: '金牌月嫂', photo: '👩‍🦰', badge: '金牌', tags: ['母婴护理', '月子餐', '催乳'], orders: 328, rate: 4.9, years: 8 },
    { id: 2, name: '张美华', role: '资深保洁', photo: '👩', badge: '资深', tags: ['深度清洁', '收纳', '除螨'], orders: 562, rate: 4.8, years: 6 },
    { id: 3, name: '王桂兰', role: '养老护理', photo: '👩‍🦳', badge: '专业', tags: ['康复护理', '陪护', '膳食'], orders: 215, rate: 4.9, years: 10 }
  ]
  reviews.value = [
    { id: 1, name: '张女士', avatar: '张', text: '阿姨很细致，连窗缝都擦得干干净净。做完之后家里像新的一样，太舒心了！', stars: 5, service: '日常保洁', date: '2025-03-15' }
  ]
}

const showToastFn = (message, error = false) => {
  toastMessage.value = message
  toastError.value = error
  showToast.value = true
  setTimeout(() => showToast.value = false, 3000)
}

const handleServiceClick = (service) => {
  const bookingSection = document.getElementById('booking')
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleBookingSubmit = async (data) => {
  try {
    const res = await bookingsAPI.create(data)
    showToastFn(res.data.message || '预约成功！')
    loadData()
  } catch (err) {
    showToastFn(err.response?.data?.error || '预约失败', true)
  }
}

const handleReviewSubmit = async (data) => {
  try {
    const res = await reviewsAPI.create(data)
    showToastFn(res.data.message || '评价发表成功！')
    loadData()
  } catch (err) {
    showToastFn(err.response?.data?.error || '评价失败', true)
  }
}

const handleLoginSuccess = (user) => {
  currentStaff.value = null
  currentAdmin.value = false
  currentUser.value = user
  applyBackground(user.background || 'maple')
  showLogin.value = false
  showToastFn(`登录成功！欢迎回来，${user.name}`)
}

const handleRegisterSuccess = () => {
  showRegister.value = false
  showToastFn('注册成功！请登录')
  showLogin.value = true
}

const handleStaffLoginSuccess = (staff) => {
  currentUser.value = null
  currentAdmin.value = false
  currentStaff.value = staff
  showStaffLogin.value = false
  showToastFn(`欢迎回来，${staff.name}师傅！`)
}

const handleStaffRegisterSuccess = () => {
  showStaffRegister.value = false
  showToastFn('入驻申请已提交！请使用手机号和密码登录')
  showStaffLogin.value = true
}

const handleStaffLogout = () => {
  currentStaff.value = null
  showToastFn('已退出员工模式')
}

const handleStaffPhotoUpdated = (newPhoto) => {
  if (currentStaff.value) {
    currentStaff.value.photo = newPhoto
  }
}

const handleDisplayPhotoUpdated = (newDisplayPhoto) => {
  if (currentStaff.value) {
    currentStaff.value.display_photo = newDisplayPhoto
  }
}

const handleAdminLoginSuccess = () => {
  currentUser.value = null
  currentStaff.value = null
  showAdminLogin.value = false
  currentAdmin.value = true
  showToastFn('已进入管理后台')
}

const handleAdminLogout = () => {
  currentAdmin.value = false
  showToastFn('已退出管理后台')
}

const handleDeleteAccount = async () => {
  if (!currentUser.value) return
  try {
    await usersAPI.deleteAccount(currentUser.value.id)
    currentUser.value = null
    showToastFn('账号已注销，感谢您使用晚枫家政')
  } catch (err) {
    showToastFn(err.response?.data?.error || '注销失败', true)
  }
}

const PRESET_THEMES = ['maple', 'mint', 'sakura', 'ocean', 'galaxy', 'pure']

const applyBackground = (value) => {
  if (!value) {
    value = 'maple'
  }
  if (PRESET_THEMES.includes(value)) {
    customBgUrl.value = ''
    document.body.dataset.theme = value
  } else {
    document.body.removeAttribute('data-theme')
    customBgUrl.value = 'http://localhost:3000/uploads/' + value
  }
}

const handleThemeChange = async (theme) => {
  if (!currentUser.value) return
  applyBackground(theme)
  currentUser.value.background = theme
}

const logout = () => {
  currentUser.value = null
  applyBackground('maple')
  showToastFn('已退出登录')
}

onMounted(() => {
  if (!currentUser.value) {
    applyBackground('maple')
  }
  loadData()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
}
</style>
