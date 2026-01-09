import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, authorizeLojista } from '../middleware/auth';

const router = express.Router();

// Todas as rotas de relatórios precisam de autenticação
router.use(authenticate);

/**
 * GET /api/relatorios/clientes-vip-mes
 * Lista de Clientes VIP cadastrados por mês (com nomes individuais)
 */
router.get(
  '/clientes-vip-mes',
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { mes, loja_id } = req.query;

      let query = `
        SELECT 
          cv.id,
          cv.nome as cliente_nome,
          cv.data_ativacao,
          DATE_TRUNC('month', cv.data_ativacao) as mes,
          cv.loja_id,
          l.nome as loja_nome,
          cv.status
        FROM clientes_vip cv
        JOIN lojas l ON cv.loja_id = l.id
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
          query += ` AND cv.loja_id = $${paramCount}`;
          params.push(lojaResult.rows[0].id);
          paramCount++;
        } else {
          return res.json([]);
        }
      } else if (loja_id) {
        query += ` AND cv.loja_id = $${paramCount}`;
        params.push(loja_id);
        paramCount++;
      }

      if (mes) {
        const ano = new Date().getFullYear();
        const mesFormatado = String(mes).padStart(2, '0');
        query += ` AND DATE_TRUNC('month', cv.data_ativacao) = $${paramCount}::date`;
        params.push(`${ano}-${mesFormatado}-01`);
        paramCount++;
      }

      query += ` ORDER BY cv.data_ativacao DESC`;

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
 * Uso de benefícios por parceiro (benefícios resgatados + validações)
 */
router.get(
  '/uso-beneficios',
  authorize('admin_mt', 'admin_shopping', 'parceiro', 'lojista'),
  async (req, res) => {
    try {
      const { mes } = req.query;
      const userRole = req.user!.role;
      const userId = req.user!.userId;

      // Obter filtros baseados no role
      let parceiroId: string | null = null;
      let lojaId: string | null = null;

      if (userRole === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1',
          [userId]
        );
        if (parceiroResult.rows.length === 0) {
          return res.json([]);
        }
        parceiroId = parceiroResult.rows[0].id;
      } else if (userRole === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1',
          [userId]
        );
        if (lojaResult.rows.length === 0) {
          return res.json([]);
        }
        lojaId = lojaResult.rows[0].id;
      }

      // Query para listar benefícios resgatados (clientes_beneficios onde resgatado = true)
      // e validações de benefícios (validacoes_beneficios) com nomes dos clientes
      let query = `
        WITH resgates AS (
          SELECT 
            cb.id,
            cv.nome as cliente_nome,
            cv.id as cliente_vip_id,
            COALESCE(bo.id, bl.id) as beneficio_id,
            COALESCE(bo.nome, bl.nome) as beneficio_nome,
            bo.parceiro_id,
            COALESCE(p.nome, l.nome) as parceiro_nome,
            cb.data_resgate as data_uso,
            'resgatado' as tipo_uso
          FROM clientes_beneficios cb
          INNER JOIN clientes_vip cv ON cb.cliente_vip_id = cv.id
          LEFT JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id AND cb.tipo = 'oficial'
          LEFT JOIN beneficios_loja bl ON cb.beneficio_loja_id = bl.id AND cb.tipo = 'loja'
          LEFT JOIN parceiros p ON bo.parceiro_id = p.id
          LEFT JOIN lojas l ON bl.loja_id = l.id
          WHERE cb.resgatado = true
            AND cb.data_resgate IS NOT NULL
      `;
      
      const params: any[] = [];
      let paramCount = 1;

      if (parceiroId) {
        query += ` AND bo.parceiro_id = $${paramCount}`;
        params.push(parceiroId);
        paramCount++;
      }

      if (lojaId) {
        query += ` AND (bl.loja_id = $${paramCount} OR cv.loja_id = $${paramCount})`;
        params.push(lojaId);
        paramCount++;
      }

      if (mes) {
        const ano = new Date().getFullYear();
        const mesFormatado = String(mes).padStart(2, '0');
        query += ` AND DATE_TRUNC('month', cb.data_resgate) = $${paramCount}::date`;
        params.push(`${ano}-${mesFormatado}-01`);
        paramCount++;
      }

      query += `
        ),
        validacoes AS (
          SELECT 
            vb.id,
            cv.nome as cliente_nome,
            cv.id as cliente_vip_id,
            COALESCE(bo.id, bl.id) as beneficio_id,
            COALESCE(bo.nome, bl.nome) as beneficio_nome,
            bo.parceiro_id,
            COALESCE(p.nome, l.nome) as parceiro_nome,
            vb.data_validacao as data_uso,
            'validado' as tipo_uso
          FROM validacoes_beneficios vb
          INNER JOIN clientes_vip cv ON vb.cliente_vip_id = cv.id
          LEFT JOIN beneficios_oficiais bo ON vb.beneficio_oficial_id = bo.id AND vb.tipo = 'oficial'
          LEFT JOIN beneficios_loja bl ON vb.beneficio_loja_id = bl.id AND vb.tipo = 'loja'
          LEFT JOIN parceiros p ON vb.parceiro_id = p.id
          LEFT JOIN lojas l ON bl.loja_id = l.id
          WHERE 1=1
      `;

      if (parceiroId) {
        query += ` AND vb.parceiro_id = $${paramCount}`;
        params.push(parceiroId);
        paramCount++;
      }

      if (lojaId) {
        query += ` AND (bl.loja_id = $${paramCount} OR cv.loja_id = $${paramCount})`;
        params.push(lojaId);
        paramCount++;
      }

      if (mes) {
        const ano = new Date().getFullYear();
        const mesFormatado = String(mes).padStart(2, '0');
        query += ` AND DATE_TRUNC('month', vb.data_validacao) = $${paramCount}::date`;
        params.push(`${ano}-${mesFormatado}-01`);
        paramCount++;
      }

      query += `
        )
        SELECT 
          cliente_nome,
          beneficio_nome,
          parceiro_nome,
          data_uso,
          tipo_uso
        FROM (
          SELECT cliente_nome, beneficio_nome, parceiro_nome, data_uso, tipo_uso FROM resgates
          UNION ALL
          SELECT cliente_nome, beneficio_nome, parceiro_nome, data_uso, tipo_uso FROM validacoes
        ) AS todos_usos
        ORDER BY data_uso DESC
      `;

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

