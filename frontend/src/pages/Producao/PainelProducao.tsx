import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { osApi, fotosApi, checklistsApi } from '../../api'
import { OS } from '../../types'
import { formatarData, STATUS_OS_COR, STATUS_OS_LABEL } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import FotoInput from '../../components/FotoInput'

const SETORES_PRODUCAO = [
  { setor: 'PRODUCAO_INOX', label: 'Produção Inox', responsavel: 'Israel' },
  { setor: 'CALDEIRARIA', label: 'Caldeiraria', responsavel: 'Gabriel' },
  { setor: 'USINAGEM', label: 'Usinagem', responsavel: 'Hernani Mariano' },
  { setor: 'ELETRICA', label: 'Elétrica', responsavel: 'Moisés' },
  { setor: 'MONTAGEM_AUTOMATIZADA', label: 'Montagem', responsavel: 'Ricardo' },
]

export default function PainelProducao() {
  const { usuario } = useAuth()
  const [osList, setOsList] = useState<OS[]>([])
  const [loading, setLoading] = useState(true)
  const [fotoModal, setFotoModal] = useState<OS | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoDescricao, setFotoDescricao] = useState('')

  useEffect(() => {
    osApi.listar({ status: 'EM_ANDAMENTO' }).then(({ data }) => {
      setOsList(data)
      setLoading(false)
    })
  }, [])

  async function enviarFoto() {
    if (!fotoFile || !fotoModal) return
    const form = new FormData()
    form.append('foto', fotoFile)
    form.append('osId', fotoModal.id)
    form.append('setor', usuario?.setor || 'PRODUCAO_INOX')
    form.append('descricao', fotoDescricao)
    form.append('numeroPedido', fotoModal.pedido.numero)
    form.append('nomeCliente', fotoModal.pedido.cliente.nome)
    form.append('cidadeCliente', fotoModal.pedido.cliente.cidade)
    await fotosApi.upload(form)
    setFotoModal(null)
    setFotoFile(null)
    setFotoDescricao('')
    alert('Foto enviada com sucesso!')
  }

  const diaDaSemana = new Date().getDay()
  const horaAtual = new Date().getHours()
  const precisaFoto = (diaDaSemana === 1 || diaDaSemana === 3) && horaAtual >= 17
  const precisaOrganizacao = diaDaSemana === 5 && horaAtual >= 16

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel de Produção</h1>

      {precisaFoto && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <h2 className="font-semibold text-amber-800 text-lg">📸 Foto de Produção Pendente</h2>
          <p className="text-amber-700 text-sm mt-1">Hoje é dia de registrar foto do andamento da produção (17h). Clique em "Enviar Foto" nas O.S. abaixo.</p>
        </div>
      )}

      {precisaOrganizacao && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <h2 className="font-semibold text-red-800 text-lg">🧹 Checklist de Organização - Sexta-feira</h2>
          <p className="text-red-700 text-sm mt-1">Registre a organização do setor às 16h. Foto obrigatória + checklist de segurança.</p>
          <Link to="/checklists/sexta" className="btn-danger mt-3 inline-block text-sm">Abrir Checklist de Sexta</Link>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">Setores de Produção</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {SETORES_PRODUCAO.map((s) => (
            <div key={s.setor} className="bg-gray-50 border rounded-lg p-3 text-center">
              <p className="font-medium text-sm">{s.label}</p>
              <p className="text-xs text-gray-500 mt-1">{s.responsavel}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">O.S. em Andamento</h2>
        {loading ? <div className="text-center py-8 text-gray-500">Carregando...</div> : (
          <div className="space-y-3">
            {osList.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Nenhuma O.S. em andamento</p>
            ) : (
              osList.map((os) => (
                <div key={os.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-blue-600">#{os.numero}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_OS_COR[os.status]}`}>{STATUS_OS_LABEL[os.status]}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><span className="text-gray-500">Pedido:</span> <strong>#{os.pedido.numero}</strong></p>
                        <p><span className="text-gray-500">Cliente:</span> <strong>{os.pedido.cliente.nome}</strong> - {os.pedido.cliente.cidade}</p>
                        <p><span className="text-gray-500">Equipamento:</span> {os.pedido.equipamento} {os.pedido.modelo}</p>
                        <p><span className="text-gray-500">Prazo:</span> {formatarData(os.pedido.prazoEntrega)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="btn-primary text-xs" onClick={() => setFotoModal(os)}>📸 Enviar Foto</button>
                      <Link to={`/os/${os.id}`} className="btn-secondary text-xs text-center">Ver O.S.</Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {fotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">📸 Enviar Foto de Produção</h2>
            <p className="text-sm text-gray-600">
              O.S. #{fotoModal.numero} - {fotoModal.pedido.cliente.nome} / {fotoModal.pedido.cliente.cidade}
            </p>
            <div>
              <label className="label">Foto *</label>
              <FotoInput value={fotoFile} onChange={setFotoFile} />
            </div>
            <div>
              <label className="label">Descrição</label>
              <input className="input" value={fotoDescricao} onChange={(e) => setFotoDescricao(e.target.value)} placeholder="Descreva o andamento..." />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={enviarFoto} disabled={!fotoFile}>Enviar</button>
              <button className="btn-secondary" onClick={() => setFotoModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
