import { useState } from 'react'
import { checklistsApi, fotosApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SETOR_LABEL } from '../../utils/formatters'
import { Setor } from '../../types'
import FotoInput from '../../components/FotoInput'

const ITENS_ORGANIZACAO = [
  'Lâmpadas apagadas', 'Ferramentas levantadas', 'Ferramentas guardadas',
  'Materiais protegidos contra risco de enchente', 'Máquinas de solda desligadas',
  'Ar comprimido fechado', 'Gases fechados', 'Botijas de gás fechadas', 'Argônio fechado',
  'Abrasivos guardados', 'Abrasivos levantados do chão', 'Setor limpo', 'Área organizada',
  'Risco aparente registrado (se houver)',
]

const ITENS_TORNO = [
  'Limpeza do torno', 'Lubrificação do torno', 'Organização da área',
  'Ferramentas guardadas', 'Cavacos removidos', 'Máquina em condição adequada',
  'Setor seguro para o final de semana',
]

export default function ChecklistSexta() {
  const { usuario } = useAuth()
  const [tipo, setTipo] = useState<'ORGANIZACAO_SEXTA' | 'TORNO_SEXTA'>('ORGANIZACAO_SEXTA')
  const [respostas, setRespostas] = useState<Record<string, boolean>>({})
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const itens = tipo === 'ORGANIZACAO_SEXTA' ? ITENS_ORGANIZACAO : ITENS_TORNO
  const todosMarcados = itens.every((item) => respostas[item] !== undefined)

  async function enviar() {
    setEnviando(true)
    try {
      const checklist = await checklistsApi.criar({
        tipo,
        setor: usuario?.setor,
      })

      const respostasData = itens.map((item, idx) => ({
        itemId: checklist.data.itens[idx]?.id,
        resposta: respostas[item] || false,
        observacao: '',
      }))

      await checklistsApi.responder(checklist.data.id, respostasData)

      if (fotoFile) {
        const form = new FormData()
        form.append('foto', fotoFile)
        form.append('setor', usuario?.setor || '')
        form.append('checklistId', checklist.data.id)
        form.append('descricao', `Checklist de ${tipo === 'ORGANIZACAO_SEXTA' ? 'organização' : 'torno'} - sexta-feira`)
        await fotosApi.upload(form)
      }

      setConcluido(true)
    } finally {
      setEnviando(false)
    }
  }

  if (concluido) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-green-700">Checklist concluído!</h1>
          <p className="text-gray-600">O checklist de sexta-feira foi registrado com sucesso.</p>
          <button className="btn-primary" onClick={() => { setConcluido(false); setRespostas({}); setFotoFile(null) }}>
            Fazer novo checklist
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Checklist de Sexta-feira</h1>
        <p className="text-gray-500">{SETOR_LABEL[usuario?.setor as Setor] || usuario?.setor} - {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {usuario?.setor === 'USINAGEM' && (
        <div className="flex gap-2">
          <button className={`px-4 py-2 rounded-lg font-medium text-sm ${tipo === 'ORGANIZACAO_SEXTA' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTipo('ORGANIZACAO_SEXTA')}>
            Organização Geral (16h)
          </button>
          <button className={`px-4 py-2 rounded-lg font-medium text-sm ${tipo === 'TORNO_SEXTA' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTipo('TORNO_SEXTA')}>
            Tornos (16h20)
          </button>
        </div>
      )}

      <div className="card space-y-3">
        <h2 className="font-semibold">{tipo === 'ORGANIZACAO_SEXTA' ? '🧹 Checklist de Organização e Segurança' : '⚙️ Checklist dos Tornos'}</h2>
        {itens.map((item) => (
          <label key={item} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100">
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-green-700 cursor-pointer">
                <input type="radio" name={item} checked={respostas[item] === true} onChange={() => setRespostas((p) => ({ ...p, [item]: true }))} /> OK
              </label>
              <label className="flex items-center gap-1 text-red-600 cursor-pointer">
                <input type="radio" name={item} checked={respostas[item] === false} onChange={() => setRespostas((p) => ({ ...p, [item]: false }))} /> Não OK
              </label>
            </div>
            <span className={`text-sm flex-1 ${respostas[item] === true ? 'text-green-700' : respostas[item] === false ? 'text-red-600' : 'text-gray-700'}`}>{item}</span>
          </label>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">📸 Foto da Área (Obrigatório)</h2>
        <FotoInput value={fotoFile} onChange={setFotoFile} />
      </div>

      <button className="btn-primary w-full" onClick={enviar} disabled={enviando || !todosMarcados || !fotoFile}>
        {enviando ? 'Enviando...' : '✅ Concluir Checklist de Sexta'}
      </button>

      {(!todosMarcados || !fotoFile) && (
        <p className="text-center text-sm text-amber-600">⚠️ Responda todos os itens e anexe uma foto para concluir.</p>
      )}
    </div>
  )
}
