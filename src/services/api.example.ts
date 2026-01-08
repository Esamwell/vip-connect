/**
 * Exemplo de serviço de API
 * 
 * Este arquivo mostra como usar as configurações do banco de dados
 * quando você criar o backend/API.
 * 
 * Por enquanto, este é apenas um exemplo de como estruturar.
 */

import { apiConfig } from '@/config/database';

// Exemplo: Buscar clientes VIP
export const fetchClientesVip = async () => {
  try {
    const response = await fetch(`${apiConfig.baseUrl}/clientes-vip`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar clientes VIP:', error);
    throw error;
  }
};

// Exemplo: Buscar ranking de lojas
export const fetchRankingLojas = async () => {
  try {
    const response = await fetch(`${apiConfig.baseUrl}/ranking/lojas`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    throw error;
  }
};

// Exemplo: Validar benefício
export const validarBeneficio = async (qrCode: string, parceiroId: string) => {
  try {
    const response = await fetch(`${apiConfig.baseUrl}/beneficios/validar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qr_code: qrCode,
        parceiro_id: parceiroId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao validar benefício:', error);
    throw error;
  }
};

// Exemplo: Criar chamado
export const criarChamado = async (chamadoData: {
  cliente_vip_id: string;
  tipo: string;
  titulo: string;
  descricao: string;
}) => {
  try {
    const response = await fetch(`${apiConfig.baseUrl}/chamados`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chamadoData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar chamado:', error);
    throw error;
  }
};

