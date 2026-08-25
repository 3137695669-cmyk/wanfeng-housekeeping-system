import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`),
  update: (id, data) => api.put(`/services/${id}`, data),
  uploadIcon: (id, file) => {
    const form = new FormData()
    form.append('icon', file)
    form.append('id', id)
    return api.post('/services/icon-upload', form)
  }
}

export const staffAPI = {
  getAll: () => api.get('/staff'),
  getById: (id) => api.get(`/staff/${id}`),
  login: (data) => api.post('/staff/login', data),
  register: (data) => api.post('/staff/register', data),
  updateRate: (id, stars) => api.put(`/staff/${id}/rate`, { stars }),
  uploadPhoto: (id, file) => {
    const form = new FormData()
    form.append('photo', file)
    form.append('id', id)
    return api.post('/staff/photo-upload', form)
  },
  uploadDisplayPhoto: (id, file) => {
    const form = new FormData()
    form.append('display_photo', file)
    form.append('id', id)
    return api.post('/staff/display-photo-upload', form)
  }
}

export const bookingsAPI = {
  getAll: (status) => api.get('/bookings', { params: { status } }),
  getByStaff: (staffId) => api.get(`/bookings/staff/${staffId}`),
  getByUser: (phone) => api.get(`/bookings/user/${phone}`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  claim: (id, staffId, staffName) => api.put(`/bookings/${id}/claim`, { staffId, staffName })
}

export const reviewsAPI = {
  getAll: (service) => api.get('/reviews', { params: { service } }),
  getStats: () => api.get('/reviews/stats'),
  create: (data) => api.post('/reviews', data)
}

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  updateBackground: (id, bg) => api.put(`/users/${id}/background`, { background: bg }),
  uploadBackground: (id, file) => {
    const form = new FormData()
    form.append('background', file)
    return api.post(`/users/${id}/background/upload`, form)
  },
  deleteAccount: (id) => api.delete(`/users/${id}`)
}

export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  stats: () => api.get('/admin/stats')
}

export const settingsAPI = {
  getAbout: () => api.get('/settings/about'),
  updateAbout: (data) => api.put('/settings/about', data),
  uploadAboutImage: (file) => {
    const form = new FormData()
    form.append('image', file)
    return api.post('/settings/about/image', form)
  }
}

export const healthAPI = {
  check: () => api.get('/health')
}

export default api
