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

export async function perfil(req: AuthRequest, res: Response) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario!.id },
    select: { id: true, nome: true, email: true, cargo: true, setor: true, role: true, ativo: true, senhaTemporaria: true, senhaAlteradaEm: true },
  })
  return res.json(usuario)
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
