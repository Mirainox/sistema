import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/database'
import { signToken } from '../utils/jwt'
import { AuthRequest } from '../middleware/auth'

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' })

  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario || !usuario.ativo) return res.status(401).json({ erro: 'Credenciais inválidas' })

  const valido = await bcrypt.compare(senha, usuario.senha)
  if (!valido) return res.status(401).json({ erro: 'Credenciais inválidas' })

  const token = signToken({ id: usuario.id, role: usuario.role, setor: usuario.setor, nome: usuario.nome })
  const { senha: _, ...dados } = usuario
  return res.json({ token, usuario: dados })
}

const PERFIL_SELECT = {
  id: true, nome: true, email: true, telefone: true, fotoPerfil: true,
  cargo: true, setor: true, role: true, ativo: true, senhaTemporaria: true, senhaAlteradaEm: true,
} as const

export async function perfil(req: AuthRequest, res: Response) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario!.id },
    select: PERFIL_SELECT,
  })
  return res.json(usuario)
}

// O próprio funcionário edita seus dados: nome, email, telefone e foto de perfil.
// Cargo, setor e função (role) só o administrador altera.
export async function atualizarPerfil(req: AuthRequest, res: Response) {
  const { nome, email, telefone } = req.body
  const arquivo = req.file as Express.Multer.File | undefined

  const data: Record<string, unknown> = {}

  if (nome !== undefined) {
    if (!String(nome).trim()) return res.status(400).json({ erro: 'O nome não pode ficar em branco.' })
    data.nome = String(nome).trim()
  }

  if (email !== undefined) {
    const novoEmail = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) {
      return res.status(400).json({ erro: 'Email inválido.' })
    }
    const jaUsado = await prisma.usuario.findFirst({
      where: { email: novoEmail, NOT: { id: req.usuario!.id } },
      select: { id: true },
    })
    if (jaUsado) return res.status(400).json({ erro: 'Este email já está em uso por outro funcionário.' })
    data.email = novoEmail
  }

  if (telefone !== undefined) data.telefone = String(telefone).trim() || null
  if (arquivo) data.fotoPerfil = `/uploads/${arquivo.filename}`

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ erro: 'Nada para atualizar.' })
  }

  const usuario = await prisma.usuario.update({
    where: { id: req.usuario!.id },
    data,
    select: PERFIL_SELECT,
  })

  // Reemite o token porque o nome vai embutido nele (usado em notificações).
  const token = signToken({ id: usuario.id, role: usuario.role, setor: usuario.setor, nome: usuario.nome })
  return res.json({ usuario, token })
}

export async function alterarSenha(req: AuthRequest, res: Response) {
  const { senhaAtual, novaSenha } = req.body
  if (!novaSenha || novaSenha.length < 6) {
    return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 6 caracteres' })
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } })
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' })

  const valido = await bcrypt.compare(senhaAtual, usuario.senha)
  if (!valido) return res.status(401).json({ erro: 'Senha atual incorreta' })

  const hash = await bcrypt.hash(novaSenha, 10)
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senha: hash, senhaTemporaria: false, senhaAlteradaEm: new Date() },
  })
  return res.json({ mensagem: 'Senha alterada com sucesso' })
}
