import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mirainox_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mirainox_token')
      localStorage.removeItem('mirainox_usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
