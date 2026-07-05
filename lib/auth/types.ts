export type AuthUser = { id: string; email: string | null };
export interface AuthProvider {
  getCurrentUser(): Promise<AuthUser | null>;
  signOut(): Promise<void>;
}
