import { api } from './api';

export interface ClienteVip {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  loja_id: string;
  loja_nome?: string;
  status: 'ativo' | 'vencido' | 'renovado' | 'cancelado';
  data_venda: string;
  data_ativacao: string;
  data_validade: string;
  data_renovacao?: string;
  qr_code_digital: string;
  qr_code_fisico?: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: number;
  veiculo_placa?: string;
  potencial_recompra: boolean;
  beneficios_oficiais?: any[];
  beneficios_loja?: any[];
}

/**
 * Serviço de clientes VIP
 */
export const clientesService = {
  /**
   * Busca cliente VIP por ID ou QR Code
   */
  async getByIdOrQR(idOrQR: string): Promise<ClienteVip> {
    return api.get<ClienteVip>(`/clientes-vip/${idOrQR}`);
  },

  /**
   * Lista clientes VIP (com filtros)
   */
  async list(filters?: {
    loja_id?: string;
    status?: string;
    search?: string;
  }): Promise<ClienteVip[]> {
    const params = new URLSearchParams();
    if (filters?.loja_id) params.append('loja_id', filters.loja_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const query = params.toString();
    return api.get<ClienteVip[]>(`/clientes-vip${query ? `?${query}` : ''}`);
  },
};

