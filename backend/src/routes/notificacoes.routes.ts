import { Router } from 'express'
import { listar, marcarLida, marcarTodasLidas, naoLidas } from '../controllers/notificacoes.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/nao-lidas', naoLidas)
router.patch('/:id/lida', marcarLida)
router.patch('/todas/lidas', marcarTodasLidas)

export default router
