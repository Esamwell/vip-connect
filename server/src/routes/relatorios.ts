import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, authorizeLojista } from '../middleware/auth';

const router = express.Router();

// Todas as rotas de relatórios precisam de autenticação
router.use(authenticate);

/**
 * GET /api/relatorios/clientes-vip-mes
 * Total de Clientes VIP por mês e por loja
 */
router.get(
  '/clientes-vip-mes',
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { mes, loja_id } = req.query;

      let query = `
        SELECT * FROM relatorio_clientes_vip_mes
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      // Se for lojista, filtrar apenas sua loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1',
          [req.user!.userId]
        );
        if (lojaResult.rows.length > 0) {
          query += ` AND loja_id = $${paramCount}`;
          params.push(lojaResult.rows[0].id);
          paramCount++;
        } else {
          return res.json([]);
        }
      } else if (loja_id) {
        query += ` AND loja_id = $${paramCount}`;
        params.push(loja_id);
        paramCount++;
      }

      if (mes) {
        query += ` AND mes = $${paramCount}`;
        params.push(mes);
        paramCount++;
      }

      query += ` ORDER BY mes DESC, total_clientes DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar relatório:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/relatorios/uso-beneficios
 * Uso de benefícios por parceiro
 */
router.get(
  '/uso-beneficios',
  authorize('admin_mt', 'admin_shopping', 'parceiro'),
  async (req, res) => {
    try {
      const { mes, parceiro_id } = req.query;

      let query = `
        SELECT * FROM relatorio_uso_beneficios
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      // Se for parceiro, filtrar apenas seus benefícios
      if (req.user!.role === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1',
          [req.user!.userId]
        );
        if (parceiroResult.rows.length > 0) {
          query += ` AND parceiro_id = $${paramCount}`;
          params.push(parceiroResult.rows[0].id);
          paramCount++;
        } else {
          return res.json([]);
        }
      } else if (parceiro_id) {
        query += ` AND parceiro_id = $${paramCount}`;
        params.push(parceiro_id);
        paramCount++;
      }

      if (mes) {
        query += ` AND mes = $${paramCount}`;
        params.push(mes);
        paramCount++;
      }

      query += ` ORDER BY mes DESC, total_validacoes DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar relatório:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/relatorios/chamados-loja
 * Chamados de pós-venda por loja
 */
router.get(
  '/chamados-loja',
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { mes, loja_id } = req.query;

      let query = `
        SELECT * FROM relatorio_chamados_loja
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      // Se for lojista, filtrar apenas sua loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1',
          [req.user!.userId]
        );
        if (lojaResult.rows.length > 0) {
          query += ` AND loja_id = $${paramCount}`;
          params.push(lojaResult.rows[0].id);
          paramCount++;
        } else {
          return res.json([]);
        }
      } else if (loja_id) {
        query += ` AND loja_id = $${paramCount}`;
        params.push(loja_id);
        paramCount++;
      }

      if (mes) {
        query += ` AND mes = $${paramCount}`;
        params.push(mes);
        paramCount++;
      }

      query += ` ORDER BY mes DESC, total_chamados DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar relatório:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/relatorios/clientes-vencimento-proximo
 * Clientes próximos do vencimento
 */
router.get(
  '/clientes-vencimento-proximo',
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      let query = `
        SELECT * FROM relatorio_clientes_vencimento_proximo
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      // Se for lojista, filtrar apenas sua loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1',
          [req.user!.userId]
        );
        if (lojaResult.rows.length > 0) {
          query += ` AND loja_id = $${paramCount}`;
          params.push(lojaResult.rows[0].id);
          paramCount++;
        } else {
          return res.json([]);
        }
      }

      query += ` ORDER BY dias_restantes ASC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar relatório:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/relatorios/clientes-renovados
 * Clientes renovados / recompra
 */
router.get(
  '/clientes-renovados',
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { data_inicio, data_fim } = req.query;

      let query = `
        SELECT * FROM relatorio_clientes_renovados
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      // Se for lojista, filtrar apenas sua loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1',
          [req.user!.userId]
        );
        if (lojaResult.rows.length > 0) {
          query += ` AND loja_id = $${paramCount}`;
          params.push(lojaResult.rows[0].id);
          paramCount++;
        } else {
          return res.json([]);
        }
      }

      if (data_inicio) {
        query += ` AND data_renovacao >= $${paramCount}`;
        params.push(data_inicio);
        paramCount++;
      }

      if (data_fim) {
        query += ` AND data_renovacao <= $${paramCount}`;
        params.push(data_fim);
        paramCount++;
      }

      query += ` ORDER BY data_renovacao DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar relatório:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

