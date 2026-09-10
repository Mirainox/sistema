import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pedidosApi } from '../api'
import { Pedido } from '../types'
import { formatarData, formatarDataHora, formatarMoeda, FASE_ENTREGA_LABEL, FASE_ENTREGA_COR } from '../utils/formatters'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'

const FASES: { id: string; label: string }[] = [
  { id: 'PRODUCAO_FINALIZADA', label: 'Finalizada pela produção' },
  { id: 'EM_ROTA', label: 'Em rota de entrega' },
  { id: 'ENTREGUE', label: 'Entregue no destino' },
]

function noPrazo(p: Pedido) {
  if (!p.entregueEm || !p.prazoEntrega) return null
  const e = new Date(p.entregueEm); e.setHours(0, 0, 0, 0)
  const prazo = new Date(p.prazoEntrega); prazo.setHours(0, 0, 0, 0)
  return e.getTime() <= prazo.getTime()
}

export default function Entregas() {
  const { hasRole } = useAuth()
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState('')

  const podeEditar = hasRole('GERENTE_OPERACIONAL', 'GESTOR_PRODUCAO', 'ADMIN', 'GESTOR_ADMIN', 'DIRETOR')

  function carregar() {
    setLoading(true)
    pedidosApi.listarEntregas(mes).then(({ data }) => {
      setPedidos(data.pedidos || [])
      setLoading(false)
    })
  }

  useEffect(carregar, [mes])

  async function mudarFase(id: string, fase: string, atual?: string | null) {
    const nova = atual === fase ? null : fase
    setSalvando(id)
    try {
      await pedidosApi.atualizarFaseEntrega(id, nova)
      carregar()
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setSalvando('')
    }
  }

  const cont = {
    finalizada: pedidos.filter((p) => p.faseEntrega === 'PRODUCAO_FINALIZADA').length,
    rota: pedidos.filter((p) => p.faseEntrega === 'EM_ROTA').length,
    entregue: pedidos.filter((p) => p.faseEntrega === 'ENTREGUE').length,
    foraPrazo: pedidos.filter((p) => noPrazo(p) === false).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entregas do Mês"
        subtitle="Máquinas finalizadas, em rota e entregues — controle do encarregado geral de produção"
        actions={
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="input w-44" />
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Finalizadas pela produção', cont.finalizada, 'text-amber-700'],
          ['Em rota de entrega', cont.rota, 'text-blue-700'],
          ['Entregues no destino', cont.entregue, 'text-green-700'],
          ['Entregues fora do prazo', cont.foraPrazo, 'text-red-700'],
        ].map(([t, n, cor]) => (
          <div key={t as string} className="card py-4">
            <p className="text-xs text-gray-500">{t}</p>
            <p className={`text-2xl font-bold mt-1 ${cor}`}>{n as number}</p>
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-5xl mb-3">📦</p>
            <p className="text-gray-500">Nenhum pedido finalizado ou entregue neste mês.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => {
              const prazo = noPrazo(p)
              return (
                <div key={p.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-blue-600">#{p.numero}</span>
                        {p.faseEntrega && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FASE_ENTREGA_COR[p.faseEntrega]}`}>
                            {FASE_ENTREGA_LABEL[p.faseEntrega]}
                          </span>
                        )}
                        {p.faseEntrega === 'ENTREGUE' && prazo !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prazo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {prazo ? '✓ dentro do prazo' : '⚠ fora do prazo'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm"><strong>{p.cliente.nome}</strong> - {p.cliente.cidade}/{p.cliente.estado}</p>
                      <p className="text-sm text-gray-600">{p.equipamento} {p.modelo} · {formatarMoeda(p.valorTotal)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Prazo de entrega: {formatarData(p.prazoEntrega)}
                        {p.entregueEm && <> · Entregue em: {formatarData(p.entregueEm)}</>}
                      </p>
                      {p.faseEntregaPor && p.faseEntregaEm && (
                        <p className="text-xs text-gray-400 mt-0.5">Atualizado por {p.faseEntregaPor} · {formatarDataHora(p.faseEntregaEm)}</p>
                      )}
                    </div>
                    <Link to={`/pedidos/${p.id}`} className="btn-secondary text-sm whitespace-nowrap">Ver pedido</Link>
                  </div>

                  {podeEditar && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {FASES.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => mudarFase(p.id, f.id, p.faseEntrega)}
                          disabled={salvando === p.id}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                            p.faseEntrega === f.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
