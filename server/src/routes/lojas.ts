import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/lojas
 * Lista todas as lojas
 */
router.get(
  '/',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      let query = 'SELECT * FROM lojas WHERE ativo = true';
      const params: any[] = [];
      
      // Lojista só vê suas próprias lojas
      if (req.user!.role === 'lojista') {
        query += ' AND user_id = $1';
        params.push(req.user!.userId);
      }
      
      query += ' ORDER BY nome ASC';
      
      const result = await pool.query(query, params);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao listar lojas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/lojas
 * Cria uma nova loja
 */
router.post(
  '/',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { nome, cnpj, telefone, email, endereco } = req.body;

      if (!nome) {
        return res.status(400).json({
          error: 'Nome é obrigatório',
        });
      }

      // Verificar se CNPJ já existe (se fornecido)
      if (cnpj) {
        const cnpjCheck = await pool.query(
          'SELECT id FROM lojas WHERE cnpj = $1',
          [cnpj]
        );
        
        if (cnpjCheck.rows.length > 0) {
          return res.status(400).json({
            error: 'CNPJ já cadastrado',
          });
        }
      }

      // Criar loja
      const result = await pool.query(
        `INSERT INTO lojas (nome, cnpj, telefone, email, endereco, ativo)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [nome, cnpj || null, telefone || null, email || null, endereco || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar loja:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/lojas/:id
 * Busca loja por ID
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      let query = 'SELECT * FROM lojas WHERE id = $1';
      const params: any[] = [id];
      
      // Lojista só vê suas próprias lojas
      if (req.user!.role === 'lojista') {
        query += ' AND user_id = $2';
        params.push(req.user!.userId);
      }
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar loja:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * PATCH /api/lojas/:id
 * Atualiza uma loja
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, cnpj, telefone, email, endereco, ativo } = req.body;

      // Verificar se loja existe
      const lojaCheck = await pool.query(
        'SELECT id FROM lojas WHERE id = $1',
        [id]
      );
      
      if (lojaCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }

      // Verificar se CNPJ já existe em outra loja (se fornecido)
      if (cnpj) {
        const cnpjCheck = await pool.query(
          'SELECT id FROM lojas WHERE cnpj = $1 AND id != $2',
          [cnpj, id]
        );
        
        if (cnpjCheck.rows.length > 0) {
          return res.status(400).json({
            error: 'CNPJ já cadastrado em outra loja',
          });
        }
      }

      // Construir query dinamicamente
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (nome !== undefined) {
        updates.push(`nome = $${paramIndex++}`);
        values.push(nome);
      }
      if (cnpj !== undefined) {
        updates.push(`cnpj = $${paramIndex++}`);
        values.push(cnpj || null);
      }
      if (telefone !== undefined) {
        updates.push(`telefone = $${paramIndex++}`);
        values.push(telefone || null);
      }
      if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email || null);
      }
      if (endereco !== undefined) {
        updates.push(`endereco = $${paramIndex++}`);
        values.push(endereco || null);
      }
      if (ativo !== undefined) {
        updates.push(`ativo = $${paramIndex++}`);
        values.push(ativo);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await pool.query(
        `UPDATE lojas 
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar loja:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

