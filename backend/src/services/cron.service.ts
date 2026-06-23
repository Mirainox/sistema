import cron from 'node-cron'
import {
  notificarComprasPendentes,
  notificarFotosPendentes,
  notificarComprasPrazo,
} from './notificacao.service'

export function iniciarCronJobs() {
  // Notificar compras pendentes todos os dias às 8h
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Notificando compras pendentes...')
    await notificarComprasPendentes()
  })

  // Notificar fotos pendentes: segunda, quarta às 17h e sexta às 16h
  cron.schedule('0 17 * * 1,3', async () => {
    console.log('[CRON] Notificando fotos de produção (seg/qua)...')
    await notificarFotosPendentes()
  })

  cron.schedule('0 16 * * 5', async () => {
    console.log('[CRON] Notificando fotos e organização (sexta)...')
    await notificarFotosPendentes()
  })

  // Notificar compras próximas do prazo: segunda, quarta, sexta às 8h
  cron.schedule('0 8 * * 1,3,5', async () => {
    console.log('[CRON] Notificando compras próximas do prazo...')
    await notificarComprasPrazo()
  })

  console.log('[CRON] Jobs agendados com sucesso.')
}
