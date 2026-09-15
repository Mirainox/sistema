import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pedidosApi, usuariosApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
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
  const { usuario } = useAuth()

  const [vendedores, setVendedores] = useState<{ id: string; nome: string }[]>([])
  const [vendedorId, setVendedorId] = useState(usuario?.role === 'VENDEDOR' ? usuario.id : '')

  useEffect(() => {
    usuariosApi.listar().then(({ data }) => {
      const lista = data.filter((u: any) => u.ativo && u.role === 'VENDEDOR').map((u: any) => ({ id: u.id, nome: u.nome }))
      // garante que o usuário logado (se vendedor) apareça na lista
      if (usuario?.role === 'VENDEDOR' && !lista.some((v: any) => v.id === usuario.id)) {
        lista.unshift({ id: usuario.id, nome: usuario.nome })
      }
      setVendedores(lista)
    }).catch(() => {})
  }, [usuario])

  const [pedidoGerado, setPedidoGerado] = useState<File | null>(null)
  const [pedidoGeradoProducao, setPedidoGeradoProducao] = useState<File | null>(null)
  const [pedidoAssinado, setPedidoAssinado] = useState<File | null>(null)
  const [comprovanteSinal, setComprovanteSinal] = useState<File | null>(null)

  // Dados lidos pela IA em cada documento (mesmo fluxo do Almoxarifado: lê ao
  // anexar, preenche os campos abaixo, o vendedor confere e pode corrigir tudo
  // antes de enviar). Guardamos a leitura de cada documento para não precisar
  // chamar a IA de novo ao salvar o pedido.
  type DadosDocumento = { numeroPedido: string | null; nomeCliente: string | null; cidadeCliente: string | null; telefoneCliente: string | null; prazoEntrega: string | null; dataDocumento: string | null }
  const [extraidos, setExtraidos] = useState<Partial<Record<'pedidoGerado' | 'pedidoGeradoProducao' | 'pedidoAssinado', DadosDocumento>>>({})
  const [lendoDocumento, setLendoDocumento] = useState<string | null>(null)

  const [numeroPedidoDoc, setNumeroPedidoDoc] = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [cidadeCliente, setCidadeCliente] = useState('')
  const [telefoneCliente, setTelefoneCliente] = useState('')
  const [prazoEntrega, setPrazoEntrega] = useState('')

  async function handleAnexo(
    campo: 'pedidoGerado' | 'pedidoGeradoProducao' | 'pedidoAssinado',
    file: File | null,
    setFile: (f: File | null) => void,
  ) {
    setFile(file)
    if (!file) return
    setLendoDocumento(campo)
    try {
      const formData = new FormData()
      formData.append('arquivo', file)
      const { data } = await pedidosApi.lerDocumento(formData)
      setExtraidos((p) => ({ ...p, [campo]: data }))
      // Só preenche campos ainda vazios — não sobrescreve o que o vendedor já digitou.
      setNumeroPedidoDoc((v) => v || data.numeroPedido || '')
      setNomeCliente((v) => v || data.nomeCliente || '')
      setCidadeCliente((v) => v || data.cidadeCliente || '')
      setTelefoneCliente((v) => v || data.telefoneCliente || '')
      setPrazoEntrega((v) => v || data.prazoEntrega || '')
    } catch (err) {
      console.error('[ia] falha ao ler documento:', err)
    } finally {
      setLendoDocumento(null)
    }
  }
  const [amostraEmbalagem, setAmostraEmbalagem] = useState(false)
  const [amostraNaoSeAplica, setAmostraNaoSeAplica] = useState(false)
  const [amostraPedidaCliente, setAmostraPedidaCliente] = useState(false)
  const [amostraEnviada, setAmostraEnviada] = useState(false)
  const [amostraChegou, setAmostraChegou] = useState(false)
  const [amostraEmbalagemObs, setAmostraEmbalagemObs] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [observacoesComerciais, setObservacoesComerciais] = useState('')
  const [observacoesTecnicas, setObservacoesTecnicas] = useState('')

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  // Comprovante de Sinal NÃO é obrigatório para lançar o pedido — pode ser
  // anexado depois, sem limite de tempo (na tela de detalhe do pedido).
  const tudoPronto = !!pedidoGerado && !!pedidoGeradoProducao && !!pedidoAssinado && !!vendedorId

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vendedorId) {
      setErro('Selecione o vendedor responsável pelo pedido.')
      return
    }
    if (!pedidoGerado || !pedidoGeradoProducao || !pedidoAssinado) {
      setErro('Anexe o Pedido Gerado, o Pedido Gerado Produção e o Pedido Assinado.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const formData = new FormData()
      formData.append('vendedorId', vendedorId)
      formData.append('pedidoGerado', pedidoGerado!)
      formData.append('pedidoGeradoProducao', pedidoGeradoProducao!)
      formData.append('pedidoAssinado', pedidoAssinado!)
      if (comprovanteSinal) formData.append('comprovanteSinal', comprovanteSinal)
      if (nomeCliente.trim()) formData.append('nomeCliente', nomeCliente.trim())
      if (cidadeCliente.trim()) formData.append('cidadeCliente', cidadeCliente.trim())
      if (telefoneCliente.trim()) formData.append('telefoneCliente', telefoneCliente.trim())
      if (prazoEntrega) formData.append('prazoEntrega', prazoEntrega)
      // Leitura da IA já conferida pelo vendedor — reaproveitada no backend
      // em vez de ler os documentos de novo.
      if (extraidos.pedidoGerado) formData.append('dadosPedidoGerado', JSON.stringify(extraidos.pedidoGerado))
      if (extraidos.pedidoGeradoProducao) formData.append('dadosPedidoGeradoProducao', JSON.stringify(extraidos.pedidoGeradoProducao))
      if (extraidos.pedidoAssinado) formData.append('dadosPedidoAssinado', JSON.stringify(extraidos.pedidoAssinado))
      formData.append('amostraNaoSeAplica', String(amostraNaoSeAplica))
      formData.append('amostraEmbalagem', String(!amostraNaoSeAplica && amostraEmbalagem))
      formData.append('amostraPedidaCliente', String(!amostraNaoSeAplica && amostraPedidaCliente))
      formData.append('amostraEnviada', String(!amostraNaoSeAplica && amostraEnviada))
      formData.append('amostraChegou', String(!amostraNaoSeAplica && amostraChegou))
      if (amostraEmbalagemObs.trim()) formData.append('amostraEmbalagemObs', amostraEmbalagemObs.trim())
      if (observacoes.trim()) formData.append('observacoes', observacoes.trim())
      if (observacoesComerciais.trim()) formData.append('observacoesComerciais', observacoesComerciais.trim())
      if (observacoesTecnicas.trim()) formData.append('observacoesTecnicas', observacoesTecnicas.trim())
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
        <div className="card">
          <h2 className="section-title">Vendedor responsável</h2>
          <p className="text-xs text-gray-500 mb-2">Identifica quem fechou esta venda. Acompanha o pedido em todas as etapas.</p>
          <select className="input" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} required>
            <option value="">Selecione o vendedor...</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>{v.nome}{usuario?.id === v.id ? ' (você)' : ''}</option>
            ))}
          </select>
        </div>

        <div className="card divide-y divide-gray-100">
          <h2 className="section-title">Documentos obrigatórios</h2>
          <p className="text-xs text-gray-500 -mt-2">
            Ao anexar o Pedido Gerado, a IA lê o documento e sugere os dados do cliente abaixo — confira e corrija antes de enviar.
          </p>
          <div className="pt-4">
            <DocItem titulo="Pedido Gerado" value={pedidoGerado} onChange={(f) => handleAnexo('pedidoGerado', f, setPedidoGerado)} />
            {lendoDocumento === 'pedidoGerado' && <p className="text-xs text-purple-600 mt-1">🤖 Lendo documento...</p>}
          </div>
          <div className="pt-4">
            <DocItem titulo="Pedido Gerado Produção" value={pedidoGeradoProducao} onChange={setPedidoGeradoProducao} />
          </div>
          <div className="pt-4">
            <DocItem titulo="Pedido Assinado" value={pedidoAssinado} onChange={setPedidoAssinado} />
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Dados do cliente</h2>
          <p className="text-xs text-gray-500 mb-3">Preenchido automaticamente pela IA ao anexar o Pedido Gerado — confira e ajuste se necessário.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nº do pedido no documento</label>
              <input className="input" value={numeroPedidoDoc} onChange={(e) => setNumeroPedidoDoc(e.target.value)} placeholder="Preenchido pela IA" />
            </div>
            <div className="col-span-2">
              <label className="label">Nome do cliente</label>
              <input className="input" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Preenchido pela IA" />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input className="input" value={cidadeCliente} onChange={(e) => setCidadeCliente(e.target.value)} placeholder="Preenchido pela IA" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} placeholder="Preenchido pela IA" />
            </div>
            <div className="col-span-2">
              <label className="label">Prazo de entrega</label>
              <input className="input" type="date" value={prazoEntrega} onChange={(e) => setPrazoEntrega(e.target.value)} />
            </div>
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

          <div className="pt-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Observações comerciais <span className="text-sm font-normal text-gray-500">(opcional)</span></h3>
              <p className="text-xs text-gray-500 mb-2">Condições, combinados com o cliente, pontos de negociação. Acompanham o pedido até a produção.</p>
              <textarea value={observacoesComerciais} onChange={(e) => setObservacoesComerciais(e.target.value)} rows={3} placeholder="Ex.: entrega combinada em duas etapas; cliente retira na fábrica..." className="input text-sm" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Observações técnicas <span className="text-sm font-normal text-gray-500">(opcional)</span></h3>
              <p className="text-xs text-gray-500 mb-2">Detalhes técnicos do equipamento que a produção precisa saber.</p>
              <textarea value={observacoesTecnicas} onChange={(e) => setObservacoesTecnicas(e.target.value)} rows={3} placeholder="Ex.: bocal de 40mm; tensão 380V trifásico; acabamento escovado..." className="input text-sm" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Observações gerais <span className="text-sm font-normal text-gray-500">(opcional)</span></h3>
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Outras anotações do vendedor sobre este pedido..." className="input text-sm" />
            </div>
          </div>
        </div>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{erro}</div>}

        {!tudoPronto && (
          <p className="text-sm text-amber-600">⚠️ Selecione o vendedor responsável e anexe os 3 documentos obrigatórios para liberar o envio.</p>
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
