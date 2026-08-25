<template>
  <section class="section reviews" id="reviews">
    <div class="container">
      <div class="section-header">
        <h2><span class="deco-star">★</span> 客户评价 <span class="deco-star">★</span></h2>
        <p>超过5000个家庭的真实反馈</p>
      </div>

      <div class="review-form-wrap">
        <h3>分享您的体验</h3>
        <form class="review-form" @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-group">
              <label>评分</label>
              <div class="star-rating">
                <span 
                  v-for="i in 5" 
                  :key="i"
                  :class="{ active: i <= rating }"
                  @click="rating = i"
                >★</span>
              </div>
            </div>
            <div class="form-group">
              <label>服务类型</label>
              <select v-model="reviewForm.service">
                <option value="">请选择</option>
                <option v-for="s in ['日常保洁', '深度清洁', '月嫂服务', '养老护理', '家电清洗', '收纳整理']" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>您的称呼</label>
              <input v-model="reviewForm.name" type="text" placeholder="请输入称呼" />
            </div>
          </div>
          <div class="form-group">
            <label>评价内容 *</label>
            <textarea v-model="reviewForm.text" placeholder="分享您的服务体验..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-sm">发表评价</button>
        </form>
      </div>

      <div class="reviews-grid">
        <div v-for="review in reviews" :key="review.id" class="review-card card-moe">
          <p class="review-text">{{ review.text }}</p>
          <div class="review-meta">
            <div class="review-author">
              <div class="review-avatar">{{ review.avatar }}</div>
              <div>
                <div style="font-weight: 600; font-size: 0.95rem;">{{ review.name }}</div>
                <div class="review-stars">{{ '★'.repeat(review.stars) }}{{ '☆'.repeat(5 - review.stars) }}</div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <div class="review-service-tag">{{ review.service }}</div>
              <div v-if="review.staffName" style="font-size: 0.75rem; color: var(--maple);">评价师傅: {{ review.staffName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

defineProps(['reviews'])
const emit = defineEmits(['reviewSubmit'])

const rating = ref(0)
const reviewForm = ref({
  name: '',
  service: '',
  text: ''
})

const handleSubmit = () => {
  if (!reviewForm.value.text) {
    alert('请填写评价内容')
    return
  }
  if (rating.value === 0) {
    alert('请给服务评分')
    return
  }
  
  emit('reviewSubmit', {
    name: reviewForm.value.name || '匿名',
    text: reviewForm.value.text,
    stars: rating.value,
    service: reviewForm.value.service || '未指定'
  })
  
  rating.value = 0
  reviewForm.value = { name: '', service: '', text: '' }
}
</script>

<style scoped>
.reviews {
  background: var(--cream);
}

.review-form-wrap {
  background: #fff;
  border-radius: var(--radius);
  padding: 32px;
  box-shadow: var(--shadow);
  margin-bottom: 40px;
}

.review-form-wrap h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 20px;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  outline: none;
}

.star-rating {
  display: flex;
  gap: 6px;
  font-size: 1.8rem;
  cursor: pointer;
}

.star-rating span {
  color: #ddd;
  transition: color var(--transition);
}

.star-rating span.active,
.star-rating span:hover {
  color: #f0a030;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.review-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 28px;
  position: relative;
}

.review-text {
  font-size: 0.95rem;
  color: var(--text);
  margin-bottom: 16px;
  font-style: italic;
}

.review-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--maple-light), var(--maple));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
}

.review-stars {
  color: #f0a030;
  font-size: 0.85rem;
}

.review-service-tag {
  font-size: 0.75rem;
  padding: 4px 10px;
  background: var(--cream);
  border-radius: 10px;
  color: var(--text-light);
}

.deco-star {
  color: #f7c873;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  .reviews-grid {
    grid-template-columns: 1fr;
  }
}
</style>
