import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { comprasApi } from '../../api'
import { Setor } from '../../types'
import { SETOR_LABEL } from '../../utils/formatters'

export default function NovaCompra() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    produto: '', quantidade: '', unidade: 'un',
    numeroPedido: '', nomeCliente: '', cidadeCliente: '',
    urgencia: 'NORMAL', setorSolicitante: '' as Setor | '',
    prazoNecessario: '', osId: '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      await comprasApi.solicitar({
        ...form,
        quantidade: Number(form.quantidade),
        prazoNecessario: form.prazoNecessario ? new Date(form.prazoNecessario) : undefined,
        setorSolicitante: form.setorSolicitante || undefined,
      })
      navigate('/compras')
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Erro ao solicitar compra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Solicitar Compra</h1>
        <button onClick={() => navigate('/compras')} className="btn-secondary">← Voltar</button>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          ⚠️ Preencha sempre o número do pedido, nome e cidade do cliente vinculados a esta compra.
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Produto / Material *</label><input className="input" value={form.produto} onChange={(e) => set('produto', e.target.value)} required /></div>
          <div><label className="label">Quantidade *</label><input className="input" type="number" value={form.quantidade} onChange={(e) => set('quantidade', e.target.value)} required /></div>
          <div><label className="label">Unidade</label><input className="input" value={form.unidade} onChange={(e) => set('unidade', e.target.value)} /></div>
          <div><label className="label">Nº Pedido</label><input className="input" value={form.numeroPedido} onChange={(e) => set('numeroPedido', e.target.value)} /></div>
          <div><label className="label">Nome do Cliente</label><input className="input" value={form.nomeCliente} onChange={(e) => set('nomeCliente', e.target.value)} /></div>
          <div><label className="label">Cidade do Cliente</label><input className="input" value={form.cidadeCliente} onChange={(e) => set('cidadeCliente', e.target.value)} /></div>
          <div>
            <label className="label">Urgência</label>
            <select className="input" value={form.urgencia} onChange={(e) => set('urgencia', e.target.value)}>
              <option value="NORMAL">Normal</option>
              <option value="URGENTE">Urgente</option>
              <option value="CRITICO">Crítico</option>
            </select>
          </div>
          <div>
            <label className="label">Setor Solicitante</label>
            <select className="input" value={form.setorSolicitante} onChange={(e) => set('setorSolicitante', e.target.value)}>
              <option value="">Selecione...</option>
              {Object.entries(SETOR_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Prazo Necessário</label><input className="input" type="date" value={form.prazoNecessario} onChange={(e) => set('prazoNecessario', e.target.value)} /></div>
        </div>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{erro}</div>}

        <div className="flex gap-4">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Solicitar Compra'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/compras')}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
