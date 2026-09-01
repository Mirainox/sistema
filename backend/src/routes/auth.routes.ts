import { Router } from 'express'
import { login, perfil, atualizarPerfil, alterarSenha } from '../controllers/auth.controller'
import { autenticar } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()
router.post('/login', login)
router.get('/perfil', autenticar, perfil)
router.put('/perfil', autenticar, upload.single('fotoPerfil'), atualizarPerfil)
router.put('/senha', autenticar, alterarSenha)

export default router
