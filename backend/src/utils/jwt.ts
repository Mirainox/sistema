import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'mirainox_secret'
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES } as jwt.SignOptions)
}

export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, SECRET) as jwt.JwtPayload
}
