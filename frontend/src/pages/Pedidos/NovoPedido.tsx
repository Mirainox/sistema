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

  const [lendoDocumento, setLendoDocumento] = useState(false)
  const [documentoNaoSuportado, setDocumentoNaoSuportado] = useState(false)

  const [form, setForm] = useState({
    nomeCliente: '', cidadeCliente: '', estadoCliente: '', telefoneCliente: '', emailCliente: '',
    equipamento: '', modelo: '', opcionais: '', personalizacoes: '',
    condicaoPagamento: '', prazoEntrega: '', voltagem: '', embalagem: '',
    valorTotal: '', observacoesTecnicas: '', observacoesComerciais: '',
  })

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handlePedidoGerado(arquivo: File | null) {
    setPedidoGerado(arquivo)
    setDocumentoNaoSuportado(false)
    if (!arquivo) return

    setLendoDocumento(true)
    setErro('')
    try {
      const { data } = await pedidosApi.interpretarDocumento(arquivo)
      if (data.suportado && data.dados) {
        const d = data.dados
        setForm((prev) => ({
          ...prev,
          nomeCliente: d.nomeCliente || prev.nomeCliente,
          cidadeCliente: d.cidadeCliente || prev.cidadeCliente,
          estadoCliente: d.estadoCliente || prev.estadoCliente,
          telefoneCliente: d.telefoneCliente || prev.telefoneCliente,
          emailCliente: d.emailCliente || prev.emailCliente,
          equipamento: d.equipamento || prev.equipamento,
          modelo: d.modelo || prev.modelo,
          opcionais: d.opcionais || prev.opcionais,
          personalizacoes: d.personalizacoes || prev.personalizacoes,
          condicaoPagamento: d.condicaoPagamento || prev.condicaoPagamento,
          prazoEntrega: d.prazoEntrega || prev.prazoEntrega,
          voltagem: d.voltagem || prev.voltagem,
          embalagem: d.embalagem || prev.embalagem,
          valorTotal: d.valorTotal != null ? String(d.valorTotal) : prev.valorTotal,
          observacoesTecnicas: d.observacoesTecnicas || prev.observacoesTecnicas,
          observacoesComerciais: d.observacoesComerciais || prev.observacoesComerciais,
        }))
      } else {
        setDocumentoNaoSuportado(true)
      }
    } catch {
      setErro('Não conseguimos ler esse documento automaticamente. Confira/preencha os dados abaixo manualmente.')
      setDocumentoNaoSuportado(true)
    } finally {
      setLendoDocumento(false)
    }
  }

  const dadosConfirmados = !!form.nomeCliente && !!form.cidadeCliente && !!form.equipamento &&
    !!form.modelo && !!form.condicaoPagamento && !!form.prazoEntrega && !!form.valorTotal

  const tudoPronto = !!pedidoGerado && !!pedidoGeradoProducao && !!pedidoAssinado && !!comprovanteSinal && dadosConfirmados

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tudoPronto) {
      setErro('Anexe o Pedido Gerado, o Pedido Gerado Produção, o Pedido Assinado, confirme os dados e anexe o Comprovante de Sinal.')
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
        <div className="card">
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={!!pedidoGerado} readOnly className="w-4 h-4 accent-blue-600" />
            <h2 className="font-semibold">Pedido Gerado</h2>
          </label>
          <AnexoDocumentoInput value={pedidoGerado} onChange={handlePedidoGerado} />
          {lendoDocumento && <p className="text-sm text-blue-600 mt-2">🔎 Lendo o documento e preenchendo os dados...</p>}
          {documentoNaoSuportado && !lendoDocumento && (
            <p className="text-sm text-amber-600 mt-2">⚠️ Não foi possível ler esse arquivo automaticamente. Confira os dados abaixo antes de enviar.</p>
          )}
        </div>

        {pedidoGerado && !lendoDocumento && (
          <div className="card space-y-4">
            <div>
              <h2 className="font-semibold">📝 Confira os dados extraídos do pedido</h2>
              <p className="text-sm text-gray-500">Lemos isso do documento anexado — confirme ou corrija antes de enviar.</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Dados do Cliente</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nome do Cliente *</label><input className="input" value={form.nomeCliente} onChange={(e) => set('nomeCliente', e.target.value)} required /></div>
                <div><label className="label">Cidade *</label><input className="input" value={form.cidadeCliente} onChange={(e) => set('cidadeCliente', e.target.value)} required /></div>
                <div><label className="label">Estado</label><input className="input" value={form.estadoCliente} onChange={(e) => set('estadoCliente', e.target.value)} /></div>
                <div><label className="label">Telefone</label><input className="input" value={form.telefoneCliente} onChange={(e) => set('telefoneCliente', e.target.value)} /></div>
                <div className="col-span-2"><label className="label">Email</label><input className="input" type="email" value={form.emailCliente} onChange={(e) => set('emailCliente', e.target.value)} /></div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Equipamento</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Equipamento *</label><input className="input" value={form.equipamento} onChange={(e) => set('equipamento', e.target.value)} required /></div>
                <div><label className="label">Modelo *</label><input className="input" value={form.modelo} onChange={(e) => set('modelo', e.target.value)} required /></div>
                <div><label className="label">Opcionais</label><input className="input" value={form.opcionais} onChange={(e) => set('opcionais', e.target.value)} /></div>
                <div><label className="label">Personalizações</label><input className="input" value={form.personalizacoes} onChange={(e) => set('personalizacoes', e.target.value)} /></div>
                <div><label className="label">Voltagem/Energia</label><input className="input" value={form.voltagem} onChange={(e) => set('voltagem', e.target.value)} /></div>
                <div><label className="label">Embalagem</label><input className="input" value={form.embalagem} onChange={(e) => set('embalagem', e.target.value)} /></div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Condições Comerciais</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Condição de Pagamento *</label><input className="input" value={form.condicaoPagamento} onChange={(e) => set('condicaoPagamento', e.target.value)} required /></div>
                <div><label className="label">Prazo de Entrega *</label><input className="input" type="date" value={form.prazoEntrega} onChange={(e) => set('prazoEntrega', e.target.value)} required /></div>
                <div className="col-span-2"><label className="label">Valor Total (R$) *</label><input className="input" type="number" step="0.01" value={form.valorTotal} onChange={(e) => set('valorTotal', e.target.value)} required /></div>
                <div className="col-span-2"><label className="label">Observações Técnicas</label><textarea className="input h-20" value={form.observacoesTecnicas} onChange={(e) => set('observacoesTecnicas', e.target.value)} /></div>
                <div className="col-span-2"><label className="label">Observações Comerciais</label><textarea className="input h-20" value={form.observacoesComerciais} onChange={(e) => set('observacoesComerciais', e.target.value)} /></div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={!!pedidoGeradoProducao} readOnly className="w-4 h-4 accent-blue-600" />
            <h2 className="font-semibold">Pedido Gerado Produção</h2>
          </label>
          <AnexoDocumentoInput value={pedidoGeradoProducao} onChange={setPedidoGeradoProducao} />
        </div>

        <div className="card">
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={!!pedidoAssinado} readOnly className="w-4 h-4 accent-blue-600" />
            <h2 className="font-semibold">Pedido Assinado</h2>
          </label>
          <AnexoDocumentoInput value={pedidoAssinado} onChange={setPedidoAssinado} />
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
          <p className="text-center text-sm text-amber-600">⚠️ Anexe o Pedido Gerado, o Pedido Gerado Produção, o Pedido Assinado, confirme os dados e anexe o Comprovante de Sinal para liberar o envio.</p>
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
