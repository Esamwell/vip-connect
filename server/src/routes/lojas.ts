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

      // Limpar e validar CNPJ (remover formatação e limitar a 18 caracteres)
      let cnpjLimpo = null;
      if (cnpj) {
        // Remover formatação (pontos, barras, hífens, espaços)
        cnpjLimpo = cnpj.replace(/[.\-\/\s]/g, '').substring(0, 18);
        if (cnpjLimpo.length === 0) {
          cnpjLimpo = null;
        }
      }

      // Limpar e validar telefone (limitar a 20 caracteres)
      let telefoneLimpo = null;
      if (telefone) {
        // Remover formatação e limitar
        telefoneLimpo = telefone.replace(/[.\-\s\(\)]/g, '').substring(0, 20);
        if (telefoneLimpo.length === 0) {
          telefoneLimpo = null;
        }
      }

      // Verificar se CNPJ já existe (se fornecido)
      if (cnpjLimpo) {
        const cnpjCheck = await pool.query(
          'SELECT id FROM lojas WHERE cnpj = $1',
          [cnpjLimpo]
        );
        
        if (cnpjCheck.rows.length > 0) {
          return res.status(400).json({
            error: 'CNPJ já cadastrado',
          });
        }
      }

      // Gerar email único para o usuário
      // Se email da loja foi fornecido, usar ele, senão gerar um baseado no nome
      let emailUsuario = email;
      if (!emailUsuario) {
        // Gerar email baseado no nome da loja (normalizar e adicionar sufixo único)
        const nomeNormalizado = nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        const timestamp = Date.now().toString().slice(-6);
        emailUsuario = `loja${nomeNormalizado}${timestamp}@exemplo.com`;
      }

      // Verificar se email já existe
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [emailUsuario]
      );
      
      if (emailCheck.rows.length > 0) {
        // Se email já existe e foi fornecido pelo usuário, retornar erro
        if (email) {
          return res.status(400).json({
            error: 'Email já está em uso por outro usuário',
          });
        }
        // Se foi gerado automaticamente e já existe, gerar um novo
        const timestamp = Date.now().toString().slice(-6);
        emailUsuario = `loja${timestamp}@exemplo.com`;
      }

      // Hash da senha padrão: Lojista123!
      const senhaPadraoHash = '$2a$10$R2UGOLXtQYWFsqENXOLJG.la1m4Rd.5DEb046nxD0jhwGzIlOhJCO';

      // Usar transação para garantir atomicidade
      const client = await pool.connect();
      let clientReleased = false;
      
      const releaseClient = () => {
        if (!clientReleased) {
          client.release();
          clientReleased = true;
        }
      };
      
      try {
        await client.query('BEGIN');

        // Criar usuário automaticamente
        let userId;
        try {
          const userResult = await client.query(
            `INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id`,
            [
              emailUsuario,
              senhaPadraoHash,
              'lojista',
              `Lojista ${nome}`,
              telefoneLimpo
            ]
          );
          userId = userResult.rows[0].id;
        } catch (userError: any) {
          await client.query('ROLLBACK');
          releaseClient();
          console.error('Erro ao criar usuário na transação:', userError);
          console.error('Detalhes do erro do usuário:', {
            code: userError.code,
            detail: userError.detail,
            constraint: userError.constraint,
            message: userError.message
          });
          
          // Se erro de constraint unique (email duplicado)
          if (userError.code === '23505' && userError.constraint === 'users_email_key') {
            return res.status(400).json({
              error: 'Email já está em uso por outro usuário',
            });
          }
          
          // Retornar erro específico do usuário
          return res.status(500).json({
            error: 'Erro ao criar usuário',
            message: userError.message || 'Erro desconhecido',
            ...(process.env.NODE_ENV === 'development' && {
              detail: userError.detail,
              code: userError.code
            })
          });
        }

        // Criar loja associada ao usuário
        let result;
        try {
          result = await client.query(
            `INSERT INTO lojas (nome, cnpj, telefone, email, endereco, ativo, user_id)
             VALUES ($1, $2, $3, $4, $5, true, $6)
             RETURNING *`,
            [nome, cnpjLimpo, telefoneLimpo, email || null, endereco || null, userId]
          );
        } catch (lojaError: any) {
          await client.query('ROLLBACK');
          releaseClient();
          console.error('Erro ao criar loja na transação:', lojaError);
          console.error('Detalhes do erro da loja:', {
            code: lojaError.code,
            detail: lojaError.detail,
            constraint: lojaError.constraint,
            message: lojaError.message
          });
          
          // Tratar erros específicos da criação da loja
          if (lojaError.code === '23505') {
            if (lojaError.constraint?.includes('cnpj')) {
              return res.status(400).json({
                error: 'CNPJ já cadastrado',
              });
            }
          }
          
          // Retornar erro específico da loja
          return res.status(500).json({
            error: 'Erro ao criar loja',
            message: lojaError.message || 'Erro desconhecido',
            ...(process.env.NODE_ENV === 'development' && {
              detail: lojaError.detail,
              code: lojaError.code,
              constraint: lojaError.constraint
            })
          });
        }

        await client.query('COMMIT');
        releaseClient();
        res.status(201).json(result.rows[0]);
      } catch (error: any) {
        // Se ainda não fez rollback, fazer agora
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Erro ao fazer rollback:', rollbackError);
        }
        
        releaseClient();
        console.error('Erro na transação:', error);
        // Se já retornou resposta, não fazer nada
        if (!res.headersSent) {
          return res.status(500).json({
            error: 'Erro na transação',
            message: error.message || 'Erro desconhecido',
            ...(process.env.NODE_ENV === 'development' && {
              detail: error.detail,
              code: error.code,
              stack: error.stack
            })
          });
        }
        throw error; // Re-throw para ser capturado pelo catch externo
      }
    } catch (error: any) {
      console.error('Erro ao criar loja:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        message: error.message,
        stack: error.stack
      });
      
      // Tratar erros específicos
      if (error.code === '23505') {
        // Violação de constraint única
        if (error.constraint === 'users_email_key') {
          return res.status(400).json({
            error: 'Email já está em uso por outro usuário',
          });
        }
        if (error.constraint?.includes('cnpj')) {
          return res.status(400).json({
            error: 'CNPJ já cadastrado',
          });
        }
      }
      
      // Só retornar resposta se ainda não foi retornada
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Erro interno do servidor',
          message: error.message || 'Erro desconhecido',
          ...(process.env.NODE_ENV === 'development' && {
            detail: error.detail,
            code: error.code,
            constraint: error.constraint,
            stack: error.stack
          })
        });
      }
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

