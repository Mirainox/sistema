import { useEffect, useState } from 'react'
import { comprasApi } from '../../api'
import { Compra } from '../../types'
import { formatarData } from '../../utils/formatters'

export default function PainelFiscal() {
  const [comprasRealizadas, setComprasRealizadas] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    comprasApi.listar({ status: 'PEDIDO_REALIZADO' }).then(({ data }) => {
      setComprasRealizadas(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel Fiscal</h1>

      <div className="card">
        <h2 className="font-semibold mb-2 text-blue-700">🧾 Notas Fiscais Previstas</h2>
        <p className="text-sm text-gray-500 mb-4">
          Compras já realizadas. Prepare-se para receber as notas fiscais destes itens.
        </p>

        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          comprasRealizadas.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Nenhuma nota fiscal prevista</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 font-semibold text-gray-700">Produto</th>
                  <th className="pb-3 font-semibold text-gray-700">Fornecedor</th>
                  <th className="pb-3 font-semibold text-gray-700">Qtd</th>
                  <th className="pb-3 font-semibold text-gray-700">Pedido</th>
                  <th className="pb-3 font-semibold text-gray-700">Cliente</th>
                  <th className="pb-3 font-semibold text-gray-700">Previsão Chegada</th>
                  <th className="pb-3 font-semibold text-gray-700">Transportadora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comprasRealizadas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{c.produto}</td>
                    <td className="py-3 text-gray-600">{c.fornecedor || '-'}</td>
                    <td className="py-3">{c.quantidade} {c.unidade}</td>
                    <td className="py-3 text-gray-600">#{c.numeroPedido}</td>
                    <td className="py-3 text-gray-600">{c.nomeCliente} / {c.cidadeCliente}</td>
                    <td className="py-3">{c.previsaoChegada ? formatarData(c.previsaoChegada) : '-'}</td>
                    <td className="py-3 text-gray-600">{c.comprador?.nome || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  )
}
