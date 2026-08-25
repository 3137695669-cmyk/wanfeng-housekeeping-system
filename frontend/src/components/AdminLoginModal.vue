<template>
  <div class="admin-overlay" @click.self="$emit('close')">
    <div class="admin-panel">
      <div class="admin-header">
        <h2><img src="/logo.jpg" alt="晚枫家政" class="admin-logo" /> 晚枫家政 · 管理后台</h2>
        <button class="admin-close" @click="$emit('close')">✕</button>
      </div>
      <div class="admin-body">
        <div class="login-wrap">
          <h3>🔐 管理员登录</h3>
          <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>
          <div class="form-group">
            <label>账号</label>
            <input v-model="form.username" type="text" placeholder="请输入管理员账号" @keydown.enter="handleLogin" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="form.password" type="password" placeholder="请输入管理员密码" @keydown.enter="handleLogin" />
          </div>
          <button class="btn btn-primary" @click="handleLogin">登 录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { adminAPI } from '../api'

const emit = defineEmits(['close', 'success'])

const form = ref({ username: '', password: '' })
const errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''
  try {
    await adminAPI.login(form.value)
    emit('success')
  } catch (err) {
    errorMsg.value = err.response?.data?.error || '登录失败'
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
}

.admin-panel {
  background: #fff;
  border-radius: var(--radius);
  width: 100%;
  max-width: 440px;
  margin-top: 80px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.admin-header {
  background: #3d2c1e;
  color: #fff;
  padding: 20px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h2 { font-size: 1.1rem; display: flex; align-items: center; gap: 8px; }
.admin-logo { width: 28px; height: 28px; border-radius: 5px; object-fit: contain; }

.admin-close {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.admin-body { padding: 28px; }

.login-wrap { display: flex; flex-direction: column; gap: 18px; align-items: center; }

.login-wrap h3 { font-size: 1.2rem; }

.form-group {
  width: 100%;
  display: flex; flex-direction: column; gap: 6px;
}

.form-group label { font-size: 0.9rem; font-weight: 500; color: var(--text); }

.form-group input {
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
}

.error-msg {
  background: #fff0f0;
  color: var(--red);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  text-align: center;
  border: 1px solid #fcc;
  width: 100%;
}
</style>
