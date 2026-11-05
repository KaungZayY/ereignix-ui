export interface Session {
  user: { id: number; name: string; email: string }
  organization: { id: number; name: string; slug: string }
}
export interface AuthResponse extends Session {
  accessToken: string
  refreshToken: string
}
export interface Project {
  id: number
  organizationId: number
  name: string
  description: string | null
  createdAt: string
}
export interface ApiKey {
  id: number
  name: string
  keyId: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}
export interface WebhookEndpoint {
  id: number
  name: string
  url: string
  enabled: boolean
  eventNames: string[]
  createdAt: string
}
