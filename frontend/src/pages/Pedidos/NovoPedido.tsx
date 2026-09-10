import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pedidosApi } from '../../api'
import AnexoDocumentoInput from '../../components/AnexoDocumentoInput'
import PageHeader from '../../components/PageHeader'

function DocItem({
  titulo, opcional, ajuda, value, onChange,
}: {
  titulo: string
  opcional?: boolean
  ajuda?: string
  value: File | null
  onChange: (f: File | null) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <input type="checkbox" checked={!!value} readOnly className="w-4 h-4 accent-blue-600" />
        <h3 className="font-semibold">
          {titulo}{opcional && <span className="text-sm font-normal text-gray-500"> (opcional)</span>}
        </h3>
      </div>
      {ajuda && <p className="text-xs text-gray-500 mb-2">{ajuda}</p>}
      <AnexoDocumentoInput value={value} onChange={onChange} />
    </div>
  )
}

export default function NovoPedido() {
  const navigate = useNavigate()

  const [pedidoGerado, setPedidoGerado] = useState<File | null>(null)
  const [pedidoGeradoProducao, setPedidoGeradoProducao] = useState<File | null>(null)
  const [pedidoAssinado, setPedidoAssinado] = useState<File | null>(null)
  const [comprovanteSinal, setComprovanteSinal] = useState<File | null>(null)
  const [amostraEmbalagem, setAmostraEmbalagem] = useState(false)
  const [amostraNaoSeAplica, setAmostraNaoSeAplica] = useState(false)
  const [amostraPedidaCliente, setAmostraPedidaCliente] = useState(false)
  const [amostraEnviada, setAmostraEnviada] = useState(false)
  const [amostraChegou, setAmostraChegou] = useState(false)
  const [amostraEmbalagemObs, setAmostraEmbalagemObs] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  // Comprovante de Sinal NÃO é obrigatório para lançar o pedido — pode ser
  // anexado depois, sem limite de tempo (na tela de detalhe do pedido).
  const tudoPronto = !!pedidoGerado && !!pedidoGeradoProducao && !!pedidoAssinado

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tudoPronto) {
      setErro('Anexe o Pedido Gerado, o Pedido Gerado Produção e o Pedido Assinado.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const formData = new FormData()
      formData.append('pedidoGerado', pedidoGerado!)
      formData.append('pedidoGeradoProducao', pedidoGeradoProducao!)
      formData.append('pedidoAssinado', pedidoAssinado!)
      if (comprovanteSinal) formData.append('comprovanteSinal', comprovanteSinal)
      formData.append('amostraNaoSeAplica', String(amostraNaoSeAplica))
      formData.append('amostraEmbalagem', String(!amostraNaoSeAplica && amostraEmbalagem))
      formData.append('amostraPedidaCliente', String(!amostraNaoSeAplica && amostraPedidaCliente))
      formData.append('amostraEnviada', String(!amostraNaoSeAplica && amostraEnviada))
      formData.append('amostraChegou', String(!amostraNaoSeAplica && amostraChegou))
      if (amostraEmbalagemObs.trim()) formData.append('amostraEmbalagemObs', amostraEmbalagemObs.trim())
      if (observacoes.trim()) formData.append('observacoes', observacoes.trim())
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
      <PageHeader title="Novo Pedido" back="/pedidos" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card divide-y divide-gray-100">
          <h2 className="section-title">Documentos obrigatórios</h2>
          <div className="pt-4">
            <DocItem titulo="Pedido Gerado" value={pedidoGerado} onChange={setPedidoGerado} />
          </div>
          <div className="pt-4">
            <DocItem titulo="Pedido Gerado Produção" value={pedidoGeradoProducao} onChange={setPedidoGeradoProducao} />
          </div>
          <div className="pt-4">
            <DocItem titulo="Pedido Assinado" value={pedidoAssinado} onChange={setPedidoAssinado} />
          </div>
        </div>

        <div className="card divide-y divide-gray-100">
          <h2 className="section-title">Opcionais</h2>

          <div className="pt-4">
            <DocItem
              titulo="Comprovante de Sinal"
              opcional
              ajuda="Pode ser anexado ou substituído depois, a qualquer momento, na tela do pedido."
              value={comprovanteSinal}
              onChange={setComprovanteSinal}
            />
          </div>

          <div className="pt-4">
            <h3 className="font-semibold mb-1">Amostra de Embalagem <span className="text-sm font-normal text-gray-500">(opcional)</span></h3>
            <p className="text-xs text-gray-500 mb-3">
              Para equipamentos que dependem de embalagem (envasadoras, seladoras, etc.). Não precisa anexar nada —
              o acompanhamento (pedida / enviada / chegou) também pode ser atualizado depois, na tela do pedido.
            </p>

            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={amostraNaoSeAplica}
                onChange={(e) => setAmostraNaoSeAplica(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="font-medium">Não se aplica (equipamento não depende de embalagem)</span>
            </label>

            {!amostraNaoSeAplica && (
              <div className="space-y-2 border-l-2 border-gray-100 pl-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={amostraEmbalagem} onChange={(e) => setAmostraEmbalagem(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  <span>Há amostra de embalagem</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={amostraPedidaCliente} onChange={(e) => setAmostraPedidaCliente(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  <span>Amostra já pedida ao cliente</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={amostraEnviada} onChange={(e) => setAmostraEnviada(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  <span>Amostra já enviada</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={amostraChegou} onChange={(e) => setAmostraChegou(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  <span>Amostra já chegou na Mirainox</span>
                </label>
              </div>
            )}

            <textarea
              value={amostraEmbalagemObs}
              onChange={(e) => setAmostraEmbalagemObs(e.target.value)}
              rows={3}
              placeholder="Observação sobre a amostra de embalagem..."
              className="input text-sm mt-3"
            />
          </div>

          <div className="pt-4">
            <h3 className="font-semibold mb-2">Observações <span className="text-sm font-normal text-gray-500">(opcional)</span></h3>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              placeholder="Anotações do vendedor sobre este pedido..."
              className="input text-sm"
            />
          </div>
        </div>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{erro}</div>}

        {!tudoPronto && (
          <p className="text-sm text-amber-600">⚠️ Anexe os 3 documentos obrigatórios para liberar o envio.</p>
        )}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading || !tudoPronto}>
            {loading ? 'Salvando...' : 'Criar Pedido'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/pedidos')}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
