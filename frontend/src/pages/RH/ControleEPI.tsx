import { useEffect, useState } from 'react'
import { rhApi, usuariosApi } from '../../api'
import { formatarData } from '../../utils/formatters'
import { SETOR_LABEL } from '../../utils/formatters'

export default function ControleEPI() {
  const [epis, setEpis] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ funcionarioId: '', tipoEpi: '', quantidade: '1', dataEntrega: new Date().toISOString().split('T')[0], setor: '' })

  useEffect(() => {
    Promise.all([rhApi.listarEpis(), usuariosApi.listar()]).then(([episRes, usuariosRes]) => {
      setEpis(episRes.data)
      setUsuarios(usuariosRes.data)
      setLoading(false)
    })
  }, [])

  async function registrar() {
    await rhApi.registrarEntrega({ ...form, quantidade: Number(form.quantidade) })
    const { data } = await rhApi.listarEpis()
    setEpis(data)
    setModalAberto(false)
    setForm({ funcionarioId: '', tipoEpi: '', quantidade: '1', dataEntrega: new Date().toISOString().split('T')[0], setor: '' })
  }

  async function confirmar(id: string) {
    await rhApi.confirmarRecebimento(id)
    const { data } = await rhApi.listarEpis()
    setEpis(data)
  }

  const TIPOS_EPI = ['Capacete', 'Óculos de proteção', 'Protetor auricular', 'Luvas', 'Bota de segurança', 'Avental de couro', 'Máscara de solda', 'Protetor facial', 'Cinto de segurança', 'Respirador']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">RH / Controle de EPIs</h1>
        <button className="btn-primary" onClick={() => setModalAberto(true)}>+ Registrar Entrega de EPI</button>
      </div>

      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3 font-semibold text-gray-700">Funcionário</th>
                <th className="pb-3 font-semibold text-gray-700">Setor</th>
                <th className="pb-3 font-semibold text-gray-700">EPI</th>
                <th className="pb-3 font-semibold text-gray-700">Qtd</th>
                <th className="pb-3 font-semibold text-gray-700">Data Entrega</th>
                <th className="pb-3 font-semibold text-gray-700">Confirmado</th>
                <th className="pb-3 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {epis.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500">Nenhuma entrega registrada</td></tr>
              ) : (
                epis.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{e.funcionario?.nome}</td>
                    <td className="py-3 text-gray-600">{SETOR_LABEL[e.setor] || e.setor}</td>
                    <td className="py-3">{e.tipoEpi}</td>
                    <td className="py-3">{e.quantidade}</td>
                    <td className="py-3 text-gray-600">{formatarData(e.dataEntrega)}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${e.confirmacaoRecebimento ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {e.confirmacaoRecebimento ? '✓ Confirmado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3">
                      {!e.confirmacaoRecebimento && (
                        <button className="text-blue-600 hover:underline text-xs" onClick={() => confirmar(e.id)}>Confirmar</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">Registrar Entrega de EPI</h2>
            <div>
              <label className="label">Funcionário *</label>
              <select className="input" value={form.funcionarioId} onChange={(e) => setForm((p) => ({ ...p, funcionarioId: e.target.value }))}>
                <option value="">Selecione...</option>
                {usuarios.filter(u => u.ativo).map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo de EPI *</label>
              <select className="input" value={form.tipoEpi} onChange={(e) => setForm((p) => ({ ...p, tipoEpi: e.target.value }))}>
                <option value="">Selecione...</option>
                {TIPOS_EPI.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Quantidade</label><input className="input" type="number" value={form.quantidade} onChange={(e) => setForm((p) => ({ ...p, quantidade: e.target.value }))} /></div>
            <div><label className="label">Data da Entrega</label><input className="input" type="date" value={form.dataEntrega} onChange={(e) => setForm((p) => ({ ...p, dataEntrega: e.target.value }))} /></div>
            <div>
              <label className="label">Setor</label>
              <select className="input" value={form.setor} onChange={(e) => setForm((p) => ({ ...p, setor: e.target.value }))}>
                <option value="">Selecione...</option>
                {Object.entries(SETOR_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={registrar} disabled={!form.funcionarioId || !form.tipoEpi}>Registrar</button>
              <button className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
