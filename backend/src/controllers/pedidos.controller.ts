import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { Role } from '@prisma/client'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { notificarPorRole, criarNotificacao } from '../services/notificacao.service'
import { interpretarDocumentoPedido, mimeSuportadoParaLeitura } from '../services/ia.service'
import { podeVer, podeVerTudo, SETORES_PEDIDO_ADMINISTRATIVO, SETORES_PEDIDO_PRODUCAO } from '../utils/visibilidade'

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

export async function buscar(req: AuthRequest, res: Response) {
  const { id } = req.params
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      vendedor: { select: { nome: true } },
      os: { include: { setoresOS: true, fotos: true } },
      fotos: { include: { usuario: { select: { nome: true } } }, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' })

  const role = req.usuario!.role
  const fotosVisiveis = pedido.fotos.filter((f) => podeVer(role, f.visivelPara))
  const comprovanteVisivel = podeVerTudo(role) || SETORES_PEDIDO_ADMINISTRATIVO.includes(role)

  return res.json({
    ...pedido,
    fotos: fotosVisiveis,
    comprovanteSinal: comprovanteVisivel ? pedido.comprovanteSinal : null,
  })
}

export async function interpretarDocumento(req: AuthRequest, res: Response) {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' })

  const extensao = path.extname(req.file.originalname)
  const mimeType = mimeSuportadoParaLeitura(extensao)
  const caminhoArquivo = req.file.path

  try {
    if (!mimeType) {
      return res.json({ suportado: false, dados: null })
    }
    const buffer = fs.readFileSync(caminhoArquivo)
    const dados = await interpretarDocumentoPedido(buffer, mimeType)
    return res.json({ suportado: true, dados })
  } catch (err) {
    console.error('Erro ao interpretar documento do pedido:', err)
    return res.status(500).json({ erro: 'Não foi possível ler o documento automaticamente. Preencha os dados manualmente.' })
  } finally {
    // Era só pra leitura — o arquivo definitivo é reenviado na criação do pedido.
    fs.unlink(caminhoArquivo, () => {})
  }
}

export async function criar(req: AuthRequest, res: Response) {
  const data = req.body
  const numero = gerarNumeroPedido()

  const arquivos = req.files as { [campo: string]: Express.Multer.File[] } | undefined
  const comprovante = arquivos?.comprovanteSinal?.[0]
  const pedidoGeradoArquivo = arquivos?.pedidoGerado?.[0]
  const pedidoGeradoProducaoArquivo = arquivos?.pedidoGeradoProducao?.[0]
  const pedidoAssinadoArquivo = arquivos?.pedidoAssinado?.[0]

  let cliente = data.nomeCliente
    ? await prisma.cliente.findFirst({ where: { nome: data.nomeCliente, cidade: data.cidadeCliente } })
    : null

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        nome: data.nomeCliente || `Cliente do pedido ${numero} (preencher)`,
        cidade: data.cidadeCliente || 'A definir',
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
      equipamento: data.equipamento || 'A definir',
      modelo: data.modelo || '-',
      opcionais: data.opcionais,
      personalizacoes: data.personalizacoes,
      condicaoPagamento: data.condicaoPagamento || 'A definir',
      prazoEntrega: data.prazoEntrega ? new Date(data.prazoEntrega) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      voltagem: data.voltagem,
      embalagem: data.embalagem,
      valorTotal: data.valorTotal ? Number(data.valorTotal) : 0,
      observacoesTecnicas: data.observacoesTecnicas,
      observacoesComerciais: data.observacoesComerciais,
      comprovanteSinal: comprovante ? `/uploads/${comprovante.filename}` : undefined,
    },
    include: { cliente: true },
  })

  const documentos = [
    pedidoGeradoArquivo && { arquivo: pedidoGeradoArquivo, descricao: 'Pedido Gerado', visivelPara: SETORES_PEDIDO_ADMINISTRATIVO },
    pedidoGeradoProducaoArquivo && { arquivo: pedidoGeradoProducaoArquivo, descricao: 'Pedido Gerado Produção', visivelPara: SETORES_PEDIDO_PRODUCAO },
    pedidoAssinadoArquivo && { arquivo: pedidoAssinadoArquivo, descricao: 'Pedido Assinado', visivelPara: SETORES_PEDIDO_ADMINISTRATIVO },
  ].filter(Boolean) as { arquivo: Express.Multer.File; descricao: string; visivelPara: Role[] }[]

  if (documentos.length > 0) {
    await prisma.foto.createMany({
      data: documentos.map((d) => ({
        pedidoId: pedido.id,
        usuarioId: req.usuario!.id,
        setor: 'VENDAS' as const,
        url: `/uploads/${d.arquivo.filename}`,
        descricao: d.descricao,
        numeroPedido: pedido.numero,
        nomeCliente: cliente.nome,
        cidadeCliente: cliente.cidade,
        visivelPara: d.visivelPara,
      })),
    })
  }

  await notificarPorRole(
    ['FINANCEIRO', 'FISCAL', 'EXPEDICAO', 'GERENTE_OPERACIONAL', 'GESTOR_ADMIN'],
    `Novo pedido #${numero}`,
    `${cliente.nome} - ${cliente.cidade} | ${pedido.equipamento} ${pedido.modelo} | Prazo: ${pedido.prazoEntrega.toLocaleDateString('pt-BR')}`,
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
