import { Router } from 'express'
import { listar, buscar, criar, atualizar, desativar } from '../controllers/users.controller'
import { autenticar, autorizar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/:id', buscar)
router.post('/', autorizar('ADMIN', 'GESTOR_ADMIN'), criar)
router.put('/:id', autorizar('ADMIN', 'GESTOR_ADMIN'), atualizar)
router.delete('/:id', autorizar('ADMIN'), desativar)

export default router
