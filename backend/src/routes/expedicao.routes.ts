import { Router } from 'express'
import { listar, criar, atualizar, sugerirRota } from '../controllers/expedicao.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/rota/sugerir', sugerirRota)
router.post('/', criar)
router.put('/:id', atualizar)

export default router
