<template>
  <div class="toast" :class="{ show, error }">{{ message }}</div>
</template>

<script setup>
defineProps({
  message: String,
  show: Boolean,
  error: Boolean
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(-120px);
  background: var(--green);
  color: #fff;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 500;
  z-index: 9999;
  transition: transform 0.4s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.toast.show {
  transform: translateX(-50%) translateY(0);
}

.toast.error {
  background: var(--red);
}
</style>
