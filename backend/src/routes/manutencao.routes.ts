import { Router } from 'express'
import { listar, buscar, abrir, atualizar, encerrar } from '../controllers/manutencao.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/:id', buscar)
router.post('/', abrir)
router.put('/:id', atualizar)
router.patch('/:id/encerrar', encerrar)

export default router
