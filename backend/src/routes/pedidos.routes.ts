import { Router } from 'express'
import { listar, buscar, criar, atualizar, atualizarStatus, confirmarChecklist, confirmarPagamento } from '../controllers/pedidos.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/:id', buscar)
router.post('/', criar)
router.put('/:id', atualizar)
router.patch('/:id/status', atualizarStatus)
router.patch('/:id/checklist', confirmarChecklist)
router.patch('/:id/pagamento', confirmarPagamento)

export default router
