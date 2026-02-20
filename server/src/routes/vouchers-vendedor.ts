import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/vouchers-vendedor
 * Criar um novo voucher para vendedor (apenas admin_mt, admin_shopping, lojista)
 */
router.post('/', authenticate, authorize(['admin_mt', 'admin_shopping', 'lojista']), async (req, res) => {
  try {
    const {
      vendedor_id,
      nome,
      descricao,
      tipo,
      valor,
      valido_de,
      valido_ate,
      quantidade_disponivel = 1
    } = req.body;

    // Validações básicas
    if (!vendedor_id || !nome || !tipo) {
      return res.status(400).json({
        error: 'vendedor_id, nome e tipo são obrigatórios'
      });
    }

    // Verificar se o vendedor existe e se o lojista tem permissão
    let checkQuery = `
      SELECT v.*, l.user_id as loja_user_id 
      FROM vendedores v 
      JOIN lojas l ON v.loja_id = l.id 
      WHERE v.id = $1 AND v.ativo = true
    `;
    const checkResult = await pool.query(checkQuery, [vendedor_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vendedor não encontrado ou inativo'
      });
    }

    const vendedor = checkResult.rows[0];

    // Se for lojista, verificar se o vendedor pertence à sua loja
    if (req.user!.role === 'lojista' && vendedor.loja_user_id !== req.user!.userId) {
      return res.status(403).json({
        error: 'Você só pode criar vouchers para vendedores da sua própria loja'
      });
    }

    // Gerar código único do voucher
    const codigo = `VOUCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Criar voucher
    const result = await pool.query(
      `INSERT INTO vouchers_vendedor 
       (vendedor_id, nome, descricao, tipo, valor, codigo, valido_de, valido_ate, quantidade_disponivel, criado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [vendedor_id, nome, descricao, tipo, valor, codigo, valido_de, valido_ate, quantidade_disponivel, req.user!.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar voucher:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/vouchers-vendedor
 * Listar vouchers disponíveis (filtrados por vendedor se for vendedor)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let query = `
      SELECT vv.*, v.nome as vendedor_nome, l.nome as loja_nome,
             u_criador.nome as criado_por_nome
      FROM vouchers_vendedor vv
      JOIN vendedores v ON vv.vendedor_id = v.id
      JOIN lojas l ON v.loja_id = l.id
      LEFT JOIN users u_criador ON vv.criado_por = u_criador.id
      WHERE vv.ativo = true
    `;
    const params: any[] = [];

    // Se for vendedor, mostrar apenas seus vouchers
    if (req.user!.role === 'vendedor') {
      query += ' AND vv.vendedor_id = (SELECT id FROM vendedores WHERE user_id = $1)';
      params.push(req.user!.userId);
    }
    // Se for lojista, mostrar apenas vouchers dos vendedores da sua loja
    else if (req.user!.role === 'lojista') {
      query += ' AND v.loja_id IN (SELECT id FROM lojas WHERE user_id = $1)';
      params.push(req.user!.userId);
    }

    query += ' ORDER BY vv.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar vouchers:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/vouchers-vendedor/:id
 * Obter dados de um voucher específico
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT vv.*, v.nome as vendedor_nome, l.nome as loja_nome,
             u_criador.nome as criado_por_nome
      FROM vouchers_vendedor vv
      JOIN vendedores v ON vv.vendedor_id = v.id
      JOIN lojas l ON v.loja_id = l.id
      LEFT JOIN users u_criador ON vv.criado_por = u_criador.id
      WHERE vv.id = $1 AND vv.ativo = true
    `;

    // Se for vendedor, verificar se o voucher é dele
    if (req.user!.role === 'vendedor') {
      query += ' AND vv.vendedor_id = (SELECT id FROM vendedores WHERE user_id = $2)';
    }
    // Se for lojista, verificar se o voucher é de um vendedor da sua loja
    else if (req.user!.role === 'lojista') {
      query += ' AND v.loja_id IN (SELECT id FROM lojas WHERE user_id = $2)';
    }

    const params = ['vendedor', 'lojista'].includes(req.user!.role) ? [id, req.user!.userId] : [id];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Voucher não encontrado'
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao obter voucher:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/vouchers-vendedor/:id/resgatar
 * Resgatar um voucher (apenas vendedores)
 */
router.post('/:id/resgatar', authenticate, authorize(['vendedor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { observacoes } = req.body;

    // Verificar se o voucher existe e pertence ao vendedor
    const voucherResult = await pool.query(
      `SELECT vv.*, v.user_id as vendedor_user_id
       FROM vouchers_vendedor vv
       JOIN vendedores v ON vv.vendedor_id = v.id
       WHERE vv.id = $1 AND vv.ativo = true AND v.user_id = $2`,
      [id, req.user!.userId]
    );

    if (voucherResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Voucher não encontrado ou não disponível para você'
      });
    }

    const voucher = voucherResult.rows[0];

    // Verificar se o voucher ainda está válido
    if (voucher.valido_ate && new Date(voucher.valido_ate) < new Date()) {
      return res.status(400).json({
        error: 'Voucher expirado'
      });
    }

    if (voucher.valido_de && new Date(voucher.valido_de) > new Date()) {
      return res.status(400).json({
        error: 'Voucher ainda não está válido'
      });
    }

    // Verificar se ainda há quantidade disponível
    if (voucher.quantidade_disponivel <= voucher.quantidade_utilizada) {
      return res.status(400).json({
        error: 'Voucher esgotado'
      });
    }

    // Verificar se o vendedor já resgatou este voucher
    const existingResgate = await pool.query(
      'SELECT id FROM resgates_vouchers_vendedor WHERE voucher_id = $1 AND vendedor_id = $2 AND status = $3',
      [id, voucher.vendedor_id, 'resgatado']
    );

    if (existingResgate.rows.length > 0) {
      return res.status(400).json({
        error: 'Você já resgatou este voucher'
      });
    }

    // Iniciar transação
    await pool.query('BEGIN');

    try {
      // Inserir resgate
      const resgateResult = await pool.query(
        `INSERT INTO resgates_vouchers_vendedor 
         (vendedor_id, voucher_id, observacoes) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [voucher.vendedor_id, id, observacoes]
      );

      // Atualizar quantidade utilizada
      await pool.query(
        `UPDATE vouchers_vendedor 
         SET quantidade_utilizada = quantidade_utilizada + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      await pool.query('COMMIT');

      res.status(201).json({
        resgate: resgateResult.rows[0],
        voucher: {
          ...voucher,
          quantidade_utilizada: voucher.quantidade_utilizada + 1
        }
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Erro ao resgatar voucher:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/vouchers-vendedor/vendedor/:vendedorId
 * Listar vouchers de um vendedor específico
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
    const isOwnVouchers = req.user!.role === 'vendedor' && req.user!.userId === vendedor.user_id;
    const isLojista = req.user!.role === 'lojista' && vendedor.loja_user_id === req.user!.userId;
    const isAdmin = ['admin_mt', 'admin_shopping'].includes(req.user!.role);

    if (!isOwnVouchers && !isLojista && !isAdmin) {
      return res.status(403).json({
        error: 'Sem permissão para visualizar vouchers deste vendedor'
      });
    }

    const result = await pool.query(
      `SELECT vv.*, 
              (SELECT COUNT(*) FROM resgates_vouchers_vendedor rvv WHERE rvv.voucher_id = vv.id AND rvv.status = 'resgatado') as total_resgates
       FROM vouchers_vendedor vv
       WHERE vv.vendedor_id = $1 AND vv.ativo = true
       ORDER BY vv.created_at DESC`,
      [vendedorId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar vouchers do vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/vouchers-vendedor/resgates/vendedor/:vendedorId
 * Listar resgates de um vendedor específico
 */
router.get('/resgates/vendedor/:vendedorId', authenticate, async (req, res) => {
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
    const isOwnResgates = req.user!.role === 'vendedor' && req.user!.userId === vendedor.user_id;
    const isLojista = req.user!.role === 'lojista' && vendedor.loja_user_id === req.user!.userId;
    const isAdmin = ['admin_mt', 'admin_shopping'].includes(req.user!.role);

    if (!isOwnResgates && !isLojista && !isAdmin) {
      return res.status(403).json({
        error: 'Sem permissão para visualizar resgates deste vendedor'
      });
    }

    const result = await pool.query(
      `SELECT rvv.*, vv.nome as voucher_nome, vv.codigo as voucher_codigo,
              u_validador.nome as validado_por_nome
       FROM resgates_vouchers_vendedor rvv
       JOIN vouchers_vendedor vv ON rvv.voucher_id = vv.id
       LEFT JOIN users u_validador ON rvv.validado_por = u_validador.id
       WHERE rvv.vendedor_id = $1
       ORDER BY rvv.data_resgate DESC`,
      [vendedorId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar resgates do vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/vouchers-vendedor/:id
 * Atualizar um voucher (apenas admin_mt, admin_shopping, lojista)
 */
router.put('/:id', authenticate, authorize(['admin_mt', 'admin_shopping', 'lojista']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      tipo,
      valor,
      valido_de,
      valido_ate,
      quantidade_disponivel,
      ativo
    } = req.body;

    // Verificar se o voucher existe e se o lojista tem permissão
    let checkQuery = `
      SELECT vv.*, v.user_id as vendedor_user_id, l.user_id as loja_user_id
      FROM vouchers_vendedor vv
      JOIN vendedores v ON vv.vendedor_id = v.id
      JOIN lojas l ON v.loja_id = l.id
      WHERE vv.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Voucher não encontrado'
      });
    }

    const voucher = checkResult.rows[0];

    // Se for lojista, verificar se o voucher é de um vendedor da sua loja
    if (req.user!.role === 'lojista' && voucher.loja_user_id !== req.user!.userId) {
      return res.status(403).json({
        error: 'Você só pode editar vouchers de vendedores da sua própria loja'
      });
    }

    // Atualizar voucher
    const result = await pool.query(
      `UPDATE vouchers_vendedor 
       SET nome = COALESCE($1, nome),
           descricao = COALESCE($2, descricao),
           tipo = COALESCE($3, tipo),
           valor = COALESCE($4, valor),
           valido_de = COALESCE($5, valido_de),
           valido_ate = COALESCE($6, valido_ate),
           quantidade_disponivel = COALESCE($7, quantidade_disponivel),
           ativo = COALESCE($8, ativo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [nome, descricao, tipo, valor, valido_de, valido_ate, quantidade_disponivel, ativo, id]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar voucher:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/vouchers-vendedor/:id
 * Desativar um voucher (soft delete)
 */
router.delete('/:id', authenticate, authorize(['admin_mt', 'admin_shopping', 'lojista']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o voucher existe e se o lojista tem permissão
    let checkQuery = `
      SELECT vv.*, v.user_id as vendedor_user_id, l.user_id as loja_user_id
      FROM vouchers_vendedor vv
      JOIN vendedores v ON vv.vendedor_id = v.id
      JOIN lojas l ON v.loja_id = l.id
      WHERE vv.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Voucher não encontrado'
      });
    }

    const voucher = checkResult.rows[0];

    // Se for lojista, verificar se o voucher é de um vendedor da sua loja
    if (req.user!.role === 'lojista' && voucher.loja_user_id !== req.user!.userId) {
      return res.status(403).json({
        error: 'Você só pode desativar vouchers de vendedores da sua própria loja'
      });
    }

    // Desativar voucher
    await pool.query(
      'UPDATE vouchers_vendedor SET ativo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'Voucher desativado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar voucher:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
