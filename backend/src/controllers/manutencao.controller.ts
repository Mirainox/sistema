import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

export async function listar(req: Request, res: Response) {
  const { status, search } = req.query
  const where: any = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { equipamento: { contains: String(search), mode: 'insensitive' } },
      { problema: { contains: String(search), mode: 'insensitive' } },
      { cliente: { nome: { contains: String(search), mode: 'insensitive' } } },
    ]
  }

  const manutencoes = await prisma.manutencao.findMany({
    where,
    include: {
      cliente: true,
      tecnico: { select: { nome: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(manutencoes)
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params
  const manutencao = await prisma.manutencao.findUnique({
    where: { id },
    include: { cliente: true, tecnico: { select: { nome: true } } },
  })
  if (!manutencao) return res.status(404).json({ erro: 'Manutenção não encontrada' })
  return res.json(manutencao)
}

export async function abrir(req: AuthRequest, res: Response) {
  const data = req.body

  let cliente = await prisma.cliente.findFirst({
    where: { nome: data.nomeCliente },
  })
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: { nome: data.nomeCliente, cidade: data.cidadeCliente || '', estado: data.estadoCliente || '' },
    })
  }

  const manutencao = await prisma.manutencao.create({
    data: {
      clienteId: cliente.id,
      equipamento: data.equipamento,
      problema: data.problema,
      prioridade: data.prioridade || 'NORMAL',
      dataEntregaEquipamento: data.dataEntregaEquipamento ? new Date(data.dataEntregaEquipamento) : undefined,
      garantia: data.garantia || false,
      prazoAtendimento: data.prazoAtendimento ? new Date(data.prazoAtendimento) : undefined,
      tecnicoId: data.tecnicoId,
    },
    include: { cliente: true },
  })

  return res.status(201).json(manutencao)
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params
  const manutencao = await prisma.manutencao.update({ where: { id }, data: req.body })
  return res.json(manutencao)
}

export async function encerrar(req: Request, res: Response) {
  const { id } = req.params
  const { solucao } = req.body
  const manutencao = await prisma.manutencao.update({
    where: { id },
    data: { status: 'CONCLUIDO', solucao },
  })
  return res.json(manutencao)
}
