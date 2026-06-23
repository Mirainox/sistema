import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface MenuItem {
  label: string
  path: string
  icon: string
  roles?: string[]
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Pedidos', path: '/pedidos', icon: '📋', roles: ['ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL', 'VENDEDOR', 'FINANCEIRO'] },
  { label: 'O.S.', path: '/os', icon: '🔧', roles: ['ADMIN', 'DIRETOR', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL', 'PRODUCAO', 'ALMOXARIFE'] },
  { label: 'Compras', path: '/compras', icon: '🛒', roles: ['ADMIN', 'GESTOR_ADMIN', 'COMPRADOR', 'GERENTE_OPERACIONAL', 'ALMOXARIFE'] },
  { label: 'Estoque', path: '/estoque', icon: '📦', roles: ['ADMIN', 'GESTOR_ADMIN', 'ALMOXARIFE', 'GERENTE_OPERACIONAL'] },
  { label: 'Produção', path: '/producao', icon: '🏭', roles: ['ADMIN', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL', 'PRODUCAO'] },
  { label: 'Checklists', path: '/checklists', icon: '✅' },
  { label: 'Manutenção', path: '/manutencao', icon: '🔨', roles: ['ADMIN', 'GERENTE_OPERACIONAL', 'MANUTENCAO', 'LOJA_PECAS'] },
  { label: 'Expedição', path: '/expedicao', icon: '🚚', roles: ['ADMIN', 'GESTOR_ADMIN', 'GERENTE_OPERACIONAL', 'EXPEDICAO'] },
  { label: 'Financeiro', path: '/financeiro', icon: '💰', roles: ['ADMIN', 'GESTOR_ADMIN', 'FINANCEIRO', 'DIRETOR'] },
  { label: 'Fiscal', path: '/fiscal', icon: '🧾', roles: ['ADMIN', 'GESTOR_ADMIN', 'FISCAL'] },
  { label: 'RH / EPIs', path: '/rh', icon: '👷', roles: ['ADMIN', 'RH', 'GESTOR_ADMIN'] },
  { label: 'Usuários', path: '/usuarios', icon: '👥', roles: ['ADMIN', 'GESTOR_ADMIN'] },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { usuario, hasRole } = useAuth()

  const itensVisiveis = menuItems.filter(
    (item) => !item.roles || hasRole(...item.roles)
  )

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">Mirainox</h1>
        <p className="text-xs text-gray-400 mt-1">Sistema de Gestão</p>
      </div>

      <div className="p-4 border-b border-gray-700">
        <p className="text-sm font-medium">{usuario?.nome}</p>
        <p className="text-xs text-gray-400">{usuario?.cargo}</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {itensVisiveis.map((item) => {
            const ativo = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    ativo
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
