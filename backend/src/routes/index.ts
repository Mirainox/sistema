import { Router } from 'express'
import authRoutes from './auth.routes'
import usersRoutes from './users.routes'
import pedidosRoutes from './pedidos.routes'
import osRoutes from './os.routes'
import comprasRoutes from './compras.routes'
import estoqueRoutes from './estoque.routes'
import checklistsRoutes from './checklists.routes'
import fotosRoutes from './fotos.routes'
import rhRoutes from './rh.routes'
import manutencaoRoutes from './manutencao.routes'
import expedicaoRoutes from './expedicao.routes'
import notificacoesRoutes from './notificacoes.routes'
import dashboardRoutes from './dashboard.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/usuarios', usersRoutes)
router.use('/pedidos', pedidosRoutes)
router.use('/os', osRoutes)
router.use('/compras', comprasRoutes)
router.use('/estoque', estoqueRoutes)
router.use('/checklists', checklistsRoutes)
router.use('/fotos', fotosRoutes)
router.use('/rh', rhRoutes)
router.use('/manutencao', manutencaoRoutes)
router.use('/expedicao', expedicaoRoutes)
router.use('/notificacoes', notificacoesRoutes)
router.use('/dashboard', dashboardRoutes)

export default router
