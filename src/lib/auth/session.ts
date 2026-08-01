import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { authConfig } from './config'

export interface SessionPayload extends JWTPayload {
  userId: string
  sessionId: string
  workspaceId?: string
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + authConfig.sessionMaxAge

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: authConfig.algorithm })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setIssuer(authConfig.issuer)
    .sign(new TextEncoder().encode(authConfig.secret))
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(authConfig.secret),
      {
        algorithms: [authConfig.algorithm],
        issuer: authConfig.issuer,
      }
    )
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function encryptRefreshToken(userId: string, tokenId: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + authConfig.refreshTokenMaxAge

  return new SignJWT({ userId, tokenId })
    .setProtectedHeader({ alg: authConfig.algorithm })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setIssuer(authConfig.issuer)
    .sign(new TextEncoder().encode(authConfig.secret))
}

export async function decryptRefreshToken(token: string): Promise<{ userId: string; tokenId: string } | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(authConfig.secret),
      {
        algorithms: [authConfig.algorithm],
        issuer: authConfig.issuer,
      }
    )
    return { userId: payload.userId as string, tokenId: payload.tokenId as string }
  } catch {
    return null
  }
}
