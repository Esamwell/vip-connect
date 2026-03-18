import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/beneficios-asi
 * Lista todos os benefícios ASI
 */
router.get(
  '/',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM beneficios_asi ORDER BY nome ASC'
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao listar benefícios ASI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/beneficios-asi
 * Cria um novo benefício ASI
 */
router.post(
  '/',
  authenticate,
  authorize('admin_mt'),
  async (req, res) => {
    try {
      const { nome, descricao } = req.body;

      if (!nome) {
        return res.status(400).json({
          error: 'Nome é obrigatório',
        });
      }

      const result = await pool.query(
        `INSERT INTO beneficios_asi (nome, descricao, ativo)
         VALUES ($1, $2, true)
         RETURNING *`,
        [nome, descricao || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar benefício ASI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * PUT /api/beneficios-asi/:id
 * Atualiza um benefício ASI
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin_mt'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, descricao, ativo } = req.body;

      const beneficioCheck = await pool.query(
        'SELECT id FROM beneficios_asi WHERE id = $1',
        [id]
      );

      if (beneficioCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Benefício ASI não encontrado',
        });
      }

      const result = await pool.query(
        `UPDATE beneficios_asi 
         SET nome = COALESCE($1, nome),
             descricao = COALESCE($2, descricao),
             ativo = COALESCE($3, ativo),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [nome || null, descricao || null, ativo !== undefined ? ativo : null, id]
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar benefício ASI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * DELETE /api/beneficios-asi/:id
 * Exclui logicamente (desativar) um benefício ASI
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin_mt'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const beneficioCheck = await pool.query(
        'SELECT id FROM beneficios_asi WHERE id = $1',
        [id]
      );

      if (beneficioCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Benefício ASI não encontrado',
        });
      }

      const result = await pool.query(
        `UPDATE beneficios_asi 
         SET ativo = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      res.json({
        message: 'Benefício ASI excluído com sucesso',
        beneficio: result.rows[0],
      });
    } catch (error: any) {
      console.error('Erro ao excluir benefício ASI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/beneficios-asi/vincular
 * Vincula benefício ASI direto a um único cliente
 */
router.post(
  '/vincular',
  authenticate,
  authorize('admin_mt'),
  async (req, res) => {
    try {
      const { cliente_vip_id, beneficio_asi_id } = req.body;

      if (!cliente_vip_id || !beneficio_asi_id) {
        return res.status(400).json({
          error: 'Dados obrigatórios faltando',
        });
      }

      // Evita duplicação do mesmo benefício
      const checaInjecao = await pool.query(
        `SELECT id FROM clientes_beneficios 
         WHERE cliente_vip_id = $1 AND beneficio_asi_id = $2 AND tipo = 'asi'`,
        [cliente_vip_id, beneficio_asi_id]
      );

      if (checaInjecao.rows.length > 0) {
        return res.status(400).json({
          error: 'Este cliente já possui este benefício ASI'
        });
      }

      const result = await pool.query(
        `INSERT INTO clientes_beneficios (cliente_vip_id, beneficio_asi_id, tipo, ativo)
         VALUES ($1, $2, 'asi', true)
         RETURNING *`,
        [cliente_vip_id, beneficio_asi_id]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao vincular benefício ASI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);


export default router;
