import { api } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'admin_mt' | 'admin_shopping' | 'lojista' | 'parceiro' | 'cliente_vip';
  whatsapp?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Serviço de autenticação
 */
export const authService = {
  /**
   * Faz login
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Salvar token no localStorage
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  /**
   * Faz logout
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  /**
   * Verifica se está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Obtém o token atual
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  /**
   * Busca dados atualizados do usuário
   */
  async getMe(): Promise<User> {
    return api.get<User>('/auth/me');
  },
};

