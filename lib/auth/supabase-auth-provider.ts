import type { AuthProvider } from "@/lib/auth/types";

export class SupabaseAuthProvider implements AuthProvider {
  async getCurrentUser() { return null; }
  async signOut() { return; }
}
