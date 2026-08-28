import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pedidosApi } from '../../api'
import FotoInput from '../../components/FotoInput'
import AnexoDocumentoInput from '../../components/AnexoDocumentoInput'

export default function NovoPedido() {
  const navigate = useNavigate()

  const [pedidoGerado, setPedidoGerado] = useState<File | null>(null)
  const [pedidoGeradoProducao, setPedidoGeradoProducao] = useState<File | null>(null)
  const [pedidoAssinado, setPedidoAssinado] = useState<File | null>(null)
  const [comprovanteSinal, setComprovanteSinal] = useState<File | null>(null)

  const [form, setForm] = useState({
    nomeCliente: '', cidadeCliente: '', estadoCliente: '', telefoneCliente: '', emailCliente: '',
  })

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const dadosConfirmados = !!form.nomeCliente && !!form.cidadeCliente

  const tudoPronto = !!pedidoGerado && !!pedidoGeradoProducao && !!pedidoAssinado && !!comprovanteSinal && dadosConfirmados

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tudoPronto) {
      setErro('Informe o cliente e a cidade, anexe o Pedido Gerado, o Pedido Gerado Produção, o Pedido Assinado e o Comprovante de Sinal.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      formData.append('pedidoGerado', pedidoGerado!)
      formData.append('pedidoGeradoProducao', pedidoGeradoProducao!)
      formData.append('pedidoAssinado', pedidoAssinado!)
      formData.append('comprovanteSinal', comprovanteSinal!)
      const { data } = await pedidosApi.criar(formData)
      navigate(`/pedidos/${data.id}`)
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Novo Pedido</h1>
        <button onClick={() => navigate('/pedidos')} className="btn-secondary">← Voltar</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <div>
            <h2 className="font-semibold">Dados do Cliente</h2>
            <p className="text-sm text-gray-500">Os detalhes do pedido (equipamento, valores, prazos) ficam nos documentos anexados — cada setor abre o anexo correspondente.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nome do Cliente *</label><input className="input" value={form.nomeCliente} onChange={(e) => set('nomeCliente', e.target.value)} required /></div>
            <div><label className="label">Cidade *</label><input className="input" value={form.cidadeCliente} onChange={(e) => set('cidadeCliente', e.target.value)} required /></div>
            <div><label className="label">Estado</label><input className="input" value={form.estadoCliente} onChange={(e) => set('estadoCliente', e.target.value)} /></div>
            <div><label className="label">Telefone</label><input className="input" value={form.telefoneCliente} onChange={(e) => set('telefoneCliente', e.target.value)} /></div>
            <div className="col-span-2"><label className="label">Email</label><input className="input" type="email" value={form.emailCliente} onChange={(e) => set('emailCliente', e.target.value)} /></div>
          </div>
        </div>

        <div className="card">
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={!!pedidoGerado} readOnly className="w-4 h-4 accent-blue-600" />
            <h2 className="font-semibold">Pedido Gerado</h2>
          </label>
          <AnexoDocumentoInput value={pedidoGerado} onChange={setPedidoGerado} />
          <p className="text-xs text-gray-500 mt-2">Encaminhado para Financeiro, Fiscal e Expedição.</p>
        </div>

        <div className="card">
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={!!pedidoGeradoProducao} readOnly className="w-4 h-4 accent-blue-600" />
            <h2 className="font-semibold">Pedido Gerado Produção</h2>
          </label>
          <AnexoDocumentoInput value={pedidoGeradoProducao} onChange={setPedidoGeradoProducao} />
          <p className="text-xs text-gray-500 mt-2">Encaminhado para a Produção.</p>
        </div>

        <div className="card">
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={!!pedidoAssinado} readOnly className="w-4 h-4 accent-blue-600" />
            <h2 className="font-semibold">Pedido Assinado</h2>
          </label>
          <AnexoDocumentoInput value={pedidoAssinado} onChange={setPedidoAssinado} />
          <p className="text-xs text-gray-500 mt-2">Encaminhado para Financeiro, Fiscal e Expedição.</p>
        </div>

        <div className="card">
          <label className="flex items-center gap-3 mb-3">
            <span className="text-xl">📎</span>
            <h2 className="font-semibold">Comprovante de Sinal (Obrigatório)</h2>
          </label>
          <FotoInput value={comprovanteSinal} onChange={setComprovanteSinal} />
        </div>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{erro}</div>}

        {!tudoPronto && (
          <p className="text-center text-sm text-amber-600">⚠️ Informe o cliente e a cidade, anexe o Pedido Gerado, o Pedido Gerado Produção, o Pedido Assinado e o Comprovante de Sinal para liberar o envio.</p>
        )}

        <div className="flex gap-4">
          <button type="submit" className="btn-primary" disabled={loading || !tudoPronto}>
            {loading ? 'Salvando...' : 'Criar Pedido'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/pedidos')}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
