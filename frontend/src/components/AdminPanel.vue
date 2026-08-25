<template>
  <div class="admin-dashboard">
    <!-- 顶栏 -->
    <header class="admin-topbar">
      <h1><img src="/logo.jpg" alt="晚枫家政" class="admin-logo" /> 晚枫家政 · 管理后台</h1>
      <button class="btn-exit" @click="$emit('logout')">🚪 退出后台</button>
    </header>

    <!-- 标签导航 -->
    <div class="admin-tabs">
      <button :class="['tab-btn', { active: activeTab === 'stats' }]" @click="switchTab('stats')">📊 数据概览</button>
      <button :class="['tab-btn', { active: activeTab === 'dashboard' }]" @click="switchTab('dashboard')">📈 数据大屏</button>
      <button :class="['tab-btn', { active: activeTab === 'services' }]" @click="switchTab('services')">🔧 服务管理</button>
      <button :class="['tab-btn', { active: activeTab === 'about' }]" @click="switchTab('about')">🍁 关于我们</button>
    </div>

    <!-- 数据大屏 -->
    <div v-if="activeTab === 'dashboard'">
      <DataDashboard />
    </div>

    <!-- 数据概览 -->
    <div class="admin-content" v-if="stats && activeTab === 'stats'">
      <!-- 4 个统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card c-maple">
          <div class="sc-icon">👥</div>
          <div class="sc-num">{{ stats.totalUsers }}</div>
          <div class="sc-label">注册用户</div>
        </div>
        <div class="stat-card c-blue">
          <div class="sc-icon">👨‍🔧</div>
          <div class="sc-num">{{ stats.totalStaff }}</div>
          <div class="sc-label">服务师傅</div>
        </div>
        <div class="stat-card c-green">
          <div class="sc-icon">📋</div>
          <div class="sc-num">{{ stats.totalBookings }}</div>
          <div class="sc-label">订单总量</div>
        </div>
        <div class="stat-card c-gold">
          <div class="sc-icon">💰</div>
          <div class="sc-num">¥{{ stats.totalRevenue }}</div>
          <div class="sc-label">总收入（已完成）</div>
        </div>
      </div>

      <!-- 图表行 -->
      <div class="chart-row">
        <!-- 订单状态分布 - 柱状图 -->
        <div class="chart-box">
          <div class="chart-title">📊 订单状态分布</div>
          <div class="bar-chart">
            <div
              v-for="s in statusBars"
              :key="s.key"
              class="bar-col"
            >
              <div class="bar-val">{{ s.count }}</div>
              <div class="bar-fill-wrap">
                <div class="bar-fill" :class="s.cls" :style="{ height: s.pct + '%' }"></div>
              </div>
              <div class="bar-label">{{ s.label }}</div>
            </div>
          </div>
        </div>

        <!-- 服务订单分布 - 进度条 -->
        <div class="chart-box">
          <div class="chart-title">🔧 服务订单排行</div>
          <div v-for="s in stats.bookingsByService" :key="s.service" class="progress-row">
            <span class="prog-label">{{ s.service }}</span>
            <span class="prog-count">{{ s.count }}单 · ¥{{ s.revenue }}</span>
            <div class="prog-bar-bg">
              <div class="prog-bar-fill" :style="{ width: (s.count / maxServiceCount * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-row">
        <!-- 师傅排行 -->
        <div class="chart-box">
          <div class="chart-title">🏆 师傅接单排行 Top 5</div>
          <div class="staff-list">
            <div
              v-for="(s, i) in stats.topStaff"
              :key="s.id"
              class="staff-row"
            >
              <span class="staff-rank" :class="'rank-' + (i + 1)">#{{ i + 1 }}</span>
              <span class="staff-name">{{ s.name }}</span>
              <span class="staff-role">{{ s.role }}</span>
              <span class="staff-info">⭐{{ s.rate }} · {{ s.orders }}单</span>
            </div>
          </div>
        </div>

        <!-- 评价概览 -->
        <div class="chart-box">
          <div class="chart-title">⭐ 评价概览</div>
          <div class="rating-big">{{ stats.avgRating }}</div>
          <div class="rating-sub">平均评分</div>
          <div class="mini-stats">
            <div class="mini-item">
              <span class="mini-num">{{ stats.totalReviews }}</span>
              <span class="mini-label">总评价数</span>
            </div>
            <div class="mini-item">
              <span class="mini-num">{{ (stats.totalBookings > 0 ? Math.round(stats.totalReviews / stats.totalBookings * 100) : 0) }}%</span>
              <span class="mini-label">评价率</span>
            </div>
          </div>
        </div>
      </div>

      <div class="refresh-info">数据实时刷新 · 上次更新 {{ lastUpdate }}</div>
    </div>

    <!-- 服务管理 -->
    <div class="admin-content" v-if="activeTab === 'services'">
      <div class="edit-section-title">🔧 服务项目管理</div>
      <div class="services-edit-grid">
        <div v-for="svc in servicesList" :key="svc.id" class="svc-edit-card">
          <div class="svc-edit-icon" @click="triggerSvcIcon(svc.id)">
            <img v-if="isPathUrl(svc.icon)" :src="'http://localhost:3000/uploads/' + svc.icon" class="svc-icon-img" />
            <span v-else class="svc-icon-emoji">{{ svc.icon }}</span>
            <div class="svc-icon-overlay">📷 更换</div>
          </div>
          <input type="file" :ref="el => svcFileInputs[svc.id] = el" accept="image/*" style="display:none" @change="(e) => handleSvcIconUpload(svc, e)" />
          <div class="svc-edit-fields">
            <label>名称</label>
            <input v-model="svc.name" class="field-input" />
            <label>描述</label>
            <textarea v-model="svc.description" class="field-textarea" rows="2"></textarea>
            <label>价格</label>
            <input v-model.number="svc.price" type="number" class="field-input field-sm" />
            <label>单位</label>
            <input v-model="svc.price_unit" class="field-input field-sm" placeholder="起" />
          </div>
          <button class="btn btn-primary btn-sm" @click="saveService(svc)">💾 保存</button>
        </div>
      </div>
    </div>

    <!-- 关于我们 -->
    <div class="admin-content" v-if="activeTab === 'about'">
      <div class="edit-section-title">🍁 编辑「关于我们」</div>
      <div class="about-edit-wrap">
        <div class="edit-field">
          <label>章节图片</label>
          <div class="about-edit-preview" @click="triggerAboutUpload">
            <img v-if="aboutForm.about_image" :src="'http://localhost:3000/uploads/' + aboutForm.about_image" class="about-preview-img" />
            <span v-else class="about-preview-placeholder">点击上传图片</span>
          </div>
          <input type="file" ref="aboutFileInput" accept="image/*" style="display:none" @change="handleAboutImageUpload" />
        </div>
        <div class="edit-field">
          <label>标题</label>
          <input v-model="aboutForm.about_title" class="field-input" />
        </div>
        <div class="edit-field">
          <label>副标题</label>
          <input v-model="aboutForm.about_subtitle" class="field-input" />
        </div>
        <div class="edit-field">
          <label>介绍文字</label>
          <textarea v-model="aboutForm.about_intro" class="field-textarea" rows="3"></textarea>
        </div>
        <div class="edit-field">
          <label>详细说明</label>
          <textarea v-model="aboutForm.about_detail" class="field-textarea" rows="3"></textarea>
        </div>
        <div class="edit-field">
          <label>服务承诺（4项）</label>
          <input v-model="aboutForm.about_feature_1" class="field-input" placeholder="承诺1" />
          <input v-model="aboutForm.about_feature_2" class="field-input" placeholder="承诺2" style="margin-top:6px" />
          <input v-model="aboutForm.about_feature_3" class="field-input" placeholder="承诺3" style="margin-top:6px" />
          <input v-model="aboutForm.about_feature_4" class="field-input" placeholder="承诺4" style="margin-top:6px" />
        </div>
        <button class="btn btn-primary" @click="saveAbout">💾 保存关于我们</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { adminAPI, servicesAPI, settingsAPI } from '../api'

