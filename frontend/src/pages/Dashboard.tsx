import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api'
import { DashboardResumo } from '../types'
import { formatarData, formatarMoeda, STATUS_PEDIDO_COR, STATUS_PEDIDO_LABEL } from '../utils/formatters'

interface CardProps { titulo: string; valor: number | string; cor: string; icon: string; link: string }

function CardResumo({ titulo, valor, cor, icon, link }: CardProps) {
  return (
    <Link to={link} className={`card hover:shadow-md transition-shadow border-l-4 ${cor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{titulo}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{valor}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const [dados, setDados] = useState<DashboardResumo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.resumo().then(({ data }) => {
      setDados(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>
  if (!dados) return null

  const { totais, ultimosPedidos, comprasUrgentes } = dados

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral da operação Mirainox</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardResumo titulo="Total de Pedidos" valor={totais.totalPedidos} cor="border-blue-500" icon="📋" link="/pedidos" />
        <CardResumo titulo="Em Produção" valor={totais.pedidosEmProducao} cor="border-purple-500" icon="🏭" link="/pedidos?status=EM_PRODUCAO" />
        <CardResumo titulo="O.S. Ativas" valor={totais.totalOS} cor="border-orange-500" icon="🔧" link="/os" />
        <CardResumo titulo="Compras Pendentes" valor={totais.comprasPendentes} cor="border-red-500" icon="🛒" link="/compras" />
        <CardResumo titulo="Aguard. Financeiro" valor={totais.pedidosAguardandoFinanceiro} cor="border-yellow-500" icon="💰" link="/financeiro" />
        <CardResumo titulo="Manutenção Aberta" valor={totais.manutencaoAberta} cor="border-teal-500" icon="🔨" link="/manutencao" />
        <CardResumo titulo="Expedição Pendente" valor={totais.expedicaoPendente} cor="border-indigo-500" icon="🚚" link="/expedicao" />
        <CardResumo titulo="Notificações" valor={totais.notificacoesNaoLidas} cor="border-pink-500" icon="🔔" link="/" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Últimos Pedidos</h2>
          {ultimosPedidos.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum pedido cadastrado</p>
          ) : (
            <div className="space-y-3">
              {ultimosPedidos.map((p) => (
                <Link key={p.id} to={`/pedidos/${p.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div>
                    <p className="font-medium text-sm">#{p.numero}</p>
                    <p className="text-xs text-gray-600">{p.cliente.nome} - {p.cliente.cidade}</p>
                    <p className="text-xs text-gray-500">{p.equipamento} | Prazo: {formatarData(p.prazoEntrega)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_PEDIDO_COR[p.status]}`}>
                    {STATUS_PEDIDO_LABEL[p.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link to="/pedidos" className="block text-center text-sm text-blue-600 hover:underline mt-4">
            Ver todos →
          </Link>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">⚠️ Compras Urgentes</h2>
          {comprasUrgentes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma compra urgente</p>
          ) : (
            <div className="space-y-3">
              {comprasUrgentes.map((c) => (
                <Link key={c.id} to={`/compras/${c.id}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100">
                  <div>
                    <p className="font-medium text-sm">{c.produto}</p>
                    <p className="text-xs text-gray-600">Qtd: {c.quantidade} | Cliente: {c.nomeCliente}</p>
                    <p className="text-xs text-gray-500">Pedido #{c.numeroPedido}</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">URGENTE</span>
                </Link>
              ))}
            </div>
          )}
          <Link to="/compras" className="block text-center text-sm text-blue-600 hover:underline mt-4">
            Ver todas →
          </Link>
        </div>
      </div>
    </div>
  )
}
