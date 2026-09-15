import { useEffect, useState } from 'react'
import { estoqueApi } from '../../api'
import { Estoque } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../../components/PageHeader'
import AlmoxarifadoPedidos from './AlmoxarifadoPedidos'

export default function ListaEstoque() {
  const { hasRole } = useAuth()
  const [aba, setAba] = useState<'pedidos' | 'estoque'>('pedidos')
  const [itens, setItens] = useState<Estoque[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [search, setSearch] = useState('')
  const [modalMovimentar, setModalMovimentar] = useState<Estoque | null>(null)
  const [modalCriar, setModalCriar] = useState(false)
  const [movForm, setMovForm] = useState({ tipo: 'ENTRADA', quantidade: '', motivo: '' })
  const [novoForm, setNovoForm] = useState({ tipo: 'MATERIA_PRIMA_BRUTA', codigo: '', descricao: '', unidade: 'un', quantidade: '', quantidadeMinima: '', valorUnitario: '' })
  const [lendoFoto, setLendoFoto] = useState(false)
  const [avisoLeitura, setAvisoLeitura] = useState('')

  useEffect(() => { carregar() }, [tipoFiltro])

  async function carregar() {
    setLoading(true)
    const { data } = await estoqueApi.listar({ tipo: tipoFiltro || undefined, search: search || undefined })
    setItens(data)
    setLoading(false)
  }

  async function movimentar() {
    if (!modalMovimentar) return
    await estoqueApi.movimentar(modalMovimentar.id, { ...movForm, quantidade: Number(movForm.quantidade) })
    setModalMovimentar(null)
    setMovForm({ tipo: 'ENTRADA', quantidade: '', motivo: '' })
    setAvisoLeitura('')
    carregar()
  }

  async function criarItem() {
    await estoqueApi.criar({
      ...novoForm,
      quantidade: Number(novoForm.quantidade) || 0,
      quantidadeMinima: Number(novoForm.quantidadeMinima) || 0,
      valorUnitario: novoForm.valorUnitario ? Number(novoForm.valorUnitario) : null,
    })
    setModalCriar(false)
    setNovoForm({ tipo: 'MATERIA_PRIMA_BRUTA', codigo: '', descricao: '', unidade: 'un', quantidade: '', quantidadeMinima: '', valorUnitario: '' })
    setAvisoLeitura('')
    carregar()
  }

  // Encarregado anexa a foto da peça: a IA lê e o sistema busca no estoque
  // inteiro se essa peça já existe. Se existir, só abre a Movimentação
  // (entrada) já preenchida com a quantidade lida — o encarregado confere e
  // confirma. Se não existir, abre o cadastro de Novo Item já preenchido.
  async function lerFotoPeca(file: File) {
    setLendoFoto(true)
    setAvisoLeitura('')
    try {
      const formData = new FormData()
      formData.append('arquivo', file)
      const { data } = await estoqueApi.lerFoto(formData)

      if (data.itemExistente) {
        const item: Estoque = data.itemExistente
        setModalCriar(false)
        setModalMovimentar(item)
        setMovForm({
          tipo: 'ENTRADA',
          quantidade: data.quantidade != null ? String(data.quantidade) : '',
          motivo: 'Entrada via leitura de foto (IA)',
        })
        setAvisoLeitura(`🤖 Essa peça já está no estoque (${item.quantidade} ${item.unidade} atualmente). Confira a quantidade lida antes de confirmar a entrada.`)
      } else {
        setNovoForm((p) => ({
          ...p,
          codigo: data.codigo || p.codigo,
          descricao: data.nome || p.descricao,
          unidade: data.unidade || p.unidade,
          quantidade: data.quantidade != null ? String(data.quantidade) : p.quantidade,
          valorUnitario: data.valor != null ? String(data.valor) : p.valorUnitario,
        }))
        setAvisoLeitura('🤖 Peça não encontrada no estoque — confira os dados e cadastre.')
        setModalCriar(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLendoFoto(false)
    }
  }

  const TIPO_LABEL: Record<string, string> = {
    MATERIA_PRIMA_BRUTA: 'Matéria-Prima Bruta',
    PECA_PRONTA: 'Peça Pronta',
    CONSUMIVEL: 'Consumível',
    EPI: 'EPI',
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Almoxarifado"
        subtitle="Pedidos liberados para o setor e controle de estoque"
        actions={aba === 'estoque' && hasRole('ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO', 'ALMOXARIFE', 'GERENTE_OPERACIONAL') && (
          <button className="btn-primary" onClick={() => { setAvisoLeitura(''); setModalCriar(true) }}>+ Novo Item</button>
        )}
      />

      <div className="flex gap-2">
        <button onClick={() => setAba('pedidos')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${aba === 'pedidos' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          📋 Pedidos
        </button>
        <button onClick={() => setAba('estoque')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${aba === 'estoque' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          📦 Estoque
        </button>
      </div>

      {aba === 'pedidos' && <AlmoxarifadoPedidos />}

      {aba === 'estoque' && (
      <div className="card">
        <div className="flex gap-4 mb-4">
          <input className="input flex-1" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && carregar()} />
          <select className="input w-48" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="MATERIA_PRIMA_BRUTA">Matéria-Prima</option>
            <option value="PECA_PRONTA">Peça Pronta</option>
            <option value="CONSUMIVEL">Consumível</option>
            <option value="EPI">EPI</option>
          </select>
          <button className="btn-secondary" onClick={carregar}>Buscar</button>
        </div>

        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3 font-semibold text-gray-700">Código</th>
                <th className="pb-3 font-semibold text-gray-700">Descrição</th>
                <th className="pb-3 font-semibold text-gray-700">Tipo</th>
                <th className="pb-3 font-semibold text-gray-700">Quantidade</th>
                <th className="pb-3 font-semibold text-gray-700">Mínimo</th>
                <th className="pb-3 font-semibold text-gray-700">Valor unit.</th>
                <th className="pb-3 font-semibold text-gray-700">Localização</th>
                <th className="pb-3 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {itens.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.quantidade <= item.quantidadeMinima ? 'bg-red-50' : ''}`}>
                  <td className="py-3 font-mono text-sm">{item.codigo}</td>
                  <td className="py-3">{item.descricao}</td>
                  <td className="py-3 text-gray-600">{TIPO_LABEL[item.tipo]}</td>
                  <td className="py-3">
                    <span className={`font-semibold ${item.quantidade <= item.quantidadeMinima ? 'text-red-600' : 'text-green-700'}`}>
                      {item.quantidade} {item.unidade}
                    </span>
                    {item.quantidade <= item.quantidadeMinima && <span className="ml-2 text-xs text-red-500">⚠️ Abaixo do mínimo</span>}
                  </td>
                  <td className="py-3 text-gray-600">{item.quantidadeMinima} {item.unidade}</td>
                  <td className="py-3 text-gray-600">{item.valorUnitario != null ? `R$ ${item.valorUnitario.toFixed(2)}` : '-'}</td>
                  <td className="py-3 text-gray-600">{item.localizacao || '-'}</td>
                  <td className="py-3">
                    <button className="text-blue-600 hover:underline text-xs" onClick={() => { setAvisoLeitura(''); setModalMovimentar(item) }}>Movimentar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {modalMovimentar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">Movimentar: {modalMovimentar.descricao}</h2>
            {avisoLeitura && <p className="text-xs text-purple-600 bg-purple-50/50 border border-purple-100 rounded-lg p-2">{avisoLeitura}</p>}
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={movForm.tipo} onChange={(e) => setMovForm((p) => ({ ...p, tipo: e.target.value }))}>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </div>
            <div><label className="label">Quantidade *</label><input className="input" type="number" value={movForm.quantidade} onChange={(e) => setMovForm((p) => ({ ...p, quantidade: e.target.value }))} /></div>
            <div><label className="label">Motivo</label><input className="input" value={movForm.motivo} onChange={(e) => setMovForm((p) => ({ ...p, motivo: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={movimentar}>Confirmar</button>
              <button className="btn-secondary" onClick={() => { setModalMovimentar(null); setAvisoLeitura('') }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalCriar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-lg">Novo Item de Estoque</h2>

            <div className="border border-purple-200 bg-purple-50/50 rounded-lg p-3 space-y-2">
              <label className="label">📷 Ler foto da peça (IA)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="input text-xs"
                disabled={lendoFoto}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) lerFotoPeca(file)
                  e.target.value = ''
                }}
              />
              {lendoFoto && <p className="text-xs text-purple-600">Lendo foto, aguarde...</p>}
              <p className="text-xs text-gray-500">A IA busca no estoque: se a peça já existir, só soma a quantidade; se não existir, preenche os campos abaixo para cadastro. Confira tudo antes de salvar.</p>
            </div>
            {avisoLeitura && <p className="text-xs text-purple-600 bg-purple-50/50 border border-purple-100 rounded-lg p-2">{avisoLeitura}</p>}

            <div>
              <label className="label">Tipo</label>
              <select className="input" value={novoForm.tipo} onChange={(e) => setNovoForm((p) => ({ ...p, tipo: e.target.value }))}>
                <option value="MATERIA_PRIMA_BRUTA">Matéria-Prima Bruta</option>
                <option value="PECA_PRONTA">Peça Pronta</option>
                <option value="CONSUMIVEL">Consumível</option>
                <option value="EPI">EPI</option>
              </select>
            </div>
            <div><label className="label">Código *</label><input className="input" value={novoForm.codigo} onChange={(e) => setNovoForm((p) => ({ ...p, codigo: e.target.value }))} /></div>
            <div><label className="label">Descrição *</label><input className="input" value={novoForm.descricao} onChange={(e) => setNovoForm((p) => ({ ...p, descricao: e.target.value }))} /></div>
            <div><label className="label">Unidade</label><input className="input" value={novoForm.unidade} onChange={(e) => setNovoForm((p) => ({ ...p, unidade: e.target.value }))} /></div>
            <div><label className="label">Quantidade</label><input className="input" type="number" value={novoForm.quantidade} onChange={(e) => setNovoForm((p) => ({ ...p, quantidade: e.target.value }))} /></div>
            <div><label className="label">Qtd. Mínima</label><input className="input" type="number" value={novoForm.quantidadeMinima} onChange={(e) => setNovoForm((p) => ({ ...p, quantidadeMinima: e.target.value }))} /></div>
            <div><label className="label">Valor Unitário (R$)</label><input className="input" type="number" step="0.01" value={novoForm.valorUnitario} onChange={(e) => setNovoForm((p) => ({ ...p, valorUnitario: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={criarItem}>Salvar</button>
              <button className="btn-secondary" onClick={() => { setModalCriar(false); setAvisoLeitura('') }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
