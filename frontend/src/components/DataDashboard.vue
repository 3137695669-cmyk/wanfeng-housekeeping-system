<template>
  <div class="viz-root dash-screen">
    <!-- 顶栏 -->
    <header class="ds-header">
      <div class="ds-title-wrap">
        <h1 class="ds-title">晚枫家政 · 经营数据大屏</h1>
        <div class="ds-subtitle">实时经营分析 · 数据来源 MySQL 聚合查询</div>
      </div>
      <button class="ds-refresh" @click="load">↻ 刷新</button>
    </header>

    <!-- KPI 指标行 -->
    <div class="kpi-row">
      <div class="kpi-tile" v-for="k in kpis" :key="k.label">
        <div class="kpi-label">{{ k.label }}</div>
        <div class="kpi-value">{{ k.value }}</div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="chart-grid">
      <section class="panel span-7">
        <div class="panel-title">月度订单量趋势</div>
        <div ref="trendEl" class="chart"></div>
      </section>
      <section class="panel span-5">
        <div class="panel-title">订单状态分布</div>
        <div ref="statusEl" class="chart"></div>
      </section>

      <section class="panel span-7">
        <div class="panel-title">月度营收趋势</div>
        <div ref="revenueEl" class="chart"></div>
      </section>
      <section class="panel span-5">
        <div class="panel-title">评价星级分布</div>
        <div ref="ratingEl" class="chart"></div>
      </section>

      <section class="panel span-6">
        <div class="panel-title">服务订单分布</div>
        <div ref="serviceEl" class="chart"></div>
      </section>
      <section class="panel span-6">
        <div class="panel-title">师傅接单排行 Top 5</div>
        <div ref="staffEl" class="chart"></div>
      </section>
    </div>

    <!-- 数据明细（表格视图） -->
    <section class="panel detail-panel">
      <div class="panel-title">月度经营明细</div>
      <table class="detail-table" v-if="trend.length">
        <thead>
          <tr><th>月份</th><th>订单量</th><th>营收</th></tr>
        </thead>
        <tbody>
          <tr v-for="t in trend" :key="t.month">
            <td>{{ t.month }}</td>
            <td>{{ t.count }} 单</td>
            <td>{{ fmtMoney(t.revenue) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="detail-empty">暂无数据</div>
    </section>

    <footer class="ds-footer">数据实时刷新 · 上次更新 {{ lastUpdate || '—' }}</footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { adminAPI } from '../api'

// ---- 暗色大屏配色（来自已验证的 dark 调色板）----
const C = {
  surface: '#1a1a19',
  textPrimary: '#ffffff',
  textSecondary: '#c3c2b7',
  muted: '#898781',
  gridline: '#2c2c2a',
  baseline: '#383835',
  blue: '#3987e5',
  orange: '#d95926',
  aqua: '#199e70',
  yellow: '#c98500',
  starRamp: ['#5598e7', '#3987e5', '#2a78d6', '#256abf', '#184f95'] // 1→5 星
}

const stats = ref(null)
const analytics = ref(null)
const lastUpdate = ref('')
const trend = computed(() => analytics.value?.trend || [])

const trendEl = ref(null)
const statusEl = ref(null)
const revenueEl = ref(null)
const ratingEl = ref(null)
const serviceEl = ref(null)
const staffEl = ref(null)

let charts = []

const fmt = (n) => (n ?? 0).toLocaleString('zh-CN')
const fmtMoney = (n) => '¥' + fmt(Math.round(n ?? 0))

const kpis = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: '订单总量', value: fmt(s.totalBookings) },
    { label: '总收入（已完成）', value: fmtMoney(s.totalRevenue) },
    { label: '注册用户', value: fmt(s.totalUsers) },
    { label: '服务师傅', value: fmt(s.totalStaff) },
    { label: '平均评分', value: s.avgRating ?? '0' }
  ]
})

// ECharts 通用文本/坐标样式
const axisLabelStyle = { color: C.muted, fontSize: 11 }
const tooltipStyle = {
  backgroundColor: C.surface,
  borderColor: C.baseline,
  textStyle: { color: C.textPrimary, fontSize: 12 }
}

function getChart(el) {
  if (!el) return null
  let chart = echarts.getInstanceByDom(el)
  if (!chart) {
    chart = echarts.init(el)
    charts.push(chart)
  }
  return chart
}

