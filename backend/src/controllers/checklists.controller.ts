import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

const ITENS_CHECKLIST: Record<string, string[]> = {
  COMERCIAL_VENDEDOR: [
    'Pedido gerado', 'Contrato ou pedido assinado', 'Nome do cliente', 'Cidade do cliente',
    'Número do pedido', 'Equipamento vendido', 'Modelo do equipamento', 'Opcionais',
    'Personalizações', 'Condição de pagamento', 'Prazo de entrega', 'Voltagem/energia',
    'Embalagens', 'Comprovante de sinal anexado', 'Observações técnicas', 'Observações comerciais',
  ],
  DISTRIBUICAO_OS: [
    'Entregue fisicamente ao almoxarifado', 'Entregue fisicamente à produção',
    'Entregue fisicamente à usinagem', 'Entregue fisicamente à caldeiraria',
    'Entregue fisicamente à elétrica', 'Entregue fisicamente à montagem',
    'O.S. enviada virtualmente pelo sistema', 'Confirmação de recebimento de todos os setores',
  ],
  FOTO_PRODUCAO: [
    'Foto do andamento da produção registrada', 'Foto vinculada à O.S.', 'Foto vinculada ao pedido',
  ],
  ORGANIZACAO_SEXTA: [
    'Lâmpadas apagadas', 'Ferramentas levantadas', 'Ferramentas guardadas',
    'Materiais protegidos contra risco de enchente', 'Máquinas de solda desligadas',
    'Ar comprimido fechado', 'Gases fechados', 'Botijas de gás fechadas', 'Argônio fechado',
    'Abrasivos guardados', 'Abrasivos levantados do chão', 'Setor limpo', 'Área organizada',
    'Risco aparente registrado (se houver)', 'Foto da área registrada',
  ],
  TORNO_SEXTA: [
    'Limpeza do torno', 'Lubrificação do torno', 'Organização da área',
    'Ferramentas guardadas', 'Cavacos removidos', 'Máquina em condição adequada',
    'Setor seguro para o final de semana', 'Foto do torno registrada',
  ],
  USINAGEM_PECA: [
    'Data de recebimento do desenho', 'Data de recebimento do material',
    'Hora-máquina prevista registrada', 'Previsão de conclusão definida',
    'Peça concluída', 'Conferência de medidas realizada', 'Destino da peça definido',
    'Foto da peça anexada', 'OK de conclusão',
  ],
  EPI: [
    'Funcionário registrado no sistema', 'Documentação correta', 'Tipo de EPI registrado',
    'Quantidade registrada', 'Data de entrega registrada', 'Setor do colaborador informado',
    'Confirmação de recebimento assinada',
  ],
  COMPRA_REALIZADA: [
    'Fornecedor informado', 'Produto comprado registrado', 'Quantidade registrada',
    'Valor informado', 'Condição de pagamento informada', 'Prazo de entrega informado',
    'Previsão de chegada registrada', 'PDF ou foto do pedido anexado',
    'Número do pedido interno vinculado', 'O.S. vinculada',
  ],
}

export async function criar(req: AuthRequest, res: Response) {
  const { tipo, setor, osId } = req.body

  const itens = ITENS_CHECKLIST[tipo] || []
  const checklist = await prisma.checklist.create({
    data: {
      tipo,
      setor,
      osId,
      responsavel: req.usuario!.nome,
      itens: {
        create: itens.map((descricao, idx) => ({ descricao, ordem: idx + 1 })),
      },
    },
    include: { itens: true },
  })

  return res.status(201).json(checklist)
}

export async function listar(req: Request, res: Response) {
  const { tipo, setor, osId, concluido } = req.query
  const where: any = {}
  if (tipo) where.tipo = tipo
  if (setor) where.setor = setor
  if (osId) where.osId = String(osId)
  if (concluido !== undefined) where.concluido = concluido === 'true'

  const checklists = await prisma.checklist.findMany({
    where,
    include: { itens: true, respostas: { include: { usuario: { select: { nome: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(checklists)
}

export async function responder(req: AuthRequest, res: Response) {
  const { checklistId } = req.params
  const { respostas } = req.body

  await prisma.checklistResposta.createMany({
    data: respostas.map((r: any) => ({
      checklistId,
      itemId: r.itemId,
      usuarioId: req.usuario!.id,
      resposta: r.resposta,
      observacao: r.observacao,
    })),
  })

  const checklist = await prisma.checklist.findUnique({
    where: { id: checklistId },
    include: { itens: true, respostas: true },
  })

  const totalItens = checklist?.itens.length || 0
  const totalRespostas = checklist?.respostas.length || 0
  if (totalRespostas >= totalItens) {
    await prisma.checklist.update({ where: { id: checklistId }, data: { concluido: true } })
  }

  return res.json({ mensagem: 'Respostas registradas com sucesso' })
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params
  const checklist = await prisma.checklist.findUnique({
    where: { id },
    include: {
      itens: { orderBy: { ordem: 'asc' } },
      respostas: { include: { usuario: { select: { nome: true } }, item: true } },
      fotos: true,
    },
  })
  if (!checklist) return res.status(404).json({ erro: 'Checklist não encontrado' })
  return res.json(checklist)
}
