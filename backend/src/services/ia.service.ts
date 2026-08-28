import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

const client = new Anthropic()

export const PedidoExtraidoSchema = z.object({
  nomeCliente: z.string().nullable(),
  cidadeCliente: z.string().nullable(),
  estadoCliente: z.string().nullable(),
  telefoneCliente: z.string().nullable(),
  emailCliente: z.string().nullable(),
  equipamento: z.string().nullable(),
  modelo: z.string().nullable(),
  opcionais: z.string().nullable(),
  personalizacoes: z.string().nullable(),
  condicaoPagamento: z.string().nullable(),
  prazoEntrega: z.string().nullable().describe('Data no formato AAAA-MM-DD, ou null se não houver data explícita/dedutível'),
  voltagem: z.string().nullable(),
  embalagem: z.string().nullable(),
  valorTotal: z.number().nullable().describe('Apenas o número, sem "R$" nem separador de milhar'),
  observacoesTecnicas: z.string().nullable(),
  observacoesComerciais: z.string().nullable(),
})

export type PedidoExtraido = z.infer<typeof PedidoExtraidoSchema>

const MIME_SUPORTADO: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
}

export function mimeSuportadoParaLeitura(extensao: string): string | null {
  return MIME_SUPORTADO[extensao.toLowerCase()] || null
}

const PROMPT = `Este é um documento de pedido de venda de uma empresa de equipamentos em aço inox (Mirainox). Extraia os dados do pedido presentes no documento.

Regras:
- Se um campo não estiver presente ou legível no documento, retorne null para ele — nunca invente valores.
- Para valores monetários, retorne apenas o número (sem "R$", sem separador de milhar; use ponto para casas decimais).
- Para o prazo de entrega, retorne uma data no formato AAAA-MM-DD apenas se houver uma data explícita ou claramente dedutível no documento; caso contrário, retorne null.`

export async function interpretarDocumentoPedido(buffer: Buffer, mimeType: string): Promise<PedidoExtraido> {
  const isPdf = mimeType === 'application/pdf'

  const response = await client.messages.parse({
    model: 'claude-opus-5',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          isPdf
            ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } }
            : { type: 'image', source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif', data: buffer.toString('base64') } },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(PedidoExtraidoSchema) },
  })

  if (!response.parsed_output) {
    throw new Error('Não foi possível interpretar o documento')
  }

  return response.parsed_output
}
