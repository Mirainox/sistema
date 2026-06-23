import { Router } from 'express'
import { listar, buscar, criar, movimentar, abaixoMinimo, atualizar } from '../controllers/estoque.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/alertas/minimo', abaixoMinimo)
router.get('/:id', buscar)
router.post('/', criar)
router.put('/:id', atualizar)
router.post('/:id/movimentar', movimentar)

export default router
