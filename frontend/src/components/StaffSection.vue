<template>
  <section class="section staff-section" id="staff">
    <div class="container">
      <div class="section-header">
        <h2><span class="deco-star">★</span> 家政团队展示 <span class="deco-star">★</span></h2>
        <p>每一位服务人员都经过严格筛选与系统培训</p>
      </div>
      <div class="staff-grid">
        <div v-for="member in staff" :key="member.id" class="staff-card card-moe">
          <div class="staff-photo">
            <img v-if="isPhotoPath(getDisplayPhoto(member))" :src="'http://localhost:3000/uploads/' + getDisplayPhoto(member)" alt="员工照片" class="staff-img" />
            <span v-else>{{ member.photo }}</span>
            <span class="staff-badge">{{ member.badge }}</span>
          </div>
          <div class="staff-info">
            <h3>{{ member.name }}</h3>
            <div class="staff-role">{{ member.role }}</div>
            <div class="staff-tags">
              <span v-for="(tag, i) in member.tags" :key="i" class="staff-tag">{{ tag }}</span>
            </div>
            <div class="staff-stats">
              <div class="staff-stat"><div class="staff-stat-num">{{ member.orders }}</div><div class="staff-stat-label">服务次数</div></div>
              <div class="staff-stat"><div class="staff-stat-num">{{ member.rate }}</div><div class="staff-stat-label">评分</div></div>
              <div class="staff-stat"><div class="staff-stat-num">{{ member.years }}年</div><div class="staff-stat-label">从业经验</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps(['staff'])

const isPhotoPath = (val) => {
  return val && (val.startsWith('photos/') || val.startsWith('icons/') || val.startsWith('backgrounds/'))
}

const getDisplayPhoto = (member) => {
  if (member.display_photo && (member.display_photo.startsWith('photos/') || member.display_photo.startsWith('icons/'))) {
    return member.display_photo
  }
  if (member.photo && (member.photo.startsWith('photos/') || member.photo.startsWith('icons/'))) {
    return member.photo
  }
  return ''
}
</script>

<style scoped>
.staff-section {
  background: var(--cream);
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 28px;
}

.staff-card {
  background: #fff;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all var(--transition);
  text-align: center;
}

.staff-photo {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, var(--cream), var(--warm-bg));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  position: relative;
  overflow: hidden;
}

.staff-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
}

.staff-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--maple);
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 10px;
  border-radius: 10px;
}

.staff-info {
  padding: 20px 16px;
}

.staff-info h3 {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.staff-role {
  font-size: 0.85rem;
  color: var(--maple);
  font-weight: 500;
  margin-bottom: 8px;
}

.staff-tags {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.staff-tag {
  font-size: 0.75rem;
  padding: 2px 10px;
  background: var(--cream);
  border-radius: 10px;
  color: var(--text-light);
}

.staff-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.staff-stat {
  text-align: center;
}

.staff-stat-num {
  font-size: 1rem;
  font-weight: 700;
  color: var(--maple);
}

.staff-stat-label {
  font-size: 0.7rem;
  color: var(--text-light);
}

.deco-star {
  color: #f7c873;
}

@media (max-width: 768px) {
  .staff-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
}
</style>
