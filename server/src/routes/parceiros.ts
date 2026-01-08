import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/parceiros
 * Lista todos os parceiros
 */
router.get(
  '/',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'parceiro'),
  async (req, res) => {
    try {
      let query = 'SELECT * FROM parceiros WHERE ativo = true';
      const params: any[] = [];
      
      // Parceiro só vê seus próprios dados
      if (req.user!.role === 'parceiro') {
        query += ' AND user_id = $1';
        params.push(req.user!.userId);
      }
      
      query += ' ORDER BY nome ASC';
      
      const result = await pool.query(query, params);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao listar parceiros:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/parceiros
 * Cria um novo parceiro
 */
router.post(
  '/',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { nome, tipo, cnpj, telefone, email, endereco } = req.body;

      if (!nome || !tipo) {
        return res.status(400).json({
          error: 'Nome e tipo são obrigatórios',
        });
      }

      // Validar tipo
      const tiposValidos = ['lavagem', 'estetica', 'oficina', 'pneu', 'vidros', 'outros'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
          error: `Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}`,
        });
      }

      // Verificar se CNPJ já existe (se fornecido)
      if (cnpj) {
        const cnpjCheck = await pool.query(
          'SELECT id FROM parceiros WHERE cnpj = $1',
          [cnpj]
        );
        
        if (cnpjCheck.rows.length > 0) {
          return res.status(400).json({
            error: 'CNPJ já cadastrado',
          });
        }
      }

      // Criar parceiro
      const result = await pool.query(
        `INSERT INTO parceiros (nome, tipo, cnpj, telefone, email, endereco, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING *`,
        [nome, tipo, cnpj || null, telefone || null, email || null, endereco || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar parceiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/parceiros/:id
 * Busca parceiro por ID
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'parceiro'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      let query = 'SELECT * FROM parceiros WHERE id = $1';
      const params: any[] = [id];
      
      // Parceiro só vê seus próprios dados
      if (req.user!.role === 'parceiro') {
        query += ' AND user_id = $2';
        params.push(req.user!.userId);
      }
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Parceiro não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar parceiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * PATCH /api/parceiros/:id
 * Atualiza um parceiro
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, tipo, cnpj, telefone, email, endereco, ativo } = req.body;

      // Verificar se parceiro existe
      const parceiroCheck = await pool.query(
        'SELECT id FROM parceiros WHERE id = $1',
        [id]
      );
      
      if (parceiroCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Parceiro não encontrado' });
      }

      // Validar tipo (se fornecido)
      if (tipo) {
        const tiposValidos = ['lavagem', 'estetica', 'oficina', 'pneu', 'vidros', 'outros'];
        if (!tiposValidos.includes(tipo)) {
          return res.status(400).json({
            error: `Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}`,
          });
        }
      }

      // Verificar se CNPJ já existe em outro parceiro (se fornecido)
      if (cnpj) {
        const cnpjCheck = await pool.query(
          'SELECT id FROM parceiros WHERE cnpj = $1 AND id != $2',
          [cnpj, id]
        );
        
        if (cnpjCheck.rows.length > 0) {
          return res.status(400).json({
            error: 'CNPJ já cadastrado em outro parceiro',
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
      if (tipo !== undefined) {
        updates.push(`tipo = $${paramIndex++}`);
        values.push(tipo);
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
        `UPDATE parceiros 
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar parceiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

