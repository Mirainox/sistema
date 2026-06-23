import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { checklistsApi } from '../../api'
import { formatarDataHora } from '../../utils/formatters'

const TIPO_LABEL: Record<string, string> = {
  COMERCIAL_VENDEDOR: 'Checklist Comercial',
  DISTRIBUICAO_OS: 'Distribuição O.S.',
  FOTO_PRODUCAO: 'Foto Produção',
  ORGANIZACAO_SEXTA: 'Organização Sexta',
  TORNO_SEXTA: 'Tornos Sexta',
  USINAGEM_PECA: 'Usinagem - Peça',
  EPI: 'Entrega de EPI',
  COMPRA_REALIZADA: 'Compra Realizada',
}

export default function ListaChecklists() {
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checklistsApi.listar().then(({ data }) => { setChecklists(data); setLoading(false) })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Checklists</h1>
        <Link to="/checklists/sexta" className="btn-primary">+ Checklist de Sexta</Link>
      </div>

      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          <div className="space-y-2">
            {checklists.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Nenhum checklist registrado</p>
            ) : (
              checklists.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div>
                    <span className="font-medium">{TIPO_LABEL[c.tipo] || c.tipo}</span>
                    <p className="text-sm text-gray-500">{c.responsavel} — {formatarDataHora(c.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${c.concluido ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.concluido ? '✅ Concluído' : '⏳ Pendente'}
                    </span>
                    <span className="text-xs text-gray-500">{c.itens?.length || 0} itens</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