// 数据大屏按需加载：echarts 仅在实际打开大屏时才下载
const DataDashboard = defineAsyncComponent(() => import('./DataDashboard.vue'))

defineEmits(['logout'])

const stats = ref(null)
const lastUpdate = ref('')
const activeTab = ref('stats')
const servicesList = ref([])
const svcFileInputs = ref({})

const aboutForm = ref({
  about_title: '', about_subtitle: '', about_intro: '',
  about_detail: '', about_feature_1: '', about_feature_2: '',
  about_feature_3: '', about_feature_4: '', about_image: ''
})

const isPathUrl = (val) => {
  return val && (val.startsWith('icons/') || val.startsWith('photos/') || val.startsWith('backgrounds/'))
}

const statusBars = computed(() => {
  if (!stats.value) return []
  const s = stats.value.bookingsByStatus
  const max = Math.max(s.new, s.claimed, s.completed, s.cancelled, 1)
  return [
    { key: 'new', label: '待处理', count: s.new, cls: 'bar-warn', pct: Math.round(s.new / max * 100) },
    { key: 'claimed', label: '进行中', count: s.claimed, cls: 'bar-blue', pct: Math.round(s.claimed / max * 100) },
    { key: 'completed', label: '已完成', count: s.completed, cls: 'bar-green', pct: Math.round(s.completed / max * 100) },
    { key: 'cancelled', label: '已取消', count: s.cancelled, cls: 'bar-red', pct: Math.round(s.cancelled / max * 100) }
  ]
})

