<template>
  <div class="admin-overlay" @click.self="$emit('close')">
    <div class="admin-panel">
      <div class="admin-header" style="background: linear-gradient(135deg, #1a6b3c, #2d8a3e);">
        <h2>🏠 家政师傅入驻</h2>
        <button class="admin-close" @click="$emit('close')">✕</button>
      </div>
      <div class="admin-body">
        <form @submit.prevent="handleSubmit">
          <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>
          <div class="register-section">
            <div class="register-section-title">👤 基本信息</div>
            <div class="form-row">
              <div class="form-group">
                <label>姓名 *</label>
                <input v-model="form.name" type="text" placeholder="请输入真实姓名" required />
              </div>
              <div class="form-group">
                <label>手机号 *</label>
                <input v-model="form.phone" type="tel" placeholder="作为登录账号" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>设置密码 *</label>
                <input v-model="form.password" type="password" placeholder="至少6位" required />
              </div>
              <div class="form-group">
                <label>确认密码 *</label>
                <input v-model="form.password2" type="password" placeholder="再次输入密码" required />
              </div>
            </div>
          </div>

          <div class="register-section">
            <div class="register-section-title">🔧 服务方向</div>
            <div class="form-group">
              <label>选择角色</label>
              <div class="radio-grid">
                <label
                  v-for="role in roleOptions"
                  :key="role"
                  :class="['radio-item', { active: form.role === role }]"
                >
                  <input type="radio" v-model="form.role" :value="role" />
                  {{ role }}
                </label>
              </div>
            </div>
            <div class="form-group" style="margin-top:14px;">
              <label>技能标签（用逗号分隔）</label>
              <input v-model="form.tagsStr" type="text" placeholder="如：深度清洁, 收纳, 除螨" />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline btn-sm" @click="$emit('close')">取消</button>
            <button type="submit" class="btn btn-primary btn-sm">提交申请</button>
          </div>

          <div class="form-note">
            已是师傅？<a @click="$emit('switchToLogin')">去登录</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { staffAPI } from '../api'

const emit = defineEmits(['close', 'success', 'switchToLogin'])

const roleOptions = [
  '金牌月嫂', '月嫂/育儿嫂', '资深保洁', '深度保洁',
  '养老护理', '家电清洗', '收纳整理师', '其他'
]

const errorMsg = ref('')
const form = ref({
  name: '',
  phone: '',
  password: '',
  password2: '',
  role: '资深保洁',
  tagsStr: ''
})

const handleSubmit = async () => {
  if (form.value.password !== form.value.password2) {
    errorMsg.value = '两次密码不一致'
    return
  }
  if (form.value.password.length < 6) {
    errorMsg.value = '密码至少6位'
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.value.phone)) {
    errorMsg.value = '请输入正确的手机号'
    return
  }

  errorMsg.value = ''
  try {
    const tags = form.value.tagsStr
      .split(/[,，、\s]+/)
      .filter(t => t.trim())
      .slice(0, 5)

    await staffAPI.register({
      name: form.value.name,
      phone: form.value.phone,
      password: form.value.password,
      role: form.value.role,
      tags
    })
    emit('success')
  } catch (err) {
    errorMsg.value = err.response?.data?.error || '注册失败'
  }
}
</script>

<style scoped>
.admin-overlay {
  display: flex;
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  overflow-y: auto;
}

.admin-panel {
  background: #fff;
  border-radius: var(--radius);
  width: 100%;
  max-width: 520px;
  margin-top: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.admin-header {
  color: #fff;
  padding: 20px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
}

.admin-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-body {
  padding: 28px;
}

.error-msg {
  background: #fff0f0;
  color: var(--red);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  text-align: center;
  border: 1px solid #fcc;
  margin-bottom: 12px;
}

.register-section {
  margin-bottom: 20px;
}

.register-section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--border);
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

.form-group input {
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
}

.radio-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.radio-item {
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.radio-item.active {
  border-color: var(--green);
  background: #f0faf3;
  color: var(--green);
  font-weight: 500;
}

.radio-item input {
  display: none;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.form-note {
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-light);
  margin-top: 12px;
}

.form-note a {
  color: var(--green);
  cursor: pointer;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .form-row, .radio-grid {
    grid-template-columns: 1fr;
  }
}
</style>
