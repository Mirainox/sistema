import { Router } from 'express'
import { listar, buscar, gerar, distribuir, confirmarRecebimento, atualizarStatus } from '../controllers/os.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/:id', buscar)
router.post('/', gerar)
router.post('/:id/distribuir', distribuir)
router.patch('/:id/recebimento', confirmarRecebimento)
router.patch('/:id/status', atualizarStatus)

export default router
