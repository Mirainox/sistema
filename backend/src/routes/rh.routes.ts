import { Router } from 'express'
import { listarEpis, registrarEntregaEpi, confirmarRecebimentoEpi, historicoEpi } from '../controllers/rh.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/epis', listarEpis)
router.post('/epis', registrarEntregaEpi)
router.patch('/epis/:id/confirmar', confirmarRecebimentoEpi)
router.get('/epis/historico/:funcionarioId', historicoEpi)

export default router
