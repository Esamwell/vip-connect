import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/parceiros/me
 * Retorna o parceiro do usuário autenticado
 */
router.get(
  '/me',
  authenticate,
  authorize('parceiro'),
  async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM parceiros WHERE user_id = $1 AND ativo = true',
        [req.user!.userId]
      );
      
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
 * GET /api/parceiros/meus-clientes
 * Lista clientes que têm benefícios oficiais alocados vinculados ao parceiro
 */
router.get(
  '/meus-clientes',
  authenticate,
  authorize('parceiro'),
  async (req, res) => {
    try {
      // Buscar parceiro do usuário
      const parceiroResult = await pool.query(
        'SELECT id FROM parceiros WHERE user_id = $1 AND ativo = true',
        [req.user!.userId]
      );
      
      if (parceiroResult.rows.length === 0) {
        return res.status(404).json({ error: 'Parceiro não encontrado' });
      }
      
      const parceiroId = parceiroResult.rows[0].id;
      
      // Log para debug
      console.log(`[DEBUG] Buscando clientes para parceiro ID: ${parceiroId}`);
      
      // Verificação detalhada de debug
      const debugInfo = await pool.query(
        `SELECT 
          bo.id as beneficio_id,
          bo.nome as beneficio_nome,
          bo.parceiro_id,
          bo.ativo as beneficio_ativo,
          COUNT(cb.id) as total_alocacoes,
          COUNT(cb.id) FILTER (WHERE cb.ativo = true) as alocacoes_ativas
        FROM beneficios_oficiais bo
        LEFT JOIN clientes_beneficios cb ON bo.id = cb.beneficio_oficial_id AND cb.tipo = 'oficial'
        WHERE bo.parceiro_id = $1
        GROUP BY bo.id, bo.nome, bo.parceiro_id, bo.ativo`,
        [parceiroId]
      );
      
      console.log('[DEBUG] Benefícios do parceiro e suas alocações:', JSON.stringify(debugInfo.rows, null, 2));
      
      // Verificar alocações específicas
      const alocacoesDebug = await pool.query(
        `SELECT 
          cb.id as alocacao_id,
          cb.cliente_vip_id,
          cv.nome as cliente_nome,
          cb.beneficio_oficial_id,
          bo.nome as beneficio_nome,
          bo.parceiro_id,
          cb.ativo as alocacao_ativa,
          bo.ativo as beneficio_ativo,
          cb.tipo
        FROM clientes_beneficios cb
        INNER JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id
        INNER JOIN clientes_vip cv ON cb.cliente_vip_id = cv.id
        WHERE bo.parceiro_id = $1`,
        [parceiroId]
      );
      
      console.log('[DEBUG] Todas as alocações deste parceiro:', JSON.stringify(alocacoesDebug.rows, null, 2));
      
      // Buscar clientes que têm benefícios oficiais alocados vinculados a este parceiro
      // A query busca clientes que têm pelo menos um benefício oficial alocado e ativo
      // vinculado a este parceiro
      const clientesResult = await pool.query(
        `SELECT DISTINCT
          cv.id,
          cv.nome,
          cv.email,
          cv.whatsapp as telefone,
          cv.whatsapp,
          cv.status,
          cv.data_ativacao,
          cv.data_validade,
          cv.qr_code_digital,
          cv.qr_code_fisico,
          l.nome as loja_nome
        FROM clientes_vip cv
        INNER JOIN clientes_beneficios cb ON cv.id = cb.cliente_vip_id
        INNER JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id AND cb.tipo = 'oficial'
        LEFT JOIN lojas l ON cv.loja_id = l.id
        WHERE bo.parceiro_id = $1
          AND cb.ativo = true
          AND bo.ativo = true
        ORDER BY cv.nome ASC`,
        [parceiroId]
      );
      
      console.log(`[DEBUG] Encontrados ${clientesResult.rows.length} clientes para o parceiro ${parceiroId}`);
      
      res.json(clientesResult.rows);
    } catch (error: any) {
      console.error('Erro ao buscar clientes do parceiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

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
          'SELECT id FROM parceiros WHERE cnpj = $1',
          [cnpjLimpo]
        );
        
        if (cnpjCheck.rows.length > 0) {
          return res.status(400).json({
            error: 'CNPJ já cadastrado',
          });
        }
      }

      // Gerar email único para o usuário
      // Se email do parceiro foi fornecido, usar ele, senão gerar um baseado no nome
      let emailUsuario = email;
      if (!emailUsuario) {
        // Gerar email baseado no nome do parceiro (normalizar e adicionar sufixo único)
        const nomeNormalizado = nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        const timestamp = Date.now().toString().slice(-6);
        emailUsuario = `parceiro${nomeNormalizado}${timestamp}@exemplo.com`;
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
        emailUsuario = `parceiro${timestamp}@exemplo.com`;
      }

      // Hash da senha padrão: Parceiro123!
      const senhaPadraoHash = '$2a$10$WNO5jKAYOMQxflGBXV11e.CqzEh.Y0naLRydEGzvmZBlWKyHj1p1e';

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
              'parceiro',
              `Parceiro ${nome}`,
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

        // Criar parceiro associado ao usuário
        let result;
        try {
          result = await client.query(
            `INSERT INTO parceiros (nome, tipo, cnpj, telefone, email, endereco, ativo, user_id)
             VALUES ($1, $2, $3, $4, $5, $6, true, $7)
             RETURNING *`,
            [nome, tipo, cnpjLimpo, telefoneLimpo, email || null, endereco || null, userId]
          );
        } catch (parceiroError: any) {
          await client.query('ROLLBACK');
          releaseClient();
          console.error('Erro ao criar parceiro na transação:', parceiroError);
          console.error('Detalhes do erro do parceiro:', {
            code: parceiroError.code,
            detail: parceiroError.detail,
            constraint: parceiroError.constraint,
            message: parceiroError.message
          });
          
          // Tratar erros específicos da criação do parceiro
          if (parceiroError.code === '23505') {
            if (parceiroError.constraint?.includes('cnpj')) {
              return res.status(400).json({
                error: 'CNPJ já cadastrado',
              });
            }
          }
          
          // Retornar erro específico do parceiro
          return res.status(500).json({
            error: 'Erro ao criar parceiro',
            message: parceiroError.message || 'Erro desconhecido',
            ...(process.env.NODE_ENV === 'development' && {
              detail: parceiroError.detail,
              code: parceiroError.code,
              constraint: parceiroError.constraint
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
      console.error('Erro ao criar parceiro:', error);
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

