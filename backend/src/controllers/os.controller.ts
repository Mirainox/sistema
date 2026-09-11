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

// Controle de entrega por setor: entrega física / envio virtual, pessoa que
// recebeu, data/hora e pendências.
export async function atualizarSetor(req: AuthRequest, res: Response) {
  const { setorId } = req.params
  const { recebeuFisico, recebeuVirtual, pessoaRecebeu, pendencias } = req.body
  const bool = (v: unknown) => v === true || v === 'true'

  const atual = await prisma.setorOS.findUnique({ where: { id: setorId } })
  if (!atual) return res.status(404).json({ erro: 'Setor da ordem não encontrado' })

  const data: Record<string, unknown> = {}
  if (recebeuFisico !== undefined) data.recebeuFisico = bool(recebeuFisico)
  if (recebeuVirtual !== undefined) data.recebeuVirtual = bool(recebeuVirtual)
  if (pessoaRecebeu !== undefined) data.pessoaRecebeu = String(pessoaRecebeu).trim() || null
  if (pendencias !== undefined) data.pendencias = String(pendencias).trim() || null

  const marcouRecebimento =
    (data.recebeuFisico === true && !atual.recebeuFisico) ||
    (data.recebeuVirtual === true && !atual.recebeuVirtual)
  if (marcouRecebimento && !atual.dataRecebimento) data.dataRecebimento = new Date()

  const setor = await prisma.setorOS.update({ where: { id: setorId }, data })
  return res.json(setor)
}

// Status "iniciais" do pedido — ainda não chegaram em produção finalizada.
const STATUS_PEDIDO_ANTES_DE_FINALIZAR = ['AGUARDANDO_FINANCEIRO', 'AGUARDANDO_CORRECAO', 'FINANCEIRO_APROVADO', 'EM_PRODUCAO']

export async function atualizarStatus(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { status } = req.body
  const os = await prisma.oS.update({ where: { id }, data: { status }, include: { pedido: true } })

  // Quando a Ordem de Pedido é concluída na produção, o Pedido acompanha:
  // avança para Aguardando Expedição e entra em "Entregas do Mês" como
  // finalizada pela produção (se ainda não tiver uma fase de entrega definida).
  if (status === 'CONCLUIDA') {
    const pedido = os.pedido
    const data: Record<string, unknown> = {}
    if (STATUS_PEDIDO_ANTES_DE_FINALIZAR.includes(pedido.status)) {
      data.status = 'AGUARDANDO_EXPEDICAO'
    }
    if (!pedido.faseEntrega) {
      data.faseEntrega = 'PRODUCAO_FINALIZADA'
      data.faseEntregaPor = req.usuario?.nome || 'Produção'
      data.faseEntregaEm = new Date()
    }
    if (Object.keys(data).length > 0) {
      await prisma.pedido.update({ where: { id: pedido.id }, data })
    }
  }

  return res.json(os)
}
