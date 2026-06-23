import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pedidosApi } from '../../api'

const checklistItems = [
  'Pedido gerado', 'Contrato ou pedido assinado', 'Nome do cliente', 'Cidade do cliente',
  'Número do pedido', 'Equipamento vendido', 'Modelo do equipamento', 'Opcionais definidos',
  'Condição de pagamento', 'Prazo de entrega', 'Voltagem/energia', 'Embalagens',
  'Comprovante de sinal', 'Observações técnicas', 'Observações comerciais',
]

export default function NovoPedido() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nomeCliente: '', cidadeCliente: '', estadoCliente: '', telefoneCliente: '', emailCliente: '',
    equipamento: '', modelo: '', opcionais: '', personalizacoes: '',
    condicaoPagamento: '', prazoEntrega: '', voltagem: '', embalagem: '',
    valorTotal: '', observacoesTecnicas: '', observacoesComerciais: '',
  })
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const todosMarcados = checklistItems.every((item) => checklist[item])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!todosMarcados) {
      setErro('Complete o checklist comercial antes de enviar o pedido.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const { data } = await pedidosApi.criar(form)
      navigate(`/pedidos/${data.id}`)
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Novo Pedido</h1>
        <button onClick={() => navigate('/pedidos')} className="btn-secondary">← Voltar</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Dados do Cliente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nome do Cliente *</label><input className="input" value={form.nomeCliente} onChange={(e) => set('nomeCliente', e.target.value)} required /></div>
            <div><label className="label">Cidade *</label><input className="input" value={form.cidadeCliente} onChange={(e) => set('cidadeCliente', e.target.value)} required /></div>
            <div><label className="label">Estado</label><input className="input" value={form.estadoCliente} onChange={(e) => set('estadoCliente', e.target.value)} /></div>
            <div><label className="label">Telefone</label><input className="input" value={form.telefoneCliente} onChange={(e) => set('telefoneCliente', e.target.value)} /></div>
            <div className="col-span-2"><label className="label">Email</label><input className="input" type="email" value={form.emailCliente} onChange={(e) => set('emailCliente', e.target.value)} /></div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Equipamento</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Equipamento *</label><input className="input" value={form.equipamento} onChange={(e) => set('equipamento', e.target.value)} required /></div>
            <div><label className="label">Modelo *</label><input className="input" value={form.modelo} onChange={(e) => set('modelo', e.target.value)} required /></div>
            <div><label className="label">Opcionais</label><input className="input" value={form.opcionais} onChange={(e) => set('opcionais', e.target.value)} /></div>
            <div><label className="label">Personalizações</label><input className="input" value={form.personalizacoes} onChange={(e) => set('personalizacoes', e.target.value)} /></div>
            <div><label className="label">Voltagem/Energia</label><input className="input" value={form.voltagem} onChange={(e) => set('voltagem', e.target.value)} /></div>
            <div><label className="label">Embalagem</label><input className="input" value={form.embalagem} onChange={(e) => set('embalagem', e.target.value)} /></div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Condições Comerciais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Condição de Pagamento *</label><input className="input" value={form.condicaoPagamento} onChange={(e) => set('condicaoPagamento', e.target.value)} required /></div>
            <div><label className="label">Prazo de Entrega *</label><input className="input" type="date" value={form.prazoEntrega} onChange={(e) => set('prazoEntrega', e.target.value)} required /></div>
            <div className="col-span-2"><label className="label">Valor Total (R$) *</label><input className="input" type="number" step="0.01" value={form.valorTotal} onChange={(e) => set('valorTotal', e.target.value)} required /></div>
            <div className="col-span-2"><label className="label">Observações Técnicas</label><textarea className="input h-20" value={form.observacoesTecnicas} onChange={(e) => set('observacoesTecnicas', e.target.value)} /></div>
            <div className="col-span-2"><label className="label">Observações Comerciais</label><textarea className="input h-20" value={form.observacoesComerciais} onChange={(e) => set('observacoesComerciais', e.target.value)} /></div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">✅ Checklist Obrigatório do Vendedor</h2>
          <p className="text-sm text-gray-500 mb-4">Confirme todos os itens antes de enviar o pedido.</p>
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <label key={item} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={!!checklist[item]}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, [item]: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className={`text-sm ${checklist[item] ? 'text-green-700 line-through' : 'text-gray-700'}`}>{item}</span>
              </label>
            ))}
          </div>
          {!todosMarcados && (
            <p className="text-sm text-amber-600 mt-3">⚠️ Marque todos os itens para liberar o envio.</p>
          )}
        </div>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{erro}</div>}

        <div className="flex gap-4">
          <button type="submit" className="btn-primary" disabled={loading || !todosMarcados}>
            {loading ? 'Salvando...' : 'Criar Pedido'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/pedidos')}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
