<template>
  <section class="section services" id="services">
    <div class="container">
      <div class="section-header">
        <h2><span class="deco-star">★</span> 我们的服务项目 <span class="deco-star">★</span></h2>
        <p>全方位满足您的家庭需求，每一项服务都精益求精</p>
      </div>
      <div class="services-grid">
        <div 
          v-for="service in services" 
          :key="service.id" 
          class="service-card card-moe" 
          @click="$emit('serviceClick', service)"
        >
          <div class="service-icon" :class="'icon-' + (service.id % 6 + 1)">
            <img v-if="isIconUrl(service.icon)" :src="'http://localhost:3000/uploads/' + service.icon" alt="图标" class="icon-img" />
            <span v-else>{{ service.icon }}</span>
          </div>
          <h3>{{ service.name }}</h3>
          <p>{{ service.description }}</p>
          <div class="service-price">¥{{ service.price }} {{ service.price_unit }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps(['services'])
defineEmits(['serviceClick'])

const isIconUrl = (val) => {
  return val && (val.startsWith('icons/') || val.startsWith('photos/') || val.startsWith('backgrounds/'))
}
</script>

<style scoped>
.services {
  background: var(--cream);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 28px;
}

.service-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 36px 28px;
  box-shadow: var(--shadow);
  transition: all var(--transition);
  text-align: center;
  cursor: pointer;
}

.service-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  overflow: hidden;
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
}

.icon-1 { background: #fff3ed; }
.icon-2 { background: #fef5e7; }
.icon-3 { background: #fff0f0; }
.icon-4 { background: #f0faf5; }
.icon-5 { background: #f3f0ff; }
.icon-6 { background: #fff7e6; }

.service-card h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.service-card p {
  font-size: 0.9rem;
  color: var(--text-light);
}

.service-price {
  display: inline-block;
  margin-top: 16px;
  padding: 6px 16px;
  background: var(--cream);
  color: var(--maple);
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.95rem;
}

.deco-star {
  color: #f7c873;
}
</style>
