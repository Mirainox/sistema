import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { comprasApi } from '../../api'
import { Compra } from '../../types'
import { formatarData, STATUS_COMPRA_COR, STATUS_COMPRA_LABEL } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'

export default function ListaCompras() {
  const { hasRole } = useAuth()
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFiltro, setStatusFiltro] = useState('')

  useEffect(() => { carregar() }, [statusFiltro])

  async function carregar() {
    setLoading(true)
    const { data } = await comprasApi.listar({ status: statusFiltro || undefined })
    setCompras(data)
    setLoading(false)
  }

  async function marcarCiente(id: string) {
    await comprasApi.marcarCiente(id)
    carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
        {hasRole('ADMIN', 'ALMOXARIFE', 'GERENTE_OPERACIONAL', 'COMPRADOR', 'PRODUCAO') && (
          <Link to="/compras/nova" className="btn-primary">+ Solicitar Compra</Link>
        )}
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <select className="input w-56" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">Todos</option>
            <option value="SOLICITADO">Solicitado</option>
            <option value="CIENTE">Ciente</option>
            <option value="COTANDO">Cotando</option>
            <option value="PEDIDO_REALIZADO">Pedido Realizado</option>
            <option value="EM_TRANSITO">Em Trânsito</option>
            <option value="RECEBIDO">Recebido</option>
          </select>
        </div>

        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          <div className="space-y-3">
            {compras.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Nenhuma compra encontrada</p>
            ) : (
              compras.map((c) => (
                <div key={c.id} className={`p-4 border rounded-xl ${c.urgencia === 'URGENTE' ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{c.produto}</span>
                        {c.urgencia === 'URGENTE' && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">URGENTE</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COMPRA_COR[c.status]}`}>
                          {STATUS_COMPRA_LABEL[c.status]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                        <span>Qtd: <strong>{c.quantidade} {c.unidade}</strong></span>
                        {c.numeroPedido && <span>Pedido: <strong>#{c.numeroPedido}</strong></span>}
                        {c.nomeCliente && <span>Cliente: <strong>{c.nomeCliente}</strong></span>}
                        {c.cidadeCliente && <span>Cidade: <strong>{c.cidadeCliente}</strong></span>}
                        {c.previsaoChegada && <span>Previsão: <strong>{formatarData(c.previsaoChegada)}</strong></span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!c.ciencia && hasRole('COMPRADOR', 'ADMIN', 'GERENTE_OPERACIONAL') && (
                        <button className="btn-secondary text-xs" onClick={() => marcarCiente(c.id)}>Marcar Ciente</button>
                      )}
                      <Link to={`/compras/${c.id}`} className="text-blue-600 hover:underline text-xs">Detalhes</Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
