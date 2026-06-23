import { useEffect, useState } from 'react'
import { manutencaoApi, usuariosApi } from '../../api'
import { Manutencao } from '../../types'
import { formatarData } from '../../utils/formatters'

const STATUS_LABEL: Record<string, string> = { ABERTO: 'Aberto', EM_ANALISE: 'Em Análise', AGUARDANDO_PECAS: 'Aguardando Peças', EM_ATENDIMENTO: 'Em Atendimento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' }
const STATUS_COR: Record<string, string> = { ABERTO: 'bg-red-100 text-red-700', EM_ANALISE: 'bg-yellow-100 text-yellow-700', AGUARDANDO_PECAS: 'bg-orange-100 text-orange-700', EM_ATENDIMENTO: 'bg-blue-100 text-blue-700', CONCLUIDO: 'bg-green-100 text-green-700', CANCELADO: 'bg-gray-100 text-gray-700' }

export default function ListaManutencao() {
  const [lista, setLista] = useState<Manutencao[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nomeCliente: '', cidadeCliente: '', equipamento: '', problema: '', prioridade: 'NORMAL', garantia: false, tecnicoId: '' })

  useEffect(() => {
    Promise.all([manutencaoApi.listar(), usuariosApi.listar()]).then(([m, u]) => {
      setLista(m.data)
      setUsuarios(u.data)
      setLoading(false)
    })
  }, [])

  async function abrir() {
    await manutencaoApi.abrir(form)
    const { data } = await manutencaoApi.listar()
    setLista(data)
    setModal(false)
    setForm({ nomeCliente: '', cidadeCliente: '', equipamento: '', problema: '', prioridade: 'NORMAL', garantia: false, tecnicoId: '' })
  }

  async function encerrar(id: string) {
    const solucao = prompt('Descreva a solução aplicada:')
    if (!solucao) return
    await manutencaoApi.encerrar(id, solucao)
    const { data } = await manutencaoApi.listar()
    setLista(data)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manutenção e Atendimento Técnico</h1>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nova Solicitação</button>
      </div>

      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          <div className="space-y-3">
            {lista.length === 0 ? <p className="text-center py-8 text-gray-500">Nenhuma solicitação</p> : (
              lista.map((m) => (
                <div key={m.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{m.equipamento}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COR[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                        {m.prioridade === 'URGENTE' && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">URGENTE</span>}
                        {m.garantia && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Garantia</span>}
                      </div>
                      <p className="text-sm text-gray-700">{m.problema}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Cliente: {m.cliente.nome} - {m.cliente.cidade}
                        {m.tecnico && ` | Técnico: ${m.tecnico.nome}`}
                        {' | '}{formatarData(m.createdAt)}
                      </p>
                    </div>
                    {m.status !== 'CONCLUIDO' && m.status !== 'CANCELADO' && (
                      <button className="btn-success text-xs" onClick={() => encerrar(m.id)}>Encerrar</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4 max-h-screen overflow-y-auto">
            <h2 className="font-semibold text-lg">Nova Solicitação de Manutenção</h2>
            <div><label className="label">Cliente *</label><input className="input" value={form.nomeCliente} onChange={(e) => setForm((p) => ({ ...p, nomeCliente: e.target.value }))} /></div>
            <div><label className="label">Cidade</label><input className="input" value={form.cidadeCliente} onChange={(e) => setForm((p) => ({ ...p, cidadeCliente: e.target.value }))} /></div>
            <div><label className="label">Equipamento *</label><input className="input" value={form.equipamento} onChange={(e) => setForm((p) => ({ ...p, equipamento: e.target.value }))} /></div>
            <div><label className="label">Problema *</label><textarea className="input h-20" value={form.problema} onChange={(e) => setForm((p) => ({ ...p, problema: e.target.value }))} /></div>
            <div>
              <label className="label">Prioridade</label>
              <select className="input" value={form.prioridade} onChange={(e) => setForm((p) => ({ ...p, prioridade: e.target.value }))}>
                <option value="NORMAL">Normal</option>
                <option value="URGENTE">Urgente</option>
                <option value="CRITICO">Crítico</option>
              </select>
            </div>
            <div>
              <label className="label">Técnico Responsável</label>
              <select className="input" value={form.tecnicoId} onChange={(e) => setForm((p) => ({ ...p, tecnicoId: e.target.value }))}>
                <option value="">Sem técnico definido</option>
                {usuarios.filter(u => u.ativo).map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.garantia} onChange={(e) => setForm((p) => ({ ...p, garantia: e.target.checked }))} />
              Equipamento em garantia
            </label>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={abrir} disabled={!form.nomeCliente || !form.equipamento || !form.problema}>Abrir Chamado</button>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
