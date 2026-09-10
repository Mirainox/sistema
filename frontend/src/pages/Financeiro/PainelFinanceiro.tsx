import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pedidosApi } from '../../api'
import { Pedido } from '../../types'
import { formatarData, formatarMoeda } from '../../utils/formatters'
import PageHeader from '../../components/PageHeader'

export default function PainelFinanceiro() {
  const [aguardando, setAguardando] = useState<Pedido[]>([])
  const [liberados, setLiberados] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      pedidosApi.listar({ status: 'AGUARDANDO_FINANCEIRO' }),
      pedidosApi.listar({ status: 'FINANCEIRO_APROVADO' }),
    ]).then(([a, b]) => {
      setAguardando(a.data)
      setLiberados(b.data)
      setLoading(false)
    })
  }, [])

  function LinhaPedido({ p, cor }: { p: Pedido; cor: string }) {
    return (
      <div className={`flex items-center justify-between p-4 border rounded-xl ${cor}`}>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-blue-600">#{p.numero}</span>
            {p.aguardandoSinal && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⏳ Aguardando sinal</span>}
            {p.financeiroLiberadoEm && <span className="text-xs text-blue-600">liberado em {formatarData(p.financeiroLiberadoEm)}</span>}
          </div>
          <p className="text-sm"><strong>{p.cliente.nome}</strong> - {p.cliente.cidade}/{p.cliente.estado}</p>
          <p className="text-sm text-gray-600">{p.equipamento} {p.modelo}</p>
          <p className="text-sm">
            <span className="text-gray-500">Valor: </span><strong>{formatarMoeda(p.valorTotal)}</strong>
            {' | '}<span className="text-gray-500">Pagamento: </span>{p.condicaoPagamento}
            {' | '}<span className="text-gray-500">Prazo: </span>{formatarData(p.prazoEntrega)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {p.pagamentoConfirmado ? '✅' : '⬜'} Pagamento 100% confirmado &nbsp;·&nbsp;
            {p.comprovanteSinalConferido ? '✅' : '⬜'} Comprovante de sinal conferido
            {p.financeiroObservacao ? ` · 📝 ${p.financeiroObservacao}` : ''}
          </p>
        </div>
        <Link to={`/pedidos/${p.id}`} className="btn-primary text-sm whitespace-nowrap">Revisar / Liberar</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Painel Financeiro" subtitle="Revise e libere pedidos para a produção" />

      <div className="card">
        <h2 className="section-title text-amber-700">⏳ Pedidos aguardando o Financeiro</h2>
        <p className="text-sm text-gray-500 mb-4">
          Abra o pedido para marcar "Pagamento Confirmado" / "Comprovante de Sinal" (nenhum é obrigatório),
          registrar uma observação e liberar para a produção. Tudo pode ser ajustado depois.
        </p>

        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          aguardando.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-3">✅</p>
              <p className="text-gray-500">Nenhum pedido aguardando o financeiro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aguardando.map((p) => <LinhaPedido key={p.id} p={p} cor="border-yellow-200 bg-yellow-50" />)}
            </div>
          )
        )}
      </div>

      {liberados.length > 0 && (
        <div className="card">
          <h2 className="section-title text-blue-700">📤 Liberados para a produção</h2>
          <p className="text-sm text-gray-500 mb-4">Já liberados. Você ainda pode abrir e ajustar os campos e a observação.</p>
          <div className="space-y-3">
            {liberados.map((p) => <LinhaPedido key={p.id} p={p} cor="border-blue-200 bg-blue-50" />)}
          </div>
        </div>
      )}
    </div>
  )
}