function renderTrend() {
  const chart = getChart(trendEl.value)
  if (!chart || !analytics.value) return
  const data = analytics.value.trend || []
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 48, right: 20, top: 20, bottom: 30 },
    tooltip: {
      ...tooltipStyle,
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: C.baseline } },
      formatter: (ps) => {
        const p = ps[0]
        return `${p.axisValue}<br/>订单量：<strong>${p.value} 单</strong>`
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.month),
      axisLine: { lineStyle: { color: C.baseline } },
      axisTick: { show: false },
      axisLabel: axisLabelStyle
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: C.gridline } },
      axisLabel: axisLabelStyle
    },
    series: [{
      type: 'line',
      data: data.map(d => d.count),
      color: C.blue,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 2 },
      itemStyle: { color: C.blue, borderColor: C.surface, borderWidth: 2 },
      areaStyle: { color: C.blue, opacity: 0.1 },
      smooth: false
    }]
  })
}

function renderRevenue() {
  const chart = getChart(revenueEl.value)
  if (!chart || !analytics.value) return
  const data = analytics.value.trend || []
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    tooltip: {
      ...tooltipStyle,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (ps) => {
        const p = ps[0]
        return `${p.axisValue}<br/>营收：<strong>${fmtMoney(p.value)}</strong>`
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.month),
      axisLine: { lineStyle: { color: C.baseline } },
      axisTick: { show: false },
      axisLabel: axisLabelStyle
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: C.gridline } },
      axisLabel: { ...axisLabelStyle, formatter: (v) => fmt(v) }
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.revenue),
      barMaxWidth: 24,
      itemStyle: { color: C.orange, borderRadius: [4, 4, 0, 0] }
    }]
  })
}

function renderStatus() {
  const chart = getChart(statusEl.value)
  if (!chart || !stats.value) return
  const s = stats.value.bookingsByStatus
  const rows = [
    { name: '已完成', value: s.completed, color: C.aqua },
    { name: '进行中', value: s.claimed, color: C.blue },
    { name: '待处理', value: s.new, color: C.yellow },
    { name: '已取消', value: s.cancelled, color: C.orange }
  ]
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 72, right: 48, top: 10, bottom: 10 },
    tooltip: { ...tooltipStyle, trigger: 'item', formatter: (p) => `${p.name}：<strong>${p.value} 单</strong>` },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: C.gridline } }, axisLabel: axisLabelStyle },
    yAxis: {
      type: 'category',
      data: rows.map(r => r.name),
      axisLine: { lineStyle: { color: C.baseline } },
      axisTick: { show: false },
      axisLabel: { ...axisLabelStyle, color: C.textSecondary }
    },
    series: [{
      type: 'bar',
      data: rows.map(r => ({ value: r.value, itemStyle: { color: r.color } })),
      barMaxWidth: 20,
      itemStyle: { borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', color: C.textSecondary, fontSize: 11 }
    }]
  })
}

function renderRating() {
  const chart = getChart(ratingEl.value)
  if (!chart || !analytics.value) return
  const data = analytics.value.ratingDist || []
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 40, right: 20, top: 24, bottom: 30 },
    tooltip: { ...tooltipStyle, trigger: 'item', formatter: (p) => `${p.name}：<strong>${p.value} 条</strong>` },
    xAxis: {
      type: 'category',
      data: data.map(d => d.stars + '星'),
      axisLine: { lineStyle: { color: C.baseline } },
      axisTick: { show: false },
      axisLabel: axisLabelStyle
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: C.gridline } },
      axisLabel: axisLabelStyle
    },
    series: [{
      type: 'bar',
      data: data.map((d, i) => ({ value: d.count, itemStyle: { color: C.starRamp[i] } })),
      barMaxWidth: 24,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top', color: C.textSecondary, fontSize: 11 }
    }]
  })
}

