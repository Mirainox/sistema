import { useState } from 'react'
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
  { label: 'Compras', path: '/compras', icon: '🛒', roles: ['ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'COMPRADOR', 'GERENTE_OPERACIONAL', 'ALMOXARIFE', 'PRODUCAO'] },
  { label: 'Almoxarifado', path: '/estoque', icon: '📦', roles: ['ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'ALMOXARIFE', 'GERENTE_OPERACIONAL'] },
  { label: 'Produção', path: '/producao', icon: '🏭', roles: ['ADMIN', 'DIRETOR', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL', 'PRODUCAO', 'ALMOXARIFE'] },
  { label: 'Checklists', path: '/checklists', icon: '✅' },
  { label: 'Manutenção', path: '/manutencao', icon: '🔨', roles: ['ADMIN', 'DIRETOR', 'GERENTE_OPERACIONAL', 'MANUTENCAO', 'LOJA_PECAS', 'PRODUCAO'] },
  { label: 'Expedição', path: '/expedicao', icon: '🚚', roles: ['ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GERENTE_OPERACIONAL', 'EXPEDICAO'] },
  { label: 'Financeiro', path: '/financeiro', icon: '💰', roles: ['ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'FINANCEIRO', 'GERENTE_OPERACIONAL'] },
  { label: 'Fiscal', path: '/fiscal', icon: '🧾', roles: ['ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'FISCAL', 'GERENTE_OPERACIONAL'] },
  { label: 'RH / EPIs', path: '/rh', icon: '👷', roles: ['ADMIN', 'DIRETOR', 'RH', 'GESTOR_ADMIN', 'GERENTE_OPERACIONAL'] },
  { label: 'Usuários', path: '/usuarios', icon: '👥', roles: ['ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GERENTE_OPERACIONAL'] },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { usuario, hasRole } = useAuth()
  const [colapsado, setColapsado] = useState(() => localStorage.getItem('mirainox_sidebar_colapsado') === '1')

  function alternarColapso() {
    setColapsado((prev) => {
      const proximo = !prev
      localStorage.setItem('mirainox_sidebar_colapsado', proximo ? '1' : '0')
      return proximo
    })
  }

  const itensVisiveis = menuItems.filter(
    (item) => !item.roles || hasRole(...item.roles)
  )

  return (
    <aside className={`relative ${colapsado ? 'w-16' : 'w-64'} bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-200 flex-shrink-0`}>
      <button
        onClick={alternarColapso}
        title={colapsado ? 'Expandir menu' : 'Recolher menu'}
        aria-label={colapsado ? 'Expandir menu' : 'Recolher menu'}
        className="absolute -right-3 top-8 w-6 h-6 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800 z-10"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={colapsado ? '9 6 15 12 9 18' : '15 6 9 12 15 18'} />
        </svg>
      </button>

      <div className={`border-b border-gray-700 ${colapsado ? 'p-3 text-center' : 'p-6'}`}>
        {colapsado ? (
          <h1 className="text-xl font-bold text-blue-400">M</h1>
        ) : (
          <>
            <h1 className="text-xl font-bold text-blue-400">Mirainox</h1>
            <p className="text-xs text-gray-400 mt-1">Sistema de Gestão</p>
          </>
        )}
      </div>

      {!colapsado && (
        <div className="p-4 border-b border-gray-700">
          <p className="text-sm font-medium">{usuario?.nome}</p>
          <p className="text-xs text-gray-400">{usuario?.cargo}</p>
        </div>
      )}

      <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {itensVisiveis.map((item) => {
            const ativo = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  title={colapsado ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${colapsado ? 'justify-center' : ''} ${
                    ativo
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  {!colapsado && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
