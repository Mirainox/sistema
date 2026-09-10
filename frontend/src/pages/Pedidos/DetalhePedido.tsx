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
  const [fAguardandoSinal, setFAguardandoSinal] = useState(false)
  const [fCompValor, setFCompValor] = useState('')
  const [fCompData, setFCompData] = useState('')
  const [fCompBanco, setFCompBanco] = useState('')
  const [fCompCliente, setFCompCliente] = useState(false)
  const [fCompPedido, setFCompPedido] = useState(false)
  const [salvandoFin, setSalvandoFin] = useState(false)
  const [erroFin, setErroFin] = useState('')
  const [okFin, setOkFin] = useState('')

  const [aNaoAplica, setANaoAplica] = useState(false)
  const [aTem, setATem] = useState(false)
  const [aPedida, setAPedida] = useState(false)
  const [aEnviada, setAEnviada] = useState(false)
  const [aChegou, setAChegou] = useState(false)
  const [aObs, setAObs] = useState('')
  const [salvandoAmostra, setSalvandoAmostra] = useState(false)
  const [erroAmostra, setErroAmostra] = useState('')
  const [okAmostra, setOkAmostra] = useState('')

  const podeMexerComprovante = hasRole('VENDEDOR', 'ADMIN', 'GESTOR_ADMIN', 'GERENTE_OPERACIONAL', 'FINANCEIRO')
  const podeRevisarFinanceiro = hasRole('FINANCEIRO', 'ADMIN', 'GESTOR_ADMIN', 'GERENTE_OPERACIONAL')
  const podeMexerAmostra = hasRole('VENDEDOR', 'ADMIN', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL', 'PRODUCAO')

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

  function carregarForms(data: Pedido) {
    setFPagamento(!!data.pagamentoConfirmado)
    setFComprovante(!!data.comprovanteSinalConferido)
    setFObs(data.financeiroObservacao || '')
    setFAguardandoSinal(!!data.aguardandoSinal)
    setFCompValor(data.compValor != null ? String(data.compValor) : '')
    setFCompData(data.compData ? data.compData.slice(0, 10) : '')
    setFCompBanco(data.compBanco || '')
    setFCompCliente(!!data.compClienteConfere)
    setFCompPedido(!!data.compPedidoConfere)
    setANaoAplica(!!data.amostraNaoSeAplica)
    setATem(!!data.amostraEmbalagem)
    setAPedida(!!data.amostraPedidaCliente)
    setAEnviada(!!data.amostraEnviada)
    setAChegou(!!data.amostraChegou)
    setAObs(data.amostraEmbalagemObs || '')
  }

  useEffect(() => {
    pedidosApi.buscar(id!).then(({ data }) => {
      setPedido(data)
      carregarForms(data)
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
        aguardandoSinal: fAguardandoSinal,
        compValor: fCompValor === '' ? null : Number(fCompValor),
        compData: fCompData || null,
        compBanco: fCompBanco,
        compClienteConfere: fCompCliente,
        compPedidoConfere: fCompPedido,
        liberar,
      })
      const { data } = await pedidosApi.buscar(id!)
      setPedido(data)
      carregarForms(data)
      setOkFin(liberar ? 'Pedido liberado para a produção. Wellington foi notificado.' : 'Alterações salvas.')
    } catch (err: any) {
      setErroFin(err.response?.data?.erro || 'Erro ao salvar a revisão do financeiro')
    } finally {
      setSalvandoFin(false)
    }
  }

  async function salvarAmostra() {
    setSalvandoAmostra(true)
    setErroAmostra('')
    setOkAmostra('')
    try {
      await pedidosApi.atualizarAmostra(id!, {
        amostraNaoSeAplica: aNaoAplica,
        amostraEmbalagem: !aNaoAplica && aTem,
        amostraPedidaCliente: !aNaoAplica && aPedida,
        amostraEnviada: !aNaoAplica && aEnviada,
        amostraChegou: !aNaoAplica && aChegou,
        amostraEmbalagemObs: aObs,
      })
      const { data } = await pedidosApi.buscar(id!)
      setPedido(data)
      carregarForms(data)
      setOkAmostra('Amostra atualizada.')
    } catch (err: any) {
      setErroAmostra(err.response?.data?.erro || 'Erro ao salvar a amostra')
    } finally {
      setSalvandoAmostra(false)
    }
  }

  async function gerarOS() {
    if (!confirm('Gerar a Ordem de Pedido para a produção?')) return
    const { data } = await osApi.gerar(id!)
    navigate(`/os/${data.id}`)
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Carregando...</div>
  if (!pedido) return <div className="text-center py-8 text-red-500">Pedido não encontrado</div>

  const temDocumentos = (pedido.fotos && pedido.fotos.length > 0) || pedido.comprovanteSinal

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
          <Chip ok={pedido.pagamentoConfirmado}>Pagamento 100% confirmado</Chip>
          <Chip ok={!!pedido.comprovanteSinalConferido}>Comprov. Sinal (Financeiro)</Chip>
          <Chip ok={!!pedido.comprovanteSinal} warn>Comprovante de Sinal (anexo)</Chip>
          {pedido.aguardandoSinal && <span className="chip chip--warn"><span>⏳</span>Aguardando sinal</span>}
          <Chip ok={!!(pedido.os && pedido.os.length > 0)}>Ordem de Pedido gerada</Chip>
        </div>
        {(pedido.observacoes || pedido.observacoesComerciais || pedido.observacoesTecnicas) && (
          <div className="mt-4 border-t border-gray-100 pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Observações do pedido</p>
            {pedido.observacoes && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap"><span className="text-gray-500">Geral (vendedor): </span>{pedido.observacoes}</p>
            )}
            {pedido.observacoesComerciais && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap"><span className="text-gray-500">Comercial: </span>{pedido.observacoesComerciais}</p>
            )}
            {pedido.observacoesTecnicas && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap"><span className="text-gray-500">Técnica: </span>{pedido.observacoesTecnicas}</p>
            )}
            <p className="text-xs text-gray-400">Acompanham o pedido em todas as etapas (financeiro, produção e setores).</p>
          </div>
        )}
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
          <p className="text-sm mb-3 text-amber-700">
            Nenhum campo é obrigatório e tudo pode ser alterado depois, sem data fixa. Se liberar sem o sinal
            confirmado, marque <strong>Aguardando sinal</strong> e explique a situação na observação — o Wellington
            recebe essas informações para conferir antes de liberar para a produção.
          </p>
          {(pedido.observacoes || pedido.observacoesComerciais) && (
            <div className="text-sm text-amber-800 bg-white/60 rounded-lg p-3 mb-4 space-y-1">
              {pedido.observacoes && <p>📝 <span className="text-amber-700">Observação do vendedor:</span> {pedido.observacoes}</p>}
              {pedido.observacoesComerciais && <p>📝 <span className="text-amber-700">Observação comercial:</span> {pedido.observacoesComerciais}</p>}
            </div>
          )}

          <div className="bg-white rounded-lg border border-amber-200 p-4 space-y-4">
            {/* 1. Conferência do comprovante de sinal */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">1. Conferência do comprovante de sinal</p>
              <p className="text-xs text-gray-500 mb-2">
                Preencha quando houver comprovante anexado.
                {!pedido.comprovanteSinal && <span className="text-amber-600"> Nenhum comprovante anexado ainda.</span>}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">Valor do comprovante</label>
                  <input type="number" step="0.01" value={fCompValor} onChange={(e) => setFCompValor(e.target.value)} className="input text-sm" placeholder="0,00" />
                </div>
                <div>
                  <label className="label">Data do pagamento</label>
                  <input type="date" value={fCompData} onChange={(e) => setFCompData(e.target.value)} className="input text-sm" />
                </div>
                <div>
                  <label className="label">Banco / forma</label>
                  <input value={fCompBanco} onChange={(e) => setFCompBanco(e.target.value)} className="input text-sm" placeholder="Ex.: PIX Itaú" />
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <label className="flex items-center gap-3 cursor-pointer text-sm">
                  <input type="checkbox" checked={fCompCliente} onChange={(e) => setFCompCliente(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  Nome do cliente confere <span className="text-gray-400">(pedido: {pedido.cliente.nome})</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm">
                  <input type="checkbox" checked={fCompPedido} onChange={(e) => setFCompPedido(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  Comprovante corresponde a este pedido
                </label>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* 2. Pagamento 100% confirmado */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">2. Pagamento</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={fPagamento} onChange={(e) => setFPagamento(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="font-medium text-gray-800">Pagamento 100% confirmado</span>
              </label>
              <p className="text-xs text-gray-500 ml-7">Marque só quando o valor estiver realmente identificado na conta da empresa.</p>
              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <input type="checkbox" checked={fComprovante} onChange={(e) => setFComprovante(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="font-medium text-gray-800">Comprovante de sinal conferido</span>
              </label>
            </div>

            <hr className="border-gray-100" />

            {/* 3. Aguardando sinal */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">3. Aguardando sinal</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={fAguardandoSinal} onChange={(e) => setFAguardandoSinal(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="font-medium text-gray-800">Pedido segue sem o sinal confirmado</span>
              </label>
              <label className="label mt-2">Observação (situação financeira)</label>
              <textarea
                value={fObs}
                onChange={(e) => setFObs(e.target.value)}
                rows={3}
                placeholder="Ex.: cliente informou pagamento em 20/09 · autorizado pela gestão a seguir sem sinal · comprovante enviado, valor ainda não caiu na conta..."
                className="input text-sm"
              />
            </div>
          </div>

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
          <h2 className="font-semibold mb-2">🏭 Conferir e gerar Ordem de Pedido</h2>
          <div className="text-sm mb-4 space-y-1 text-blue-700">
            <p>{pedido.pagamentoConfirmado ? '✅' : '⚠️'} Pagamento 100% confirmado: <strong>{pedido.pagamentoConfirmado ? 'SIM' : 'NÃO'}</strong></p>
            <p>{pedido.comprovanteSinalConferido ? '✅' : '⚠️'} Comprovante de sinal conferido: <strong>{pedido.comprovanteSinalConferido ? 'SIM' : 'NÃO'}</strong></p>
            {(pedido.compValor != null || pedido.compData || pedido.compBanco) && (
              <p>
                🧾 Comprovante:
                {pedido.compValor != null && <> {formatarMoeda(pedido.compValor)}</>}
                {pedido.compData && <> · {formatarData(pedido.compData)}</>}
                {pedido.compBanco && <> · {pedido.compBanco}</>}
                {pedido.compClienteConfere && <> · cliente confere</>}
                {pedido.compPedidoConfere && <> · confere com o pedido</>}
              </p>
            )}
            {pedido.aguardandoSinal && <p>⏳ <strong>AGUARDANDO SINAL</strong></p>}
            {pedido.financeiroObservacao && <p>📝 Observação do Financeiro: {pedido.financeiroObservacao}</p>}
            {pedido.observacoes && <p>📝 Observação do vendedor: {pedido.observacoes}</p>}
            <p className="text-xs">Confira as observações, os documentos e as fotos antes de gerar a Ordem de Pedido.</p>
          </div>
          <button onClick={gerarOS} className="btn-primary">🏭 Gerar Ordem de Pedido</button>
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

      {/* ---------- Amostra de embalagem ---------- */}
      {pedido.amostraEmbalagem != null && (
        <div className="card">
          <h2 className="section-title">📦 Amostra de embalagem</h2>
          {pedido.amostraNaoSeAplica ? (
            <p className="text-sm text-gray-500">Não se aplica (equipamento não depende de embalagem).</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Chip ok={!!pedido.amostraEmbalagem}>Há amostra</Chip>
              <Chip ok={!!pedido.amostraPedidaCliente}>Pedida ao cliente</Chip>
              <Chip ok={!!pedido.amostraEnviada}>Enviada</Chip>
              <Chip ok={!!pedido.amostraChegou}>Chegou na Mirainox</Chip>
            </div>
          )}
          {pedido.amostraEmbalagemObs && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{pedido.amostraEmbalagemObs}</p>
          )}
        </div>
      )}

      {/* ---------- Editar amostra de embalagem ---------- */}
      {podeMexerAmostra && pedido.amostraEmbalagem != null && (
        <div className="card">
          <h2 className="section-title">📦 Atualizar amostra de embalagem</h2>
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input type="checkbox" checked={aNaoAplica} onChange={(e) => setANaoAplica(e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="font-medium">Não se aplica (equipamento não depende de embalagem)</span>
          </label>
          {!aNaoAplica && (
            <div className="space-y-2 border-l-2 border-gray-100 pl-4">
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={aTem} onChange={(e) => setATem(e.target.checked)} className="w-4 h-4 accent-blue-600" />Há amostra de embalagem</label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={aPedida} onChange={(e) => setAPedida(e.target.checked)} className="w-4 h-4 accent-blue-600" />Amostra já pedida ao cliente</label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={aEnviada} onChange={(e) => setAEnviada(e.target.checked)} className="w-4 h-4 accent-blue-600" />Amostra já enviada</label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={aChegou} onChange={(e) => setAChegou(e.target.checked)} className="w-4 h-4 accent-blue-600" />Amostra já chegou na Mirainox</label>
            </div>
          )}
          <textarea value={aObs} onChange={(e) => setAObs(e.target.value)} rows={2} placeholder="Observação sobre a amostra..." className="input text-sm mt-3" />
          {erroAmostra && <p className="text-sm text-red-600 mt-2">{erroAmostra}</p>}
          {okAmostra && <p className="text-sm text-green-700 mt-2">{okAmostra}</p>}
          <button onClick={salvarAmostra} disabled={salvandoAmostra} className="btn-primary mt-3">
            {salvandoAmostra ? 'Salvando...' : 'Salvar amostra'}
          </button>
        </div>
      )}

      {/* ---------- Ordem de Pedido (produção) ---------- */}
      {pedido.os && pedido.os.length > 0 && (
        <div className="card">
          <h2 className="section-title">Ordem de Pedido</h2>
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
