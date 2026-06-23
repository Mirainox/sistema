import { useEffect, useState } from 'react'
import { expedicaoApi } from '../../api'
import { formatarData } from '../../utils/formatters'

export default function ListaExpedicao() {
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ numeroPedido: '', nomeCliente: '', cidadeCliente: '', estado: '', equipamento: '', peso: '', volume: '', dimensoes: '', dataPrevisao: '', caminhao: '', transportadora: '' })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await expedicaoApi.listar()
    setLista(data)
    setLoading(false)
  }

  async function criar() {
    await expedicaoApi.criar({ ...form, peso: form.peso ? Number(form.peso) : undefined, volume: form.volume ? Number(form.volume) : undefined, dataPrevisao: new Date(form.dataPrevisao) })
    await carregar()
    setModal(false)
    setForm({ numeroPedido: '', nomeCliente: '', cidadeCliente: '', estado: '', equipamento: '', peso: '', volume: '', dimensoes: '', dataPrevisao: '', caminhao: '', transportadora: '' })
  }

  async function atualizarStatus(id: string, status: string) {
    await expedicaoApi.atualizar(id, { status })
    await carregar()
  }

  const STATUS_COR: Record<string, string> = { AGUARDANDO: 'bg-yellow-100 text-yellow-700', EM_ROTA: 'bg-blue-100 text-blue-700', ENTREGUE: 'bg-green-100 text-green-700' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expedição</h1>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nova Expedição</button>
      </div>

      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3 font-semibold text-gray-700">Pedido</th>
                <th className="pb-3 font-semibold text-gray-700">Cliente</th>
                <th className="pb-3 font-semibold text-gray-700">Cidade / Estado</th>
                <th className="pb-3 font-semibold text-gray-700">Equipamento</th>
                <th className="pb-3 font-semibold text-gray-700">Previsão</th>
                <th className="pb-3 font-semibold text-gray-700">Transportadora</th>
                <th className="pb-3 font-semibold text-gray-700">Status</th>
                <th className="pb-3 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500">Nenhuma expedição cadastrada</td></tr>
              ) : (
                lista.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">#{e.numeroPedido}</td>
                    <td className="py-3">{e.nomeCliente}</td>
                    <td className="py-3 text-gray-600">{e.cidadeCliente}/{e.estado}</td>
                    <td className="py-3">{e.equipamento}</td>
                    <td className="py-3 text-gray-600">{formatarData(e.dataPrevisao)}</td>
                    <td className="py-3 text-gray-600">{e.transportadora || '-'}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COR[e.status] || 'bg-gray-100 text-gray-700'}`}>{e.status}</span>
                    </td>
                    <td className="py-3">
                      <select className="text-xs border rounded px-1 py-0.5" value={e.status} onChange={(ev) => atualizarStatus(e.id, ev.target.value)}>
                        <option value="AGUARDANDO">Aguardando</option>
                        <option value="EM_ROTA">Em Rota</option>
                        <option value="ENTREGUE">Entregue</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] space-y-4 max-h-screen overflow-y-auto">
            <h2 className="font-semibold text-lg">Nova Expedição</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              ℹ️ Preencha nº do pedido, nome e cidade do cliente. Esses dados são obrigatórios para roteirização.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Nº Pedido *</label><input className="input" value={form.numeroPedido} onChange={(e) => setForm((p) => ({ ...p, numeroPedido: e.target.value }))} /></div>
              <div><label className="label">Equipamento *</label><input className="input" value={form.equipamento} onChange={(e) => setForm((p) => ({ ...p, equipamento: e.target.value }))} /></div>
              <div><label className="label">Cliente *</label><input className="input" value={form.nomeCliente} onChange={(e) => setForm((p) => ({ ...p, nomeCliente: e.target.value }))} /></div>
              <div><label className="label">Cidade *</label><input className="input" value={form.cidadeCliente} onChange={(e) => setForm((p) => ({ ...p, cidadeCliente: e.target.value }))} /></div>
              <div><label className="label">Estado</label><input className="input" value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} /></div>
              <div><label className="label">Previsão de Entrega</label><input className="input" type="date" value={form.dataPrevisao} onChange={(e) => setForm((p) => ({ ...p, dataPrevisao: e.target.value }))} /></div>
              <div><label className="label">Peso (kg)</label><input className="input" type="number" value={form.peso} onChange={(e) => setForm((p) => ({ ...p, peso: e.target.value }))} /></div>
              <div><label className="label">Volume (m³)</label><input className="input" type="number" value={form.volume} onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))} /></div>
              <div><label className="label">Dimensões</label><input className="input" value={form.dimensoes} onChange={(e) => setForm((p) => ({ ...p, dimensoes: e.target.value }))} /></div>
              <div><label className="label">Transportadora</label><input className="input" value={form.transportadora} onChange={(e) => setForm((p) => ({ ...p, transportadora: e.target.value }))} /></div>
              <div><label className="label">Caminhão</label><input className="input" value={form.caminhao} onChange={(e) => setForm((p) => ({ ...p, caminhao: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={criar} disabled={!form.numeroPedido || !form.nomeCliente}>Cadastrar</button>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
