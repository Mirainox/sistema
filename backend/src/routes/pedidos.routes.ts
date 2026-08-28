import { Router } from 'express'
import { listar, buscar, criar, atualizar, atualizarStatus, atualizarComprovante, confirmarChecklist, confirmarPagamento } from '../controllers/pedidos.controller'
import { autenticar } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/:id', buscar)
router.post(
  '/',
  upload.fields([
    { name: 'comprovanteSinal', maxCount: 1 },
    { name: 'pedidoGerado', maxCount: 1 },
    { name: 'pedidoGeradoProducao', maxCount: 1 },
    { name: 'pedidoAssinado', maxCount: 1 },
  ]),
  criar
)
router.put('/:id', atualizar)
router.patch('/:id/comprovante', upload.single('comprovanteSinal'), atualizarComprovante)
router.patch('/:id/status', atualizarStatus)
router.patch('/:id/checklist', confirmarChecklist)
router.patch('/:id/pagamento', confirmarPagamento)

export default router
