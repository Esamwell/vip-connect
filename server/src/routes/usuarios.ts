import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/usuarios
 * Lista todos os usuários (apenas admins)
 */
router.get(
  '/',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      // Admin shopping só vê usuários da sua role ou abaixo se houver regras específicas (aqui vemos todos)
      const query = `
        SELECT id, nome, email, role, whatsapp, ativo, created_at, updated_at
        FROM users
        ORDER BY nome ASC
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/usuarios
 * Cria um novo usuário (Admin)
 */
router.post(
  '/',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { nome, email, senha, role, whatsapp } = req.body;

      if (!nome || !email || !senha || !role) {
        return res.status(400).json({
          error: 'Nome, email, senha e permissão são obrigatórios',
        });
      }

      if (senha.length < 6) {
        return res.status(400).json({
          error: 'A senha deve ter no mínimo 6 caracteres',
        });
      }

      // Verificar permissão para criar admin_mt (só admin_mt pode criar outro admin_mt)
      if (role === 'admin_mt' && req.user?.role !== 'admin_mt') {
         return res.status(403).json({
           error: 'Você não tem permissão para criar um usuário deste nível',
         });
      }

      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      
      const insertQuery = `
        INSERT INTO users (nome, email, password_hash, role, whatsapp)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nome, email, role, whatsapp, ativo, created_at
      `;
      const values = [nome, email, senhaHash, role, whatsapp || null];
      
      const result = await pool.query(insertQuery, values);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * PATCH /api/usuarios/:id
 * Atualiza um usuário
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, email, role, whatsapp, ativo } = req.body;

      // Verificar se usuário existe
      const checkQuery = 'SELECT * FROM users WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = checkResult.rows[0];

      // Proteções
      if (user.role === 'admin_mt' && req.user?.role !== 'admin_mt') {
        return res.status(403).json({ error: 'Permissão negada para editar este usuário' });
      }

      if (email && email !== user.email) {
        const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ error: 'Email já cadastrado por outro usuário' });
        }
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (nome !== undefined) {
        updates.push(`nome = $${paramCount}`);
        values.push(nome);
        paramCount++;
      }
      if (email !== undefined) {
        updates.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
      }
      if (role !== undefined) {
        updates.push(`role = $${paramCount}`);
        values.push(role);
        paramCount++;
      }
      if (whatsapp !== undefined) {
        updates.push(`whatsapp = $${paramCount}`);
        values.push(whatsapp);
        paramCount++;
      }
      if (ativo !== undefined) {
        updates.push(`ativo = $${paramCount}`);
        values.push(ativo);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.json(user);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const updateQuery = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, nome, email, role, whatsapp, ativo, updated_at
      `;

      const result = await pool.query(updateQuery, values);
      res.json(result.rows[0]);

    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * DELETE /api/usuarios/:id
 * Desativar um usuário
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Não se pode deletar a si mesmo (precaução básica)
      if (id === req.user?.userId) {
         return res.status(400).json({ error: 'Não é possível desativar o próprio usuário enquanto logado' });
      }

      const checkQuery = 'SELECT * FROM users WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = checkResult.rows[0];
      if (user.role === 'admin_mt' && req.user?.role !== 'admin_mt') {
        return res.status(403).json({ error: 'Permissão negada para desativar este usuário' });
      }

      await pool.query(
        'UPDATE users SET ativo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      res.json({ message: 'Usuário desativado com sucesso' });
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;
