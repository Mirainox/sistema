import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { osApi, checklistsApi } from '../../api'
import { OS, Setor } from '../../types'
import { formatarData, STATUS_OS_LABEL, STATUS_OS_COR, SETOR_LABEL } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'

const SETORES_PRODUCAO: { setor: Setor; label: string }[] = [
  { setor: 'ALMOXARIFADO_GERAL', label: 'Almoxarifado' },
  { setor: 'PRODUCAO_INOX', label: 'Produção Inox' },
  { setor: 'CALDEIRARIA', label: 'Caldeiraria' },
  { setor: 'USINAGEM', label: 'Usinagem' },
  { setor: 'ELETRICA', label: 'Elétrica' },
  { setor: 'MONTAGEM_AUTOMATIZADA', label: 'Montagem' },
]

export default function DetalheOS() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [os, setOs] = useState<OS | null>(null)
  const [loading, setLoading] = useState(true)
  const [distribuindo, setDistribuindo] = useState(false)
  const [setoresSelecionados, setSetoresSelecionados] = useState<{ setor: string; responsavel: string; recebeuFisico: boolean }[]>([])

  useEffect(() => {
    carregarOS()
  }, [id])

  async function carregarOS() {
    const { data } = await osApi.buscar(id!)
    setOs(data)
    setLoading(false)
  }

  async function distribuir() {
    if (setoresSelecionados.length === 0) return alert('Selecione ao menos um setor')
    await osApi.distribuir(id!, setoresSelecionados)
    setDistribuindo(false)
    carregarOS()
  }

  async function atualizarStatus(status: string) {
    await osApi.atualizarStatus(id!, status)
    carregarOS()
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Carregando...</div>
  if (!os) return <div className="text-center py-8 text-red-500">O.S. não encontrada</div>

  const podeDistribuir = hasRole('GERENTE_OPERACIONAL', 'ADMIN')
  const podeAtualizarStatus = hasRole('GERENTE_OPERACIONAL', 'ADMIN', 'PRODUCAO', 'ALMOXARIFE')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">O.S. #{os.numero}</h1>
          <p className="text-gray-500">Pedido #{os.pedido.numero} | Criada em {formatarData(os.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_OS_COR[os.status]}`}>{STATUS_OS_LABEL[os.status]}</span>
          <button onClick={() => navigate('/os')} className="btn-secondary">← Voltar</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Identificação Obrigatória</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Nº Pedido:</span> <strong>#{os.pedido.numero}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Cliente:</span> <strong>{os.pedido.cliente.nome}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Cidade:</span> <strong>{os.pedido.cliente.cidade}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Equipamento:</span> <strong>{os.pedido.equipamento}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Prazo:</span> <strong>{formatarData(os.pedido.prazoEntrega)}</strong></div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Status da Distribuição</h2>
          <div className="space-y-2">
            {os.setoresOS.length === 0 ? (
              <p className="text-sm text-gray-500">Ainda não distribuída</p>
            ) : (
              os.setoresOS.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{SETOR_LABEL[s.setor] || s.setor}</span>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.recebeuFisico ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.recebeuFisico ? '✓ Físico' : '⬜ Físico'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.recebeuVirtual ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.recebeuVirtual ? '✓ Virtual' : '⬜ Virtual'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {podeDistribuir && os.status === 'GERADA' && (
        <div className="card">
          <h2 className="font-semibold mb-4">📋 Distribuir O.S. para Setores</h2>
          {!distribuindo ? (
            <button className="btn-primary" onClick={() => setDistribuindo(true)}>Iniciar Distribuição</button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Selecione os setores que receberão esta O.S. e indique se já receberam fisicamente:</p>
              {SETORES_PRODUCAO.map((s) => {
                const idx = setoresSelecionados.findIndex((x) => x.setor === s.setor)
                const selecionado = idx >= 0

                return (
                  <div key={s.setor} className="flex items-center gap-4 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSetoresSelecionados((prev) => [...prev, { setor: s.setor, responsavel: s.label, recebeuFisico: false }])
                        } else {
                          setSetoresSelecionados((prev) => prev.filter((x) => x.setor !== s.setor))
                        }
                      }}
                    />
                    <span className="font-medium flex-1">{s.label}</span>
                    {selecionado && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={setoresSelecionados[idx]?.recebeuFisico}
                          onChange={(e) => {
                            setSetoresSelecionados((prev) => prev.map((x, i) => i === idx ? { ...x, recebeuFisico: e.target.checked } : x))
                          }}
                        />
                        Recebeu fisicamente
                      </label>
                    )}
                  </div>
                )
              })}
              <div className="flex gap-2">
                <button className="btn-primary" onClick={distribuir}>Confirmar Distribuição</button>
                <button className="btn-secondary" onClick={() => setDistribuindo(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {podeAtualizarStatus && os.status !== 'GERADA' && os.status !== 'CONCLUIDA' && os.status !== 'EXPEDIDA' && (
        <div className="card">
          <h2 className="font-semibold mb-3">Atualizar Status da O.S.</h2>
          <div className="flex flex-wrap gap-2">
            {['EM_ANDAMENTO', 'AGUARDANDO_PECAS', 'EM_TESTE', 'CONCLUIDA'].map((s) => (
              <button key={s} className="btn-secondary text-sm" onClick={() => atualizarStatus(s)}>
                → {STATUS_OS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
