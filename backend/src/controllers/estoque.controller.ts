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

// Busca rápida por uma peça já cadastrada: primeiro pelo código lido (mais
// confiável), depois pelo nome — exato e, por último, parcial.
async function buscarItemExistente(codigo: string | null, nome: string | null) {
  if (codigo) {
    const porCodigo = await prisma.estoque.findFirst({ where: { codigo: { equals: codigo, mode: 'insensitive' } } })
    if (porCodigo) return porCodigo
  }
  if (nome) {
    const porNomeExato = await prisma.estoque.findFirst({ where: { descricao: { equals: nome, mode: 'insensitive' } } })
    if (porNomeExato) return porNomeExato
    const porNomeParcial = await prisma.estoque.findFirst({ where: { descricao: { contains: nome, mode: 'insensitive' } } })
    if (porNomeParcial) return porNomeParcial
  }
  return null
}

// Almoxarifado (Carlos, Matheus): tira/anexa uma foto da peça e a IA sugere
// código, nome, quantidade, valor e unidade. Antes de devolver, fazemos uma
// busca rápida no estoque: se a peça já existir, o funcionário só confirma a
// entrada da quantidade lida; se não existir, ele confere e cadastra do zero.
export async function lerFoto(req: AuthRequest, res: Response) {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' })
  const dados = await lerFotoPeca(req.file)
  if (!dados) return res.json({ codigo: null, nome: null, tipo: null, quantidade: null, valor: null, unidade: null, localizacao: null, itemExistente: null })
  const itemExistente = await buscarItemExistente(dados.codigo, dados.nome)
  return res.json({ ...dados, itemExistente })
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
