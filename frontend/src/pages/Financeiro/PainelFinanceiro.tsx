import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { pedidosApi } from '../../api'
import { Pedido } from '../../types'
import { formatarData, formatarMoeda } from '../../utils/formatters'
import PageHeader from '../../components/PageHeader'

type Aba = 'aguardando' | 'sinal' | 'liberados'

export default function PainelFinanceiro() {
  const [aguardando, setAguardando] = useState<Pedido[]>([])
  const [liberados, setLiberados] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<Aba>('aguardando')

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

  // "Aguardando sinal" = pedidos gerados sem pagamento confirmado que o Financeiro
  // marcou para seguir mesmo assim (com observação da situação).
  const aguardandoSinal = useMemo(
    () => [...aguardando, ...liberados].filter((p) => p.aguardandoSinal),
    [aguardando, liberados],
  )

  function LinhaPedido({ p, cor, destaqueObs }: { p: Pedido; cor: string; destaqueObs?: boolean }) {
    return (
      <div className={`flex items-start justify-between gap-4 p-4 border rounded-xl ${cor}`}>
        <div className="min-w-0">
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
          </p>
          {p.financeiroObservacao && (
            destaqueObs
              ? <p className="text-sm text-amber-800 bg-amber-100/60 rounded-lg px-3 py-2 mt-2">📝 {p.financeiroObservacao}</p>
              : <p className="text-xs text-gray-500 mt-1">📝 {p.financeiroObservacao}</p>
          )}
        </div>
        <Link to={`/pedidos/${p.id}`} className="btn-primary text-sm whitespace-nowrap">Revisar / Liberar</Link>
      </div>
    )
  }

  const abas: { id: Aba; label: string; count: number }[] = [
    { id: 'aguardando', label: '⏳ Aguardando o Financeiro', count: aguardando.length },
    { id: 'sinal', label: '⏳ Aguardando sinal', count: aguardandoSinal.length },
    { id: 'liberados', label: '📤 Liberados', count: liberados.length },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Painel Financeiro" subtitle="Confira o pagamento e libere pedidos para a produção" />

      <div className="flex flex-wrap gap-2">
        {abas.map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              aba === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t.label} <span className={aba === t.id ? 'text-blue-100' : 'text-gray-400'}>({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-10 text-gray-500">Carregando...</div>
      ) : aba === 'aguardando' ? (
        <div className="card">
          <p className="text-sm text-gray-500 mb-4">
            Abra o pedido para conferir o comprovante de sinal (valor, data, banco, cliente),
            marcar <strong>Pagamento 100% confirmado</strong> e liberar para a produção. Nada é obrigatório e tudo pode ser ajustado depois.
          </p>
          {aguardando.length === 0 ? (
            <div className="text-center py-8"><p className="text-5xl mb-3">✅</p><p className="text-gray-500">Nenhum pedido aguardando o financeiro.</p></div>
          ) : (
            <div className="space-y-3">{aguardando.map((p) => <LinhaPedido key={p.id} p={p} cor="border-yellow-200 bg-yellow-50" />)}</div>
          )}
        </div>
      ) : aba === 'sinal' ? (
        <div className="card">
          <p className="text-sm text-gray-500 mb-4">
            Pedidos que seguiram <strong>sem o sinal 100% confirmado</strong>. A observação abaixo explica a situação
            (cliente vai pagar em tal data, autorizado pela gestão, comprovante enviado mas não caiu, em análise, etc.).
            Assim que o valor cair na conta, abra o pedido e marque <strong>Pagamento 100% confirmado</strong>.
          </p>
          {aguardandoSinal.length === 0 ? (
            <div className="text-center py-8"><p className="text-5xl mb-3">✅</p><p className="text-gray-500">Nenhum pedido aguardando sinal.</p></div>
          ) : (
            <div className="space-y-3">{aguardandoSinal.map((p) => <LinhaPedido key={p.id} p={p} cor="border-amber-200 bg-amber-50" destaqueObs />)}</div>
          )}
        </div>
      ) : (
        <div className="card">
          <p className="text-sm text-gray-500 mb-4">Já liberados para a produção. Você ainda pode abrir e ajustar os campos e a observação.</p>
          {liberados.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Nenhum pedido liberado ainda.</p>
          ) : (
            <div className="space-y-3">{liberados.map((p) => <LinhaPedido key={p.id} p={p} cor="border-blue-200 bg-blue-50" />)}</div>
          )}
        </div>
      )}
    </div>
  )
}
