import { Request, Response } from 'express'
import { Role } from '@prisma/client'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { notificarPorRole, criarNotificacao } from '../services/notificacao.service'
import { garantirExpedicao } from '../services/expedicao.service'
import { podeVer, podeVerTudo, SETORES_PEDIDO_ADMINISTRATIVO, SETORES_PEDIDO_PRODUCAO } from '../utils/visibilidade'

function gerarNumeroPedido() {
  const ano = new Date().getFullYear()
  const seq = String(Date.now()).slice(-5)
  return `PED-${ano}-${seq}`
}

export async function listar(req: AuthRequest, res: Response) {
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

  const role = req.usuario!.role
  const comprovanteVisivel = podeVerTudo(role) || SETORES_PEDIDO_ADMINISTRATIVO.includes(role)
  const out = comprovanteVisivel ? pedidos : pedidos.map((p) => ({ ...p, comprovanteSinal: null }))
  return res.json(out)
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
  const ehVendedorDoPedido = pedido.vendedorId === req.usuario!.id
  const comprovanteVisivel = podeVerTudo(role) || SETORES_PEDIDO_ADMINISTRATIVO.includes(role) || ehVendedorDoPedido
  // Amostra de Embalagem NAO deve ser vista pelo Financeiro nem pelo Fiscal.
  const amostraVisivel = role !== 'FINANCEIRO' && role !== 'FISCAL'

  const amostraOculta = amostraVisivel ? {} : {
    amostraEmbalagem: null,
    amostraEmbalagemObs: null,
    amostraNaoSeAplica: null,
    amostraPedidaCliente: null,
    amostraEnviada: null,
    amostraChegou: null,
  }

  return res.json({
    ...pedido,
    fotos: fotosVisiveis,
    comprovanteSinal: comprovanteVisivel ? pedido.comprovanteSinal : null,
    ...amostraOculta,
  })
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

  // Vendedor responsável pelo pedido: por padrão quem está logado, mas pode ser
  // indicado outro vendedor (a empresa tem mais de um).
  let vendedorId = req.usuario!.id
  if (data.vendedorId && data.vendedorId !== req.usuario!.id) {
    const v = await prisma.usuario.findFirst({ where: { id: String(data.vendedorId), ativo: true }, select: { id: true } })
    if (v) vendedorId = v.id
  }

  const pedido = await prisma.pedido.create({
    data: {
      numero,
      clienteId: cliente.id,
      vendedorId,
      empresa: data.empresa || undefined,
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
      observacoes: data.observacoes || undefined,
      amostraEmbalagem: data.amostraEmbalagem === 'true' || data.amostraEmbalagem === true,
      amostraEmbalagemObs: data.amostraEmbalagemObs || undefined,
      amostraNaoSeAplica: data.amostraNaoSeAplica === 'true' || data.amostraNaoSeAplica === true,
      amostraPedidaCliente: data.amostraPedidaCliente === 'true' || data.amostraPedidaCliente === true,
      amostraEnviada: data.amostraEnviada === 'true' || data.amostraEnviada === true,
      amostraChegou: data.amostraChegou === 'true' || data.amostraChegou === true,
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

  // Amostra Embalagem vai para o Wellington e a liderança de produção — nunca para Financeiro/Fiscal.
  if (pedido.amostraEmbalagem) {
    await notificarPorRole(
      ['GERENTE_OPERACIONAL', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO', 'PRODUCAO'],
      `Amostra de embalagem - Pedido #${numero}`,
      `${cliente.nome} - ${cliente.cidade}${pedido.amostraEmbalagemObs ? ` | Obs: ${pedido.amostraEmbalagemObs}` : ''}`,
      'NOVO_PEDIDO',
      { pedidoId: pedido.id }
    )
  }

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

// Revisão do Financeiro. Os dois campos ("Pagamento Confirmado" e "Comprovante
// de Sinal") e a observação NÃO são obrigatórios e podem ser alterados a
// qualquer momento (sem data fixa). O Financeiro pode liberar o pedido para a
// produção mesmo com os campos desmarcados / documentos não anexados — nesse
// caso a observação explica o motivo. Tudo isso chega ao Wellington para
// conferência antes de gerar a O.S.
export async function revisarFinanceiro(req: AuthRequest, res: Response) {
  const { id } = req.params
  const {
    pagamentoConfirmado, comprovanteSinalConferido, financeiroObservacao, liberar,
    compValor, compData, compBanco, compClienteConfere, compPedidoConfere, aguardandoSinal,
  } = req.body

  const bool = (v: unknown) => v === true || v === 'true'

  const existente = await prisma.pedido.findUnique({ where: { id } })
  if (!existente) return res.status(404).json({ erro: 'Pedido não encontrado' })

  const data: Record<string, unknown> = {}
  if (pagamentoConfirmado !== undefined) data.pagamentoConfirmado = bool(pagamentoConfirmado)
  if (comprovanteSinalConferido !== undefined) data.comprovanteSinalConferido = bool(comprovanteSinalConferido)
  if (financeiroObservacao !== undefined) data.financeiroObservacao = String(financeiroObservacao).trim() || null
  if (aguardandoSinal !== undefined) data.aguardandoSinal = bool(aguardandoSinal)
  // Conferência do comprovante de sinal
  if (compValor !== undefined) data.compValor = compValor === '' || compValor === null ? null : Number(compValor)
  if (compData !== undefined) data.compData = compData ? new Date(compData) : null
  if (compBanco !== undefined) data.compBanco = String(compBanco).trim() || null
  if (compClienteConfere !== undefined) data.compClienteConfere = bool(compClienteConfere)
  if (compPedidoConfere !== undefined) data.compPedidoConfere = bool(compPedidoConfere)

  const vaiLiberar = bool(liberar) && !existente.financeiroLiberadoEm
  if (vaiLiberar) {
    data.status = 'FINANCEIRO_APROVADO'
    data.financeiroLiberadoEm = new Date()
  }

  const pedido = await prisma.pedido.update({ where: { id }, data, include: { cliente: true } })

  if (vaiLiberar) {
    const pagTxt = pedido.pagamentoConfirmado ? 'SIM (100%)' : 'NÃO'
    const compTxt = pedido.comprovanteSinalConferido ? 'SIM' : 'NÃO'
    const sinalTxt = pedido.aguardandoSinal ? ' | AGUARDANDO SINAL' : ''
    const obs = pedido.financeiroObservacao ? ` | Obs. financeiro: ${pedido.financeiroObservacao}` : ''
    const empresa = pedido.empresa ? ` (${pedido.empresa})` : ''
    await notificarPorRole(
      ['GERENTE_OPERACIONAL', 'GESTOR_ADMIN', 'ADMIN'],
      `Pedido #${pedido.numero} liberado pelo Financeiro — conferência inicial`,
      `${pedido.cliente.nome}${empresa} - ${pedido.cliente.cidade} | ${pedido.equipamento} ${pedido.modelo} | Prazo: ${pedido.prazoEntrega.toLocaleDateString('pt-BR')} | Pagamento 100%: ${pagTxt} | Comprovante conferido: ${compTxt}${sinalTxt}${obs}`,
      'NOVO_PEDIDO',
      { pedidoId: pedido.id }
    )
  }

  return res.json(pedido)
}

// Rastreamento da amostra de embalagem (pedida ao cliente / enviada / chegou).
// Pode ser atualizado a qualquer momento pelo vendedor do pedido, gerência e produção.
export async function atualizarAmostra(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { amostraEmbalagem, amostraNaoSeAplica, amostraPedidaCliente, amostraEnviada, amostraChegou, amostraEmbalagemObs } = req.body
  const bool = (v: unknown) => v === true || v === 'true'

  const existente = await prisma.pedido.findUnique({ where: { id } })
  if (!existente) return res.status(404).json({ erro: 'Pedido não encontrado' })

  const data: Record<string, unknown> = {}
  if (amostraEmbalagem !== undefined) data.amostraEmbalagem = bool(amostraEmbalagem)
  if (amostraNaoSeAplica !== undefined) data.amostraNaoSeAplica = bool(amostraNaoSeAplica)
  if (amostraPedidaCliente !== undefined) data.amostraPedidaCliente = bool(amostraPedidaCliente)
  if (amostraEnviada !== undefined) data.amostraEnviada = bool(amostraEnviada)
  if (amostraChegou !== undefined) data.amostraChegou = bool(amostraChegou)
  if (amostraEmbalagemObs !== undefined) data.amostraEmbalagemObs = String(amostraEmbalagemObs).trim() || null

  if (Object.keys(data).length === 0) return res.status(400).json({ erro: 'Nada para atualizar.' })

  const pedido = await prisma.pedido.update({ where: { id }, data })
  return res.json(pedido)
}

// Comprovante de Sinal pode ser anexado ou substituído a qualquer momento,
// sem limite de tempo desde a criação do pedido.
export async function atualizarComprovante(req: AuthRequest, res: Response) {
  const { id } = req.params
  const arquivo = req.file as Express.Multer.File | undefined
  const observacoes = req.body?.observacoes

  if (!arquivo && observacoes === undefined) {
    return res.status(400).json({ erro: 'Envie o comprovante de sinal ou as observações.' })
  }

  const pedidoExistente = await prisma.pedido.findUnique({ where: { id } })
  if (!pedidoExistente) return res.status(404).json({ erro: 'Pedido não encontrado' })

  const pedido = await prisma.pedido.update({
    where: { id },
    data: {
      ...(arquivo ? { comprovanteSinal: `/uploads/${arquivo.filename}` } : {}),
      ...(observacoes !== undefined ? { observacoes: observacoes || null } : {}),
    },
  })

  if (arquivo) {
    await notificarPorRole(
      ['FINANCEIRO', 'FISCAL', 'EXPEDICAO', 'GERENTE_OPERACIONAL', 'GESTOR_ADMIN'],
      `Comprovante de sinal anexado - Pedido #${pedido.numero}`,
      `${req.usuario!.nome || 'Vendedor'} anexou o comprovante de sinal do pedido #${pedido.numero}.`,
      'NOVO_PEDIDO',
      { pedidoId: pedido.id }
    )
  }

  return res.json(pedido)
}

const VOLTAGENS = ['220_MONO', '220_BI', '220_TRI', '380_TRI']

// Checklist do gerente de produção (Wellington): dados conferidos, necessidade de
// desenho técnico (gera tarefa para o William) e voltagem do equipamento.
export async function conferenciaGerente(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { dadosConferidos, desenhoNecessario, voltagem } = req.body
  const bool = (v: unknown) => v === true || v === 'true'

  const existente = await prisma.pedido.findUnique({ where: { id }, include: { cliente: true } })
  if (!existente) return res.status(404).json({ erro: 'Pedido não encontrado' })

  const data: Record<string, unknown> = {}
  if (dadosConferidos !== undefined) {
    data.dadosConferidos = bool(dadosConferidos)
    data.conferenciaGerenteEm = bool(dadosConferidos) ? new Date() : null
  }
  if (voltagem !== undefined) data.voltagem = VOLTAGENS.includes(voltagem) ? voltagem : null

  let novoDesenho = false
  if (desenhoNecessario !== undefined) {
    const v = bool(desenhoNecessario)
    data.desenhoNecessario = v
    if (v && !existente.desenhoNecessario) {
      data.desenhoStatus = 'PENDENTE'
      novoDesenho = true
    }
    if (!v) data.desenhoStatus = null
  }

  const pedido = await prisma.pedido.update({ where: { id }, data })

  if (novoDesenho) {
    await notificarPorRole(
      ['PROJETISTA', 'GESTOR_PRODUCAO'],
      `Desenho técnico - Pedido #${pedido.numero}`,
      `${existente.cliente.nome} - ${existente.cliente.cidade} | ${pedido.equipamento} ${pedido.modelo}. Prepare, ajuste ou valide o desenho.`,
      'GERAL',
      { pedidoId: pedido.id }
    )
  }

  return res.json(pedido)
}

// Pedidos que entram na Área de Trabalho do William (Projetos e Desenhos):
// quando o gerente marca "desenho necessário" na conferência OU quando a Ordem
// de Pedido é distribuída incluindo o setor "Projetos e Desenhos".
export async function listarProjetos(req: AuthRequest, res: Response) {
  const role = req.usuario!.role
  const pedidos = await prisma.pedido.findMany({
    where: {
      status: { notIn: ['CANCELADO'] },
      OR: [
        { desenhoNecessario: true },
        { os: { some: { setoresOS: { some: { setor: 'PROJETOS' } } } } },
      ],
    },
    include: {
      cliente: true,
      vendedor: { select: { nome: true } },
      fotos: { include: { usuario: { select: { nome: true } } }, orderBy: { createdAt: 'desc' } },
      os: { select: { id: true, numero: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Nesta área só o documento "Pedido Gerado Produção" (e anexos de desenho)
  // ficam disponíveis — Pedido Gerado, Pedido Assinado e Comprovante de Sinal
  // não são do setor de Projetos e Desenhos.
  const comprovanteVisivel = podeVerTudo(role) || SETORES_PEDIDO_ADMINISTRATIVO.includes(role)
  const out = pedidos.map((p) => ({
    ...p,
    fotos: p.fotos.filter((f) => podeVer(role, f.visivelPara)),
    comprovanteSinal: comprovanteVisivel ? p.comprovanteSinal : null,
  }))
  return res.json(out)
}

// Área de Trabalho do Almoxarifado (Carlos, Matheus, João Vitor): todo pedido
// que já foi liberado por todo mundo e chegou à produção (Ordem de Pedido
// gerada) aparece aqui sozinho — não depende de o gerente já ter distribuído
// aos setores. Quando a distribuição acontece, o recebimento (papel/sistema,
// pessoa, pendências) fica editável direto nesta tela.
const SETORES_ALMOXARIFADO = ['ALMOXARIFADO_GERAL', 'ALMOXARIFADO_CONSUMIVEIS']

export async function listarAlmoxarifado(req: AuthRequest, res: Response) {
  const role = req.usuario!.role
  const pedidos = await prisma.pedido.findMany({
    where: {
      status: { notIn: ['CANCELADO'] },
      os: { some: {} },
    },
    include: {
      cliente: true,
      vendedor: { select: { nome: true } },
      fotos: { include: { usuario: { select: { nome: true } } }, orderBy: { createdAt: 'desc' } },
      os: {
        select: {
          id: true,
          numero: true,
          setoresOS: { where: { setor: { in: SETORES_ALMOXARIFADO as any } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Mesma regra: só "Pedido Gerado Produção" (e anexos vinculados ao setor)
  // ficam visíveis para o Almoxarifado — não Pedido Gerado, Pedido Assinado
  // ou o Comprovante de Sinal.
  const comprovanteVisivel = podeVerTudo(role) || SETORES_PEDIDO_ADMINISTRATIVO.includes(role)
  const out = pedidos.map((p) => ({
    ...p,
    fotos: p.fotos.filter((f) => podeVer(role, f.visivelPara)),
    comprovanteSinal: comprovanteVisivel ? p.comprovanteSinal : null,
  }))
  return res.json(out)
}

// Mini checklist do William (Projetos e Desenhos): 3 etapas, cada uma registra
// automaticamente quem marcou + data + hora (padrão da Distribuição).
export async function marcarDesenhoEtapa(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { etapa, marcado } = req.body
  const on = marcado === true || marcado === 'true'

  const colunas: Record<string, [string, string, string]> = {
    recebido: ['desenhoRecebido', 'desenhoRecebidoPor', 'desenhoRecebidoEm'],
    andamento: ['desenhoAndamento', 'desenhoAndamentoPor', 'desenhoAndamentoEm'],
    finalizado: ['desenhoFinalizado', 'desenhoFinalizadoPor', 'desenhoFinalizadoEm'],
  }
  const cols = colunas[etapa]
  if (!cols) return res.status(400).json({ erro: 'Etapa inválida.' })

  const atual = await prisma.pedido.findUnique({ where: { id } })
  if (!atual) return res.status(404).json({ erro: 'Pedido não encontrado' })

  const quem = req.usuario!.nome
  const data: Record<string, unknown> = {
    [cols[0]]: on,
    [cols[1]]: on ? quem : null,
    [cols[2]]: on ? new Date() : null,
  }

  // Mantém o resumo desenhoStatus em sincronia (usado em chips e relatórios).
  const rec = etapa === 'recebido' ? on : atual.desenhoRecebido
  const and = etapa === 'andamento' ? on : atual.desenhoAndamento
  const fin = etapa === 'finalizado' ? on : atual.desenhoFinalizado
  data.desenhoStatus = fin ? 'CONCLUIDO' : and ? 'EM_ANDAMENTO' : rec ? 'PENDENTE' : (atual.desenhoNecessario ? 'PENDENTE' : null)

  const pedido = await prisma.pedido.update({ where: { id }, data })

  if (etapa === 'finalizado' && on) {
    await notificarPorRole(
      ['GERENTE_OPERACIONAL', 'GESTOR_PRODUCAO', 'DIRETOR', 'ADMIN'],
      `Desenho finalizado - Pedido #${pedido.numero}`,
      `${quem} finalizou o desenho técnico do pedido #${pedido.numero}.`,
      'GERAL',
      { pedidoId: pedido.id }
    )
  }

  return res.json(pedido)
}

// William anexa foto/documento do desenho finalizado (fica vinculado ao pedido).
export async function anexarDesenho(req: AuthRequest, res: Response) {
  const { id } = req.params
  const arquivo = req.file as Express.Multer.File | undefined
  if (!arquivo) return res.status(400).json({ erro: 'Nenhum arquivo enviado' })

  const pedido = await prisma.pedido.findUnique({ where: { id }, include: { cliente: true } })
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' })

  const foto = await prisma.foto.create({
    data: {
      pedidoId: id,
      usuarioId: req.usuario!.id,
      setor: 'PROJETOS',
      url: `/uploads/${arquivo.filename}`,
      descricao: 'Desenho técnico',
      numeroPedido: pedido.numero,
      nomeCliente: pedido.cliente.nome,
      cidadeCliente: pedido.cliente.cidade,
      visivelPara: ['PROJETISTA', 'GERENTE_OPERACIONAL', 'GESTOR_PRODUCAO', 'PRODUCAO', 'ALMOXARIFE'],
    },
    include: { usuario: { select: { nome: true } } },
  })
  return res.status(201).json(foto)
}

// Erro de Pedido: o gerente identifica um problema e devolve o pedido para
// correção. Notifica imediatamente o vendedor e as gerências.
export async function marcarErro(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { erro, observacao, prazo, resolver } = req.body

  const existente = await prisma.pedido.findUnique({
    where: { id },
    include: { cliente: true, vendedor: { select: { id: true, nome: true } } },
  })
  if (!existente) return res.status(404).json({ erro: 'Pedido não encontrado' })

  if (resolver === true || resolver === 'true') {
    const pedido = await prisma.pedido.update({
      where: { id },
      data: { erroPedido: false, status: 'AGUARDANDO_FINANCEIRO' },
    })
    await notificarPorRole(
      ['GERENTE_OPERACIONAL', 'GESTOR_PRODUCAO', 'GESTOR_ADMIN', 'FINANCEIRO'],
      `Pedido #${pedido.numero} corrigido`,
      `${req.usuario!.nome} marcou o pedido #${pedido.numero} como corrigido. Refazer a conferência.`,
      'NOVO_PEDIDO',
      { pedidoId: pedido.id }
    )
    return res.json(pedido)
  }

  if (!observacao || !String(observacao).trim()) {
    return res.status(400).json({ erro: 'A observação do erro é obrigatória.' })
  }

  const quem = req.usuario!.nome
  const agora = new Date()
  const pedido = await prisma.pedido.update({
    where: { id },
    data: {
      erroPedido: true,
      erroPedidoObs: String(observacao).trim(),
      erroPedidoPor: quem,
      erroPedidoEm: agora,
      erroPedidoPrazo: prazo ? new Date(prazo) : null,
      status: 'AGUARDANDO_CORRECAO',
    },
  })

  const prazoTxt = pedido.erroPedidoPrazo ? ` | Prazo para correção: ${pedido.erroPedidoPrazo.toLocaleDateString('pt-BR')}` : ''
  const msg = `Pedido #${pedido.numero} | ${existente.cliente.nome} - ${existente.cliente.cidade} | Erro: ${pedido.erroPedidoObs} | Devolvido por: ${quem} em ${agora.toLocaleString('pt-BR')}${prazoTxt}`

  // Vendedor que enviou o pedido
  if (existente.vendedor?.id) {
    await criarNotificacao({
      usuarioId: existente.vendedor.id,
      titulo: `⚠️ ERRO no Pedido #${pedido.numero} — corrija`,
      mensagem: msg,
      tipo: 'NOVO_PEDIDO',
      pedidoId: pedido.id,
    })
  }
  // Ciência para as gerências
  await notificarPorRole(
    ['GERENTE_OPERACIONAL', 'GESTOR_PRODUCAO', 'GESTOR_ADMIN', 'ADMIN'],
    `⚠️ Erro de Pedido #${pedido.numero}`,
    msg,
    'NOVO_PEDIDO',
    { pedidoId: pedido.id }
  )

  return res.json(pedido)
}

const FASES_ENTREGA = ['PRODUCAO_FINALIZADA', 'EM_ROTA', 'ENTREGUE']
const STATUS_POR_FASE: Record<string, string> = {
  PRODUCAO_FINALIZADA: 'AGUARDANDO_EXPEDICAO',
  EM_ROTA: 'EXPEDIDO',
  ENTREGUE: 'ENTREGUE',
}

// Entregas do mês — máquinas finalizadas pela produção, em rota ou já entregues.
export async function listarEntregas(req: AuthRequest, res: Response) {
  const mes = String(req.query.mes || '') // "YYYY-MM"; vazio = mês atual
  const ref = /^\d{4}-\d{2}$/.test(mes) ? mes : new Date().toISOString().slice(0, 7)
  const [ano, m] = ref.split('-').map(Number)
  const inicio = new Date(ano, m - 1, 1)
  const fim = new Date(ano, m, 1)

  const pedidos = await prisma.pedido.findMany({
    where: {
      OR: [
        { faseEntrega: { not: null } },
        { status: { in: ['AGUARDANDO_EXPEDICAO', 'EXPEDIDO', 'ENTREGUE'] } },
      ],
    },
    include: { cliente: true, vendedor: { select: { nome: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  const doMes = pedidos.filter((p) => {
    const d = p.faseEntregaEm || p.updatedAt
    return d >= inicio && d < fim
  })

  return res.json({ mes: ref, pedidos: doMes })
}

// Encarregado geral de produção define a fase de entrega do pedido.
export async function atualizarFaseEntrega(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { faseEntrega } = req.body

  const existente = await prisma.pedido.findUnique({ where: { id } })
  if (!existente) return res.status(404).json({ erro: 'Pedido não encontrado' })

  if (faseEntrega !== null && faseEntrega !== '' && !FASES_ENTREGA.includes(faseEntrega)) {
    return res.status(400).json({ erro: 'Fase de entrega inválida.' })
  }

  const agora = new Date()
  const limpa = faseEntrega === null || faseEntrega === ''
  const data: Record<string, unknown> = {
    faseEntrega: limpa ? null : faseEntrega,
    faseEntregaPor: limpa ? null : req.usuario!.nome,
    faseEntregaEm: limpa ? null : agora,
    entregueEm: faseEntrega === 'ENTREGUE' ? agora : (existente.faseEntrega === 'ENTREGUE' ? null : existente.entregueEm),
  }
  if (!limpa && STATUS_POR_FASE[faseEntrega]) data.status = STATUS_POR_FASE[faseEntrega] as any

  const pedido = await prisma.pedido.update({ where: { id }, data })

  // A partir de "finalizada pela produção" o pedido deve aparecer na Área de
  // Trabalho da Expedição.
  if (!limpa) await garantirExpedicao(pedido.id)

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
