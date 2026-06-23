import { Router } from 'express'
import { criar, listar, responder, buscar } from '../controllers/checklists.controller'
import { autenticar } from '../middleware/auth'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/:id', buscar)
router.post('/', criar)
router.post('/:checklistId/responder', responder)

export default router
