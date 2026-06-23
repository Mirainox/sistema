import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ListaPedidos from './pages/Pedidos/ListaPedidos'
import NovoPedido from './pages/Pedidos/NovoPedido'
import DetalhePedido from './pages/Pedidos/DetalhePedido'
import ListaOS from './pages/OS/ListaOS'
import DetalheOS from './pages/OS/DetalheOS'
import ListaCompras from './pages/Compras/ListaCompras'
import NovaCompra from './pages/Compras/NovaCompra'
import ListaEstoque from './pages/Estoque/ListaEstoque'
import ControleEPI from './pages/RH/ControleEPI'
import PainelProducao from './pages/Producao/PainelProducao'
import ListaManutencao from './pages/Manutencao/ListaManutencao'
import ListaExpedicao from './pages/Expedicao/ListaExpedicao'
import ChecklistSexta from './pages/Checklists/ChecklistSexta'
import ListaChecklists from './pages/Checklists/ListaChecklists'
import PainelFinanceiro from './pages/Financeiro/PainelFinanceiro'
import PainelFiscal from './pages/Fiscal/PainelFiscal'
import GerenciarUsuarios from './pages/Usuarios/GerenciarUsuarios'

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Carregando...</div>
  if (!usuario) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { usuario } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<RotaProtegida><Layout /></RotaProtegida>}>
        <Route index element={<Dashboard />} />
        <Route path="pedidos" element={<ListaPedidos />} />
        <Route path="pedidos/novo" element={<NovoPedido />} />
        <Route path="pedidos/:id" element={<DetalhePedido />} />
        <Route path="os" element={<ListaOS />} />
        <Route path="os/:id" element={<DetalheOS />} />
        <Route path="compras" element={<ListaCompras />} />
        <Route path="compras/nova" element={<NovaCompra />} />
        <Route path="estoque" element={<ListaEstoque />} />
        <Route path="rh" element={<ControleEPI />} />
        <Route path="producao" element={<PainelProducao />} />
        <Route path="manutencao" element={<ListaManutencao />} />
        <Route path="expedicao" element={<ListaExpedicao />} />
        <Route path="checklists" element={<ListaChecklists />} />
        <Route path="checklists/sexta" element={<ChecklistSexta />} />
        <Route path="financeiro" element={<PainelFinanceiro />} />
        <Route path="fiscal" element={<PainelFiscal />} />
        <Route path="usuarios" element={<GerenciarUsuarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
