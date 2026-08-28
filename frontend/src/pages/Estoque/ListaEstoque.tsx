import { useEffect, useState } from 'react'
import { estoqueApi } from '../../api'
import { Estoque } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

export default function ListaEstoque() {
  const { hasRole } = useAuth()
  const [itens, setItens] = useState<Estoque[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [search, setSearch] = useState('')
  const [modalMovimentar, setModalMovimentar] = useState<Estoque | null>(null)
  const [modalCriar, setModalCriar] = useState(false)
  const [movForm, setMovForm] = useState({ tipo: 'ENTRADA', quantidade: '', motivo: '' })
  const [novoForm, setNovoForm] = useState({ tipo: 'MATERIA_PRIMA_BRUTA', codigo: '', descricao: '', unidade: 'un', quantidadeMinima: '' })

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
    carregar()
  }

  async function criarItem() {
    await estoqueApi.criar({ ...novoForm, quantidadeMinima: Number(novoForm.quantidadeMinima) })
    setModalCriar(false)
    setNovoForm({ tipo: 'MATERIA_PRIMA_BRUTA', codigo: '', descricao: '', unidade: 'un', quantidadeMinima: '' })
    carregar()
  }

  const TIPO_LABEL: Record<string, string> = {
    MATERIA_PRIMA_BRUTA: 'Matéria-Prima Bruta',
    PECA_PRONTA: 'Peça Pronta',
    CONSUMIVEL: 'Consumível',
    EPI: 'EPI',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Almoxarifado</h1>
        {hasRole('ADMIN', 'ALMOXARIFE', 'GERENTE_OPERACIONAL') && (
          <button className="btn-primary" onClick={() => setModalCriar(true)}>+ Novo Item</button>
        )}
      </div>

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
                  <td className="py-3 text-gray-600">{item.localizacao || '-'}</td>
                  <td className="py-3">
                    <button className="text-blue-600 hover:underline text-xs" onClick={() => setModalMovimentar(item)}>Movimentar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMovimentar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">Movimentar: {modalMovimentar.descricao}</h2>
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
              <button className="btn-secondary" onClick={() => setModalMovimentar(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalCriar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">Novo Item de Estoque</h2>
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
            <div><label className="label">Qtd. Mínima</label><input className="input" type="number" value={novoForm.quantidadeMinima} onChange={(e) => setNovoForm((p) => ({ ...p, quantidadeMinima: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={criarItem}>Salvar</button>
              <button className="btn-secondary" onClick={() => setModalCriar(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
