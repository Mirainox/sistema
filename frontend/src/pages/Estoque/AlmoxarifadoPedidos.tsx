import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pedidosApi, osApi } from '../../api'
import { formatarData, formatarDataHora } from '../../utils/formatters'

type SetorOSAlmox = {
  id: string
  osId: string
  setor: string
  recebeuFisico: boolean
  recebeuVirtual: boolean
  pessoaRecebeu?: string | null
  pendencias?: string | null
  dataRecebimento?: string | null
}
type Foto = { id: string; url: string; descricao?: string }
type PedidoAlmox = {
  id: string
  numero: string
  cliente: { nome: string; cidade: string; estado: string }
  vendedor?: { nome: string }
  equipamento: string
  modelo: string
  prazoEntrega: string
  observacoesTecnicas?: string | null
  os: { id: string; numero: string; setoresOS: SetorOSAlmox[] }[]
  fotos?: Foto[]
}

const SETOR_LABEL_LOCAL: Record<string, string> = { ALMOXARIFADO_GERAL: 'Almoxarifado 1', ALMOXARIFADO_CONSUMIVEIS: 'Almoxarifado 2' }

function setoresDoPedido(p: PedidoAlmox): SetorOSAlmox[] {
  return p.os.flatMap((os) => os.setoresOS.map((s) => ({ ...s, osId: os.id })))
}
function recebidoCompleto(p: PedidoAlmox) {
  const setores = setoresDoPedido(p)
  return setores.length > 0 && setores.every((s) => s.recebeuFisico || s.recebeuVirtual)
}

function SetorLinha({ s, onSalvo }: { s: SetorOSAlmox; onSalvo: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [fisico, setFisico] = useState(s.recebeuFisico)
  const [virtual, setVirtual] = useState(s.recebeuVirtual)
  const [pessoa, setPessoa] = useState(s.pessoaRecebeu || '')
  const [pendencias, setPendencias] = useState(s.pendencias || '')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      await osApi.atualizarSetor(s.osId, s.id, { recebeuFisico: fisico, recebeuVirtual: virtual, pessoaRecebeu: pessoa, pendencias })
      setAberto(false)
      onSalvo()
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const recebido = s.recebeuFisico || s.recebeuVirtual

  return (
    <div className={`rounded-lg border p-3 text-sm ${recebido ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-medium">{SETOR_LABEL_LOCAL[s.setor] || s.setor}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${recebido ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {recebido ? '✓ Recebido' : '⬜ Aguardando'}
          </span>
          <button onClick={() => setAberto((v) => !v)} className="text-xs text-blue-600 hover:underline">{aberto ? 'fechar' : 'editar'}</button>
        </div>
      </div>
      {(s.pessoaRecebeu || s.dataRecebimento || s.pendencias) && !aberto && (
        <p className="text-xs text-gray-500 mt-1">
          {s.pessoaRecebeu && <>Recebeu: {s.pessoaRecebeu} </>}
          {s.dataRecebimento && <>· {formatarDataHora(s.dataRecebimento)} </>}
          {s.pendencias && <>· ⚠️ {s.pendencias}</>}
        </p>
      )}
      {aberto && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={fisico} onChange={(e) => setFisico(e.target.checked)} className="w-4 h-4 accent-blue-600" />Recebido em papel</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={virtual} onChange={(e) => setVirtual(e.target.checked)} className="w-4 h-4 accent-blue-600" />Recebido pelo sistema</label>
          </div>
          <div><label className="label">Pessoa que recebeu</label><input value={pessoa} onChange={(e) => setPessoa(e.target.value)} className="input text-sm" /></div>
          <div><label className="label">Pendências (se houver)</label><input value={pendencias} onChange={(e) => setPendencias(e.target.value)} className="input text-sm" placeholder="Ex.: falta chapa 304 2mm" /></div>
          <button onClick={salvar} disabled={salvando} className="btn-primary text-sm">{salvando ? 'Salvando...' : 'Salvar recebimento'}</button>
        </div>
      )}
    </div>
  )
}

function CardPedido({ p, recarregar }: { p: PedidoAlmox; recarregar: () => void }) {
  const [aberto, setAberto] = useState(true)
  const setores = setoresDoPedido(p)
  const completo = recebidoCompleto(p)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setAberto((v) => !v)} className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-blue-600">#{p.numero}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${completo ? 'bg-green-100 text-green-700' : setores.length ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
              {completo ? 'Recebido' : setores.length ? 'Aguardando recebimento' : 'Aguardando distribuição'}
            </span>
          </div>
          <p className="text-sm mt-1"><strong>{p.cliente.nome}</strong> - {p.cliente.cidade}/{p.cliente.estado} · {p.equipamento} {p.modelo}</p>
        </div>
        <span className="text-gray-400 text-sm shrink-0">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <dl className="dl">
            <dt>Prazo</dt><dd>{formatarData(p.prazoEntrega)}</dd>
            {p.vendedor?.nome && (<><dt>Vendedor</dt><dd>{p.vendedor.nome}</dd></>)}
          </dl>
          {p.observacoesTecnicas && <p className="text-sm text-gray-700"><span className="text-gray-500">Obs. técnicas: </span>{p.observacoesTecnicas}</p>}

          {(p.fotos && p.fotos.length > 0) && (
            <div>
              <h4 className="section-title">Documentos encaminhados</h4>
              <div className="space-y-2">
                {p.fotos.map((f) => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="doc-row">
                    <span className="font-medium text-sm">{f.descricao || 'Documento'}</span>
                    <span className="text-xs text-blue-600">Abrir →</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="section-title">Recebimento do material</h4>
            {setores.length === 0 ? (
              <p className="text-sm text-gray-500">O pedido chegou à produção, mas o gerente ainda não distribuiu para o Almoxarifado.</p>
            ) : (
              <div className="space-y-2">
                {setores.map((s) => <SetorLinha key={s.id} s={s} onSalvo={recarregar} />)}
              </div>
            )}
          </div>

          <Link to={`/pedidos/${p.id}`} className="text-sm text-blue-600 hover:underline inline-block">Ver pedido completo →</Link>
        </div>
      )}
    </div>
  )
}

export default function AlmoxarifadoPedidos() {
  const [pedidos, setPedidos] = useState<PedidoAlmox[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'pendentes' | 'recebidos'>('pendentes')

  function recarregar() {
    pedidosApi.listarAlmoxarifado().then(({ data }) => {
      setPedidos(data)
      setLoading(false)
    })
  }

  useEffect(recarregar, [])

  const pendentes = pedidos.filter((p) => !recebidoCompleto(p))
  const recebidos = pedidos.filter(recebidoCompleto)
  const lista = aba === 'pendentes' ? pendentes : recebidos

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Todo pedido liberado pelo financeiro e conferido pelo gerente de produção chega aqui automaticamente.
      </p>

      <div className="flex gap-2">
        <button onClick={() => setAba('pendentes')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${aba === 'pendentes' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          📋 Pendentes ({pendentes.length})
        </button>
        <button onClick={() => setAba('recebidos')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${aba === 'recebidos' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          ✅ Recebidos ({recebidos.length})
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-gray-500">Carregando...</div>
      ) : lista.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-5xl mb-3">📦</p>
          <p className="text-gray-500">{aba === 'pendentes' ? 'Nenhum pedido pendente no Almoxarifado.' : 'Nenhum pedido recebido ainda.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((p) => <CardPedido key={p.id} p={p} recarregar={recarregar} />)}
        </div>
      )}
    </div>
  )
}
