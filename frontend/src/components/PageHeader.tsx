import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Mostra um botão "Voltar". `true` volta uma página; string navega para a rota. */
  back?: boolean | string
  /** Conteúdo alinhado à direita (botões, badges, etc). */
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        {back && (
          <button
            onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
            className="btn-secondary"
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  )
}
