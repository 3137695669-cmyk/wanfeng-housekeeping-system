<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo-text"><img src="/logo.jpg" alt="晚枫家政" class="footer-logo" /> 晚枫家政</div>
          <p>让家更有温度。专业家政服务平台，致力于为每一个家庭提供高品质、可信赖的家政服务。</p>
        </div>
        <div>
          <h4>服务项目</h4>
          <ul class="footer-links">
            <li><a href="#services">日常保洁</a></li>
            <li><a href="#services">深度清洁</a></li>
            <li><a href="#services">月嫂服务</a></li>
            <li><a href="#services">养老护理</a></li>
          </ul>
        </div>
        <div>
          <h4>关于我们</h4>
          <ul class="footer-links">
            <li><a href="#about">公司简介</a></li>
            <li><a href="#staff">家政团队</a></li>
            <li><a href="#">加入我们</a></li>
            <li><a href="#">常见问题</a></li>
          </ul>
        </div>
        <div>
          <h4>联系方式</h4>
          <ul class="footer-links">
            <li><span class="deco-star">★</span> 400-888-6666</li>
            <li>💬 微信：wanfeng_jiazheng</li>
            <li>🏠 服务范围：全市覆盖</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; 2025 晚枫家政 All Rights Reserved. | 用心服务每一个家
        <span class="footer-admin-link" @click="$emit('openAdmin')"><span class="deco-star">✦</span> 管理后台</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
defineEmits(['openAdmin'])
</script>

<style scoped>
.footer {
  background: var(--text);
  color: #b8a898;
  padding: 60px 0 30px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 48px;
}

.logo-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.footer-logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: contain;
}

.footer-brand p {
  font-size: 0.9rem;
}

.footer h4 {
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.footer-links li {
  margin-bottom: 8px;
}

.footer-links a {
  font-size: 0.9rem;
  transition: color var(--transition);
}

.footer-links a:hover {
  color: var(--maple-light);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 24px;
  text-align: center;
  font-size: 0.85rem;
}

.footer-admin-link {
  color: #6b5744;
  cursor: pointer;
  margin-left: 12px;
  font-size: 0.8rem;
  transition: color var(--transition);
}

.footer-admin-link:hover {
  color: var(--maple-light);
}

.deco-star {
  color: #f7c873;
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
