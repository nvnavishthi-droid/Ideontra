// auth.ts — Safe session identity and authentication action contracts.
import type { Role } from "./idea";
export interface AuthIdentity {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface AuthResult {
  error?: string;
}
