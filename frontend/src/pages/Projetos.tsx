import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pedidosApi } from '../api'
import { formatarData, VOLTAGEM_LABEL } from '../utils/formatters'
import PageHeader from '../components/PageHeader'
import AnexoDocumentoInput from '../components/AnexoDocumentoInput'

type Foto = { id: string; url: string; descricao?: string; usuario?: { nome: string }; createdAt: string }
type PedidoProjeto = {
  id: string
  numero: string
  cliente: { nome: string; cidade: string; estado: string }
  vendedor?: { nome: string }
  equipamento: string
  modelo: string
  voltagem?: string | null
  prazoEntrega: string
  observacoesComerciais?: string | null
  observacoesTecnicas?: string | null
  desenhoRecebido?: boolean
  desenhoRecebidoPor?: string | null
  desenhoRecebidoEm?: string | null
  desenhoAndamento?: boolean
  desenhoAndamentoPor?: string | null
  desenhoAndamentoEm?: string | null
  desenhoFinalizado?: boolean
  desenhoFinalizadoPor?: string | null
  desenhoFinalizadoEm?: string | null
  fotos?: Foto[]
}

function dataHora(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return {
    data: d.toLocaleDateString('pt-BR'),
    hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }
}

function Etapa({
  titulo, marcado, por, em, onToggle, salvando,
}: {
  titulo: string
  marcado?: boolean
  por?: string | null
  em?: string | null
  onToggle: (v: boolean) => void
  salvando: boolean
}) {
  const dh = dataHora(em)
  const rotulo = titulo === 'Pedido recebido' ? 'Recebido por' : titulo === 'Desenho em andamento' ? 'Iniciado por' : 'Finalizado por'
  return (
    <div className={`rounded-lg border p-3 ${marcado ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={!!marcado} disabled={salvando} onChange={(e) => onToggle(e.target.checked)} className="w-4 h-4 accent-blue-600" />
        <span className="font-medium text-gray-800">{marcado ? '☑️' : '☐'} {titulo}</span>
      </label>
      {marcado && (
        <div className="text-xs text-gray-600 mt-2 ml-7 space-y-0.5">
          <p>{rotulo}: <strong>{por || '—'}</strong></p>
          {dh && <p>Data: {dh.data}</p>}
          {dh && <p>Hora: {dh.hora}</p>}
        </div>
      )}
    </div>
  )
}

function CardPedido({ p, recarregar }: { p: PedidoProjeto; recarregar: () => void }) {
  const [aberto, setAberto] = useState(!p.desenhoFinalizado)
  const [salvando, setSalvando] = useState('')
  const [anexo, setAnexo] = useState<File | null>(null)
  const [enviandoAnexo, setEnviandoAnexo] = useState(false)

  async function marcar(etapa: 'recebido' | 'andamento' | 'finalizado', v: boolean) {
    setSalvando(etapa)
    try {
      await pedidosApi.marcarDesenhoEtapa(p.id, etapa, v)
      recarregar()
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setSalvando('')
    }
  }

  async function enviarAnexo() {
    if (!anexo) return
    setEnviandoAnexo(true)
    try {
      const fd = new FormData()
      fd.append('arquivo', anexo)
      await pedidosApi.anexarDesenho(p.id, fd)
      setAnexo(null)
      recarregar()
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao anexar')
    } finally {
      setEnviandoAnexo(false)
    }
  }

  const etapa = p.desenhoFinalizado ? 'Finalizado' : p.desenhoAndamento ? 'Em andamento' : p.desenhoRecebido ? 'Recebido' : 'A receber'
  const cor = p.desenhoFinalizado ? 'bg-green-100 text-green-700' : p.desenhoAndamento ? 'bg-blue-100 text-blue-700' : p.desenhoRecebido ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
  const desenhos = (p.fotos || []).filter((f) => f.descricao === 'Desenho técnico')
  const documentos = (p.fotos || []).filter((f) => f.descricao !== 'Desenho técnico')

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setAberto((v) => !v)} className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-blue-600">#{p.numero}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cor}`}>{etapa}</span>
          </div>
          <p className="text-sm mt-1"><strong>{p.cliente.nome}</strong> - {p.cliente.cidade}/{p.cliente.estado} · {p.equipamento} {p.modelo}</p>
        </div>
        <span className="text-gray-400 text-sm shrink-0">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="border-t border-gray-100 p-4 space-y-5">
          {/* Informações */}
          <div>
            <h4 className="section-title">Informações do pedido</h4>
            <dl className="dl">
              <dt>Equipamento</dt><dd>{p.equipamento} {p.modelo}</dd>
              <dt>Voltagem</dt><dd>{p.voltagem ? (VOLTAGEM_LABEL[p.voltagem] || p.voltagem) : '—'}</dd>
              <dt>Prazo</dt><dd>{formatarData(p.prazoEntrega)}</dd>
              {p.vendedor?.nome && (<><dt>Vendedor</dt><dd>{p.vendedor.nome}</dd></>)}
            </dl>
            {(p.observacoesTecnicas || p.observacoesComerciais) && (
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                {p.observacoesTecnicas && <p><span className="text-gray-500">Obs. técnicas: </span>{p.observacoesTecnicas}</p>}
                {p.observacoesComerciais && <p><span className="text-gray-500">Obs. comerciais: </span>{p.observacoesComerciais}</p>}
              </div>
            )}
          </div>

          {/* Documentos encaminhados */}
          <div>
            <h4 className="section-title">Documentos encaminhados pelo Wellington</h4>
            {documentos.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum documento visível para o seu perfil.</p>
            ) : (
              <div className="space-y-2">
                {documentos.map((f) => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="doc-row">
                    <span className="font-medium text-sm">{f.descricao || 'Documento'}</span>
                    <span className="text-xs text-blue-600">Abrir →</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Mini checklist */}
          <div>
            <h4 className="section-title">Acompanhamento do desenho</h4>
            <div className="space-y-2">
              <Etapa titulo="Pedido recebido" marcado={p.desenhoRecebido} por={p.desenhoRecebidoPor} em={p.desenhoRecebidoEm} salvando={salvando === 'recebido'} onToggle={(v) => marcar('recebido', v)} />
              <Etapa titulo="Desenho em andamento" marcado={p.desenhoAndamento} por={p.desenhoAndamentoPor} em={p.desenhoAndamentoEm} salvando={salvando === 'andamento'} onToggle={(v) => marcar('andamento', v)} />
              <Etapa titulo="Desenho finalizado" marcado={p.desenhoFinalizado} por={p.desenhoFinalizadoPor} em={p.desenhoFinalizadoEm} salvando={salvando === 'finalizado'} onToggle={(v) => marcar('finalizado', v)} />
            </div>
          </div>

          {/* Anexos do desenho */}
          <div>
            <h4 className="section-title">Anexos do desenho</h4>
            {desenhos.length > 0 && (
              <div className="space-y-2 mb-3">
                {desenhos.map((f) => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="doc-row">
                    <span className="font-medium text-sm">Desenho técnico {f.usuario?.nome ? `· ${f.usuario.nome}` : ''} · {new Date(f.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="text-xs text-blue-600">Abrir →</span>
                  </a>
                ))}
              </div>
            )}
            <AnexoDocumentoInput value={anexo} onChange={setAnexo} />
            <button onClick={enviarAnexo} disabled={!anexo || enviandoAnexo} className="btn-primary mt-3">
              {enviandoAnexo ? 'Enviando...' : 'Anexar foto / documento do desenho'}
            </button>
          </div>

          <Link to={`/pedidos/${p.id}`} className="text-sm text-blue-600 hover:underline inline-block">Ver pedido completo →</Link>
        </div>
      )}
    </div>
  )
}

export default function Projetos() {
  const [pedidos, setPedidos] = useState<PedidoProjeto[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'ativos' | 'finalizados'>('ativos')

  function recarregar() {
    pedidosApi.listarProjetos().then(({ data }) => {
      setPedidos(data)
      setLoading(false)
    })
  }

  useEffect(recarregar, [])

  const ativos = pedidos.filter((p) => !p.desenhoFinalizado)
  const finalizados = pedidos.filter((p) => p.desenhoFinalizado)
  const lista = aba === 'ativos' ? ativos : finalizados

  return (
    <div className="space-y-6">
      <PageHeader title="Projetos e Desenhos" subtitle="Área de trabalho — pedidos encaminhados para desenho técnico" />

      <div className="flex gap-2">
        <button onClick={() => setAba('ativos')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${aba === 'ativos' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          🎨 Em trabalho ({ativos.length})
        </button>
        <button onClick={() => setAba('finalizados')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${aba === 'finalizados' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          ✅ Finalizados ({finalizados.length})
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-gray-500">Carregando...</div>
      ) : lista.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-5xl mb-3">🎨</p>
          <p className="text-gray-500">{aba === 'ativos' ? 'Nenhum pedido aguardando desenho.' : 'Nenhum desenho finalizado.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((p) => <CardPedido key={p.id} p={p} recarregar={recarregar} />)}
        </div>
      )}
    </div>
  )
}
