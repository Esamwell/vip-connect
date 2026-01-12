/**
 * Serviço de notificações
 */

import { api } from './api';

export interface Notificacao {
  id: string;
  tipo: 'vencimento_proximo' | 'vip_renovado' | 'beneficio_validado' | 'chamado_aberto' | 'chamado_resolvido';
  titulo: string;
  mensagem: string;
  created_at: string;
  enviada: boolean;
  data_envio?: string;
  cliente_nome?: string;
  loja_nome?: string;
}

/**
 * Serviço de notificações
 */
export const notificacoesService = {
  /**
   * Busca notificações do usuário
   */
  async listar(): Promise<Notificacao[]> {
    return api.get<Notificacao[]>('/dashboard/notificacoes');
  },

  /**
   * Marca uma notificação como lida
   */
  async marcarComoLida(id: string): Promise<void> {
    return api.patch(`/dashboard/notificacoes/${id}/marcar-lida`);
  },
};

