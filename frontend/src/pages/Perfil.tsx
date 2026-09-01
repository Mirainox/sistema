import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import SenhaInput from '../components/SenhaInput'
import { SETOR_LABEL, ROLE_LABEL } from '../utils/formatters'

export default function Perfil() {
  const { usuario, aplicarPerfil } = useAuth()
  const navigate = useNavigate()
  const fotoRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(usuario?.nome || '')
  const [email, setEmail] = useState(usuario?.email || '')
  const [telefone, setTelefone] = useState(usuario?.telefone || '')
  const [novaFoto, setNovaFoto] = useState<File | null>(null)
  const [previewFoto, setPreviewFoto] = useState<string | null>(null)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState('')
  const [okSenha, setOkSenha] = useState('')

  const fotoAtual = previewFoto || usuario?.fotoPerfil || null

  function escolherFoto(file: File | null) {
    setNovaFoto(file)
    setPreviewFoto(file ? URL.createObjectURL(file) : null)
  }

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setOk('')
    setSalvando(true)
    try {
      const fd = new FormData()
      fd.append('nome', nome)
      fd.append('email', email)
      fd.append('telefone', telefone)
      if (novaFoto) fd.append('fotoPerfil', novaFoto)
      const { data } = await authApi.atualizarPerfil(fd)
      aplicarPerfil(data.usuario, data.token)
      setNovaFoto(null)
      setPreviewFoto(null)
      setOk('Perfil atualizado com sucesso.')
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Não foi possível salvar o perfil.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault()
    setErroSenha('')
    setOkSenha('')
    if (novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não conferem.')
      return
    }
    setSalvandoSenha(true)
    try {
      await authApi.alterarSenha(senhaAtual, novaSenha)
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setOkSenha('Senha alterada com sucesso.')
    } catch (err: any) {
      setErroSenha(err.response?.data?.erro || 'Não foi possível alterar a senha.')
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <button onClick={() => navigate(-1)} className="btn-secondary">← Voltar</button>
      </div>

      <form onSubmit={salvarPerfil} className="card space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {fotoAtual
              ? <img src={fotoAtual} alt="Foto de perfil" className="w-full h-full object-cover" />
              : (usuario?.nome?.charAt(0) || '?')}
          </div>
          <div>
            <button type="button" className="btn-secondary" onClick={() => fotoRef.current?.click()}>
              📷 Trocar foto
            </button>
            {novaFoto && <p className="text-xs text-green-600 mt-1">✓ {novaFoto.name}</p>}
            <p className="text-xs text-gray-400 mt-1">JPG ou PNG, até 10 MB.</p>
          </div>
          <input
            ref={fotoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => escolherFoto(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className="label">Nome</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>

        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label className="label">Telefone</label>
          <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-3">
          <div>
            <span className="text-gray-500 block text-xs">Cargo</span>
            {usuario?.cargo || '-'}
          </div>
          <div>
            <span className="text-gray-500 block text-xs">Setor</span>
            {usuario ? SETOR_LABEL[usuario.setor] || usuario.setor : '-'}
          </div>
          <div>
            <span className="text-gray-500 block text-xs">Função no sistema</span>
            {usuario ? ROLE_LABEL[usuario.role] || usuario.role : '-'}
          </div>
        </div>
        <p className="text-xs text-gray-400 -mt-2">Cargo, setor e função só podem ser alterados pelo administrador.</p>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>}
        {ok && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{ok}</div>}

        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      <form onSubmit={salvarSenha} className="card space-y-4">
        <h2 className="font-semibold">Alterar senha</h2>
        <div>
          <label className="label">Senha atual</label>
          <SenhaInput value={senhaAtual} onChange={setSenhaAtual} required />
        </div>
        <div>
          <label className="label">Nova senha</label>
          <SenhaInput value={novaSenha} onChange={setNovaSenha} placeholder="Mínimo 6 caracteres" required />
        </div>
        <div>
          <label className="label">Confirmar nova senha</label>
          <SenhaInput value={confirmarSenha} onChange={setConfirmarSenha} required />
        </div>

        {erroSenha && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erroSenha}</div>}
        {okSenha && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{okSenha}</div>}

        <button type="submit" className="btn-primary" disabled={salvandoSenha}>
          {salvandoSenha ? 'Salvando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  )
}
