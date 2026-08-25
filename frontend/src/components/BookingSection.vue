<template>
  <section class="section booking" id="booking">
    <div class="container">
      <div class="booking-grid glow-border">
        <div class="booking-info">
          <h2>预约<span class="text-anime">服务</span></h2>
          <p>填写以下信息，我们将在30分钟内与您联系确认。</p>
          <div class="booking-contact-item">
            <div class="contact-icon">📞</div>
            <div class="contact-text"><strong>客服热线</strong><span>400-888-6666</span></div>
          </div>
          <div class="booking-contact-item">
            <div class="contact-icon">💬</div>
            <div class="contact-text"><strong>微信咨询</strong><span>wanfeng_jiazheng</span></div>
          </div>
          <div class="booking-contact-item">
            <div class="contact-icon">🏠</div>
            <div class="contact-text"><strong>服务范围</strong><span>全市覆盖，远郊亦可上门</span></div>
          </div>
        </div>
        <form class="booking-form" @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-group">
              <label>您的姓名 *</label>
              <input v-model="form.name" type="text" placeholder="请输入姓名" required />
            </div>
            <div class="form-group">
              <label>手机号码 *</label>
              <input v-model="form.phone" type="tel" placeholder="请输入手机号" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>服务类型 *</label>
              <select v-model="form.service" required @change="updateStaffOptions">
                <option value="">请选择服务</option>
                <option v-for="s in services" :key="s.id" :value="s.name">{{ s.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>期望日期</label>
            <input v-model="form.date" type="date" />
          </div>
          <div class="form-group staff-select-container" v-if="form.service">
            <label>选择服务人员 <span class="hint">(可选)</span></label>
            <select v-model="form.staffId">
              <option value="">不指定（系统自动分配）</option>
              <option v-for="s in matchingStaff" :key="s.id" :value="s.id">{{ s.name }} · {{ s.role }} · ⭐{{ s.rate }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>服务地址 *</label>
            <input v-model="form.address" type="text" placeholder="请输入详细地址" required />
          </div>
          <div class="form-group">
            <label>备注说明</label>
            <textarea v-model="form.remark" placeholder="如有特殊需求，请在此说明"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">提交预约</button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  services: { type: Array, default: () => [] },
  staff: { type: Array, default: () => [] },
  currentUser: { type: Object, default: null }
})
const emit = defineEmits(['bookingSubmit'])

const form = ref({
  name: '',
  phone: '',
  service: '',
  date: '',
  address: '',
  remark: '',
  staffId: ''
})

const matchingStaff = computed(() => {
  return props.staff.filter((s) => {
    if (!form.value.service) {
      return true
    }
    const roleMatch = s.role.includes('保洁') && form.value.service.includes('保洁')
    const tagMatch = s.tags.some(tag => form.value.service.includes(tag))
    return roleMatch || tagMatch
  })
})

const updateStaffOptions = () => {
  form.value.staffId = ''
}

const handleSubmit = () => {
  const submitData = {
    name: form.value.name || (props.currentUser?.name || ''),
    phone: form.value.phone || (props.currentUser?.phone || ''),
    service: form.value.service,
    date: form.value.date,
    address: form.value.address || (props.currentUser?.address || ''),
    remark: form.value.remark,
    staffId: form.value.staffId || null
  }

  if (!submitData.name || !submitData.phone || !submitData.service || !submitData.address) {
    alert('请填写完整的预约信息')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(submitData.phone)) {
    alert('请输入正确的手机号')
    return
  }

  emit('bookingSubmit', submitData)

  form.value = {
    name: '',
    phone: '',
    service: '',
    date: '',
    address: '',
    remark: '',
    staffId: ''
  }
}
</script>

<style scoped>
.booking {
  background: #fff;
}

.booking-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  background: var(--cream);
  border-radius: var(--radius);
  padding: 48px;
  box-shadow: var(--shadow);
}

.booking-info h2 {
  font-size: 2.1rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.text-anime {
  background: linear-gradient(120deg, #ff6b9d, #c44dff, #6bb5ff, #ff6b9d);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 4s ease infinite;
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.booking-info > p {
  color: var(--text-light);
  margin-bottom: 28px;
}

.booking-contact-item {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.contact-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.contact-text strong {
  display: block;
  font-size: 0.95rem;
}

.contact-text span {
  font-size: 0.85rem;
  color: var(--text-light);
}

.booking-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--text);
  background: #fff;
  transition: border-color var(--transition);
  outline: none;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--maple);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.hint {
  font-weight: 400;
  font-size: 0.8rem;
  color: var(--text-light);
}

.glow-border {
  border: 1.5px solid #f0a0c0;
  transition: all 0.4s ease;
}

.glow-border:hover {
  animation: border-glow 1.5s ease-in-out infinite;
}

@keyframes border-glow {
  0%, 100% { border-color: #f0a0c0; box-shadow: 0 0 8px rgba(240, 160, 192, 0.3); }
  50% { border-color: #c0a0f0; box-shadow: 0 0 16px rgba(192, 160, 240, 0.5); }
}

@media (max-width: 768px) {
  .booking-grid {
    grid-template-columns: 1fr;
    padding: 28px;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
