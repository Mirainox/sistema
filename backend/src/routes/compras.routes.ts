import { Router } from 'express'
import { listar, buscar, solicitar, marcarCiente, registrarPedido, atualizarStatus } from '../controllers/compras.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/:id', buscar)
router.post('/', solicitar)
router.patch('/:id/ciente', marcarCiente)
router.patch('/:id/pedido', registrarPedido)
router.patch('/:id/status', atualizarStatus)

export default router
