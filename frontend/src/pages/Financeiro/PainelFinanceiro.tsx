import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pedidosApi } from '../../api'
import { Pedido } from '../../types'
import { formatarData, formatarMoeda } from '../../utils/formatters'

export default function PainelFinanceiro() {
  const [aguardando, setAguardando] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pedidosApi.listar({ status: 'AGUARDANDO_FINANCEIRO' }).then(({ data }) => {
      setAguardando(data)
      setLoading(false)
    })
  }, [])

  async function confirmar(id: string) {
    if (!confirm('Confirmar que o pagamento entrou na conta?')) return
    await pedidosApi.confirmarPagamento(id)
    const { data } = await pedidosApi.listar({ status: 'AGUARDANDO_FINANCEIRO' })
    setAguardando(data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel Financeiro</h1>

      <div className="card">
        <h2 className="font-semibold mb-4 text-yellow-700">⏳ Pedidos Aguardando Confirmação de Pagamento</h2>
        <p className="text-sm text-gray-500 mb-4">Confirme o recebimento do sinal/pagamento para liberar o pedido para a produção.</p>

        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          aguardando.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-3">✅</p>
              <p className="text-gray-500">Todos os pagamentos estão confirmados!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aguardando.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 border border-yellow-200 rounded-xl bg-yellow-50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-blue-600">#{p.numero}</span>
                    </div>
                    <p className="text-sm"><strong>{p.cliente.nome}</strong> - {p.cliente.cidade}/{p.cliente.estado}</p>
                    <p className="text-sm text-gray-600">{p.equipamento} {p.modelo}</p>
                    <p className="text-sm">
                      <span className="text-gray-500">Valor: </span><strong>{formatarMoeda(p.valorTotal)}</strong>
                      {' | '}<span className="text-gray-500">Pagamento: </span>{p.condicaoPagamento}
                      {' | '}<span className="text-gray-500">Prazo: </span>{formatarData(p.prazoEntrega)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-success text-sm" onClick={() => confirmar(p.id)}>✅ Confirmar Pagamento</button>
                    <Link to={`/pedidos/${p.id}`} className="btn-secondary text-sm">Ver pedido</Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
