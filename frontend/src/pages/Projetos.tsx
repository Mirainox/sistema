import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pedidosApi } from '../api'
import { Pedido } from '../types'
import { formatarData, DESENHO_LABEL, VOLTAGEM_LABEL } from '../utils/formatters'
import PageHeader from '../components/PageHeader'

export default function Projetos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarConcluidos, setMostrarConcluidos] = useState(false)

  useEffect(() => {
    pedidosApi.listar().then(({ data }) => {
      setPedidos(data.filter((p: Pedido) => p.desenhoNecessario))
      setLoading(false)
    })
  }, [])

  const pendentes = pedidos.filter((p) => p.desenhoStatus !== 'CONCLUIDO')
  const concluidos = pedidos.filter((p) => p.desenhoStatus === 'CONCLUIDO')
  const lista = mostrarConcluidos ? concluidos : pendentes

  return (
    <div className="space-y-6">
      <PageHeader title="Projetos e Desenhos" subtitle="Desenhos técnicos solicitados pela Produção" />

      <div className="flex gap-2">
        <button onClick={() => setMostrarConcluidos(false)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${!mostrarConcluidos ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          🎨 Pendentes ({pendentes.length})
        </button>
        <button onClick={() => setMostrarConcluidos(true)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${mostrarConcluidos ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          ✅ Concluídos ({concluidos.length})
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-5xl mb-3">🎨</p>
            <p className="text-gray-500">{mostrarConcluidos ? 'Nenhum desenho concluído.' : 'Nenhum desenho pendente.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-blue-600">#{p.numero}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.desenhoStatus === 'CONCLUIDO' ? 'bg-green-100 text-green-700' : p.desenhoStatus === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {DESENHO_LABEL[p.desenhoStatus || 'PENDENTE']}
                    </span>
                  </div>
                  <p className="text-sm"><strong>{p.cliente.nome}</strong> - {p.cliente.cidade}/{p.cliente.estado}</p>
                  <p className="text-sm text-gray-600">{p.equipamento} {p.modelo}{p.voltagem ? ` · ${VOLTAGEM_LABEL[p.voltagem] || p.voltagem}` : ''}</p>
                  <p className="text-xs text-gray-500">Prazo do pedido: {formatarData(p.prazoEntrega)}</p>
                  {p.observacoesTecnicas && <p className="text-xs text-gray-500 mt-1">📝 {p.observacoesTecnicas}</p>}
                </div>
                <Link to={`/pedidos/${p.id}`} className="btn-primary text-sm whitespace-nowrap">Abrir pedido</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
