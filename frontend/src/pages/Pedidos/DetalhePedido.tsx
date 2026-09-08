import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { pedidosApi, osApi } from '../../api'
import { Pedido } from '../../types'
import { formatarData, formatarMoeda, STATUS_PEDIDO_COR, STATUS_PEDIDO_LABEL, STATUS_OS_COR, STATUS_OS_LABEL } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import AnexoDocumentoInput from '../../components/AnexoDocumentoInput'

export default function DetalhePedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null)
  const [salvandoComprovante, setSalvandoComprovante] = useState(false)
  const [erroComprovante, setErroComprovante] = useState('')

  const [fPagamento, setFPagamento] = useState(false)
  const [fComprovante, setFComprovante] = useState(false)
  const [fObs, setFObs] = useState('')
  const [salvandoFin, setSalvandoFin] = useState(false)
  const [erroFin, setErroFin] = useState('')
  const [okFin, setOkFin] = useState('')

  const podeMexerComprovante = hasRole('VENDEDOR', 'ADMIN', 'GESTOR_ADMIN', 'GERENTE_OPERACIONAL', 'FINANCEIRO')
  const podeRevisarFinanceiro = hasRole('FINANCEIRO', 'ADMIN', 'GESTOR_ADMIN', 'GERENTE_OPERACIONAL')

  async function salvarComprovante() {
    if (!comprovanteFile) return
    setSalvandoComprovante(true)
    setErroComprovante('')
    try {
      const fd = new FormData()
      fd.append('comprovanteSinal', comprovanteFile)
      await pedidosApi.atualizarComprovante(id!, fd)
      setComprovanteFile(null)
      const { data } = await pedidosApi.buscar(id!)
      setPedido(data)
    } catch (err: any) {
      setErroComprovante(err.response?.data?.erro || 'Erro ao salvar o comprovante')
    } finally {
      setSalvandoComprovante(false)
    }
  }

  useEffect(() => {
    pedidosApi.buscar(id!).then(({ data }) => {
      setPedido(data)
      setFPagamento(!!data.pagamentoConfirmado)
      setFComprovante(!!data.comprovanteSinalConferido)
      setFObs(data.financeiroObservacao || '')
      setLoading(false)
    })
  }, [id])

  async function salvarFinanceiro(liberar: boolean) {
    if (liberar && !confirm('Liberar este pedido para a produção? O Wellington será avisado para conferir.')) return
    setSalvandoFin(true)
    setErroFin('')
    setOkFin('')
    try {
      await pedidosApi.revisarFinanceiro(id!, {
        pagamentoConfirmado: fPagamento,
        comprovanteSinalConferido: fComprovante,
        financeiroObservacao: fObs,
        liberar,
      })
      const { data } = await pedidosApi.buscar(id!)
      setPedido(data)
      setOkFin(liberar ? 'Pedido liberado para a produção. Wellington foi notificado.' : 'Alterações salvas.')
    } catch (err: any) {
      setErroFin(err.response?.data?.erro || 'Erro ao salvar a revisão do financeiro')
    } finally {
      setSalvandoFin(false)
    }
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

        {pedido.observacoes && (
          <div className="card md:col-span-2">
            <h2 className="font-semibold mb-2">Observações do Vendedor</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{pedido.observacoes}</p>
          </div>
        )}

        {pedido.amostraEmbalagem != null && (
          <div className="card md:col-span-2">
            <h2 className="font-semibold mb-1">
              {pedido.amostraEmbalagem ? '✅' : '⬜'} Amostra Embalagem
            </h2>
            {pedido.amostraEmbalagemObs && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{pedido.amostraEmbalagemObs}</p>
            )}
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
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pedido.comprovanteSinalConferido ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            {pedido.comprovanteSinalConferido ? '✅' : '⬜'} Comprov. Sinal (Financeiro)
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pedido.comprovanteSinal ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {pedido.comprovanteSinal ? '✅' : '⬜'} Comprovante de Sinal (anexo)
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pedido.os && pedido.os.length > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            {pedido.os && pedido.os.length > 0 ? '✅' : '⬜'} O.S. Gerada
          </div>
        </div>
        {pedido.financeiroObservacao && (
          <p className="text-xs text-gray-600 mt-3">
            <span className="font-medium">Observação do Financeiro:</span> {pedido.financeiroObservacao}
          </p>
        )}
        {pedido.financeiroLiberadoEm && (
          <p className="text-xs text-blue-600 mt-1">Liberado pelo Financeiro em {formatarData(pedido.financeiroLiberadoEm)}.</p>
        )}
      </div>

      {podeRevisarFinanceiro && (pedido.status === 'AGUARDANDO_FINANCEIRO' || pedido.status === 'FINANCEIRO_APROVADO') && (
        <div className="card bg-yellow-50 border-yellow-200">
          <h2 className="font-semibold text-yellow-800 mb-1">💰 Revisão do Financeiro</h2>
          <p className="text-sm text-yellow-700 mb-4">
            Marque o que já estiver ok. Nenhum campo é obrigatório e tudo pode ser alterado depois, sem data fixa.
            Se liberar sem marcar algum item, explique o motivo na observação — o Wellington recebe essas informações para conferir antes de gerar a O.S.
          </p>

          <label className="flex items-center gap-3 mb-2 cursor-pointer">
            <input type="checkbox" checked={fPagamento} onChange={(e) => setFPagamento(e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="font-medium">Pagamento Confirmado</span>
          </label>
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input type="checkbox" checked={fComprovante} onChange={(e) => setFComprovante(e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="font-medium">Comprovante de Sinal</span>
          </label>

          <label className="label">Observação</label>
          <textarea
            value={fObs}
            onChange={(e) => setFObs(e.target.value)}
            rows={3}
            placeholder="Ex.: liberando sem o comprovante porque o cliente enviará o sinal em 2 dias..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {erroFin && <p className="text-sm text-red-600 mt-2">{erroFin}</p>}
          {okFin && <p className="text-sm text-green-700 mt-2">{okFin}</p>}

          <div className="flex gap-3 mt-4">
            <button onClick={() => salvarFinanceiro(false)} disabled={salvandoFin} className="btn-secondary">
              {salvandoFin ? 'Salvando...' : 'Salvar'}
            </button>
            {!pedido.financeiroLiberadoEm && (
              <button onClick={() => salvarFinanceiro(true)} disabled={salvandoFin} className="btn-success">
                ✅ Liberar para produção
              </button>
            )}
          </div>
        </div>
      )}

      {hasRole('GERENTE_OPERACIONAL', 'ADMIN') && pedido.status === 'FINANCEIRO_APROVADO' && (!pedido.os || pedido.os.length === 0) && (
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="font-semibold text-blue-800 mb-2">🔧 Conferir e Gerar Ordem de Serviço</h2>
          <div className="text-sm text-blue-700 mb-4 space-y-1">
            <p>{pedido.pagamentoConfirmado ? '✅' : '⚠️'} Pagamento confirmado: <strong>{pedido.pagamentoConfirmado ? 'SIM' : 'NÃO'}</strong></p>
            <p>{pedido.comprovanteSinalConferido ? '✅' : '⚠️'} Comprovante de sinal (Financeiro): <strong>{pedido.comprovanteSinalConferido ? 'SIM' : 'NÃO'}</strong></p>
            {pedido.financeiroObservacao && <p>📝 Observação do Financeiro: {pedido.financeiroObservacao}</p>}
            <p className="text-xs">Confira os documentos/fotos acima antes de gerar a O.S.</p>
          </div>
          <button onClick={gerarOS} className="btn-primary">🔧 Gerar O.S.</button>
        </div>
      )}

      {((pedido.fotos && pedido.fotos.length > 0) || pedido.comprovanteSinal) && (
        <div className="card">
          <h2 className="font-semibold mb-3">📎 Documentos do Pedido</h2>
          <div className="space-y-2">
            {pedido.fotos?.map((foto) => (
              <a key={foto.id} href={foto.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium text-sm">{foto.descricao || 'Documento'}</span>
                <span className="text-xs text-blue-600">Abrir →</span>
              </a>
            ))}
            {pedido.comprovanteSinal && (
              <a href={pedido.comprovanteSinal} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium text-sm">Comprovante de Sinal</span>
                <span className="text-xs text-blue-600">Abrir →</span>
              </a>
            )}
          </div>
        </div>
      )}

      {podeMexerComprovante && (
        <div className={`card ${pedido.comprovanteSinal ? '' : 'bg-amber-50 border-amber-200'}`}>
          <h2 className="font-semibold mb-2">
            {pedido.comprovanteSinal ? '🔄 Substituir Comprovante de Sinal' : '📤 Anexar Comprovante de Sinal'}
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            {pedido.comprovanteSinal
              ? 'Já existe um comprovante anexado. Envie um novo arquivo para substituí-lo — pode ser feito a qualquer momento.'
              : 'O comprovante pode ser anexado agora ou depois (dias ou semanas depois), sem limite de tempo.'}
          </p>
          <AnexoDocumentoInput value={comprovanteFile} onChange={setComprovanteFile} />
          {erroComprovante && <p className="text-sm text-red-600 mt-2">{erroComprovante}</p>}
          <button
            onClick={salvarComprovante}
            disabled={!comprovanteFile || salvandoComprovante}
            className="btn-primary mt-3"
          >
            {salvandoComprovante ? 'Salvando...' : pedido.comprovanteSinal ? 'Substituir comprovante' : 'Salvar comprovante'}
          </button>
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
