<template>
  <section class="hero">
    <div class="container">
      <div class="hero-tag"><span class="deco-star">✦</span> 专业 · 贴心 · 值得信赖 <span class="deco-star">✦</span></div>
      <h1>晚枫家政，<span class="text-anime">让家更有温度</span></h1>
      <p>深耕家政行业多年，严选每一位服务人员，用专业和真诚，守护万家灯火的温暖日常。</p>
      <div class="hero-actions">
        <a href="#booking" class="btn btn-primary">✨ 立即预约服务</a>
        <a href="tel:400-888-6666" class="btn btn-outline"><span class="deco-star">★</span> 400-888-6666</a>
      </div>
      <div class="hero-stats">
        <div class="stat-item"><div class="stat-num">5000+</div><div class="stat-label">服务家庭</div></div>
        <div class="stat-item"><div class="stat-num">98.6%</div><div class="stat-label">好评率</div></div>
        <div class="stat-item"><div class="stat-num">300+</div><div class="stat-label">专业服务人员</div></div>
        <div class="stat-item"><div class="stat-num">7×24</div><div class="stat-label">客服支持</div></div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.hero {
  padding: 160px 0 100px;
  background: linear-gradient(170deg, var(--cream) 0%, var(--warm-bg) 50%, #fff 100%);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-tag {
  display: inline-block;
  background: rgba(199, 81, 26, 0.08);
  color: var(--maple);
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 0.9rem;
  margin-bottom: 24px;
}

.hero h1 {
  font-size: 3rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1.25;
  margin-bottom: 20px;
}

.hero h1 span {
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

.hero p {
  font-size: 1.15rem;
  color: var(--text-light);
  max-width: 560px;
  margin: 0 auto 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-top: 64px;
  padding-top: 48px;
  border-top: 1px solid var(--border);
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 2rem;
  font-weight: 800;
  color: var(--maple);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-top: 4px;
}

.deco-star {
  color: #f7c873;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  .hero-stats {
    gap: 30px;
    flex-wrap: wrap;
  }
  .stat-num {
    font-size: 1.5rem;
  }
}
</style>
