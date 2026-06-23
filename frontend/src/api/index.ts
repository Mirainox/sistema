import api from './axios'

export const authApi = {
  login: (email: string, senha: string) => api.post('/auth/login', { email, senha }),
  perfil: () => api.get('/auth/perfil'),
  alterarSenha: (senhaAtual: string, novaSenha: string) => api.put('/auth/senha', { senhaAtual, novaSenha }),
}

export const usuariosApi = {
  listar: () => api.get('/usuarios'),
  buscar: (id: string) => api.get(`/usuarios/${id}`),
  criar: (data: any) => api.post('/usuarios', data),
  atualizar: (id: string, data: any) => api.put(`/usuarios/${id}`, data),
  desativar: (id: string) => api.delete(`/usuarios/${id}`),
}

export const pedidosApi = {
  listar: (params?: any) => api.get('/pedidos', { params }),
  buscar: (id: string) => api.get(`/pedidos/${id}`),
  criar: (data: any) => api.post('/pedidos', data),
  atualizar: (id: string, data: any) => api.put(`/pedidos/${id}`, data),
  atualizarStatus: (id: string, status: string) => api.patch(`/pedidos/${id}/status`, { status }),
  confirmarChecklist: (id: string) => api.patch(`/pedidos/${id}/checklist`),
  confirmarPagamento: (id: string) => api.patch(`/pedidos/${id}/pagamento`),
}

export const osApi = {
  listar: (params?: any) => api.get('/os', { params }),
  buscar: (id: string) => api.get(`/os/${id}`),
  gerar: (pedidoId: string) => api.post('/os', { pedidoId }),
  distribuir: (id: string, setores: any[]) => api.post(`/os/${id}/distribuir`, { setores }),
  confirmarRecebimento: (id: string, data: any) => api.patch(`/os/${id}/recebimento`, data),
  atualizarStatus: (id: string, status: string) => api.patch(`/os/${id}/status`, { status }),
}

export const comprasApi = {
  listar: (params?: any) => api.get('/compras', { params }),
  buscar: (id: string) => api.get(`/compras/${id}`),
  solicitar: (data: any) => api.post('/compras', data),
  marcarCiente: (id: string) => api.patch(`/compras/${id}/ciente`),
  registrarPedido: (id: string, data: any) => api.patch(`/compras/${id}/pedido`, data),
  atualizarStatus: (id: string, status: string) => api.patch(`/compras/${id}/status`, { status }),
}

export const estoqueApi = {
  listar: (params?: any) => api.get('/estoque', { params }),
  buscar: (id: string) => api.get(`/estoque/${id}`),
  criar: (data: any) => api.post('/estoque', data),
  atualizar: (id: string, data: any) => api.put(`/estoque/${id}`, data),
  movimentar: (id: string, data: any) => api.post(`/estoque/${id}/movimentar`, data),
  abaixoMinimo: () => api.get('/estoque/alertas/minimo'),
}

export const checklistsApi = {
  listar: (params?: any) => api.get('/checklists', { params }),
  buscar: (id: string) => api.get(`/checklists/${id}`),
  criar: (data: any) => api.post('/checklists', data),
  responder: (id: string, respostas: any[]) => api.post(`/checklists/${id}/responder`, { respostas }),
}

export const fotosApi = {
  upload: (formData: FormData) => api.post('/fotos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listarPorOS: (osId: string) => api.get(`/fotos/os/${osId}`),
  listarPorSetor: (setor: string) => api.get(`/fotos/setor/${setor}`),
}

export const rhApi = {
  listarEpis: (params?: any) => api.get('/rh/epis', { params }),
  registrarEntrega: (data: any) => api.post('/rh/epis', data),
  confirmarRecebimento: (id: string) => api.patch(`/rh/epis/${id}/confirmar`),
  historico: (funcionarioId: string) => api.get(`/rh/epis/historico/${funcionarioId}`),
}

export const manutencaoApi = {
  listar: (params?: any) => api.get('/manutencao', { params }),
  buscar: (id: string) => api.get(`/manutencao/${id}`),
  abrir: (data: any) => api.post('/manutencao', data),
  atualizar: (id: string, data: any) => api.put(`/manutencao/${id}`, data),
  encerrar: (id: string, solucao: string) => api.patch(`/manutencao/${id}/encerrar`, { solucao }),
}

export const expedicaoApi = {
  listar: (params?: any) => api.get('/expedicao', { params }),
  criar: (data: any) => api.post('/expedicao', data),
  atualizar: (id: string, data: any) => api.put(`/expedicao/${id}`, data),
  sugerirRota: (params?: any) => api.get('/expedicao/rota/sugerir', { params }),
}

export const notificacoesApi = {
  listar: () => api.get('/notificacoes'),
  naoLidas: () => api.get('/notificacoes/nao-lidas'),
  marcarLida: (id: string) => api.patch(`/notificacoes/${id}/lida`),
  marcarTodasLidas: () => api.patch('/notificacoes/todas/lidas'),
}

export const dashboardApi = {
  resumo: () => api.get('/dashboard/resumo'),
}
