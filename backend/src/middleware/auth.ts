import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { Role } from '@prisma/client'

export interface AuthRequest extends Request {
  usuario?: { id: string; role: Role; setor: string; nome: string }
}

export function autenticar(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' })
  }
  try {
    const token = header.split(' ')[1]
    const payload = verifyToken(token)
    req.usuario = payload as AuthRequest['usuario']
    next()
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}

export function autorizar(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario || !roles.includes(req.usuario.role)) {
      return res.status(403).json({ erro: 'Acesso não autorizado' })
    }
    next()
  }
}
