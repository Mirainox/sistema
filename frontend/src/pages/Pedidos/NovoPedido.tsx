import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pedidosApi } from '../../api'
import AnexoDocumentoInput from '../../components/AnexoDocumentoInput'

export default function NovoPedido() {
  const navigate = useNavigate()

  const [pedidoGerado, setPedidoGerado] = useState<File | null>(null)
  const [pedidoGeradoProducao, setPedidoGeradoProducao] = useState<File | null>(null)
  const [pedidoAssinado, setPedidoAssinado] = useState<File | null>(null)
  const [comprovanteSinal, setComprovanteSinal] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const tudoPronto = !!pedidoGerado && !!pedidoGeradoProducao && !!pedidoAssinado && !!comprovanteSinal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tudoPronto) {
      setErro('Anexe o Pedido Gerado, o Pedido Gerado Produção, o Pedido Assinado e o Comprovante de Sinal.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const formData = new FormData()
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
          <AnexoDocumentoInput value={pedidoGerado} onChange={setPedidoGerado} />
        </div>

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
            <input type="checkbox" checked={!!comprovanteSinal} readOnly className="w-4 h-4 accent-blue-600" />
            <h2 className="font-semibold">Comprovante de Sinal</h2>
          </label>
          <AnexoDocumentoInput value={comprovanteSinal} onChange={setComprovanteSinal} />
        </div>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{erro}</div>}

        {!tudoPronto && (
          <p className="text-center text-sm text-amber-600">⚠️ Anexe os 4 documentos para liberar o envio.</p>
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
