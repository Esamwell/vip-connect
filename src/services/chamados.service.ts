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
  cliente_nome?: string;
  loja_nome?: string;
}

export interface CriarChamadoData {
  cliente_vip_id: string;
  tipo: Chamado['tipo'];
  titulo: string;
  descricao: string;
  prioridade?: number;
}

/**
 * Serviço de chamados
 */
export const chamadosService = {
  /**
   * Cria um novo chamado
   */
  async create(data: CriarChamadoData): Promise<Chamado> {
    return api.post<Chamado>('/chamados', data);
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
   * Atualiza um chamado
   */
  async update(id: string, data: Partial<Chamado>): Promise<Chamado> {
    return api.patch<Chamado>(`/chamados/${id}`, data);
  },
};

