import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

export async function upload(req: AuthRequest, res: Response) {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' })

  const { osId, checklistId, setor, descricao, numeroPedido, nomeCliente, cidadeCliente } = req.body
  const url = `/uploads/${req.file.filename}`

  const foto = await prisma.foto.create({
    data: {
      url,
      setor,
      descricao,
      numeroPedido,
      nomeCliente,
      cidadeCliente,
      usuarioId: req.usuario!.id,
      osId: osId || undefined,
      checklistId: checklistId || undefined,
    },
  })

  return res.status(201).json(foto)
}

export async function listarPorOS(req: Request, res: Response) {
  const { osId } = req.params
  const fotos = await prisma.foto.findMany({
    where: { osId },
    include: { usuario: { select: { nome: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(fotos)
}

export async function listarPorSetor(req: Request, res: Response) {
  const { setor } = req.params
  const fotos = await prisma.foto.findMany({
    where: { setor: setor as any },
    include: { usuario: { select: { nome: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return res.json(fotos)
}