function renderService() {
  const chart = getChart(serviceEl.value)
  if (!chart || !stats.value) return
  const data = stats.value.bookingsByService || []
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 88, right: 48, top: 10, bottom: 10 },
    tooltip: {
      ...tooltipStyle,
      trigger: 'item',
      formatter: (p) => `${p.name}：<strong>${p.value} 单</strong> · 营收 ${fmtMoney(data[p.dataIndex]?.revenue)}`
    },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: C.gridline } }, axisLabel: axisLabelStyle },
    yAxis: {
      type: 'category',
      data: data.map(d => d.service),
      axisLine: { lineStyle: { color: C.baseline } },
      axisTick: { show: false },
      axisLabel: { ...axisLabelStyle, color: C.textSecondary }
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.count),
      color: C.blue,
      barMaxWidth: 20,
      itemStyle: { borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', color: C.textSecondary, fontSize: 11 }
    }]
  })
}

function renderStaff() {
  const chart = getChart(staffEl.value)
  if (!chart || !stats.value) return
  const data = [...(stats.value.topStaff || [])].reverse() // #1 置顶
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 88, right: 48, top: 10, bottom: 10 },
    tooltip: {
      ...tooltipStyle,
      trigger: 'item',
      formatter: (p) => `${p.name}（${data[p.dataIndex]?.role}）：<strong>${p.value} 单</strong> · ⭐${data[p.dataIndex]?.rate}`
    },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: C.gridline } }, axisLabel: axisLabelStyle },
    yAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: { lineStyle: { color: C.baseline } },
      axisTick: { show: false },
      axisLabel: { ...axisLabelStyle, color: C.textSecondary }
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.orders),
      color: C.blue,
      barMaxWidth: 20,
      itemStyle: { borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', color: C.textSecondary, fontSize: 11 }
    }]
  })
}

function renderAll() {
  renderTrend()
  renderRevenue()
  renderStatus()
  renderRating()
  renderService()
  renderStaff()
}

const load = async () => {
  try {
    const [sRes, aRes] = await Promise.all([adminAPI.stats(), adminAPI.analytics()])
    stats.value = sRes.data
    analytics.value = aRes.data
    lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
    await nextTick()
    renderAll()
  } catch (e) {
    console.error('大屏数据加载失败:', e)
  }
}

const onResize = () => charts.forEach(c => c.resize())

onMounted(() => {
  load()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach(c => c.dispose())
  charts = []
})
</script>

<style scoped>
.viz-root {
  --surface: #1a1a19;
  --page: #0d0d0d;
  --ink-primary: #ffffff;
  --ink-secondary: #c3c2b7;
  --ink-muted: #898781;
  --border: rgba(255, 255, 255, 0.10);
  --gridline: #2c2c2a;
  color-scheme: dark;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

.dash-screen {
  min-height: 100vh;
  background: radial-gradient(1200px 600px at 50% -10%, #1c1c1a 0%, var(--page) 55%);
  color: var(--ink-primary);
  padding: 24px 28px 40px;
  box-sizing: border-box;
}

/* ---- 顶栏 ---- */
.ds-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}

.ds-title {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0;
}

.ds-subtitle {
  font-size: 0.78rem;
  color: var(--ink-muted);
  margin-top: 4px;
}

.ds-refresh {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ink-secondary);
  border: 1px solid var(--border);
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  transition: background 0.2s;
}

.ds-refresh:hover { background: rgba(255, 255, 255, 0.12); }

/* ---- KPI ---- */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}

@media (max-width: 1000px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
}

.kpi-tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
}

.kpi-label {
  font-size: 0.78rem;
  color: var(--ink-muted);
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* ---- 图表网格 ---- */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.span-5 { grid-column: span 5; }
.span-6 { grid-column: span 6; }
.span-7 { grid-column: span 7; }

@media (max-width: 900px) {
  .span-5, .span-6, .span-7 { grid-column: span 12; }
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ink-secondary);
  margin-bottom: 12px;
}

.chart {
  height: 260px;
  width: 100%;
}

/* ---- 明细表格 ---- */
.detail-panel { margin-bottom: 16px; }

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.detail-table th,
.detail-table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--gridline);
  font-variant-numeric: tabular-nums;
}

.detail-table th {
  color: var(--ink-muted);
  font-weight: 500;
  font-size: 0.75rem;
}

.detail-empty {
  color: var(--ink-muted);
  font-size: 0.85rem;
  padding: 8px 0;
}

.ds-footer {
  text-align: center;
  font-size: 0.72rem;
  color: var(--ink-muted);
  margin-top: 8px;
}
</style>