const maxServiceCount = computed(() => {
  if (!stats.value) return 1
  return Math.max(...stats.value.bookingsByService.map(s => s.count), 1)
})

const load = async () => {
  try {
    const res = await adminAPI.stats()
    stats.value = res.data
    lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'services' && servicesList.value.length === 0) {
    loadServices()
  }
  if (tab === 'about' && !aboutForm.value.about_title) {
    loadAbout()
  }
}

// ---- 服务管理 ----
const loadServices = async () => {
  try {
    const res = await servicesAPI.getAll()
    servicesList.value = res.data
  } catch (e) {
    console.error('加载服务失败:', e)
  }
}

const saveService = async (svc) => {
  try {
    await servicesAPI.update(svc.id, {
      name: svc.name,
      icon: svc.icon,
      description: svc.description,
      price: svc.price,
      price_unit: svc.price_unit
    })
    alert('保存成功')
  } catch (e) {
    alert(e.response?.data?.error || '保存失败')
  }
}

const triggerSvcIcon = (id) => {
  svcFileInputs.value[id]?.click()
}

const handleSvcIconUpload = async (svc, e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const res = await servicesAPI.uploadIcon(svc.id, file)
    svc.icon = res.data.icon
  } catch (err) {
    alert(err.response?.data?.error || '上传失败')
  }
}

// ---- 关于我们管理 ----
const loadAbout = async () => {
  try {
    const res = await settingsAPI.getAbout()
    aboutForm.value = { ...aboutForm.value, ...res.data }
  } catch (e) {
    console.error('加载关于我们失败:', e)
  }
}

const saveAbout = async () => {
  try {
    await settingsAPI.updateAbout(aboutForm.value)
    alert('关于我们已更新')
  } catch (e) {
    alert(e.response?.data?.error || '保存失败')
  }
}

const aboutFileInput = ref(null)

const triggerAboutUpload = () => {
  aboutFileInput.value?.click()
}

const handleAboutImageUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const res = await settingsAPI.uploadAboutImage(file)
    aboutForm.value.about_image = res.data.image
  } catch (err) {
    alert(err.response?.data?.error || '上传失败')
  }
}

onMounted(() => {
  load()
  setInterval(load, 15000) // 每15秒刷新
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f5f3f0;
}

/* ---- 顶栏 ---- */
.admin-topbar {
  background: #3d2c1e;
  color: #fff;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.admin-topbar h1 { font-size: 1.2rem; display: flex; align-items: center; gap: 8px; }
.admin-logo { width: 28px; height: 28px; border-radius: 5px; object-fit: contain; }

.btn-exit {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
}

.btn-exit:hover { background: rgba(255,255,255,0.2); }

/* ---- 内容 ---- */
.admin-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 60px;
}

/* ---- 统计卡片 ---- */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

@media (max-width: 900px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border-top: 4px solid;
}

.c-maple { border-top-color: var(--maple); }
.c-blue  { border-top-color: var(--blue); }
.c-green { border-top-color: var(--green); }
.c-gold  { border-top-color: #f0a030; }

.sc-icon { font-size: 1.8rem; margin-bottom: 8px; }
.sc-num  { font-size: 2rem; font-weight: 800; color: var(--text); }
.sc-label { font-size: 0.78rem; color: var(--text-light); margin-top: 4px; }

/* ---- 图表行 ---- */
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 900px) {
  .chart-row { grid-template-columns: 1fr; }
}

.chart-box {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 20px;
}

/* ---- 柱状图 ---- */
.bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 180px;
  padding-top: 20px;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 60px;
}

