import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import type { UserRole } from '../types';

const router = express.Router();

/**
 * POST /api/premiacoes
 * Criar uma nova premiação por ranking (apenas admin_mt, admin_shopping)
 */
router.post('/', authenticate, authorize('admin_mt', 'admin_shopping'), async (req, res) => {
  try {
    const {
      nome,
      descricao,
      tipo,
      posicao_minima,
      posicao_maxima,
      premio,
      valor_premio
    } = req.body;

    // Validações básicas
    if (!nome || !tipo || !posicao_minima || !posicao_maxima || !premio) {
      return res.status(400).json({
        error: 'nome, tipo, posicao_minima, posicao_maxima e premio são obrigatórios'
      });
    }

    if (posicao_minima > posicao_maxima) {
      return res.status(400).json({
        error: 'posicao_minima não pode ser maior que posicao_maxima'
      });
    }

    // Criar premiação
    const result = await pool.query(
      `INSERT INTO premiacoes_ranking 
       (nome, descricao, tipo, posicao_minima, posicao_maxima, premio, valor_premio) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [nome, descricao, tipo, posicao_minima, posicao_maxima, premio, valor_premio]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar premiação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/premiacoes
 * Listar premiações disponíveis
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { tipo, ativo = 'true' } = req.query;

    let query = `
      SELECT pr.*, 
             COUNT(prr.id)::integer as total_premiacoes_recebidas
      FROM premiacoes_ranking pr
      LEFT JOIN premiacoes_recebidas prr ON pr.id = prr.premiacoes_ranking_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tipo) {
      query += ' AND pr.tipo = $1';
      params.push(tipo);
    }

    if (ativo === 'true') {
      query += ' AND pr.ativo = true';
      if (tipo) {
        params.push(ativo);
      } else {
        query += ' AND pr.ativo = $1';
        params.push(ativo);
      }
    }

    query += ' GROUP BY pr.id ORDER BY pr.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar premiações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/premiacoes/:id
 * Obter dados de uma premiação específica
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT pr.*, 
              COUNT(prr.id)::integer as total_premiacoes_recebidas
       FROM premiacoes_ranking pr
       LEFT JOIN premiacoes_recebidas prr ON pr.id = prr.premiacoes_ranking_id
       WHERE pr.id = $1
       GROUP BY pr.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Premiação não encontrada'
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao obter premiação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/premiacoes/:id
 * Atualizar uma premiação (apenas admin_mt, admin_shopping)
 */
router.put('/:id', authenticate, authorize('admin_mt', 'admin_shopping'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      tipo,
      posicao_minima,
      posicao_maxima,
      premio,
      valor_premio,
      ativo
    } = req.body;

    // Verificar se a premiação existe
    const checkResult = await pool.query(
      'SELECT id FROM premiacoes_ranking WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Premiação não encontrada'
      });
    }

    if (posicao_minima && posicao_maxima && posicao_minima > posicao_maxima) {
      return res.status(400).json({
        error: 'posicao_minima não pode ser maior que posicao_maxima'
      });
    }

    // Atualizar premiação
    const result = await pool.query(
      `UPDATE premiacoes_ranking 
       SET nome = COALESCE($1, nome),
           descricao = COALESCE($2, descricao),
           tipo = COALESCE($3, tipo),
           posicao_minima = COALESCE($4, posicao_minima),
           posicao_maxima = COALESCE($5, posicao_maxima),
           premio = COALESCE($6, premio),
           valor_premio = COALESCE($7, valor_premio),
           ativo = COALESCE($8, ativo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [nome, descricao, tipo, posicao_minima, posicao_maxima, premio, valor_premio, ativo, id]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar premiação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/premiacoes/:id
 * Desativar uma premiação (soft delete)
 */
router.delete('/:id', authenticate, authorize('admin_mt', 'admin_shopping'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a premiação existe
    const checkResult = await pool.query(
      'SELECT id FROM premiacoes_ranking WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Premiação não encontrada'
      });
    }

    // Desativar premiação
    await pool.query(
      'UPDATE premiacoes_ranking SET ativo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'Premiação desativada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar premiação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/premiacoes/calcular/:periodo
 * Calcular premiações para um período específico
 */
router.get('/calcular/:periodo', authenticate, authorize('admin_mt', 'admin_shopping'), async (req, res) => {
  try {
    const { periodo } = req.params;
    const { tipo_ranking = 'vendas' } = req.query;

    // Validar formato do período (YYYY-MM)
    const periodoRegex = /^\d{4}-\d{2}$/;
    if (!periodoRegex.test(periodo)) {
      return res.status(400).json({
        error: 'Período deve estar no formato YYYY-MM'
      });
    }

    const periodoDate = new Date(periodo + '-01');

    // Obter ranking do período
    let rankingQuery = '';
    if (tipo_ranking === 'vendas') {
      rankingQuery = `
        SELECT 
          v.id as vendedor_id,
          v.nome as vendedor_nome,
          v.loja_id,
          l.nome as loja_nome,
          COUNT(vd.id)::integer as total_vendas,
          COALESCE(SUM(vd.valor), 0) as valor_total_vendas,
          ROW_NUMBER() OVER (PARTITION BY v.loja_id ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_loja,
          ROW_NUMBER() OVER (ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_geral
        FROM vendedores v
        JOIN lojas l ON v.loja_id = l.id
        LEFT JOIN vendas vd ON v.id = vd.vendedor_id 
          AND DATE_TRUNC('month', vd.data_venda) = DATE_TRUNC('month', $1::date)
        WHERE v.ativo = true
        GROUP BY v.id, v.nome, v.loja_id, l.nome
        ORDER BY total_vendas DESC, valor_total_vendas DESC
      `;
    } else {
      rankingQuery = `
        SELECT 
          v.id as vendedor_id,
          v.nome as vendedor_nome,
          v.loja_id,
          l.nome as loja_nome,
          COUNT(a.id)::integer as total_avaliacoes,
          COALESCE(AVG(a.nota), 0) as nota_media,
          ROW_NUMBER() OVER (PARTITION BY v.loja_id ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_loja,
          ROW_NUMBER() OVER (ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_geral
        FROM vendedores v
        JOIN lojas l ON v.loja_id = l.id
        LEFT JOIN avaliacoes a ON v.id = a.vendedor_id 
          AND DATE_TRUNC('month', a.created_at) = DATE_TRUNC('month', $1::date)
        WHERE v.ativo = true
        GROUP BY v.id, v.nome, v.loja_id, l.nome
        HAVING COUNT(a.id) > 0
        ORDER BY nota_media DESC, total_avaliacoes DESC
      `;
    }

    const rankingResult = await pool.query(rankingQuery, [periodo]);

    // Obter premiações ativas
    const premiacoesResult = await pool.query(
      'SELECT * FROM premiacoes_ranking WHERE ativo = true ORDER BY posicao_minima',
      []
    );

    // Calcular premiações
    const premiacoesCalculadas: any[] = [];

    for (const premiação of premiacoesResult.rows) {
      const vendedoresPremiados = rankingResult.rows.filter(vendedor => {
        if (premiação.tipo === 'loja') {
          return vendedor.posicao_ranking_loja >= premiação.posicao_minima && 
                 vendedor.posicao_ranking_loja <= premiação.posicao_maxima;
        } else {
          return vendedor.posicao_ranking_geral >= premiação.posicao_minima && 
                 vendedor.posicao_ranking_geral <= premiação.posicao_maxima;
        }
      });

      for (const vendedor of vendedoresPremiados) {
        // Verificar se já não foi premiado
        const existingPremiacao = await pool.query(
          'SELECT id FROM premiacoes_recebidas WHERE vendedor_id = $1 AND premiacoes_ranking_id = $2 AND periodo_referencia = $3',
          [vendedor.vendedor_id, premiação.id, periodoDate]
        );

        if (existingPremiacao.rows.length === 0) {
          premiacoesCalculadas.push({
            vendedor_id: vendedor.vendedor_id,
            vendedor_nome: vendedor.vendedor_nome,
            loja_id: vendedor.loja_id,
            loja_nome: vendedor.loja_nome,
            premiacoes_ranking_id: premiação.id,
            premio_nome: premiação.nome,
            premio_descricao: premiação.descricao,
            premio: premiação.premio,
            valor_premio: premiação.valor_premio,
            posicao_ranking: premiação.tipo === 'loja' ? vendedor.posicao_ranking_loja : vendedor.posicao_ranking_geral,
            periodo_referencia: periodoDate
          });
        }
      }
    }

    res.json({
      periodo,
      tipo_ranking,
      total_vendedores: rankingResult.rows.length,
      total_premiacoes: premiacoesCalculadas.length,
      premiacoes: premiacoesCalculadas
    });
  } catch (error: any) {
    console.error('Erro ao calcular premiações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/premiacoes/conceder
 * Conceder premiações calculadas
 */
router.post('/conceder', authenticate, authorize('admin_mt', 'admin_shopping'), async (req, res) => {
  try {
    const { periodo, tipo_ranking = 'vendas', premiacoes } = req.body;

    if (!periodo || !premiacoes || !Array.isArray(premiacoes)) {
      return res.status(400).json({
        error: 'periodo e premiacoes (array) são obrigatórios'
      });
    }

    // Validar formato do período
    const periodoRegex = /^\d{4}-\d{2}$/;
    if (!periodoRegex.test(periodo)) {
      return res.status(400).json({
        error: 'Período deve estar no formato YYYY-MM'
      });
    }

    const periodoDate = new Date(periodo + '-01');

    // Iniciar transação
    await pool.query('BEGIN');

    try {
      const premiacoesConcedidas: any[] = [];

      for (const premiação of premiacoes) {
        const {
          vendedor_id,
          premiacoes_ranking_id,
          posicao_ranking
        } = premiação;

        // Verificar se já não foi concedido
        const existingPremiacao = await pool.query(
          'SELECT id FROM premiacoes_recebidas WHERE vendedor_id = $1 AND premiacoes_ranking_id = $2 AND periodo_referencia = $3',
          [vendedor_id, premiacoes_ranking_id, periodoDate]
        );

        if (existingPremiacao.rows.length === 0) {
          // Inserir premiação recebida
          const result = await pool.query(
            `INSERT INTO premiacoes_recebidas 
             (vendedor_id, premiacoes_ranking_id, periodo_referencia, posicao_ranking) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [vendedor_id, premiacoes_ranking_id, periodoDate, posicao_ranking]
          );

          premiacoesConcedidas.push(result.rows[0]);
        }
      }

      await pool.query('COMMIT');

      res.status(201).json({
        message: 'Premiações concedidas com sucesso',
        total_concedidas: premiacoesConcedidas.length,
        premiacoes: premiacoesConcedidas
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Erro ao conceder premiações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/premiacoes/vendedor/:vendedorId
 * Listar premiações recebidas por um vendedor
 */
router.get('/vendedor/:vendedorId', authenticate, async (req, res) => {
  try {
    const { vendedorId } = req.params;

    // Verificar se o vendedor existe e se tem permissão
    let checkQuery = `
      SELECT v.*, l.user_id as loja_user_id 
      FROM vendedores v 
      JOIN lojas l ON v.loja_id = l.id 
      WHERE v.id = $1 AND v.ativo = true
    `;
    const checkResult = await pool.query(checkQuery, [vendedorId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vendedor não encontrado'
      });
    }

    const vendedor = checkResult.rows[0];

    // Verificar permissões
    const isOwnProfile = req.user!.role === 'vendedor' && req.user!.userId === vendedor.user_id;
    const isLojista = req.user!.role === 'lojista' && vendedor.loja_user_id === req.user!.userId;
    const isAdmin = ['admin_mt', 'admin_shopping'].includes(req.user!.role);

    if (!isOwnProfile && !isLojista && !isAdmin) {
      return res.status(403).json({
        error: 'Sem permissão para visualizar premiações deste vendedor'
      });
    }

    const result = await pool.query(
      `SELECT prr.*, 
              pr.nome as premio_nome, 
              pr.descricao as premio_descricao,
              pr.tipo as premio_tipo,
              pr.premio as premio_descricao_premio,
              pr.valor_premio as premio_valor
       FROM premiacoes_recebidas prr
       JOIN premiacoes_ranking pr ON prr.premiacoes_ranking_id = pr.id
       WHERE prr.vendedor_id = $1
       ORDER BY prr.periodo_referencia DESC, prr.data_premiacao DESC`,
      [vendedorId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar premiações do vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PATCH /api/premiacoes/recebidas/:id/status
 * Atualizar status de uma premiação recebida
 */
router.patch('/recebidas/:id/status', authenticate, authorize('admin_mt', 'admin_shopping', 'lojista'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacoes } = req.body;

    if (!status || !['pendente', 'recebido', 'cancelado'].includes(status)) {
      return res.status(400).json({
        error: 'Status inválido. Deve ser: pendente, recebido ou cancelado'
      });
    }

    // Verificar se a premiação recebida existe e se o lojista tem permissão
    let checkQuery = `
      SELECT prr.*, v.user_id as vendedor_user_id, l.user_id as loja_user_id
      FROM premiacoes_recebidas prr
      JOIN vendedores v ON prr.vendedor_id = v.id
      JOIN lojas l ON v.loja_id = l.id
      WHERE prr.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Premiação recebida não encontrada'
      });
    }

    const premiacao = checkResult.rows[0];

    // Se for lojista, verificar se a premiação é de um vendedor da sua loja
    if (req.user!.role === 'lojista' && premiacao.loja_user_id !== req.user!.userId) {
      return res.status(403).json({
        error: 'Você só pode editar premiações de vendedores da sua própria loja'
      });
    }

    // Atualizar status
    const result = await pool.query(
      `UPDATE premiacoes_recebidas 
       SET status = $1, 
           observacoes = COALESCE($2, observacoes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, observacoes, id]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar status da premiação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
