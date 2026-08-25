<template>
  <section class="section about" id="about">
    <div class="container">
      <div class="about-image">
        <img v-if="aboutData.about_image" :src="'http://localhost:3000/uploads/' + aboutData.about_image" alt="关于晚枫" class="about-img" />
        <template v-else>
          🍁<br><span>{{ aboutData.about_subtitle || '✦ 晚枫 · 让家更有温度 ✦' }}</span>
        </template>
      </div>
      <div class="about-content">
        <h2>关于<span class="text-anime">{{ aboutData.about_title || '晚枫' }}</span></h2>
        <p>{{ aboutData.about_intro || '晚枫家政成立于2020年，始终秉持"用心服务每一个家"的理念。我们深知，家是每个人最柔软的港湾——而我们的使命，就是让这份柔软被温柔对待。' }}</p>
        <p>{{ aboutData.about_detail || '每一位晚枫服务人员都经过严格的背景调查、技能考核和岗前培训，持证上岗，服务全程保险保障。' }}</p>
        <div class="about-features">
          <div class="about-feat"><span class="check">✓</span> {{ aboutData.about_feature_1 || '实名认证，背景调查' }}</div>
          <div class="about-feat"><span class="check">✓</span> {{ aboutData.about_feature_2 || '岗前培训，持证上岗' }}</div>
          <div class="about-feat"><span class="check">✓</span> {{ aboutData.about_feature_3 || '服务保险，全程保障' }}</div>
          <div class="about-feat"><span class="check">✓</span> {{ aboutData.about_feature_4 || '品质督导，售后无忧' }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  aboutData: { type: Object, default: () => ({}) }
})
</script>

<style scoped>
.about {
  background: #fff;
}

.about .container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}

.about-image {
  border-radius: var(--radius);
  overflow: hidden;
  background: linear-gradient(135deg, var(--cream), var(--warm-bg));
  aspect-ratio: 4/3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
  position: relative;
}

.about-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
}

.about-content h2 {
  font-size: 2.1rem;
  font-weight: 700;
  margin-bottom: 20px;
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

.about-content p {
  color: var(--text-light);
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.about-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 28px;
}

.about-feat {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  font-size: 0.95rem;
}

.about-feat .check {
  width: 24px;
  height: 24px;
  background: rgba(199, 81, 26, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--maple);
  font-size: 0.8rem;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .about .container {
    grid-template-columns: 1fr;
  }
  .about-image {
    aspect-ratio: 16/9;
    font-size: 4rem;
  }
}
</style>
