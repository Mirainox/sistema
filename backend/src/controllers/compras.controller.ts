import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { criarNotificacao, notificarPorRole } from '../services/notificacao.service'

export async function listar(req: Request, res: Response) {
  const { status, search } = req.query
  const where: any = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { produto: { contains: String(search), mode: 'insensitive' } },
      { nomeCliente: { contains: String(search), mode: 'insensitive' } },
      { numeroPedido: { contains: String(search), mode: 'insensitive' } },
    ]
  }

  const compras = await prisma.compra.findMany({
    where,
    include: { comprador: { select: { nome: true } }, os: { select: { numero: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(compras)
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params
  const compra = await prisma.compra.findUnique({
    where: { id },
    include: { comprador: { select: { nome: true } }, os: true },
  })
  if (!compra) return res.status(404).json({ erro: 'Compra não encontrada' })
  return res.json(compra)
}

export async function solicitar(req: AuthRequest, res: Response) {
  const data = req.body
  const compra = await prisma.compra.create({ data })

  await notificarPorRole(
    ['COMPRADOR', 'GESTOR_ADMIN'],
    `Nova solicitação de compra`,
    `${data.produto} (x${data.quantidade}) - Pedido #${data.numeroPedido} | ${data.nomeCliente} / ${data.cidadeCliente} | Urgência: ${data.urgencia}`,
    'COMPRA_SOLICITADA',
    { compraId: compra.id }
  )

  return res.status(201).json(compra)
}

export async function marcarCiente(req: AuthRequest, res: Response) {
  const { id } = req.params
  const compra = await prisma.compra.update({
    where: { id },
    data: { ciencia: true, dataCiencia: new Date(), compradorId: req.usuario!.id, status: 'CIENTE' },
  })
  return res.json(compra)
}

export async function registrarPedido(req: Request, res: Response) {
  const { id } = req.params
  const { fornecedor, valor, condicaoPagamento, prazoEntrega, transportadora, previsaoChegada, pdfPedido } = req.body

  const compra = await prisma.compra.update({
    where: { id },
    data: {
      fornecedor,
      valor: valor ? Number(valor) : undefined,
      condicaoPagamento,
      prazoEntrega: prazoEntrega ? new Date(prazoEntrega) : undefined,
      transportadora,
      previsaoChegada: previsaoChegada ? new Date(previsaoChegada) : undefined,
      pdfPedido,
      pedidoRealizado: true,
      dataPedido: new Date(),
      status: 'PEDIDO_REALIZADO',
    },
  })

  await notificarPorRole(
    ['FINANCEIRO', 'FISCAL', 'GERENTE_OPERACIONAL'],
    `Compra efetuada: ${compra.produto}`,
    `Fornecedor: ${fornecedor} | Previsão: ${previsaoChegada ? new Date(previsaoChegada).toLocaleDateString('pt-BR') : 'N/D'} | Cliente: ${compra.nomeCliente}`,
    'FISCAL_NOTA',
    { compraId: compra.id }
  )

  return res.json(compra)
}

export async function atualizarStatus(req: Request, res: Response) {
  const { id } = req.params
  const { status } = req.body
  const compra = await prisma.compra.update({ where: { id }, data: { status } })
  return res.json(compra)
}
