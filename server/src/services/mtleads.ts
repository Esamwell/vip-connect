import axios from 'axios';

const MT_LEADS_WEBHOOK_URL = process.env.MT_LEADS_WEBHOOK_URL || '';
const MT_LEADS_API_TOKEN = process.env.MT_LEADS_API_TOKEN || '';

/**
 * Dispara evento para MT Leads via webhook
 */
export const enviarEventoMTLeads = async (
  tipo: string,
  dados: Record<string, any>
): Promise<void> => {
  if (!MT_LEADS_WEBHOOK_URL) {
    console.warn('⚠️ MT_LEADS_WEBHOOK_URL não configurado. Evento não enviado.');
    return;
  }

  try {
    const payload = {
      tipo,
      timestamp: new Date().toISOString(),
      dados,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (MT_LEADS_API_TOKEN) {
      headers['Authorization'] = `Bearer ${MT_LEADS_API_TOKEN}`;
    }

    await axios.post(MT_LEADS_WEBHOOK_URL, payload, { headers });

    console.log(`✅ Evento ${tipo} enviado para MT Leads`);
  } catch (error: any) {
    console.error('❌ Erro ao enviar evento para MT Leads:', error.message);
    // Não lançar erro para não quebrar o fluxo principal
  }
};

/**
 * Tipos de eventos suportados
 */
export const EventosMTLeads = {
  VIP_ATIVADO: 'vip_ativado',
  VENCIMENTO_PROXIMO: 'vencimento_proximo',
  VIP_RENOVADO: 'vip_renovado',
  BENEFICIO_VALIDADO: 'beneficio_validado',
  CHAMADO_ABERTO: 'chamado_aberto',
  CHAMADO_RESOLVIDO: 'chamado_resolvido',
} as const;

