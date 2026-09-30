const publicAppUrl = process.env.PUBLIC_APP_URL?.trim()

export const signingConfig = {
  publicAppUrl: publicAppUrl || undefined,
  jwtSecret: process.env.JWT_SECRET || process.env.PRIVATE_KEY,
}
