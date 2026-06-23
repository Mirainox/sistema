import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { notificarPorRole } from '../services/notificacao.service'

function gerarNumeroOS() {
  return `OS-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
}

export async function listar(req: Request, res: Response) {
  const { status, search } = req.query
  const where: any = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { numero: { contains: String(search), mode: 'insensitive' } },
      { pedido: { numero: { contains: String(search), mode: 'insensitive' } } },
      { pedido: { cliente: { nome: { contains: String(search), mode: 'insensitive' } } } },
    ]
  }

  const os = await prisma.oS.findMany({
    where,
    include: {
      pedido: { include: { cliente: true } },
      distribuidor: { select: { nome: true } },
      setoresOS: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(os)
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params
  const os = await prisma.oS.findUnique({
    where: { id },
    include: {
      pedido: { include: { cliente: true, vendedor: { select: { nome: true } } } },
      distribuidor: { select: { nome: true } },
      setoresOS: true,
      checklists: { include: { itens: true, respostas: true } },
      fotos: { include: { usuario: { select: { nome: true } } } },
      compras: true,
    },
  })
  if (!os) return res.status(404).json({ erro: 'O.S. não encontrada' })
  return res.json(os)
}

export async function gerar(req: AuthRequest, res: Response) {
  const { pedidoId } = req.body
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { cliente: true },
  })
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' })

  const numero = gerarNumeroOS()
  const os = await prisma.oS.create({
    data: { numero, pedidoId, distribuidorId: req.usuario!.id },
    include: { pedido: { include: { cliente: true } } },
  })

  await prisma.pedido.update({ where: { id: pedidoId }, data: { status: 'EM_PRODUCAO' } })

  await notificarPorRole(
    ['GERENTE_OPERACIONAL', 'GESTOR_PRODUCAO', 'ALMOXARIFE'],
    `O.S. #${numero} gerada`,
    `Pedido #${pedido.numero} - ${pedido.cliente.nome} / ${pedido.cliente.cidade} | ${pedido.equipamento}`,
    'OS_GERADA',
    { pedidoId: pedido.id, osId: os.id }
  )

  return res.status(201).json(os)
}

export async function distribuir(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { setores } = req.body

  const os = await prisma.oS.findUnique({
    where: { id },
    include: { pedido: { include: { cliente: true } } },
  })
  if (!os) return res.status(404).json({ erro: 'O.S. não encontrada' })

  await prisma.setorOS.createMany({
    data: setores.map((s: any) => ({
      osId: id,
      setor: s.setor,
      responsavel: s.responsavel,
      recebeuFisico: s.recebeuFisico || false,
    })),
  })

  const atualizada = await prisma.oS.update({
    where: { id },
    data: {
      status: 'DISTRIBUIDA_FISICAMENTE',
      dataEntregaFisica: new Date(),
      distribuidorId: req.usuario!.id,
    },
    include: { setoresOS: true },
  })

  await notificarPorRole(
    ['PRODUCAO', 'ALMOXARIFE', 'GESTOR_PRODUCAO'],
    `O.S. #${os.numero} distribuída`,
    `${os.pedido.cliente.nome} / ${os.pedido.cliente.cidade} | ${os.pedido.equipamento} - Verifique seu setor`,
    'OS_DISTRIBUIDA',
    { osId: id }
  )

  return res.json(atualizada)
}

export async function confirmarRecebimento(req: Request, res: Response) {
  const { id } = req.params
  const { setorOSId, pessoaRecebeu } = req.body

  await prisma.setorOS.update({
    where: { id: setorOSId },
    data: { recebeuVirtual: true, dataRecebimento: new Date(), pessoaRecebeu },
  })

  return res.json({ mensagem: 'Recebimento confirmado' })
}

export async function atualizarStatus(req: Request, res: Response) {
  const { id } = req.params
  const { status } = req.body
  const os = await prisma.oS.update({ where: { id }, data: { status } })
  return res.json(os)
}
