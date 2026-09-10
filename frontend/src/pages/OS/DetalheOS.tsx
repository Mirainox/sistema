import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { osApi } from '../../api'
import { OS, Setor, SetorOS } from '../../types'
import { formatarData, formatarDataHora, STATUS_OS_LABEL, STATUS_OS_COR, SETOR_LABEL } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../../components/PageHeader'

// Setores que o gerente de produção pode acionar nesta etapa inicial.
// A Usinagem NÃO entra aqui — é acionada depois, conforme necessidade.
const SETORES_PRODUCAO: { setor: Setor; label: string }[] = [
  { setor: 'ALMOXARIFADO_GERAL', label: 'Almoxarifado 1' },
  { setor: 'ALMOXARIFADO_CONSUMIVEIS', label: 'Almoxarifado 2' },
  { setor: 'PRODUCAO_INOX', label: 'Produção de Inox' },
  { setor: 'CALDEIRARIA', label: 'Caldeiraria' },
  { setor: 'ELETRICA', label: 'Elétrica' },
  { setor: 'MONTAGEM_AUTOMATIZADA', label: 'Montagem' },
]

function SetorEntrega({ osId, s, podeEditar, onSalvo }: { osId: string; s: SetorOS; podeEditar: boolean; onSalvo: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [fisico, setFisico] = useState(s.recebeuFisico)
  const [virtual, setVirtual] = useState(s.recebeuVirtual)
  const [pessoa, setPessoa] = useState(s.pessoaRecebeu || '')
  const [pendencias, setPendencias] = useState(s.pendencias || '')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      await osApi.atualizarSetor(osId, s.id, { recebeuFisico: fisico, recebeuVirtual: virtual, pessoaRecebeu: pessoa, pendencias })
      setAberto(false)
      onSalvo()
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="border border-gray-100 rounded-lg p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{SETOR_LABEL[s.setor] || s.setor}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${s.recebeuFisico ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.recebeuFisico ? '✓ Papel' : '⬜ Papel'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${s.recebeuVirtual ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.recebeuVirtual ? '✓ Sistema' : '⬜ Sistema'}</span>
          {podeEditar && <button onClick={() => setAberto((v) => !v)} className="text-xs text-blue-600 hover:underline">{aberto ? 'fechar' : 'editar'}</button>}
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
            <label className="flex items-center gap-2"><input type="checkbox" checked={fisico} onChange={(e) => setFisico(e.target.checked)} className="w-4 h-4 accent-blue-600" />Entregue em papel</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={virtual} onChange={(e) => setVirtual(e.target.checked)} className="w-4 h-4 accent-blue-600" />Enviado pelo sistema</label>
          </div>
          <div>
            <label className="label">Pessoa que recebeu</label>
            <input value={pessoa} onChange={(e) => setPessoa(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="label">Pendências (se houver)</label>
            <input value={pendencias} onChange={(e) => setPendencias(e.target.value)} className="input text-sm" placeholder="Ex.: falta material X" />
          </div>
          <button onClick={salvar} disabled={salvando} className="btn-primary text-sm">{salvando ? 'Salvando...' : 'Salvar entrega'}</button>
        </div>
      )}
    </div>
  )
}

