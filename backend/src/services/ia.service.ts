import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z, ZodType } from 'zod'
import fs from 'fs/promises'
import path from 'path'

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

const MIME_SUPORTADO: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
}

function mimeSuportadoParaLeitura(extensao: string): string | null {
  return MIME_SUPORTADO[extensao.toLowerCase()] || null
}

/**
 * Motor genérico: lê um arquivo (PDF ou imagem) com a Claude e devolve os
 * dados estruturados conforme o schema/prompt passados. Nunca lança — em
 * qualquer falha (sem crédito, arquivo ilegível, tipo não suportado, IA
 * indisponível) devolve null e quem chamou segue sem a leitura.
 */
async function interpretar<T>(caminhoArquivo: string, mimeType: string, schema: ZodType<T>, prompt: string): Promise<T | null> {
  if (!client) return null

  const isPdf = mimeType === 'application/pdf'
  const isImagem = ['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)
  if (!isPdf && !isImagem) return null

  try {
    const buffer = await fs.readFile(caminhoArquivo)
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            isPdf
              ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } }
              : { type: 'image', source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif', data: buffer.toString('base64') } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(schema) },
    })

    return response.parsed_output ?? null
  } catch (err) {
    console.error('[ia.service] Falha ao ler anexo:', err instanceof Error ? err.message : err)
    return null
  }
}

function paraMulter(arquivo: { path: string; originalname: string } | undefined | null): { caminho: string; mime: string } | null {
  if (!arquivo) return null
  const mime = mimeSuportadoParaLeitura(path.extname(arquivo.originalname))
  if (!mime) return null
  return { caminho: arquivo.path, mime }
}

// ---------- Novo Pedido: os 3 documentos (Pedido Gerado, Pedido Gerado
// Produção, Pedido Assinado) ----------

export const DadosPedidoSchema = z.object({
  numeroPedido: z.string().nullable(),
  nomeCliente: z.string().nullable(),
  cidadeCliente: z.string().nullable(),
  telefoneCliente: z.string().nullable(),
  prazoEntrega: z.string().nullable().describe('Data no formato AAAA-MM-DD, ou null se não houver data explícita/dedutível'),
  dataDocumento: z.string().nullable().describe('Data que aparece no documento, formato AAAA-MM-DD, ou null'),
})
export type DadosPedido = z.infer<typeof DadosPedidoSchema>

const PROMPT_PEDIDO = `Este é um documento de pedido de venda de uma empresa de equipamentos em aço inox (Mirainox) — pode ser o pedido gerado, o pedido gerado para produção ou o pedido assinado pelo cliente. Extraia apenas: número do pedido, nome do cliente, cidade do cliente, telefone do cliente, prazo de entrega e a data do documento.

Regras:
- Se um campo não estiver presente ou legível, retorne null — nunca invente.
- Datas no formato AAAA-MM-DD, apenas quando explícitas ou claramente dedutíveis.`

export async function lerDocumentoPedido(arquivo: { path: string; originalname: string } | undefined | null): Promise<DadosPedido | null> {
  const info = paraMulter(arquivo)
  if (!info) return null
  return interpretar(info.caminho, info.mime, DadosPedidoSchema, PROMPT_PEDIDO)
}

// ---------- Almoxarifado: foto de uma peça/item ----------

export const DadosPecaSchema = z.object({
  codigo: z.string().nullable().describe('Código/referência da peça, se houver etiqueta ou identificação visível'),
  nome: z.string().nullable().describe('Nome ou descrição da peça'),
  quantidade: z.number().nullable().describe('Quantidade visível (contada ou escrita), apenas o número'),
  valor: z.number().nullable().describe('Valor unitário, se houver etiqueta de preço ou nota — apenas o número'),
  unidade: z.string().nullable().describe('Unidade de medida (un, kg, m, cx, etc.), se identificável'),
})
export type DadosPeca = z.infer<typeof DadosPecaSchema>

const PROMPT_PECA = `Esta é uma foto de uma peça, matéria-prima ou item do almoxarifado de uma empresa de equipamentos em aço inox (Mirainox) — pode ser a peça em si, uma etiqueta, uma nota ou uma embalagem. Extraia: código/referência, nome da peça, quantidade, valor unitário e unidade de medida.

Regras:
- Se um campo não estiver presente ou legível, retorne null — nunca invente.
- Valor e quantidade: apenas o número.`

export async function lerFotoPeca(arquivo: { path: string; originalname: string } | undefined | null): Promise<DadosPeca | null> {
  const info = paraMulter(arquivo)
  if (!info) return null
  return interpretar(info.caminho, info.mime, DadosPecaSchema, PROMPT_PECA)
}
