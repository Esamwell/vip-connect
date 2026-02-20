import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/ranking-vendedores/vendas
 * Obter ranking de vendedores por vendas
 */
router.get('/vendas', authenticate, async (req, res) => {
  try {
    const { periodo = 'mes', loja_id } = req.query;

    let whereClause = 'WHERE v.ativo = true';
    const params: any[] = [];

    // Filtrar por loja se especificado ou se for lojista
    if (loja_id) {
      whereClause += ' AND v.loja_id = $1';
      params.push(loja_id);
    } else if (req.user!.role === 'lojista') {
      whereClause += ' AND v.loja_id IN (SELECT id FROM lojas WHERE user_id = $1)';
      params.push(req.user!.userId);
    }

    // Filtrar por período
    switch (periodo) {
      case 'hoje':
        whereClause += ' AND vd.data_venda = CURRENT_DATE';
        break;
      case 'semana':
        whereClause += ' AND vd.data_venda >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'mes':
        whereClause += ' AND vd.data_venda >= DATE_TRUNC(\'month\', CURRENT_DATE)';
        break;
      case 'trimestre':
        whereClause += ' AND vd.data_venda >= DATE_TRUNC(\'quarter\', CURRENT_DATE)';
        break;
      case 'ano':
        whereClause += ' AND vd.data_venda >= DATE_TRUNC(\'year\', CURRENT_DATE)';
        break;
    }

    const query = `
      SELECT 
        v.id,
        v.nome,
        v.loja_id,
        l.nome as loja_nome,
        COUNT(vd.id)::integer as total_vendas,
        COALESCE(SUM(vd.valor), 0) as valor_total_vendas,
        COALESCE(AVG(a.nota), 0) as nota_media_avaliacao,
        COUNT(a.id)::integer as total_avaliacoes,
        ROW_NUMBER() OVER (PARTITION BY v.loja_id ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_loja,
        ROW_NUMBER() OVER (ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_geral
      FROM vendedores v
      LEFT JOIN lojas l ON v.loja_id = l.id
      LEFT JOIN vendas vd ON v.id = vd.vendedor_id
      LEFT JOIN avaliacoes a ON v.id = a.vendedor_id
      ${whereClause}
      GROUP BY v.id, v.nome, v.loja_id, l.nome
      ORDER BY total_vendas DESC, valor_total_vendas DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao obter ranking de vendas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/ranking-vendedores/avaliacoes
 * Obter ranking de vendedores por avaliações
 */
router.get('/avaliacoes', authenticate, async (req, res) => {
  try {
    const { periodo = 'todos', loja_id } = req.query;

    let whereClause = 'WHERE v.ativo = true';
    const params: any[] = [];

    // Filtrar por loja se especificado ou se for lojista
    if (loja_id) {
      whereClause += ' AND v.loja_id = $1';
      params.push(loja_id);
    } else if (req.user!.role === 'lojista') {
      whereClause += ' AND v.loja_id IN (SELECT id FROM lojas WHERE user_id = $1)';
      params.push(req.user!.userId);
    }

    // Filtrar por período das avaliações
    switch (periodo) {
      case 'hoje':
        whereClause += ' AND a.created_at >= CURRENT_DATE';
        break;
      case 'semana':
        whereClause += ' AND a.created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'mes':
        whereClause += ' AND a.created_at >= DATE_TRUNC(\'month\', CURRENT_DATE)';
        break;
      case 'trimestre':
        whereClause += ' AND a.created_at >= DATE_TRUNC(\'quarter\', CURRENT_DATE)';
        break;
      case 'ano':
        whereClause += ' AND a.created_at >= DATE_TRUNC(\'year\', CURRENT_DATE)';
        break;
    }

    const query = `
      SELECT 
        v.id,
        v.nome,
        v.loja_id,
        l.nome as loja_nome,
        COUNT(a.id)::integer as total_avaliacoes,
        COALESCE(AVG(a.nota), 0) as nota_media,
        COUNT(a.id)::integer FILTER (WHERE a.nota >= 9) as avaliacoes_9_10,
        COUNT(a.id)::integer FILTER (WHERE a.nota >= 7 AND a.nota < 9) as avaliacoes_7_8,
        COUNT(a.id)::integer FILTER (WHERE a.nota < 7) as avaliacoes_abaixo_7,
        ROW_NUMBER() OVER (PARTITION BY v.loja_id ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_loja,
        ROW_NUMBER() OVER (ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_geral
      FROM vendedores v
      LEFT JOIN lojas l ON v.loja_id = l.id
      LEFT JOIN avaliacoes a ON v.id = a.vendedor_id
      ${whereClause}
      GROUP BY v.id, v.nome, v.loja_id, l.nome
      HAVING COUNT(a.id) > 0
      ORDER BY nota_media DESC, total_avaliacoes DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao obter ranking de avaliações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/ranking-vendedores/minha-posicao
 * Obter posição do vendedor logado nos rankings
 */
router.get('/minha-posicao', authenticate, authorize(['vendedor']), async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;

    // Obter ID do vendedor logado
    const vendedorResult = await pool.query(
      'SELECT id, loja_id FROM vendedores WHERE user_id = $1 AND ativo = true',
      [req.user!.userId]
    );

    if (vendedorResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vendedor não encontrado'
      });
    }

    const vendedor = vendedorResult.rows[0];

    // Ranking de vendas
    let vendasWhereClause = 'WHERE v.ativo = true';
    const vendasParams: any[] = [vendedor.id];

    switch (periodo) {
      case 'hoje':
        vendasWhereClause += ' AND vd.data_venda = CURRENT_DATE';
        break;
      case 'semana':
        vendasWhereClause += ' AND vd.data_venda >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'mes':
        vendasWhereClause += ' AND vd.data_venda >= DATE_TRUNC(\'month\', CURRENT_DATE)';
        break;
      case 'trimestre':
        vendasWhereClause += ' AND vd.data_venda >= DATE_TRUNC(\'quarter\', CURRENT_DATE)';
        break;
      case 'ano':
        vendasWhereClause += ' AND vd.data_venda >= DATE_TRUNC(\'year\', CURRENT_DATE)';
        break;
    }

    const vendasQuery = `
      WITH ranking_vendas AS (
        SELECT 
          v.id,
          v.nome,
          COUNT(vd.id)::integer as total_vendas,
          COALESCE(SUM(vd.valor), 0) as valor_total_vendas,
          ROW_NUMBER() OVER (PARTITION BY v.loja_id ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_loja,
          ROW_NUMBER() OVER (ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_geral
        FROM vendedores v
        LEFT JOIN vendas vd ON v.id = vd.vendedor_id
        ${vendasWhereClause}
        GROUP BY v.id, v.nome
      )
      SELECT * FROM ranking_vendas WHERE id = $1
    `;

    const vendasResult = await pool.query(vendasQuery, vendasParams);

    // Ranking de avaliações
    let avaliacoesWhereClause = 'WHERE v.ativo = true';
    const avaliacoesParams: any[] = [vendedor.id];

    switch (periodo) {
      case 'hoje':
        avaliacoesWhereClause += ' AND a.created_at >= CURRENT_DATE';
        break;
      case 'semana':
        avaliacoesWhereClause += ' AND a.created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'mes':
        avaliacoesWhereClause += ' AND a.created_at >= DATE_TRUNC(\'month\', CURRENT_DATE)';
        break;
      case 'trimestre':
        avaliacoesWhereClause += ' AND a.created_at >= DATE_TRUNC(\'quarter\', CURRENT_DATE)';
        break;
      case 'ano':
        avaliacoesWhereClause += ' AND a.created_at >= DATE_TRUNC(\'year\', CURRENT_DATE)';
        break;
    }

    const avaliacoesQuery = `
      WITH ranking_avaliacoes AS (
        SELECT 
          v.id,
          v.nome,
          COUNT(a.id)::integer as total_avaliacoes,
          COALESCE(AVG(a.nota), 0) as nota_media,
          ROW_NUMBER() OVER (PARTITION BY v.loja_id ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_loja,
          ROW_NUMBER() OVER (ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_geral
        FROM vendedores v
        LEFT JOIN avaliacoes a ON v.id = a.vendedor_id
        ${avaliacoesWhereClause}
        GROUP BY v.id, v.nome
        HAVING COUNT(a.id) > 0
      )
      SELECT * FROM ranking_avaliacoes WHERE id = $1
    `;

    const avaliacoesResult = await pool.query(avaliacoesQuery, avaliacoesParams);

    res.json({
      vendedor: {
        id: vendedor.id,
        nome: vendedor.nome,
        loja_id: vendedor.loja_id
      },
      ranking_vendas: vendasResult.rows[0] || null,
      ranking_avaliacoes: avaliacoesResult.rows[0] || null,
      periodo
    });
  } catch (error: any) {
    console.error('Erro ao obter posição do vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/ranking-vendedores/historico/:vendedorId
 * Obter histórico de rankings de um vendedor específico
 */
router.get('/historico/:vendedorId', authenticate, async (req, res) => {
  try {
    const { vendedorId } = req.params;
    const { meses = 12 } = req.query;

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
        error: 'Sem permissão para visualizar histórico deste vendedor'
      });
    }

    // Histórico de vendas por mês
    const historicoVendasQuery = `
      SELECT 
        DATE_TRUNC('month', vd.data_venda) as mes,
        COUNT(vd.id)::integer as total_vendas,
        COALESCE(SUM(vd.valor), 0) as valor_total_vendas,
        ROW_NUMBER() OVER (PARTITION BY v.loja_id, DATE_TRUNC('month', vd.data_venda) ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_loja,
        ROW_NUMBER() OVER (PARTITION BY DATE_TRUNC('month', vd.data_venda) ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_geral
      FROM vendedores v
      LEFT JOIN vendas vd ON v.id = vd.vendedor_id
      WHERE v.id = $1 
        AND vd.data_venda >= CURRENT_DATE - INTERVAL '${meses} months'
      GROUP BY v.id, v.loja_id, DATE_TRUNC('month', vd.data_venda)
      ORDER BY mes DESC
    `;

    const historicoVendasResult = await pool.query(historicoVendasQuery, [vendedorId]);

    // Histórico de avaliações por mês
    const historicoAvaliacoesQuery = `
      SELECT 
        DATE_TRUNC('month', a.created_at) as mes,
        COUNT(a.id)::integer as total_avaliacoes,
        COALESCE(AVG(a.nota), 0) as nota_media,
        ROW_NUMBER() OVER (PARTITION BY v.loja_id, DATE_TRUNC('month', a.created_at) ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_loja,
        ROW_NUMBER() OVER (PARTITION BY DATE_TRUNC('month', a.created_at) ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_geral
      FROM vendedores v
      LEFT JOIN avaliacoes a ON v.id = a.vendedor_id
      WHERE v.id = $1 
        AND a.created_at >= CURRENT_DATE - INTERVAL '${meses} months'
      GROUP BY v.id, v.loja_id, DATE_TRUNC('month', a.created_at)
      HAVING COUNT(a.id) > 0
      ORDER BY mes DESC
    `;

    const historicoAvaliacoesResult = await pool.query(historicoAvaliacoesQuery, [vendedorId]);

    res.json({
      vendedor: {
        id: vendedor.id,
        nome: vendedor.nome,
        loja_id: vendedor.loja_id
      },
      historico_vendas: historicoVendasResult.rows,
      historico_avaliacoes: historicoAvaliacoesResult.rows
    });
  } catch (error: any) {
    console.error('Erro ao obter histórico de rankings:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/ranking-vendedores/metas/:vendedorId
 * Obter metas e desempenho de um vendedor
 */
router.get('/metas/:vendedorId', authenticate, async (req, res) => {
  try {
    const { vendedorId } = req.params;
    const { periodo = 'mes' } = req.query;

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
        error: 'Sem permissão para visualizar metas deste vendedor'
      });
    }

    // Calcular desempenho no período
    let whereClause = 'WHERE vendedor_id = $1';
    const params: any[] = [vendedorId];

    switch (periodo) {
      case 'hoje':
        whereClause += ' AND data_venda = CURRENT_DATE';
        break;
      case 'semana':
        whereClause += ' AND data_venda >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'mes':
        whereClause += ' AND data_venda >= DATE_TRUNC(\'month\', CURRENT_DATE)';
        break;
      case 'trimestre':
        whereClause += ' AND data_venda >= DATE_TRUNC(\'quarter\', CURRENT_DATE)';
        break;
      case 'ano':
        whereClause += ' AND data_venda >= DATE_TRUNC(\'year\', CURRENT_DATE)';
        break;
    }

    const desempenhoQuery = `
      SELECT 
        COUNT(*)::integer as vendas_realizadas,
        COALESCE(SUM(valor), 0) as valor_total_vendas
      FROM vendas
      ${whereClause}
    `;

    const desempenhoResult = await pool.query(desempenhoQuery, params);

    const desempenho = desempenhoResult.rows[0];
    const metaVendasPercentual = vendedor.meta_vendas > 0 ? (desempenho.vendas_realizadas / vendedor.meta_vendas) * 100 : 0;
    const metaValorPercentual = vendedor.meta_vendas_valor > 0 ? (desempenho.valor_total_vendas / vendedor.meta_vendas_valor) * 100 : 0;

    res.json({
      vendedor: {
        id: vendedor.id,
        nome: vendedor.nome,
        meta_vendas: vendedor.meta_vendas,
        meta_vendas_valor: vendedor.meta_vendas_valor
      },
      desempenho: {
        vendas_realizadas: desempenho.vendas_realizadas,
        valor_total_vendas: desempenho.valor_total_vendas,
        meta_vendas_percentual: Math.round(metaVendasPercentual),
        meta_valor_percentual: Math.round(metaValorPercentual)
      },
      periodo
    });
  } catch (error: any) {
    console.error('Erro ao obter metas do vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
