import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { pedidosApi, osApi } from '../../api'
import { Pedido, FotoAnexo } from '../../types'
import { formatarData, formatarMoeda, STATUS_PEDIDO_COR, STATUS_PEDIDO_LABEL, STATUS_OS_COR, STATUS_OS_LABEL, VOLTAGEM_LABEL, FASE_ENTREGA_LABEL } from '../../utils/formatters'
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

function DocumentoRow({ foto }: { foto: FotoAnexo }) {
  const [aberto, setAberto] = useState(false)
  const d = foto.dadosExtraidos
  const temDados = !!(d && (d.resumo || d.nomeCliente || d.cidadeCliente || d.equipamento || d.valor != null || d.observacoes))

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <div className="doc-row">
        <a href={foto.url} target="_blank" rel="noreferrer" className="font-medium text-sm hover:underline">{foto.descricao || 'Documento'}</a>
        <div className="flex items-center gap-3 shrink-0">
          {temDados && (
            <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-purple-600 hover:underline">
              🤖 {aberto ? 'ocultar' : 'ver leitura da IA'}
            </button>
          )}
          <a href={foto.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600">Abrir →</a>
        </div>
      </div>
      {aberto && d && (
        <div className="px-3 pb-3 pt-1 text-xs text-gray-600 space-y-1 bg-purple-50/50 border-t border-purple-100">
          {d.resumo && <p className="italic text-gray-500">{d.resumo}</p>}
          {d.nomeCliente && <p><span className="text-gray-400">Cliente: </span>{d.nomeCliente}</p>}
          {d.cidadeCliente && <p><span className="text-gray-400">Cidade: </span>{d.cidadeCliente}{d.estadoCliente ? `/${d.estadoCliente}` : ''}</p>}
          {d.equipamento && <p><span className="text-gray-400">Equipamento: </span>{d.equipamento} {d.modelo || ''}</p>}
          {d.valor != null && <p><span className="text-gray-400">Valor: </span>{formatarMoeda(d.valor)}</p>}
          {d.prazoEntrega && <p><span className="text-gray-400">Prazo: </span>{formatarData(d.prazoEntrega)}</p>}
          {d.observacoes && <p><span className="text-gray-400">Obs.: </span>{d.observacoes}</p>}
        </div>
      )}
    </div>
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

  const [gDados, setGDados] = useState(false)
  const [gDesenho, setGDesenho] = useState(false)
  const [gVoltagem, setGVoltagem] = useState('')
  const [salvandoGer, setSalvandoGer] = useState(false)
  const [erroGer, setErroGer] = useState('')
  const [okGer, setOkGer] = useState('')
  const [erroAberto, setErroAberto] = useState(false)
  const [erroObs, setErroObs] = useState('')
  const [erroPrazo, setErroPrazo] = useState('')
  const [salvandoErro, setSalvandoErro] = useState(false)

  const podeMexerComprovante = hasRole('VENDEDOR', 'ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL', 'FINANCEIRO')
  const podeRevisarFinanceiro = hasRole('FINANCEIRO', 'ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL')
  const podeMexerAmostra = hasRole('VENDEDOR', 'ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL', 'PRODUCAO')
  const podeConferirGerente = hasRole('GERENTE_OPERACIONAL', 'GESTOR_PRODUCAO', 'ADMIN', 'DIRETOR', 'GESTOR_ADMIN')

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
    setGDados(!!data.dadosConferidos)
    setGDesenho(!!data.desenhoNecessario)
    setGVoltagem(data.voltagem || '')
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

  async function recarregar() {
    const { data } = await pedidosApi.buscar(id!)
    setPedido(data)
    carregarForms(data)
  }

  async function salvarConferencia() {
    setSalvandoGer(true); setErroGer(''); setOkGer('')
    try {
      await pedidosApi.conferenciaGerente(id!, {
        dadosConferidos: gDados,
        desenhoNecessario: gDesenho,
        voltagem: gVoltagem || null,
      })
      await recarregar()
      setOkGer('Conferência salva.')
    } catch (err: any) {
      setErroGer(err.response?.data?.erro || 'Erro ao salvar a conferência')
    } finally {
      setSalvandoGer(false)
    }
  }

  async function confirmarErro() {
    if (!erroObs.trim()) { alert('A observação do erro é obrigatória.'); return }
    if (!confirm('Devolver o pedido para correção? O vendedor e as gerências serão avisados.')) return
    setSalvandoErro(true)
    try {
      await pedidosApi.marcarErro(id!, { erro: true, observacao: erroObs.trim(), prazo: erroPrazo || null })
      setErroAberto(false); setErroObs(''); setErroPrazo('')
      await recarregar()
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao marcar o erro de pedido')
    } finally {
      setSalvandoErro(false)
    }
  }

  async function resolverErro() {
    if (!confirm('Marcar este pedido como corrigido?')) return
    try {
      await pedidosApi.marcarErro(id!, { resolver: true })
      await recarregar()
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao resolver')
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
        subtitle={`Criado em ${formatarData(pedido.createdAt)}${pedido.vendedor?.nome ? ` · Vendedor: ${pedido.vendedor.nome}` : ''}`}
        back="/pedidos"
        actions={
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_PEDIDO_COR[pedido.status]}`}>
            {STATUS_PEDIDO_LABEL[pedido.status]}
          </span>
        }
      />

      {/* ---------- Erro de Pedido ---------- */}
      {pedido.erroPedido && (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 p-5">
          <h2 className="font-bold text-red-800 text-lg mb-2">⚠️ ERRO DE PEDIDO — voltou para correção</h2>
          <p className="text-sm text-red-800 whitespace-pre-wrap"><span className="font-semibold">Problema: </span>{pedido.erroPedidoObs}</p>
          <p className="text-xs text-red-700 mt-2">
            Devolvido por <strong>{pedido.erroPedidoPor}</strong>
            {pedido.erroPedidoEm && <> em {formatarData(pedido.erroPedidoEm)}</>}
            {pedido.erroPedidoPrazo && <> · prazo para correção: <strong>{formatarData(pedido.erroPedidoPrazo)}</strong></>}
          </p>
          {hasRole('VENDEDOR', 'ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO') && (
            <button onClick={resolverErro} className="btn-success mt-3">✅ Marcar como corrigido</button>
          )}
        </div>
      )}

      {/* ---------- Resumo ---------- */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h2 className="section-title">Cliente</h2>
            <dl className="dl">
              <dt>Nome</dt><dd>{pedido.cliente.nome}</dd>
              {pedido.empresa && (<><dt>Empresa / ref.</dt><dd>{pedido.empresa}</dd></>)}
              <dt>Cidade</dt><dd>{pedido.cliente.cidade}/{pedido.cliente.estado}</dd>
              {pedido.cliente.telefone && (<><dt>Telefone</dt><dd>{pedido.cliente.telefone}</dd></>)}
              {pedido.cliente.email && (<><dt>Email</dt><dd>{pedido.cliente.email}</dd></>)}
              {pedido.vendedor?.nome && (<><dt>Vendedor</dt><dd>{pedido.vendedor.nome}</dd></>)}
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
          <Chip ok={!!pedido.dadosConferidos}>Dados conferidos (Produção)</Chip>
          {(pedido.desenhoNecessario || pedido.desenhoRecebido || pedido.desenhoAndamento || pedido.desenhoFinalizado) && (
            <span className={`chip ${pedido.desenhoFinalizado ? 'chip--on' : 'chip--warn'}`}>
              <span>{pedido.desenhoFinalizado ? '✅' : '🎨'}</span>
              Desenho: {pedido.desenhoFinalizado ? 'Finalizado' : pedido.desenhoAndamento ? 'Em andamento' : pedido.desenhoRecebido ? 'Recebido' : 'A receber'}
            </span>
          )}
          {pedido.voltagem && <span className="chip chip--off"><span>⚡</span>{VOLTAGEM_LABEL[pedido.voltagem] || pedido.voltagem}</span>}
          <Chip ok={!!(pedido.os && pedido.os.length > 0)}>Ordem de Pedido gerada</Chip>
          {pedido.faseEntrega && (
            <span className={`chip ${pedido.faseEntrega === 'ENTREGUE' ? 'chip--on' : 'chip--warn'}`}>
              <span>{pedido.faseEntrega === 'ENTREGUE' ? '🏁' : '🚚'}</span>
              {FASE_ENTREGA_LABEL[pedido.faseEntrega]}
            </span>
          )}
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
              {(pedido.compExtraidoValor != null || pedido.compExtraidoData || pedido.compExtraidoBanco) && (
                <div className="flex items-center justify-between gap-3 flex-wrap bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-3 text-xs text-purple-800">
                  <span>
                    🤖 A IA leu no comprovante:
                    {pedido.compExtraidoValor != null && <> {formatarMoeda(pedido.compExtraidoValor)}</>}
                    {pedido.compExtraidoData && <> · {formatarData(pedido.compExtraidoData)}</>}
                    {pedido.compExtraidoBanco && <> · {pedido.compExtraidoBanco}</>}
                    {pedido.compExtraidoCliente && <> · cliente: {pedido.compExtraidoCliente}</>}
                    {' '}— confira antes de usar.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (pedido.compExtraidoValor != null) setFCompValor(String(pedido.compExtraidoValor))
                      if (pedido.compExtraidoData) setFCompData(pedido.compExtraidoData.slice(0, 10))
                      if (pedido.compExtraidoBanco) setFCompBanco(pedido.compExtraidoBanco)
                    }}
                    className="text-xs font-medium bg-purple-600 text-white px-2.5 py-1 rounded-md hover:bg-purple-700 shrink-0"
                  >
                    Usar estes valores
                  </button>
                </div>
              )}
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

      {podeConferirGerente && pedido.status === 'FINANCEIRO_APROVADO' && !pedido.erroPedido && (!pedido.os || pedido.os.length === 0) && (
        <div className="note note--info">
          <h2 className="font-semibold mb-1">🏭 Conferência do Gerente de Produção</h2>
          <p className="text-sm text-blue-700 mb-4">Wellington — leia todos os dados, marque a conferência, defina a voltagem e o desenho, e então gere a Ordem de Pedido.</p>

          <div className="bg-white rounded-lg border border-blue-200 p-4 text-sm text-gray-700 space-y-3">
            <div>
              <p className="font-semibold text-gray-800 mb-1">Identificação</p>
              <dl className="dl">
                <dt>Nº do pedido</dt><dd>#{pedido.numero}</dd>
                <dt>Cliente</dt><dd>{pedido.cliente.nome}</dd>
                {pedido.empresa && (<><dt>Empresa / ref.</dt><dd>{pedido.empresa}</dd></>)}
                <dt>Cidade</dt><dd>{pedido.cliente.cidade}/{pedido.cliente.estado}</dd>
                <dt>Equipamento</dt><dd>{pedido.equipamento}</dd>
                <dt>Modelo</dt><dd>{pedido.modelo}</dd>
                <dt>Prazo de entrega</dt><dd>{formatarData(pedido.prazoEntrega)}</dd>
              </dl>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="font-semibold text-gray-800 mb-1">Observações</p>
              <p><span className="text-gray-500">Comerciais: </span>{pedido.observacoesComerciais || '—'}</p>
              <p><span className="text-gray-500">Técnicas: </span>{pedido.observacoesTecnicas || '—'}</p>
              {pedido.observacoes && <p><span className="text-gray-500">Gerais: </span>{pedido.observacoes}</p>}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="font-semibold text-gray-800 mb-1">Financeiro</p>
              <p>{pedido.pagamentoConfirmado ? '✅' : '⚠️'} Pagamento 100% confirmado: <strong>{pedido.pagamentoConfirmado ? 'SIM' : 'NÃO'}</strong></p>
              <p>{pedido.comprovanteSinalConferido ? '✅' : '⚠️'} Comprovante de sinal conferido: <strong>{pedido.comprovanteSinalConferido ? 'SIM' : 'NÃO'}</strong></p>
              {(pedido.compValor != null || pedido.compData || pedido.compBanco) && (
                <p>
                  <span className="text-gray-500">Comprovante: </span>
                  {pedido.compValor != null && <>{formatarMoeda(pedido.compValor)}</>}
                  {pedido.compData && <> · {formatarData(pedido.compData)}</>}
                  {pedido.compBanco && <> · {pedido.compBanco}</>}
                </p>
              )}
              <p>
                <span className="text-gray-500">Status do sinal: </span>
                {pedido.aguardandoSinal
                  ? <strong className="text-amber-700">AGUARDANDO SINAL</strong>
                  : (pedido.pagamentoConfirmado ? 'Pago' : 'Não confirmado')}
              </p>
              {pedido.financeiroObservacao && <p><span className="text-gray-500">Obs. do Financeiro: </span>{pedido.financeiroObservacao}</p>}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="font-semibold text-gray-800 mb-1">Documentos anexados</p>
              {(pedido.fotos && pedido.fotos.length > 0) ? (
                <div className="flex flex-wrap gap-2">
                  {pedido.fotos.map((f) => (
                    <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-1 hover:bg-blue-100">
                      {f.descricao || 'Documento'} ↗
                    </a>
                  ))}
                </div>
              ) : <p className="text-gray-500">Nenhum documento visível para o seu perfil.</p>}
            </div>
          </div>

          {/* Checklist do gerente */}
          <div className="bg-white rounded-lg border border-blue-200 p-4 mt-3 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={gDados} onChange={(e) => setGDados(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <span className="font-medium text-gray-800">Dados conferidos</span>
              <span className="text-xs text-gray-500">(li e analisei todo o pedido)</span>
            </label>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={gDesenho} onChange={(e) => setGDesenho(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="font-medium text-gray-800">Desenho técnico necessário</span>
              </label>
              <p className="text-xs text-gray-500 ml-7">Ao salvar marcado, o pedido entra na Área de Trabalho do William (Projetos e Desenhos).</p>
              {(pedido.desenhoRecebido || pedido.desenhoAndamento || pedido.desenhoFinalizado) && (
                <p className="text-xs text-blue-700 ml-7 mt-1">Desenho: <strong>{pedido.desenhoFinalizado ? 'Finalizado' : pedido.desenhoAndamento ? 'Em andamento' : 'Recebido pelo William'}</strong></p>
              )}
            </div>

            <div>
              <p className="font-medium text-gray-800 mb-1">Voltagem do equipamento</p>
              <div className="flex flex-wrap gap-2">
                {['220_MONO', '220_BI', '220_TRI', '380_TRI'].map((v) => (
                  <label key={v} className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${gVoltagem === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                    <input type="radio" name="voltagem" value={v} checked={gVoltagem === v} onChange={(e) => setGVoltagem(e.target.value)} className="hidden" />
                    {VOLTAGEM_LABEL[v]}
                  </label>
                ))}
                {gVoltagem && <button type="button" onClick={() => setGVoltagem('')} className="text-xs text-gray-400 hover:text-gray-600">limpar</button>}
              </div>
            </div>

            {erroGer && <p className="text-sm text-red-600">{erroGer}</p>}
            {okGer && <p className="text-sm text-green-700">{okGer}</p>}
            <button onClick={salvarConferencia} disabled={salvandoGer} className="btn-secondary">
              {salvandoGer ? 'Salvando...' : 'Salvar conferência'}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={gerarOS} disabled={!pedido.dadosConferidos} className="btn-primary" title={!pedido.dadosConferidos ? 'Marque "Dados conferidos" e salve primeiro' : ''}>
              🏭 Gerar Ordem de Pedido
            </button>
            <button onClick={() => setErroAberto((v) => !v)} className="btn-danger">⚠️ Marcar Erro de Pedido</button>
          </div>

          {erroAberto && (
            <div className="bg-white rounded-lg border-2 border-red-300 p-4 mt-3 space-y-3">
              <p className="font-semibold text-red-800">Erro de Pedido — devolve para correção</p>
              <div>
                <label className="label">O que está errado? (obrigatório)</label>
                <textarea value={erroObs} onChange={(e) => setErroObs(e.target.value)} rows={3} className="input text-sm" placeholder="Ex.: voltagem não informada · modelo divergente do pedido assinado · desenho ausente · falta documento..." />
              </div>
              <div>
                <label className="label">Prazo para correção (opcional)</label>
                <input type="date" value={erroPrazo} onChange={(e) => setErroPrazo(e.target.value)} className="input text-sm" />
              </div>
              <button onClick={confirmarErro} disabled={salvandoErro} className="btn-danger">
                {salvandoErro ? 'Enviando...' : 'Devolver para correção'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------- Desenho técnico (somente leitura — William edita em Projetos e Desenhos) ---------- */}
      {(pedido.desenhoNecessario || pedido.desenhoRecebido || pedido.desenhoAndamento || pedido.desenhoFinalizado) && (
        <div className="card">
          <h2 className="section-title">🎨 Desenho técnico</h2>
          <p className="text-xs text-gray-500 mb-3">O William acompanha e atualiza este desenho no módulo <strong>Projetos e Desenhos</strong>.</p>
          <div className="space-y-2">
            {([
              ['Pedido recebido', pedido.desenhoRecebido, pedido.desenhoRecebidoPor, pedido.desenhoRecebidoEm, 'Recebido por'],
              ['Desenho em andamento', pedido.desenhoAndamento, pedido.desenhoAndamentoPor, pedido.desenhoAndamentoEm, 'Iniciado por'],
              ['Desenho finalizado', pedido.desenhoFinalizado, pedido.desenhoFinalizadoPor, pedido.desenhoFinalizadoEm, 'Finalizado por'],
            ] as const).map(([titulo, ok, por, em, rot]) => (
              <div key={titulo} className={`rounded-lg border p-3 ${ok ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <p className="font-medium text-gray-800 text-sm">{ok ? '☑️' : '☐'} {titulo}</p>
                {ok && (
                  <p className="text-xs text-gray-600 mt-1">
                    {rot}: <strong>{por || '—'}</strong>
                    {em && <> · {formatarData(em)} · {new Date(em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>}
                  </p>
                )}
              </div>
            ))}
          </div>
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
            {pedido.fotos?.map((foto) => <DocumentoRow key={foto.id} foto={foto} />)}
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
