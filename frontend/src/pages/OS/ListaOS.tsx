import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { osApi } from '../../api'
import { OS } from '../../types'
import { formatarData, STATUS_OS_COR, STATUS_OS_LABEL } from '../../utils/formatters'

export default function ListaOS() {
  const [lista, setLista] = useState<OS[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFiltro, setStatusFiltro] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { carregar() }, [statusFiltro])

  async function carregar() {
    setLoading(true)
    const { data } = await osApi.listar({ status: statusFiltro || undefined, search: search || undefined })
    setLista(data)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <input className="input flex-1" placeholder="Buscar por número, cliente..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && carregar()} />
          <select className="input w-56" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="GERADA">Gerada</option>
            <option value="DISTRIBUIDA_FISICAMENTE">Distribuída Fisicamente</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="AGUARDANDO_PECAS">Aguardando Peças</option>
            <option value="EM_TESTE">Em Teste</option>
            <option value="CONCLUIDA">Concluída</option>
          </select>
          <button className="btn-secondary" onClick={carregar}>Buscar</button>
        </div>

        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 font-semibold text-gray-700">Nº O.S.</th>
                  <th className="pb-3 font-semibold text-gray-700">Pedido</th>
                  <th className="pb-3 font-semibold text-gray-700">Cliente</th>
                  <th className="pb-3 font-semibold text-gray-700">Cidade</th>
                  <th className="pb-3 font-semibold text-gray-700">Equipamento</th>
                  <th className="pb-3 font-semibold text-gray-700">Prazo Entrega</th>
                  <th className="pb-3 font-semibold text-gray-700">Status</th>
                  <th className="pb-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-500">Nenhuma O.S. encontrada</td></tr>
                ) : (
                  lista.map((os) => (
                    <tr key={os.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-blue-600">#{os.numero}</td>
                      <td className="py-3">#{os.pedido.numero}</td>
                      <td className="py-3">{os.pedido.cliente.nome}</td>
                      <td className="py-3 text-gray-600">{os.pedido.cliente.cidade}</td>
                      <td className="py-3">{os.pedido.equipamento}</td>
                      <td className="py-3 text-gray-600">{formatarData(os.pedido.prazoEntrega)}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_OS_COR[os.status]}`}>
                          {STATUS_OS_LABEL[os.status]}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link to={`/os/${os.id}`} className="text-blue-600 hover:underline text-xs">Ver detalhes</Link>
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
