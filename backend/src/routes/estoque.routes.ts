import { Router } from 'express'
import { listar, buscar, criar, movimentar, abaixoMinimo, atualizar, lerFoto } from '../controllers/estoque.controller'
import { autenticar } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/alertas/minimo', abaixoMinimo)
router.post('/ler-foto', upload.single('arquivo'), lerFoto)
router.get('/:id', buscar)
router.post('/', criar)
router.put('/:id', atualizar)
router.post('/:id/movimentar', movimentar)

export default router
