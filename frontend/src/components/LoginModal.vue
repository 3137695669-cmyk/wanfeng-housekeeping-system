<template>
  <div class="admin-overlay" @click.self="$emit('close')">
    <div class="admin-panel">
      <div class="admin-header">
        <h2>🔑 用户登录</h2>
        <button class="admin-close" @click="$emit('close')">✕</button>
      </div>
      <div class="admin-body">
        <div class="login-wrap">
          <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>
          <div class="form-group">
            <label>手机号</label>
            <input v-model="form.phone" type="tel" placeholder="请输入注册手机号" @keydown.enter="handleLogin" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="form.password" type="password" placeholder="请输入密码" @keydown.enter="handleLogin" />
          </div>
          <button class="btn btn-primary" @click="handleLogin">登 录</button>
          <div class="form-note">
            没有账号？<a @click="goRegister">立即注册</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usersAPI } from '../api'

const emit = defineEmits(['close', 'success'])

const form = ref({
  phone: '',
  password: ''
})
const errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''
  try {
    const res = await usersAPI.login(form.value)
    emit('success', res.data.user)
  } catch (err) {
    errorMsg.value = err.response?.data?.error || '登录失败'
  }
}

const goRegister = () => {
  emit('close')
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
  max-width: 440px;
  min-height: 200px;
  margin-top: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.admin-header {
  background: linear-gradient(135deg, #3b6eb5, #2a5290);
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
  transition: background var(--transition);
}

.admin-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

.admin-body {
  padding: 28px;
}

.login-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
}

.error-msg {
  background: #fff0f0;
  color: var(--red);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  text-align: center;
  border: 1px solid #fcc;
}

.form-group input {
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--text);
  background: #fff;
  outline: none;
}

.form-note {
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-light);
  margin-top: 12px;
}

.form-note a {
  color: var(--maple);
  cursor: pointer;
  text-decoration: underline;
}
</style>
