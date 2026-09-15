import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { lerFotoPeca } from '../services/ia.service'

export async function listar(req: Request, res: Response) {
  const { tipo, search } = req.query
  const where: any = {}
  if (tipo) where.tipo = tipo
  if (search) {
    where.OR = [
      { codigo: { contains: String(search), mode: 'insensitive' } },
      { descricao: { contains: String(search), mode: 'insensitive' } },
    ]
  }

  const itens = await prisma.estoque.findMany({ where, orderBy: { descricao: 'asc' } })
  return res.json(itens)
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params
  const item = await prisma.estoque.findUnique({
    where: { id },
    include: { movimentacoes: { orderBy: { createdAt: 'desc' }, take: 20 } },
  })
  if (!item) return res.status(404).json({ erro: 'Item não encontrado' })
  return res.json(item)
}

export async function criar(req: Request, res: Response) {
  const item = await prisma.estoque.create({ data: req.body })
  return res.status(201).json(item)
}

// Almoxarifado (Carlos, Matheus): tira/anexa uma foto da peça e a IA sugere
// código, nome, quantidade, valor e unidade — só preenche o formulário, quem
// confere e salva é o funcionário.
export async function lerFoto(req: AuthRequest, res: Response) {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' })
  const dados = await lerFotoPeca(req.file)
  if (!dados) return res.json({ codigo: null, nome: null, quantidade: null, valor: null, unidade: null })
  return res.json(dados)
}

export async function movimentar(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { tipo, quantidade, motivo, numeroPedido, nomeCliente } = req.body

  const item = await prisma.estoque.findUnique({ where: { id } })
  if (!item) return res.status(404).json({ erro: 'Item não encontrado' })

  const novaQtd = tipo === 'ENTRADA'
    ? item.quantidade + Number(quantidade)
    : item.quantidade - Number(quantidade)

  if (novaQtd < 0) return res.status(400).json({ erro: 'Quantidade insuficiente em estoque' })

  const [atualizado] = await Promise.all([
    prisma.estoque.update({ where: { id }, data: { quantidade: novaQtd } }),
    prisma.movimentacaoEstoque.create({
      data: { estoqueId: id, tipo, quantidade: Number(quantidade), motivo, numeroPedido, nomeCliente, usuarioId: req.usuario!.id },
    }),
  ])

  return res.json(atualizado)
}

export async function abaixoMinimo(req: Request, res: Response) {
  const todos = await prisma.estoque.findMany()
  const itens = todos.filter((i) => i.quantidade < i.quantidadeMinima)
  return res.json(itens)
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params
  const item = await prisma.estoque.update({ where: { id }, data: req.body })
  return res.json(item)
}
