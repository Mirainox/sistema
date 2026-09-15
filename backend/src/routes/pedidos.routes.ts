import { Router } from 'express'
import { listar, listarProjetos, listarAlmoxarifado, listarEntregas, buscar, criar, atualizar, atualizarStatus, atualizarComprovante, atualizarAmostra, confirmarChecklist, revisarFinanceiro, conferenciaGerente, marcarDesenhoEtapa, anexarDesenho, atualizarFaseEntrega, marcarErro, lerDocumento } from '../controllers/pedidos.controller'
import { autenticar } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()
router.use(autenticar)
router.get('/', listar)
router.get('/projetos', listarProjetos)
router.get('/almoxarifado', listarAlmoxarifado)
router.get('/entregas', listarEntregas)
router.post('/ler-documento', upload.single('arquivo'), lerDocumento)
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
router.patch('/:id/amostra', atualizarAmostra)
router.patch('/:id/conferencia-gerente', conferenciaGerente)
router.patch('/:id/desenho', marcarDesenhoEtapa)
router.post('/:id/desenho-anexo', upload.single('arquivo'), anexarDesenho)
router.patch('/:id/erro', marcarErro)
router.patch('/:id/entrega', atualizarFaseEntrega)
router.patch('/:id/status', atualizarStatus)
router.patch('/:id/checklist', confirmarChecklist)
router.patch('/:id/financeiro', revisarFinanceiro)

export default router
