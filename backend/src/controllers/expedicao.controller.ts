import { Request, Response } from 'express'
import prisma from '../config/database'

export async function listar(req: Request, res: Response) {
  const { status } = req.query
  const expedicoes = await prisma.expedicao.findMany({
    where: status ? { status: String(status) } : undefined,
    orderBy: { dataPrevisao: 'asc' },
  })
  return res.json(expedicoes)
}

export async function criar(req: Request, res: Response) {
  const exp = await prisma.expedicao.create({ data: req.body })
  return res.status(201).json(exp)
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params
  const exp = await prisma.expedicao.update({ where: { id }, data: req.body })
  return res.json(exp)
}

export async function sugerirRota(req: Request, res: Response) {
  const { estado, data } = req.query
  const pedidos = await prisma.expedicao.findMany({
    where: {
      status: 'AGUARDANDO',
      estado: estado ? String(estado) : undefined,
      dataPrevisao: data ? { lte: new Date(String(data)) } : undefined,
    },
    orderBy: [{ estado: 'asc' }, { cidadeCliente: 'asc' }],
  })
  return res.json(pedidos)
}
