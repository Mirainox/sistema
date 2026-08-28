import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '../config/database'

export async function listar(req: Request, res: Response) {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, cargo: true, setor: true, role: true, ativo: true, createdAt: true, senhaTemporaria: true, senhaAlteradaEm: true },
    orderBy: { nome: 'asc' },
  })
  return res.json(usuarios)
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, cargo: true, setor: true, role: true, ativo: true, senhaTemporaria: true, senhaAlteradaEm: true },
  })
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' })
  return res.json(usuario)
}

export async function criar(req: Request, res: Response) {
  const { nome, email, senha, cargo, setor, role } = req.body
  const existe = await prisma.usuario.findUnique({ where: { email } })
  if (existe) return res.status(400).json({ erro: 'Email já cadastrado' })

  const hash = await bcrypt.hash(senha, 10)
  const usuario = await prisma.usuario.create({
    data: { nome, email, senha: hash, cargo, setor, role },
    select: { id: true, nome: true, email: true, cargo: true, setor: true, role: true },
  })
  return res.status(201).json(usuario)
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params
  const { nome, cargo, setor, role, ativo } = req.body
  const usuario = await prisma.usuario.update({
    where: { id },
    data: { nome, cargo, setor, role, ativo },
    select: { id: true, nome: true, email: true, cargo: true, setor: true, role: true, ativo: true },
  })
  return res.json(usuario)
}

export async function desativar(req: Request, res: Response) {
  const { id } = req.params
  await prisma.usuario.update({ where: { id }, data: { ativo: false } })
  return res.json({ mensagem: 'Usuário desativado' })
}

export async function resetarSenha(req: Request, res: Response) {
  const { id } = req.params
  const senhaTemp = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
  const hash = await bcrypt.hash(senhaTemp, 10)

  const usuario = await prisma.usuario.update({
    where: { id },
    data: { senha: hash, senhaTemporaria: true, senhaAlteradaEm: null },
    select: { id: true, nome: true, email: true },
  })

  return res.json({ usuario, senhaTemporaria: senhaTemp })
}
