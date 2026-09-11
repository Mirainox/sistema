import { Router } from 'express'
import { listar, buscar, criar, atualizar, desativar, resetarSenha } from '../controllers/users.controller'
import { autenticar, autorizar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/:id', buscar)
router.post('/', autorizar('ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO'), criar)
router.put('/:id', autorizar('ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO'), atualizar)
router.delete('/:id', autorizar('ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO'), desativar)
router.post('/:id/resetar-senha', autorizar('ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO'), resetarSenha)

export default router
