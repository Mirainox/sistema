import { Router } from 'express'
import { upload as uploadController, listarPorOS, listarPorSetor } from '../controllers/fotos.controller'
import { autenticar } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()
router.use(autenticar)
router.post('/upload', upload.single('foto'), uploadController)
router.get('/os/:osId', listarPorOS)
router.get('/setor/:setor', listarPorSetor)

export default router
