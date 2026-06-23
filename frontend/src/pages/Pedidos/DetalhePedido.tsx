import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { pedidosApi, osApi } from '../../api'
import { Pedido } from '../../types'
import { formatarData, formatarMoeda, STATUS_PEDIDO_COR, STATUS_PEDIDO_LABEL, STATUS_OS_COR, STATUS_OS_LABEL } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'

export default function DetalhePedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pedidosApi.buscar(id!).then(({ data }) => { setPedido(data); setLoading(false) })
  }, [id])

  async function confirmarPagamento() {
    if (!confirm('Confirmar o pagamento deste pedido?')) return
    await pedidosApi.confirmarPagamento(id!)
    const { data } = await pedidosApi.buscar(id!)
    setPedido(data)
  }

  async function gerarOS() {
    if (!confirm('Gerar O.S. para este pedido?')) return
    const { data } = await osApi.gerar(id!)
    navigate(`/os/${data.id}`)
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Carregando...</div>
  if (!pedido) return <div className="text-center py-8 text-red-500">Pedido não encontrado</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido #{pedido.numero}</h1>
          <p className="text-gray-500">Criado em {formatarData(pedido.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_PEDIDO_COR[pedido.status]}`}>
            {STATUS_PEDIDO_LABEL[pedido.status]}
          </span>
          <button onClick={() => navigate('/pedidos')} className="btn-secondary">← Voltar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Cliente</h2>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Nome:</span> <strong>{pedido.cliente.nome}</strong></p>
            <p><span className="text-gray-500">Cidade:</span> {pedido.cliente.cidade}/{pedido.cliente.estado}</p>
            {pedido.cliente.telefone && <p><span className="text-gray-500">Tel:</span> {pedido.cliente.telefone}</p>}
            {pedido.cliente.email && <p><span className="text-gray-500">Email:</span> {pedido.cliente.email}</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Equipamento</h2>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Equipamento:</span> <strong>{pedido.equipamento}</strong></p>
            <p><span className="text-gray-500">Modelo:</span> {pedido.modelo}</p>
            <p><span className="text-gray-500">Valor:</span> <strong>{formatarMoeda(pedido.valorTotal)}</strong></p>
            <p><span className="text-gray-500">Prazo:</span> {formatarData(pedido.prazoEntrega)}</p>
            <p><span className="text-gray-500">Pagamento:</span> {pedido.condicaoPagamento}</p>
          </div>
        </div>

        {pedido.observacoesTecnicas && (
          <div className="card md:col-span-2">
            <h2 className="font-semibold mb-2">Observações Técnicas</h2>
            <p className="text-sm text-gray-700">{pedido.observacoesTecnicas}</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Status do Processo</h2>
        <div className="flex flex-wrap gap-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pedido.checklistComercial ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            {pedido.checklistComercial ? '✅' : '⬜'} Checklist Comercial
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pedido.pagamentoConfirmado ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            {pedido.pagamentoConfirmado ? '✅' : '⬜'} Pagamento Confirmado
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pedido.os && pedido.os.length > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            {pedido.os && pedido.os.length > 0 ? '✅' : '⬜'} O.S. Gerada
          </div>
        </div>
      </div>

      {hasRole('FINANCEIRO', 'ADMIN', 'GESTOR_ADMIN') && !pedido.pagamentoConfirmado && pedido.status === 'AGUARDANDO_FINANCEIRO' && (
        <div className="card bg-yellow-50 border-yellow-200">
          <h2 className="font-semibold text-yellow-800 mb-2">💰 Confirmação de Pagamento</h2>
          <p className="text-sm text-yellow-700 mb-4">Confirme que o pagamento/sinal entrou na conta antes de liberar o pedido para produção.</p>
          <button onClick={confirmarPagamento} className="btn-success">✅ Confirmar Pagamento e Liberar</button>
        </div>
      )}

      {hasRole('GERENTE_OPERACIONAL', 'ADMIN', 'GESTOR_PRODUCAO') && pedido.pagamentoConfirmado && (!pedido.os || pedido.os.length === 0) && (
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="font-semibold text-blue-800 mb-2">🔧 Gerar Ordem de Serviço</h2>
          <p className="text-sm text-blue-700 mb-4">Pagamento confirmado. Gere a O.S. para iniciar a distribuição à produção.</p>
          <button onClick={gerarOS} className="btn-primary">🔧 Gerar O.S.</button>
        </div>
      )}

      {pedido.os && pedido.os.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Ordens de Serviço</h2>
          <div className="space-y-2">
            {pedido.os.map((os: any) => (
              <Link key={os.id} to={`/os/${os.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium">#{os.numero}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_OS_COR[os.status]}`}>{STATUS_OS_LABEL[os.status]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
