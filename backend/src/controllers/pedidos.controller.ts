import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { notificarPorRole, criarNotificacao } from '../services/notificacao.service'

function gerarNumeroPedido() {
  const ano = new Date().getFullYear()
  const seq = String(Date.now()).slice(-5)
  return `PED-${ano}-${seq}`
}

export async function listar(req: Request, res: Response) {
  const { status, search } = req.query
  const where: any = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { numero: { contains: String(search), mode: 'insensitive' } },
      { cliente: { nome: { contains: String(search), mode: 'insensitive' } } },
      { cliente: { cidade: { contains: String(search), mode: 'insensitive' } } },
      { equipamento: { contains: String(search), mode: 'insensitive' } },
    ]
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    include: { cliente: true, vendedor: { select: { nome: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(pedidos)
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      vendedor: { select: { nome: true } },
      os: { include: { setoresOS: true, fotos: true } },
    },
  })
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' })
  return res.json(pedido)
}

export async function criar(req: AuthRequest, res: Response) {
  const data = req.body
  const numero = gerarNumeroPedido()

  let cliente = await prisma.cliente.findFirst({
    where: { nome: data.nomeCliente, cidade: data.cidadeCliente },
  })

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        nome: data.nomeCliente,
        cidade: data.cidadeCliente,
        estado: data.estadoCliente || '',
        telefone: data.telefoneCliente,
        email: data.emailCliente,
      },
    })
  }

  const pedido = await prisma.pedido.create({
    data: {
      numero,
      clienteId: cliente.id,
      vendedorId: req.usuario!.id,
      equipamento: data.equipamento,
      modelo: data.modelo,
      opcionais: data.opcionais,
      personalizacoes: data.personalizacoes,
      condicaoPagamento: data.condicaoPagamento,
      prazoEntrega: new Date(data.prazoEntrega),
      voltagem: data.voltagem,
      embalagem: data.embalagem,
      valorTotal: Number(data.valorTotal),
      observacoesTecnicas: data.observacoesTecnicas,
      observacoesComerciais: data.observacoesComerciais,
    },
    include: { cliente: true },
  })

  await notificarPorRole(
    ['FINANCEIRO', 'GERENTE_OPERACIONAL', 'GESTOR_ADMIN'],
    `Novo pedido #${numero}`,
    `${cliente.nome} - ${cliente.cidade} | ${data.equipamento} ${data.modelo} | Prazo: ${new Date(data.prazoEntrega).toLocaleDateString('pt-BR')}`,
    'NOVO_PEDIDO',
    { pedidoId: pedido.id }
  )

  return res.status(201).json(pedido)
}

export async function confirmarChecklist(req: AuthRequest, res: Response) {
  const { id } = req.params
  const pedido = await prisma.pedido.update({
    where: { id },
    data: { checklistComercial: true },
  })
  return res.json(pedido)
}

export async function confirmarPagamento(req: AuthRequest, res: Response) {
  const { id } = req.params
  const pedido = await prisma.pedido.update({
    where: { id },
    data: { pagamentoConfirmado: true, status: 'FINANCEIRO_APROVADO' },
  })

  const wellington = await prisma.usuario.findFirst({
    where: { role: 'GERENTE_OPERACIONAL', ativo: true },
  })

  if (wellington) {
    await criarNotificacao({
      usuarioId: wellington.id,
      titulo: `Pedido #${pedido.numero} liberado para produção`,
      mensagem: `Pagamento confirmado. Pedido liberado para distribuição da O.S.`,
      tipo: 'NOVO_PEDIDO',
      pedidoId: pedido.id,
    })
  }

  return res.json(pedido)
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params
  const pedido = await prisma.pedido.update({ where: { id }, data: req.body })
  return res.json(pedido)
}

export async function atualizarStatus(req: Request, res: Response) {
  const { id } = req.params
  const { status } = req.body
  const pedido = await prisma.pedido.update({ where: { id }, data: { status } })
  return res.json(pedido)
}
