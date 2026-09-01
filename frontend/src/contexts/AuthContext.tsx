import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../api'
import { Usuario } from '../types'

interface AuthContextData {
  usuario: Usuario | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: string[]) => boolean
  refreshUsuario: () => Promise<void>
  aplicarPerfil: (usuario: Usuario, token?: string) => void
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('mirainox_token')
    const saved = localStorage.getItem('mirainox_usuario')
    if (token && saved) {
      setUsuario(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  async function login(email: string, senha: string) {
    const { data } = await authApi.login(email, senha)
    localStorage.setItem('mirainox_token', data.token)
    localStorage.setItem('mirainox_usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)
  }

  function logout() {
    localStorage.removeItem('mirainox_token')
    localStorage.removeItem('mirainox_usuario')
    setUsuario(null)
  }

  function hasRole(...roles: string[]) {
    return !!usuario && roles.includes(usuario.role)
  }

  async function refreshUsuario() {
    const { data } = await authApi.perfil()
    setUsuario((prev) => {
      const atualizado = { ...prev, ...data }
      localStorage.setItem('mirainox_usuario', JSON.stringify(atualizado))
      return atualizado
    })
  }

  function aplicarPerfil(u: Usuario, token?: string) {
    if (token) localStorage.setItem('mirainox_token', token)
    localStorage.setItem('mirainox_usuario', JSON.stringify(u))
    setUsuario(u)
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, hasRole, refreshUsuario, aplicarPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
