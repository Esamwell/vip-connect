import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/beneficios/validar
 * Valida um benefício (parceiro escaneia QR ou digita código)
 */
router.post(
  '/validar',
  authenticate,
  authorize('parceiro', 'admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { qr_code, beneficio_oficial_id, beneficio_loja_id } = req.body;

      if (!qr_code) {
        return res.status(400).json({
          error: 'QR Code é obrigatório',
        });
      }

      // Buscar cliente VIP pelo QR Code
      const clienteResult = await pool.query(
        `SELECT cv.*, l.nome as loja_nome
         FROM clientes_vip cv
         JOIN lojas l ON cv.loja_id = l.id
         WHERE cv.qr_code_digital = $1 OR cv.qr_code_fisico = $1`,
        [qr_code]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Cliente VIP não encontrado ou QR Code inválido',
        });
      }

      const cliente = clienteResult.rows[0];

      // Verificar se cliente está ativo
      if (cliente.status !== 'ativo') {
        return res.status(400).json({
          error: `Cliente VIP está ${cliente.status}. Apenas clientes ativos podem usar benefícios.`,
        });
      }

      // Verificar se a validade não expirou
      const hoje = new Date();
      const dataValidade = new Date(cliente.data_validade);
      if (dataValidade < hoje) {
        return res.status(400).json({
          error: 'Cliente VIP está vencido. Renovação necessária.',
        });
      }

      // Buscar parceiro do usuário autenticado
      const parceiroResult = await pool.query(
        'SELECT id FROM parceiros WHERE user_id = $1',
        [req.user!.userId]
      );

      if (parceiroResult.rows.length === 0) {
        return res.status(403).json({
          error: 'Usuário não está associado a um parceiro',
        });
      }

      const parceiroId = parceiroResult.rows[0].id;

      // Verificar qual benefício está sendo validado
      let beneficioId: string | null = null;
      let tipoBeneficio: 'oficial' | 'loja' = 'oficial';

      if (beneficio_oficial_id) {
        // Verificar se o benefício oficial pertence ao parceiro
        const beneficioResult = await pool.query(
          'SELECT id FROM beneficios_oficiais WHERE id = $1 AND parceiro_id = $2 AND ativo = true',
          [beneficio_oficial_id, parceiroId]
        );

        if (beneficioResult.rows.length === 0) {
          return res.status(400).json({
            error: 'Benefício não encontrado ou não disponível para este parceiro',
          });
        }

        beneficioId = beneficio_oficial_id;
        tipoBeneficio = 'oficial';
      } else if (beneficio_loja_id) {
        // Verificar se o benefício de loja existe e está ativo
        const beneficioResult = await pool.query(
          'SELECT id FROM beneficios_loja WHERE id = $1 AND ativo = true',
          [beneficio_loja_id]
        );

        if (beneficioResult.rows.length === 0) {
          return res.status(400).json({
            error: 'Benefício não encontrado',
          });
        }

        beneficioId = beneficio_loja_id;
        tipoBeneficio = 'loja';
      } else {
        // Se não especificou, buscar primeiro benefício oficial do parceiro
        const beneficioResult = await pool.query(
          'SELECT id FROM beneficios_oficiais WHERE parceiro_id = $1 AND ativo = true LIMIT 1',
          [parceiroId]
        );

        if (beneficioResult.rows.length === 0) {
          return res.status(400).json({
            error: 'Nenhum benefício disponível para este parceiro',
          });
        }

        beneficioId = beneficioResult.rows[0].id;
        tipoBeneficio = 'oficial';
      }

      // Registrar validação
      const validacaoResult = await pool.query(
        `INSERT INTO validacoes_beneficios (
          cliente_vip_id, parceiro_id, beneficio_oficial_id, 
          beneficio_loja_id, tipo, codigo_qr
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          cliente.id,
          parceiroId,
          tipoBeneficio === 'oficial' ? beneficioId : null,
          tipoBeneficio === 'loja' ? beneficioId : null,
          tipoBeneficio,
          qr_code,
        ]
      );

      const validacao = validacaoResult.rows[0];

      res.status(201).json({
        validacao,
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          status: cliente.status,
          data_validade: cliente.data_validade,
          loja_nome: cliente.loja_nome,
        },
        mensagem: 'Benefício validado com sucesso!',
      });
    } catch (error: any) {
      console.error('Erro ao validar benefício:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/beneficios/validar/:qr_code
 * Busca informações do cliente pelo QR Code (para tela do parceiro)
 */
router.get(
  '/validar/:qr_code',
  authenticate,
  authorize('parceiro', 'admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { qr_code } = req.params;

      // Buscar cliente VIP
      const clienteResult = await pool.query(
        `SELECT cv.*, l.nome as loja_nome
         FROM clientes_vip cv
         JOIN lojas l ON cv.loja_id = l.id
         WHERE cv.qr_code_digital = $1 OR cv.qr_code_fisico = $1`,
        [qr_code]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Cliente VIP não encontrado',
        });
      }

      const cliente = clienteResult.rows[0];

      // Buscar parceiro do usuário
      const parceiroResult = await pool.query(
        'SELECT id, nome, tipo FROM parceiros WHERE user_id = $1',
        [req.user!.userId]
      );

      if (parceiroResult.rows.length === 0) {
        return res.status(403).json({
          error: 'Usuário não está associado a um parceiro',
        });
      }

      const parceiro = parceiroResult.rows[0];

      // Buscar benefícios válidos para este parceiro
      const beneficiosOficiais = await pool.query(
        `SELECT bo.*
         FROM beneficios_oficiais bo
         WHERE bo.parceiro_id = $1 AND bo.ativo = true`,
        [parceiro.id]
      );

      // Buscar benefícios da loja do cliente
      const beneficiosLoja = await pool.query(
        `SELECT bl.*
         FROM beneficios_loja bl
         WHERE bl.loja_id = $1 AND bl.ativo = true`,
        [cliente.loja_id]
      );

      res.json({
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          status: cliente.status,
          data_validade: cliente.data_validade,
          loja_nome: cliente.loja_nome,
          valido: cliente.status === 'ativo' && new Date(cliente.data_validade) >= new Date(),
        },
        parceiro: {
          id: parceiro.id,
          nome: parceiro.nome,
          tipo: parceiro.tipo,
        },
        beneficios_oficiais: beneficiosOficiais.rows,
        beneficios_loja: beneficiosLoja.rows,
      });
    } catch (error: any) {
      console.error('Erro ao buscar informações do QR Code:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

