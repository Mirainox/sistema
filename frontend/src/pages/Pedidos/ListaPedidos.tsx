import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pedidosApi } from '../../api'
import { Pedido } from '../../types'
import { formatarData, formatarMoeda, STATUS_PEDIDO_COR, STATUS_PEDIDO_LABEL } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'

export default function ListaPedidos() {
  const { hasRole } = useAuth()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')

  useEffect(() => {
    carregar()
  }, [statusFiltro])

  async function carregar() {
    setLoading(true)
    const { data } = await pedidosApi.listar({ status: statusFiltro || undefined, search: search || undefined })
    setPedidos(data)
    setLoading(false)
  }

  const podeCriar = hasRole('ADMIN', 'GESTOR_ADMIN', 'VENDEDOR')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        {podeCriar && (
          <Link to="/pedidos/novo" className="btn-primary">+ Novo Pedido</Link>
        )}
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <input
            className="input flex-1"
            placeholder="Buscar por número, cliente, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregar()}
          />
          <select className="input w-56" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="AGUARDANDO_FINANCEIRO">Aguardando Financeiro</option>
            <option value="FINANCEIRO_APROVADO">Financeiro Aprovado</option>
            <option value="EM_PRODUCAO">Em Produção</option>
            <option value="AGUARDANDO_EXPEDICAO">Aguardando Expedição</option>
            <option value="EXPEDIDO">Expedido</option>
            <option value="ENTREGUE">Entregue</option>
          </select>
          <button className="btn-secondary" onClick={carregar}>Buscar</button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 font-semibold text-gray-700">Nº Pedido</th>
                  <th className="pb-3 font-semibold text-gray-700">Cliente</th>
                  <th className="pb-3 font-semibold text-gray-700">Cidade</th>
                  <th className="pb-3 font-semibold text-gray-700">Equipamento</th>
                  <th className="pb-3 font-semibold text-gray-700">Prazo</th>
                  <th className="pb-3 font-semibold text-gray-700">Valor</th>
                  <th className="pb-3 font-semibold text-gray-700">Status</th>
                  <th className="pb-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidos.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-500">Nenhum pedido encontrado</td></tr>
                ) : (
                  pedidos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-blue-600">#{p.numero}</td>
                      <td className="py-3">{p.cliente.nome}</td>
                      <td className="py-3 text-gray-600">{p.cliente.cidade}/{p.cliente.estado}</td>
                      <td className="py-3">{p.equipamento} {p.modelo}</td>
                      <td className="py-3 text-gray-600">{formatarData(p.prazoEntrega)}</td>
                      <td className="py-3">{formatarMoeda(p.valorTotal)}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_PEDIDO_COR[p.status]}`}>
                          {STATUS_PEDIDO_LABEL[p.status]}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link to={`/pedidos/${p.id}`} className="text-blue-600 hover:underline text-xs">
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