.bar-val {
  font-weight: 700;
  font-size: 1.1rem;
}

.bar-fill-wrap {
  width: 40px;
  height: 130px;
  background: #f0edea;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 8px 8px 0 0;
  transition: height 0.6s ease;
  min-height: 4px;
}

.bar-warn  { background: #ffc107; }
.bar-blue  { background: var(--blue); }
.bar-green { background: var(--green); }
.bar-red   { background: var(--red); }

.bar-label {
  font-size: 0.72rem;
  color: var(--text-light);
}

/* ---- 进度条 ---- */
.progress-row {
  margin-bottom: 14px;
}

.prog-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.prog-count {
  float: right;
  font-size: 0.75rem;
  color: var(--text-light);
}

.prog-bar-bg {
  height: 8px;
  background: #f0edea;
  border-radius: 4px;
  margin-top: 4px;
  overflow: hidden;
}

.prog-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--maple), var(--maple-light));
  border-radius: 4px;
  transition: width 0.6s ease;
}

/* ---- 师傅排行 ---- */
.staff-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0edea;
}

.staff-rank { font-weight: 700; width: 30px; }
.rank-1 { color: #f0a030; }
.rank-2 { color: #a0a0a0; }
.rank-3 { color: #cd7f32; }

.staff-name { font-weight: 600; flex: 1; }
.staff-role { font-size: 0.8rem; color: var(--text-light); }
.staff-info { font-size: 0.78rem; color: var(--text-light); }

/* ---- 评价概览 ---- */
.rating-big {
  font-size: 3.5rem;
  font-weight: 800;
  text-align: center;
  color: var(--maple);
}

.rating-sub {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 20px;
}

.mini-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.mini-item {
  text-align: center;
}

.mini-num {
  font-size: 1.4rem;
  font-weight: 700;
  display: block;
}

.mini-label {
  font-size: 0.72rem;
  color: var(--text-light);
}

/* ---- 刷新 ---- */
.refresh-info {
  text-align: center;
  font-size: 0.72rem;
  color: var(--text-light);
  margin-top: 12px;
}

/* ---- 标签导航 ---- */
.admin-tabs {
  display: flex;
  justify-content: center;
  gap: 0;
  padding: 16px 24px 0;
  background: #f5f3f0;
}

.tab-btn {
  padding: 12px 32px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  color: var(--text-light);
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text);
  background: rgba(255,255,255,0.5);
}

.tab-btn.active {
  color: var(--maple);
  border-bottom-color: var(--maple);
  font-weight: 600;
}

/* ---- 编辑区块共用 ---- */
.edit-section-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--text);
}

/* ---- 服务编辑 ---- */
.services-edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.svc-edit-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.svc-edit-icon {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: var(--warm-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  transition: opacity 0.2s;
}

.svc-edit-icon:hover {
  opacity: 0.85;
}

.svc-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
}

.svc-icon-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 16px;
}

.svc-edit-icon:hover .svc-icon-overlay {
  opacity: 1;
}

.svc-edit-fields {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.svc-edit-fields label {
  font-size: 0.75rem;
  color: var(--text-light);
  font-weight: 500;
  margin-top: 6px;
}

.field-input, .field-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--text);
  background: #fff;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.field-input:focus, .field-textarea:focus {
  outline: none;
  border-color: var(--maple);
  box-shadow: 0 0 0 2px rgba(199, 81, 26, 0.1);
}

.field-textarea {
  resize: vertical;
}

.field-sm {
  max-width: 140px;
}

/* ---- 关于我们编辑 ---- */
.about-edit-wrap {
  max-width: 700px;
}

.edit-field {
  margin-bottom: 16px;
}

.edit-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}

.about-edit-preview {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 12px;
  background: var(--warm-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  border: 2px dashed var(--border);
  transition: border-color 0.2s;
}

.about-edit-preview:hover {
  border-color: var(--maple);
}

.about-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.about-preview-placeholder {
  color: var(--text-light);
  font-size: 0.9rem;
}
</style>
