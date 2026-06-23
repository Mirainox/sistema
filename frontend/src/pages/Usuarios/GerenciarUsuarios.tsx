import { useEffect, useState } from 'react'
import { usuariosApi } from '../../api'
import { SETOR_LABEL, ROLE_LABEL } from '../../utils/formatters'
import { Setor, Role } from '../../types'

export default function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: 'mirainox123', cargo: '', setor: '' as Setor | '', role: '' as Role | '' })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await usuariosApi.listar()
    setUsuarios(data)
    setLoading(false)
  }

  async function criar() {
    await usuariosApi.criar(form)
    await carregar()
    setModal(false)
    setForm({ nome: '', email: '', senha: 'mirainox123', cargo: '', setor: '', role: '' })
  }

  async function desativar(id: string, nome: string) {
    if (!confirm(`Desativar ${nome}?`)) return
    await usuariosApi.desativar(id)
    await carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários do Sistema</h1>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Novo Usuário</button>
      </div>

      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3 font-semibold text-gray-700">Nome</th>
                <th className="pb-3 font-semibold text-gray-700">Email</th>
                <th className="pb-3 font-semibold text-gray-700">Cargo</th>
                <th className="pb-3 font-semibold text-gray-700">Setor</th>
                <th className="pb-3 font-semibold text-gray-700">Perfil</th>
                <th className="pb-3 font-semibold text-gray-700">Status</th>
                <th className="pb-3 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{u.nome}</td>
                  <td className="py-3 text-gray-600">{u.email}</td>
                  <td className="py-3 text-gray-600">{u.cargo}</td>
                  <td className="py-3 text-gray-600">{SETOR_LABEL[u.setor] || u.setor}</td>
                  <td className="py-3 text-gray-600">{ROLE_LABEL[u.role] || u.role}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3">
                    {u.ativo && (
                      <button className="text-red-500 hover:underline text-xs" onClick={() => desativar(u.id, u.nome)}>Desativar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">Novo Usuário</h2>
            <div><label className="label">Nome *</label><input className="input" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} /></div>
            <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div><label className="label">Senha inicial</label><input className="input" value={form.senha} onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))} /></div>
            <div><label className="label">Cargo</label><input className="input" value={form.cargo} onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value }))} /></div>
            <div>
              <label className="label">Setor *</label>
              <select className="input" value={form.setor} onChange={(e) => setForm((p) => ({ ...p, setor: e.target.value as Setor }))}>
                <option value="">Selecione...</option>
                {Object.entries(SETOR_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Perfil de Acesso *</label>
              <select className="input" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))}>
                <option value="">Selecione...</option>
                {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={criar} disabled={!form.nome || !form.email || !form.setor || !form.role}>Criar Usuário</button>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
