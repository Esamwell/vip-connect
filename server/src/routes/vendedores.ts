import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/vendedores
 * Criar um novo vendedor (apenas admin_mt, admin_shopping, lojista)
 */
router.post('/', authenticate, authorize(['admin_mt', 'admin_shopping', 'lojista']), async (req, res) => {
  try {
    const {
      nome,
      email,
      whatsapp,
      senha,
      loja_id,
      codigo_vendedor,
      comissao_padrao = 0,
      meta_vendas = 0,
      meta_vendas_valor = 0
    } = req.body;

    // Validações básicas
    if (!nome || !email || !senha || !loja_id || !codigo_vendedor) {
      return res.status(400).json({
        error: 'Nome, email, senha, loja_id e codigo_vendedor são obrigatórios'
      });
    }

    // Verificar se o lojista só pode criar vendedores para sua própria loja
    if (req.user!.role === 'lojista') {
      const lojaResult = await pool.query(
        'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
        [loja_id, req.user!.userId]
      );

      if (lojaResult.rows.length === 0) {
        return res.status(403).json({
          error: 'Você só pode criar vendedores para sua própria loja'
        });
      }
    }

    // Verificar se email já existe
    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }

    // Verificar se código de vendedor já existe na loja
    const existingCodigo = await pool.query(
      'SELECT id FROM vendedores WHERE loja_id = $1 AND codigo_vendedor = $2',
      [loja_id, codigo_vendedor]
    );

    if (existingCodigo.rows.length > 0) {
      return res.status(400).json({
        error: 'Código de vendedor já existe nesta loja'
      });
    }

    // Iniciar transação
    await pool.query('BEGIN');

    try {
      // Criar usuário
      const hashedPassword = await bcrypt.hash(senha, 10);
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) 
         VALUES ($1, $2, 'vendedor', $3, $4, true) 
         RETURNING id, email, nome, role, whatsapp, ativo`,
        [email, hashedPassword, nome, whatsapp]
      );

      const user = userResult.rows[0];

      // Criar vendedor
      const vendedorResult = await pool.query(
        `INSERT INTO vendedores 
         (user_id, loja_id, nome, whatsapp, email, codigo_vendedor, comissao_padrao, meta_vendas, meta_vendas_valor) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [user.id, loja_id, nome, whatsapp, email, codigo_vendedor, comissao_padrao, meta_vendas, meta_vendas_valor]
      );

      await pool.query('COMMIT');

      res.status(201).json({
        user,
        vendedor: vendedorResult.rows[0]
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Erro ao criar vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/vendedores
 * Listar vendedores (filtrados por loja se for lojista)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let query = `
      SELECT v.*, u.email, u.whatsapp as user_whatsapp, l.nome as loja_nome
      FROM vendedores v
      JOIN users u ON v.user_id = u.id
      JOIN lojas l ON v.loja_id = l.id
      WHERE v.ativo = true
    `;
    const params: any[] = [];

    // Se for lojista, mostrar apenas vendedores da sua loja
    if (req.user!.role === 'lojista') {
      query += ' AND v.loja_id IN (SELECT id FROM lojas WHERE user_id = $1)';
      params.push(req.user!.userId);
    }

    query += ' ORDER BY v.nome';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar vendedores:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/vendedores/:id
 * Obter dados de um vendedor específico
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT v.*, u.email, u.whatsapp as user_whatsapp, l.nome as loja_nome
      FROM vendedores v
      JOIN users u ON v.user_id = u.id
      JOIN lojas l ON v.loja_id = l.id
      WHERE v.id = $1 AND v.ativo = true
    `;

    // Se for lojista, verificar se o vendedor pertence à sua loja
    if (req.user!.role === 'lojista') {
      query += ' AND v.loja_id IN (SELECT id FROM lojas WHERE user_id = $2)';
    }

    const params = req.user!.role === 'lojista' ? [id, req.user!.userId] : [id];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Vendedor não encontrado'
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao obter vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/vendedores/:id
 * Atualizar dados de um vendedor
 */
router.put('/:id', authenticate, authorize(['admin_mt', 'admin_shopping', 'lojista']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      whatsapp,
      email,
      codigo_vendedor,
      comissao_padrao,
      meta_vendas,
      meta_vendas_valor,
      ativo
    } = req.body;

    // Verificar se o vendedor existe e se o lojista tem permissão
    let checkQuery = 'SELECT v.*, l.user_id as loja_user_id FROM vendedores v JOIN lojas l ON v.loja_id = l.id WHERE v.id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vendedor não encontrado'
      });
    }

    const vendedor = checkResult.rows[0];

    // Se for lojista, verificar se o vendedor pertence à sua loja
    if (req.user!.role === 'lojista' && vendedor.loja_user_id !== req.user!.userId) {
      return res.status(403).json({
        error: 'Você só pode editar vendedores da sua própria loja'
      });
    }

    // Iniciar transação
    await pool.query('BEGIN');

    try {
      // Atualizar usuário se necessário
      if (nome || whatsapp || email) {
        const userUpdateQuery = `
          UPDATE users 
          SET nome = COALESCE($1, nome),
              whatsapp = COALESCE($2, whatsapp),
              email = COALESCE($3, email),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `;
        await pool.query(userUpdateQuery, [nome, whatsapp, email, vendedor.user_id]);
      }

      // Atualizar vendedor
      const vendedorUpdateQuery = `
        UPDATE vendedores 
        SET nome = COALESCE($1, nome),
            whatsapp = COALESCE($2, whatsapp),
            email = COALESCE($3, email),
            codigo_vendedor = COALESCE($4, codigo_vendedor),
            comissao_padrao = COALESCE($5, comissao_padrao),
            meta_vendas = COALESCE($6, meta_vendas),
            meta_vendas_valor = COALESCE($7, meta_vendas_valor),
            ativo = COALESCE($8, ativo),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `;
      const vendedorResult = await pool.query(vendedorUpdateQuery, [
        nome, whatsapp, email, codigo_vendedor, comissao_padrao,
        meta_vendas, meta_vendas_valor, ativo, id
      ]);

      await pool.query('COMMIT');

      res.json(vendedorResult.rows[0]);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Erro ao atualizar vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PATCH /api/vendedores/:id/senha
 * Alterar senha do vendedor
 */
router.patch('/:id/senha', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { novaSenha } = req.body;

    if (!novaSenha) {
      return res.status(400).json({
        error: 'Nova senha é obrigatória'
      });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({
        error: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar se o vendedor existe e se tem permissão
    let checkQuery = `
      SELECT v.*, u.id as user_id, l.user_id as loja_user_id 
      FROM vendedores v 
      JOIN users u ON v.user_id = u.id 
      JOIN lojas l ON v.loja_id = l.id 
      WHERE v.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

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
        error: 'Sem permissão para alterar a senha deste vendedor'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, vendedor.user_id]
    );

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar senha do vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/vendedores/:id
 * Desativar um vendedor (soft delete)
 */
router.delete('/:id', authenticate, authorize(['admin_mt', 'admin_shopping', 'lojista']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o vendedor existe e se o lojista tem permissão
    let checkQuery = 'SELECT v.*, l.user_id as loja_user_id FROM vendedores v JOIN lojas l ON v.loja_id = l.id WHERE v.id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vendedor não encontrado'
      });
    }

    const vendedor = checkResult.rows[0];

    // Se for lojista, verificar se o vendedor pertence à sua loja
    if (req.user!.role === 'lojista' && vendedor.loja_user_id !== req.user!.userId) {
      return res.status(403).json({
        error: 'Você só pode desativar vendedores da sua própria loja'
      });
    }

    // Iniciar transação
    await pool.query('BEGIN');

    try {
      // Desativar usuário
      await pool.query(
        'UPDATE users SET ativo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [vendedor.user_id]
      );

      // Desativar vendedor
      await pool.query(
        'UPDATE vendedores SET ativo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      await pool.query('COMMIT');

      res.json({ message: 'Vendedor desativado com sucesso' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Erro ao desativar vendedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/vendedores/loja/:lojaId
 * Listar vendedores de uma loja específica
 */
router.get('/loja/:lojaId', authenticate, async (req, res) => {
  try {
    const { lojaId } = req.params;

    // Se for lojista, verificar se a loja pertence a ele
    if (req.user!.role === 'lojista') {
      const lojaCheck = await pool.query(
        'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
        [lojaId, req.user!.userId]
      );

      if (lojaCheck.rows.length === 0) {
        return res.status(403).json({
          error: 'Você só pode visualizar vendedores da sua própria loja'
        });
      }
    }

    const result = await pool.query(
      `SELECT v.*, u.email, u.whatsapp as user_whatsapp
       FROM vendedores v
       JOIN users u ON v.user_id = u.id
       WHERE v.loja_id = $1 AND v.ativo = true
       ORDER BY v.nome`,
      [lojaId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar vendedores da loja:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
