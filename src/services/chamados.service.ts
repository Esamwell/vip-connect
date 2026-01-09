import { api } from './api';

export interface Chamado {
  id: string;
  cliente_vip_id: string;
  loja_id: string;
  tipo: 'documentacao' | 'ajuste_pos_venda' | 'problema_loja' | 'duvidas_gerais';
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'cancelado';
  titulo: string;
  descricao: string;
  prioridade: number;
  responsavel_id?: string;
  data_resolucao?: string;
  observacoes_resolucao?: string;
  created_at: string;
  updated_at?: string;
  cliente_nome?: string;
  loja_nome?: string;
  responsavel_nome?: string;
  veiculo_id?: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: number;
  veiculo_placa?: string;
}

export interface CriarChamadoData {
  cliente_vip_id: string;
  tipo: Chamado['tipo'];
  titulo: string;
  descricao: string;
  prioridade?: number;
  veiculo_id?: string;
}

export interface CriarChamadoPorQRData {
  qr_code: string;
  tipo: Chamado['tipo'];
  titulo: string;
  descricao: string;
  prioridade?: number;
  veiculo_id?: string;
}

/**
 * Serviço de chamados
 */
export const chamadosService = {
  /**
   * Cria um novo chamado (requer autenticação)
   */
  async create(data: CriarChamadoData): Promise<Chamado> {
    return api.post<Chamado>('/chamados', data);
  },

  /**
   * Cria um novo chamado usando QR Code (rota pública)
   */
  async createByQR(data: CriarChamadoPorQRData): Promise<Chamado> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${API_URL}/chamados/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Erro ao processar requisição',
      }));
      const errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return response.json();
  },

  /**
   * Lista chamados
   */
  async list(filters?: {
    loja_id?: string;
    status?: string;
    tipo?: string;
  }): Promise<Chamado[]> {
    const params = new URLSearchParams();
    if (filters?.loja_id) params.append('loja_id', filters.loja_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    
    const query = params.toString();
    return api.get<Chamado[]>(`/chamados${query ? `?${query}` : ''}`);
  },

  /**
   * Busca um chamado por ID
   */
  async getById(id: string): Promise<Chamado & { historico?: any[] }> {
    return api.get<Chamado & { historico?: any[] }>(`/chamados/${id}`);
  },

  /**
   * Atualiza um chamado
   */
  async update(id: string, data: Partial<Chamado>): Promise<Chamado> {
    return api.patch<Chamado>(`/chamados/${id}`, data);
  },
};

