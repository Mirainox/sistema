import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { pedidosApi, osApi } from '../../api'
import { Pedido } from '../../types'
import { formatarData, formatarMoeda, STATUS_PEDIDO_COR, STATUS_PEDIDO_LABEL, STATUS_OS_COR, STATUS_OS_LABEL } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import AnexoDocumentoInput from '../../components/AnexoDocumentoInput'
import PageHeader from '../../components/PageHeader'

function Chip({ ok, warn, children }: { ok: boolean; warn?: boolean; children: React.ReactNode }) {
  return (
    <span className={`chip ${ok ? 'chip--on' : warn ? 'chip--warn' : 'chip--off'}`}>
      <span>{ok ? '✅' : '⬜'}</span>
      {children}
    </span>
  )
}

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

  const temDocumentos = (pedido.fotos && pedido.fotos.length > 0) || pedido.comprovanteSinal
  const temObservacoes = pedido.observacoesTecnicas || pedido.observacoes || pedido.amostraEmbalagem != null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Pedido #${pedido.numero}`}
        subtitle={`Criado em ${formatarData(pedido.createdAt)}`}
        back="/pedidos"
        actions={
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_PEDIDO_COR[pedido.status]}`}>
            {STATUS_PEDIDO_LABEL[pedido.status]}
          </span>
        }
      />

      {/* ---------- Resumo ---------- */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h2 className="section-title">Cliente</h2>
            <dl className="dl">
              <dt>Nome</dt><dd>{pedido.cliente.nome}</dd>
              <dt>Cidade</dt><dd>{pedido.cliente.cidade}/{pedido.cliente.estado}</dd>
              {pedido.cliente.telefone && (<><dt>Telefone</dt><dd>{pedido.cliente.telefone}</dd></>)}
              {pedido.cliente.email && (<><dt>Email</dt><dd>{pedido.cliente.email}</dd></>)}
            </dl>
          </div>
          <div>
            <h2 className="section-title">Equipamento</h2>
            <dl className="dl">
              <dt>Equipamento</dt><dd>{pedido.equipamento}</dd>
              <dt>Modelo</dt><dd>{pedido.modelo}</dd>
              <dt>Valor</dt><dd>{formatarMoeda(pedido.valorTotal)}</dd>
              <dt>Prazo</dt><dd>{formatarData(pedido.prazoEntrega)}</dd>
              <dt>Pagamento</dt><dd>{pedido.condicaoPagamento}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* ---------- Andamento ---------- */}
      <div className="card">
        <h2 className="section-title">Andamento do processo</h2>
        <div className="flex flex-wrap gap-2">
          <Chip ok={pedido.checklistComercial}>Checklist Comercial</Chip>
          <Chip ok={pedido.pagamentoConfirmado}>Pagamento Confirmado</Chip>
          <Chip ok={!!pedido.comprovanteSinalConferido}>Comprov. Sinal (Financeiro)</Chip>
          <Chip ok={!!pedido.comprovanteSinal} warn>Comprovante de Sinal (anexo)</Chip>
          <Chip ok={!!(pedido.os && pedido.os.length > 0)}>O.S. Gerada</Chip>
        </div>
        {(pedido.financeiroObservacao || pedido.financeiroLiberadoEm) && (
          <div className="mt-3 text-xs text-gray-600 space-y-1">
            {pedido.financeiroObservacao && (
              <p><span className="font-medium">Observação do Financeiro:</span> {pedido.financeiroObservacao}</p>
            )}
            {pedido.financeiroLiberadoEm && (
              <p className="text-blue-600">Liberado pelo Financeiro em {formatarData(pedido.financeiroLiberadoEm)}.</p>
            )}
          </div>
        )}
      </div>

      {/* ---------- Ações ---------- */}
      {podeRevisarFinanceiro && (pedido.status === 'AGUARDANDO_FINANCEIRO' || pedido.status === 'FINANCEIRO_APROVADO') && (
        <div className="note note--warn">
          <h2 className="font-semibold mb-1">💰 Revisão do Financeiro</h2>
          <p className="text-sm mb-4 text-amber-700">
            Nenhum campo é obrigatório e tudo pode ser alterado depois, sem data fixa. Se liberar sem marcar
            algum item, explique o motivo na observação — o Wellington recebe essas informações para conferir
            antes de gerar a O.S.
          </p>

          <div className="bg-white rounded-lg border border-amber-200 p-4 space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={fPagamento} onChange={(e) => setFPagamento(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <span className="font-medium text-gray-800">Pagamento Confirmado</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={fComprovante} onChange={(e) => setFComprovante(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <span className="font-medium text-gray-800">Comprovante de Sinal</span>
            </label>
          </div>

          <label className="label mt-4">Observação</label>
          <textarea
            value={fObs}
            onChange={(e) => setFObs(e.target.value)}
            rows={3}
            placeholder="Ex.: liberando sem o comprovante porque o cliente enviará o sinal em 2 dias..."
            className="input text-sm"
          />

          {erroFin && <p className="text-sm text-red-600 mt-2">{erroFin}</p>}
          {okFin && <p className="text-sm text-green-700 mt-2">{okFin}</p>}

          <div className="flex flex-wrap gap-3 mt-4">
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
        <div className="note note--info">
          <h2 className="font-semibold mb-2">🔧 Conferir e gerar Ordem de Serviço</h2>
          <div className="text-sm mb-4 space-y-1 text-blue-700">
            <p>{pedido.pagamentoConfirmado ? '✅' : '⚠️'} Pagamento confirmado: <strong>{pedido.pagamentoConfirmado ? 'SIM' : 'NÃO'}</strong></p>
            <p>{pedido.comprovanteSinalConferido ? '✅' : '⚠️'} Comprovante de sinal (Financeiro): <strong>{pedido.comprovanteSinalConferido ? 'SIM' : 'NÃO'}</strong></p>
            {pedido.financeiroObservacao && <p>📝 Observação do Financeiro: {pedido.financeiroObservacao}</p>}
            <p className="text-xs">Confira os documentos e fotos antes de gerar a O.S.</p>
          </div>
          <button onClick={gerarOS} className="btn-primary">🔧 Gerar O.S.</button>
        </div>
      )}

      {podeMexerComprovante && (
        <div className={`card ${pedido.comprovanteSinal ? '' : 'border-amber-200 bg-amber-50'}`}>
          <h2 className="section-title">
            {pedido.comprovanteSinal ? '🔄 Substituir Comprovante de Sinal' : '📤 Anexar Comprovante de Sinal'}
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            {pedido.comprovanteSinal
              ? 'Já existe um comprovante anexado. Envie um novo arquivo para substituí-lo — pode ser feito a qualquer momento.'
              : 'O comprovante pode ser anexado agora ou depois (dias ou semanas depois), sem limite de tempo.'}
          </p>
          <AnexoDocumentoInput value={comprovanteFile} onChange={setComprovanteFile} />
          {erroComprovante && <p className="text-sm text-red-600 mt-2">{erroComprovante}</p>}
          <button onClick={salvarComprovante} disabled={!comprovanteFile || salvandoComprovante} className="btn-primary mt-3">
            {salvandoComprovante ? 'Salvando...' : pedido.comprovanteSinal ? 'Substituir comprovante' : 'Salvar comprovante'}
          </button>
        </div>
      )}

      {/* ---------- Documentos ---------- */}
      {temDocumentos && (
        <div className="card">
          <h2 className="section-title">📎 Documentos do pedido</h2>
          <div className="space-y-2">
            {pedido.fotos?.map((foto) => (
              <a key={foto.id} href={foto.url} target="_blank" rel="noreferrer" className="doc-row">
                <span className="font-medium text-sm">{foto.descricao || 'Documento'}</span>
                <span className="text-xs text-blue-600">Abrir →</span>
              </a>
            ))}
            {pedido.comprovanteSinal && (
              <a href={pedido.comprovanteSinal} target="_blank" rel="noreferrer" className="doc-row">
                <span className="font-medium text-sm">Comprovante de Sinal</span>
                <span className="text-xs text-blue-600">Abrir →</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ---------- Observações ---------- */}
      {temObservacoes && (
        <div className="card space-y-4">
          <h2 className="section-title">Observações</h2>

          {pedido.observacoesTecnicas && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Observações técnicas</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{pedido.observacoesTecnicas}</p>
            </div>
          )}

          {pedido.observacoes && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Observações do vendedor</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{pedido.observacoes}</p>
            </div>
          )}

          {pedido.amostraEmbalagem != null && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {pedido.amostraEmbalagem ? '✅' : '⬜'} Amostra Embalagem
              </p>
              {pedido.amostraEmbalagemObs && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{pedido.amostraEmbalagemObs}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------- Ordens de Serviço ---------- */}
      {pedido.os && pedido.os.length > 0 && (
        <div className="card">
          <h2 className="section-title">Ordens de Serviço</h2>
          <div className="space-y-2">
            {pedido.os.map((os: any) => (
              <Link key={os.id} to={`/os/${os.id}`} className="doc-row">
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
