import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { notificacoesApi } from '../../api'
import { Notificacao } from '../../types'
import { formatarDataHora } from '../../utils/formatters'

export default function Header() {
  const { logout, usuario } = useAuth()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [aberto, setAberto] = useState(false)
  const naoLidas = notificacoes.filter((n) => !n.lida).length

  useEffect(() => {
    carregarNotificacoes()
    const interval = setInterval(carregarNotificacoes, 30000)
    return () => clearInterval(interval)
  }, [])

  async function carregarNotificacoes() {
    try {
      const { data } = await notificacoesApi.listar()
      setNotificacoes(data)
    } catch {}
  }

  async function marcarLida(id: string) {
    await notificacoesApi.marcarLida(id)
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
  }

  async function marcarTodas() {
    await notificacoesApi.marcarTodasLidas()
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Sistema Mirainox</h2>
        <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setAberto(!aberto)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            🔔
            {naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>

          {aberto && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notificações</h3>
                {naoLidas > 0 && (
                  <button onClick={marcarTodas} className="text-xs text-blue-600 hover:underline">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notificacoes.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 text-center">Nenhuma notificação</p>
                ) : (
                  notificacoes.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${!n.lida ? 'bg-blue-50' : ''}`}
                      onClick={() => marcarLida(n.id)}
                    >
                      <p className="text-sm font-medium">{n.titulo}</p>
                      <p className="text-xs text-gray-600 mt-1">{n.mensagem}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatarDataHora(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {usuario?.nome.charAt(0)}
          </div>
          <button onClick={logout} className="text-sm text-gray-600 hover:text-red-600">
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
