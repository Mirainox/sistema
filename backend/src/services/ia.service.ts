import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

// Formato genérico: serve tanto para documentos de pedido (Pedido Gerado,
// Assinado, Comprovante) quanto para fotos soltas (produção, desenho,
// checklist) — por isso tudo é opcional e nunca é inventado.
export const DadosExtraidosSchema = z.object({
  resumo: z.string().nullable().describe('Resumo objetivo de uma frase do que é o documento/foto (ex.: "Pedido assinado pelo cliente", "Foto do andamento na caldeiraria")'),
  numeroPedido: z.string().nullable(),
  nomeCliente: z.string().nullable(),
  cidadeCliente: z.string().nullable(),
  estadoCliente: z.string().nullable(),
  telefoneCliente: z.string().nullable(),
  emailCliente: z.string().nullable(),
  equipamento: z.string().nullable(),
  modelo: z.string().nullable(),
  condicaoPagamento: z.string().nullable(),
  prazoEntrega: z.string().nullable().describe('Data no formato AAAA-MM-DD, ou null se não houver data explícita/dedutível'),
  valor: z.number().nullable().describe('Valor monetário principal do documento (ex.: valor do pedido ou do comprovante), apenas o número'),
  dataDocumento: z.string().nullable().describe('Data que aparece no documento (ex.: data de um comprovante de pagamento), formato AAAA-MM-DD'),
  bancoOuForma: z.string().nullable().describe('Banco ou forma de pagamento, quando for um comprovante'),
  observacoes: z.string().nullable().describe('Outras informações relevantes e objetivas do documento, resumidas em até 300 caracteres'),
})

export type DadosExtraidos = z.infer<typeof DadosExtraidosSchema>

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

const PROMPT = `Este é um documento ou foto anexado no sistema de gestão de uma empresa de equipamentos em aço inox (Mirainox) — pode ser um pedido de venda, um comprovante de pagamento, uma foto de andamento de produção, um desenho técnico, etc. Extraia as informações presentes.

Regras:
- Se um campo não estiver presente ou legível, retorne null para ele — nunca invente valores.
- Para valores monetários, retorne apenas o número (sem "R$", sem separador de milhar; ponto para casas decimais).
- Para datas, retorne no formato AAAA-MM-DD apenas se houver uma data explícita ou claramente dedutível; caso contrário, null.
- "resumo" deve sempre ser preenchido com uma frase objetiva do que é o documento, mesmo que os outros campos fiquem vazios.`

/**
 * Lê um documento/foto (PDF ou imagem) com a Claude e devolve os dados
 * estruturados encontrados nele. Não lança em caso de falha esperada
 * (arquivo ilegível, tipo não suportado, IA indisponível) — devolve null e
 * quem chamou decide o que fazer (normalmente: seguir sem a leitura).
 */
export async function lerAnexo(caminhoArquivo: string, mimeType: string): Promise<DadosExtraidos | null> {
  if (!client) return null

  const isPdf = mimeType === 'application/pdf'
  const isImagem = ['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)
  if (!isPdf && !isImagem) return null

  try {
    const buffer = await fs.readFile(caminhoArquivo)
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 2048,
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
      output_config: { format: zodOutputFormat(DadosExtraidosSchema) },
    })

    return response.parsed_output ?? null
  } catch (err) {
    console.error('[ia.service] Falha ao ler anexo:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Conveniência para ler um arquivo recém enviado pelo multer (diskStorage).
 * Nunca lança — em qualquer falha ou tipo não suportado, devolve null.
 */
export async function lerAnexoMulter(arquivo: { path: string; originalname: string } | undefined | null): Promise<DadosExtraidos | null> {
  if (!arquivo) return null
  const mime = mimeSuportadoParaLeitura(path.extname(arquivo.originalname))
  if (!mime) return null
  return lerAnexo(arquivo.path, mime)
}
