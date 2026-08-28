import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import SenhaInput from '../components/SenhaInput'

export default function TrocarSenhaObrigatoria() {
  const { usuario, refreshUsuario, logout } = useAuth()
  const navigate = useNavigate()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não conferem')
      return
    }

    setLoading(true)
    try {
      await authApi.alterarSenha(senhaAtual, novaSenha)
      await refreshUsuario()
      navigate('/')
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Não foi possível trocar a senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">Crie sua senha</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Olá, {usuario?.nome}! Por segurança, defina uma senha nova antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Senha atual (a que você usou pra entrar)</label>
            <SenhaInput value={senhaAtual} onChange={setSenhaAtual} required />
          </div>
          <div>
            <label className="label">Nova senha</label>
            <SenhaInput value={novaSenha} onChange={setNovaSenha} placeholder="Mínimo 6 caracteres" required />
          </div>
          <div>
            <label className="label">Confirmar nova senha</label>
            <SenhaInput value={confirmarSenha} onChange={setConfirmarSenha} required />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Definir nova senha e continuar'}
          </button>
          <button type="button" className="text-xs text-gray-400 w-full text-center hover:underline" onClick={logout}>
            Sair
          </button>
        </form>
      </div>
    </div>
  )
}
