import { Router } from 'express'
import { resumo } from '../controllers/dashboard.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/resumo', resumo)

export default router
