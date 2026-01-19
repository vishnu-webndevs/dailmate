export type Role = "admin" | "supervisor" | "agent"

export interface User {
  id: string
  email: string
  passwordHash: string
  role: Role
}