export default function DetalheOS() {
  const { id } = useParams()
  const { hasRole } = useAuth()
  const [os, setOs] = useState<OS | null>(null)
  const [loading, setLoading] = useState(true)
  const [distribuindo, setDistribuindo] = useState(false)
  const [setoresSelecionados, setSetoresSelecionados] = useState<{ setor: string; responsavel: string; recebeuFisico: boolean }[]>([])

  useEffect(() => {
    carregarOS()
  }, [id])

  async function carregarOS() {
    const { data } = await osApi.buscar(id!)
    setOs(data)
    setLoading(false)
  }

  async function distribuir() {
    if (setoresSelecionados.length === 0) return alert('Selecione ao menos um setor')
    await osApi.distribuir(id!, setoresSelecionados)
    setDistribuindo(false)
    carregarOS()
  }

  async function atualizarStatus(status: string) {
    await osApi.atualizarStatus(id!, status)
    carregarOS()
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Carregando...</div>
  if (!os) return <div className="text-center py-8 text-red-500">Ordem de Pedido não encontrada</div>

  const podeDistribuir = hasRole('GERENTE_OPERACIONAL', 'ADMIN', 'GESTOR_PRODUCAO')
  const podeEditarEntrega = hasRole('GERENTE_OPERACIONAL', 'ADMIN', 'GESTOR_PRODUCAO', 'PRODUCAO', 'ALMOXARIFE')
  const podeAtualizarStatus = hasRole('GERENTE_OPERACIONAL', 'ADMIN', 'PRODUCAO', 'ALMOXARIFE')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Ordem de Pedido #${os.numero}`}
        subtitle={`Pedido #${os.pedido.numero} · Criada em ${formatarData(os.createdAt)}`}
        back="/os"
        actions={
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_OS_COR[os.status]}`}>{STATUS_OS_LABEL[os.status]}</span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="section-title">Identificação obrigatória</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Nº Pedido:</span> <strong>#{os.pedido.numero}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Cliente:</span> <strong>{os.pedido.cliente.nome}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Cidade:</span> <strong>{os.pedido.cliente.cidade}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Equipamento:</span> <strong>{os.pedido.equipamento}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Prazo:</span> <strong>{formatarData(os.pedido.prazoEntrega)}</strong></div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Equipamento</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Modelo:</span> <strong>{os.pedido.modelo}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Voltagem:</span> <strong>{os.pedido.voltagem ? (({'220_MONO':'220V mono','220_BI':'220V bi','220_TRI':'220V tri','380_TRI':'380V tri'} as any)[os.pedido.voltagem] || os.pedido.voltagem) : '—'}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Desenho:</span> <strong>{os.pedido.desenhoNecessario ? (os.pedido.desenhoStatus === 'CONCLUIDO' ? 'Concluído' : 'Necessário') : 'Não'}</strong></div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Entrega por setor (papel e sistema)</h2>
        {os.setoresOS.length === 0 ? (
          <p className="text-sm text-gray-500">Ainda não distribuída aos setores.</p>
        ) : (
          <div className="space-y-2">
            {os.setoresOS.map((s) => (
              <SetorEntrega key={s.id} osId={os.id} s={s} podeEditar={podeEditarEntrega} onSalvo={carregarOS} />
            ))}
          </div>
        )}
      </div>

      {podeDistribuir && os.status === 'GERADA' && (
        <div className="card">
          <h2 className="font-semibold mb-4">📋 Distribuir Ordem de Pedido para Setores</h2>
          {!distribuindo ? (
            <button className="btn-primary" onClick={() => setDistribuindo(true)}>Iniciar Distribuição</button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Marque os setores acionados nesta etapa. A Usinagem entra depois, conforme a necessidade.</p>
              {SETORES_PRODUCAO.map((s) => {
                const idx = setoresSelecionados.findIndex((x) => x.setor === s.setor)
                const selecionado = idx >= 0

                return (
                  <div key={s.setor} className="flex items-center gap-4 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSetoresSelecionados((prev) => [...prev, { setor: s.setor, responsavel: s.label, recebeuFisico: false }])
                        } else {
                          setSetoresSelecionados((prev) => prev.filter((x) => x.setor !== s.setor))
                        }
                      }}
                    />
                    <span className="font-medium flex-1">{s.label}</span>
                    {selecionado && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={setoresSelecionados[idx]?.recebeuFisico}
                          onChange={(e) => {
                            setSetoresSelecionados((prev) => prev.map((x, i) => i === idx ? { ...x, recebeuFisico: e.target.checked } : x))
                          }}
                        />
                        Já entregue em papel
                      </label>
                    )}
                  </div>
                )
              })}
              <div className="flex gap-2">
                <button className="btn-primary" onClick={distribuir}>Confirmar Distribuição</button>
                <button className="btn-secondary" onClick={() => setDistribuindo(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {podeAtualizarStatus && os.status !== 'GERADA' && os.status !== 'CONCLUIDA' && os.status !== 'EXPEDIDA' && (
        <div className="card">
          <h2 className="font-semibold mb-3">Atualizar Status da Ordem de Pedido</h2>
          <div className="flex flex-wrap gap-2">
            {['EM_ANDAMENTO', 'AGUARDANDO_PECAS', 'EM_TESTE', 'CONCLUIDA'].map((s) => (
              <button key={s} className="btn-secondary text-sm" onClick={() => atualizarStatus(s)}>
                → {STATUS_OS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
