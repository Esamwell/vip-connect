import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/beneficios/validar
 * Valida um benefício (parceiro escaneia QR ou digita código)
 */
router.post(
  '/validar',
  authenticate,
  authorize('parceiro', 'admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { qr_code, beneficio_oficial_id, beneficio_loja_id } = req.body;

      if (!qr_code) {
        return res.status(400).json({
          error: 'QR Code é obrigatório',
        });
      }

      // Buscar cliente VIP pelo QR Code
      const clienteResult = await pool.query(
        `SELECT cv.*, l.nome as loja_nome
         FROM clientes_vip cv
         JOIN lojas l ON cv.loja_id = l.id
         WHERE cv.qr_code_digital = $1 OR cv.qr_code_fisico = $1`,
        [qr_code]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Cliente VIP não encontrado ou QR Code inválido',
        });
      }

      const cliente = clienteResult.rows[0];

      // Verificar se cliente está ativo
      if (cliente.status !== 'ativo') {
        return res.status(400).json({
          error: `Cliente VIP está ${cliente.status}. Apenas clientes ativos podem usar benefícios.`,
        });
      }

      // Verificar se a validade não expirou
      const hoje = new Date();
      const dataValidade = new Date(cliente.data_validade);
      if (dataValidade < hoje) {
        return res.status(400).json({
          error: 'Cliente VIP está vencido. Renovação necessária.',
        });
      }

      // Buscar parceiro do usuário autenticado
      const parceiroResult = await pool.query(
        'SELECT id FROM parceiros WHERE user_id = $1',
        [req.user!.userId]
      );

      if (parceiroResult.rows.length === 0) {
        return res.status(403).json({
          error: 'Usuário não está associado a um parceiro',
        });
      }

      const parceiroId = parceiroResult.rows[0].id;

      // Verificar qual benefício está sendo validado
      let beneficioId: string | null = null;
      let tipoBeneficio: 'oficial' | 'loja' = 'oficial';

      if (beneficio_oficial_id) {
        // Verificar se o benefício oficial pertence ao parceiro
        const beneficioResult = await pool.query(
          'SELECT id FROM beneficios_oficiais WHERE id = $1 AND parceiro_id = $2 AND ativo = true',
          [beneficio_oficial_id, parceiroId]
        );

        if (beneficioResult.rows.length === 0) {
          return res.status(400).json({
            error: 'Benefício não encontrado ou não disponível para este parceiro',
          });
        }

        beneficioId = beneficio_oficial_id;
        tipoBeneficio = 'oficial';
      } else if (beneficio_loja_id) {
        // Verificar se o benefício de loja existe e está ativo
        const beneficioResult = await pool.query(
          'SELECT id FROM beneficios_loja WHERE id = $1 AND ativo = true',
          [beneficio_loja_id]
        );

        if (beneficioResult.rows.length === 0) {
          return res.status(400).json({
            error: 'Benefício não encontrado',
          });
        }

        beneficioId = beneficio_loja_id;
        tipoBeneficio = 'loja';
      } else {
        // Se não especificou, buscar primeiro benefício oficial do parceiro
        const beneficioResult = await pool.query(
          'SELECT id FROM beneficios_oficiais WHERE parceiro_id = $1 AND ativo = true LIMIT 1',
          [parceiroId]
        );

        if (beneficioResult.rows.length === 0) {
          return res.status(400).json({
            error: 'Nenhum benefício disponível para este parceiro',
          });
        }

        beneficioId = beneficioResult.rows[0].id;
        tipoBeneficio = 'oficial';
      }

      // Verificar se o benefício está alocado ao cliente e marcar como resgatado
      let alocacaoId: string | null = null;
      if (tipoBeneficio === 'oficial') {
        const alocacaoCheck = await pool.query(
          'SELECT id FROM clientes_beneficios WHERE cliente_vip_id = $1 AND beneficio_oficial_id = $2 AND tipo = $3 AND ativo = true',
          [cliente.id, beneficioId, tipoBeneficio]
        );
        
        if (alocacaoCheck.rows.length > 0) {
          alocacaoId = alocacaoCheck.rows[0].id;
          // Marcar como resgatado na tabela clientes_beneficios
          await pool.query(
            `UPDATE clientes_beneficios 
             SET resgatado = true, 
                 data_resgate = CURRENT_TIMESTAMP,
                 resgatado_por = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [req.user!.userId, alocacaoId]
          );
        }
      } else {
        const alocacaoCheck = await pool.query(
          'SELECT id FROM clientes_beneficios WHERE cliente_vip_id = $1 AND beneficio_loja_id = $2 AND tipo = $3 AND ativo = true',
          [cliente.id, beneficioId, tipoBeneficio]
        );
        
        if (alocacaoCheck.rows.length > 0) {
          alocacaoId = alocacaoCheck.rows[0].id;
          // Marcar como resgatado na tabela clientes_beneficios
          await pool.query(
            `UPDATE clientes_beneficios 
             SET resgatado = true, 
                 data_resgate = CURRENT_TIMESTAMP,
                 resgatado_por = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [req.user!.userId, alocacaoId]
          );
        }
      }

      // Registrar validação
      const validacaoResult = await pool.query(
        `INSERT INTO validacoes_beneficios (
          cliente_vip_id, parceiro_id, beneficio_oficial_id, 
          beneficio_loja_id, tipo, codigo_qr
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          cliente.id,
          parceiroId,
          tipoBeneficio === 'oficial' ? beneficioId : null,
          tipoBeneficio === 'loja' ? beneficioId : null,
          tipoBeneficio,
          qr_code,
        ]
      );

      const validacao = validacaoResult.rows[0];

      res.status(201).json({
        validacao,
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          status: cliente.status,
          data_validade: cliente.data_validade,
          loja_nome: cliente.loja_nome,
        },
        mensagem: 'Benefício validado com sucesso!',
      });
    } catch (error: any) {
      console.error('Erro ao validar benefício:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/beneficios/validar/:qr_code
 * Busca informações do cliente pelo QR Code (para tela do parceiro)
 */
router.get(
  '/validar/:qr_code',
  authenticate,
  authorize('parceiro', 'admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { qr_code } = req.params;

      // Buscar cliente VIP
      const clienteResult = await pool.query(
        `SELECT cv.*, l.nome as loja_nome
         FROM clientes_vip cv
         JOIN lojas l ON cv.loja_id = l.id
         WHERE cv.qr_code_digital = $1 OR cv.qr_code_fisico = $1`,
        [qr_code]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Cliente VIP não encontrado',
        });
      }

      const cliente = clienteResult.rows[0];

      // Buscar parceiro do usuário
      const parceiroResult = await pool.query(
        'SELECT id, nome, tipo FROM parceiros WHERE user_id = $1',
        [req.user!.userId]
      );

      if (parceiroResult.rows.length === 0) {
        return res.status(403).json({
          error: 'Usuário não está associado a um parceiro',
        });
      }

      const parceiro = parceiroResult.rows[0];

      // Buscar benefícios válidos para este parceiro
      const beneficiosOficiais = await pool.query(
        `SELECT bo.*
         FROM beneficios_oficiais bo
         WHERE bo.parceiro_id = $1 AND bo.ativo = true`,
        [parceiro.id]
      );

      // Buscar benefícios da loja do cliente
      const beneficiosLoja = await pool.query(
        `SELECT bl.*
         FROM beneficios_loja bl
         WHERE bl.loja_id = $1 AND bl.ativo = true`,
        [cliente.loja_id]
      );

      res.json({
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          status: cliente.status,
          data_validade: cliente.data_validade,
          loja_nome: cliente.loja_nome,
          valido: cliente.status === 'ativo' && new Date(cliente.data_validade) >= new Date(),
        },
        parceiro: {
          id: parceiro.id,
          nome: parceiro.nome,
          tipo: parceiro.tipo,
        },
        beneficios_oficiais: beneficiosOficiais.rows,
        beneficios_loja: beneficiosLoja.rows,
      });
    } catch (error: any) {
      console.error('Erro ao buscar informações do QR Code:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/beneficios/oficiais
 * Lista todos os benefícios oficiais
 * Parceiro vê apenas seus próprios benefícios
 */
router.get(
  '/oficiais',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'parceiro'),
  async (req, res) => {
    try {
      let query = `SELECT bo.*, p.nome as parceiro_nome, p.tipo as parceiro_tipo
                   FROM beneficios_oficiais bo
                   JOIN parceiros p ON bo.parceiro_id = p.id
                   WHERE bo.ativo = true`;
      const params: any[] = [];
      
      // Parceiro só vê seus próprios benefícios
      if (req.user!.role === 'parceiro') {
        query += ' AND p.user_id = $1';
        params.push(req.user!.userId);
      }
      
      query += ' ORDER BY bo.nome ASC';
      
      const result = await pool.query(query, params);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao listar benefícios oficiais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/beneficios/oficiais
 * Cria um novo benefício oficial
 * Admin_mt e parceiros podem criar benefícios oficiais
 * Parceiros só podem criar para si mesmos
 */
router.post(
  '/oficiais',
  authenticate,
  authorize('admin_mt', 'parceiro'),
  async (req, res) => {
    try {
      const { nome, descricao, parceiro_id } = req.body;

      if (!nome) {
        return res.status(400).json({
          error: 'Nome é obrigatório',
        });
      }

      let parceiroId = parceiro_id;

      // Se for parceiro, usar seu próprio ID
      if (req.user!.role === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1 AND ativo = true',
          [req.user!.userId]
        );
        
        if (parceiroResult.rows.length === 0) {
          return res.status(404).json({
            error: 'Parceiro não encontrado',
          });
        }
        
        parceiroId = parceiroResult.rows[0].id;
      } else {
        // Admin deve fornecer parceiro_id
        if (!parceiro_id) {
          return res.status(400).json({
            error: 'Parceiro é obrigatório',
          });
        }

        // Verificar se parceiro existe
        const parceiroCheck = await pool.query(
          'SELECT id FROM parceiros WHERE id = $1 AND ativo = true',
          [parceiro_id]
        );
        
        if (parceiroCheck.rows.length === 0) {
          return res.status(404).json({
            error: 'Parceiro não encontrado ou inativo',
          });
        }
      }

      // Criar benefício oficial
      const result = await pool.query(
        `INSERT INTO beneficios_oficiais (nome, descricao, parceiro_id, ativo)
         VALUES ($1, $2, $3, true)
         RETURNING *`,
        [nome, descricao || null, parceiroId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar benefício oficial:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/beneficios/loja
 * Lista todos os benefícios de loja
 */
router.get(
  '/loja',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      let query = `SELECT bl.*, l.nome as loja_nome
                   FROM beneficios_loja bl
                   JOIN lojas l ON bl.loja_id = l.id
                   WHERE bl.ativo = true`;
      const params: any[] = [];
      
      // Lojista só vê benefícios de suas próprias lojas
      if (req.user!.role === 'lojista') {
        query += ' AND l.user_id = $1';
        params.push(req.user!.userId);
      }
      
      query += ' ORDER BY bl.nome ASC';
      
      const result = await pool.query(query, params);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao listar benefícios de loja:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/beneficios/loja
 * Cria um novo benefício de loja
 * Apenas admin_mt e lojistas podem criar benefícios de loja
 */
router.post(
  '/loja',
  authenticate,
  authorize('admin_mt', 'lojista'),
  async (req, res) => {
    try {
      const { nome, descricao, loja_id } = req.body;

      if (!nome) {
        return res.status(400).json({
          error: 'Nome é obrigatório',
        });
      }

      let lojaId = loja_id;

      // Se é lojista, usar sua própria loja ou validar se a loja pertence a ele
      if (req.user!.role === 'lojista') {
        if (loja_id) {
          // Verificar se a loja pertence ao lojista
          const lojaCheck = await pool.query(
            'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
            [loja_id, req.user!.userId]
          );
          
          if (lojaCheck.rows.length === 0) {
            return res.status(403).json({
              error: 'Você só pode criar benefícios para suas próprias lojas',
            });
          }
        } else {
          // Buscar primeira loja do lojista
          const lojaResult = await pool.query(
            'SELECT id FROM lojas WHERE user_id = $1 AND ativo = true LIMIT 1',
            [req.user!.userId]
          );
          
          if (lojaResult.rows.length === 0) {
            return res.status(404).json({
              error: 'Nenhuma loja encontrada para este usuário',
            });
          }
          
          lojaId = lojaResult.rows[0].id;
        }
      } else {
        // Admin deve fornecer loja_id
        if (!loja_id) {
          return res.status(400).json({
            error: 'Loja é obrigatória',
          });
        }
        
        // Verificar se loja existe
        const lojaCheck = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND ativo = true',
          [loja_id]
        );
        
        if (lojaCheck.rows.length === 0) {
          return res.status(404).json({
            error: 'Loja não encontrada ou inativa',
          });
        }
      }

      // Criar benefício de loja
      const result = await pool.query(
        `INSERT INTO beneficios_loja (nome, descricao, loja_id, ativo)
         VALUES ($1, $2, $3, true)
         RETURNING *`,
        [nome, descricao || null, lojaId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar benefício de loja:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * PUT /api/beneficios/oficiais/:id
 * Atualiza um benefício oficial
 */
router.put(
  '/oficiais/:id',
  authenticate,
  authorize('admin_mt', 'parceiro'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, descricao, parceiro_id, ativo } = req.body;

      // Verificar se benefício existe
      const beneficioCheck = await pool.query(
        'SELECT parceiro_id FROM beneficios_oficiais WHERE id = $1',
        [id]
      );

      if (beneficioCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Benefício não encontrado',
        });
      }

      const beneficioAtual = beneficioCheck.rows[0];

      // Se for parceiro, verificar se o benefício pertence a ele
      if (req.user!.role === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1 AND ativo = true',
          [req.user!.userId]
        );
        
        if (parceiroResult.rows.length === 0) {
          return res.status(404).json({
            error: 'Parceiro não encontrado',
          });
        }

        if (beneficioAtual.parceiro_id !== parceiroResult.rows[0].id) {
          return res.status(403).json({
            error: 'Você não tem permissão para editar este benefício',
          });
        }
      }

      // Em edição, parceiro_id não pode ser alterado - sempre usar o valor atual do banco
      // Atualizar benefício (parceiro_id não pode ser alterado em edição)
      const result = await pool.query(
        `UPDATE beneficios_oficiais 
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
      console.error('Erro ao atualizar benefício oficial:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * DELETE /api/beneficios/oficiais/:id
 * Exclui (desativa) um benefício oficial
 */
router.delete(
  '/oficiais/:id',
  authenticate,
  authorize('admin_mt', 'parceiro'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se benefício existe
      const beneficioCheck = await pool.query(
        'SELECT parceiro_id FROM beneficios_oficiais WHERE id = $1',
        [id]
      );

      if (beneficioCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Benefício não encontrado',
        });
      }

      const beneficioAtual = beneficioCheck.rows[0];

      // Se for parceiro, verificar se o benefício pertence a ele
      if (req.user!.role === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1 AND ativo = true',
          [req.user!.userId]
        );
        
        if (parceiroResult.rows.length === 0) {
          return res.status(404).json({
            error: 'Parceiro não encontrado',
          });
        }

        if (beneficioAtual.parceiro_id !== parceiroResult.rows[0].id) {
          return res.status(403).json({
            error: 'Você não tem permissão para excluir este benefício',
          });
        }
      }

      // Desativar benefício (soft delete)
      const result = await pool.query(
        `UPDATE beneficios_oficiais 
         SET ativo = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      res.json({
        message: 'Benefício excluído com sucesso',
        beneficio: result.rows[0],
      });
    } catch (error: any) {
      console.error('Erro ao excluir benefício oficial:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * PUT /api/beneficios/loja/:id
 * Atualiza um benefício de loja
 */
router.put(
  '/loja/:id',
  authenticate,
  authorize('admin_mt', 'lojista'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, descricao, loja_id, ativo } = req.body;

      // Verificar se benefício existe
      const beneficioCheck = await pool.query(
        'SELECT loja_id FROM beneficios_loja WHERE id = $1',
        [id]
      );

      if (beneficioCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Benefício não encontrado',
        });
      }

      const beneficioAtual = beneficioCheck.rows[0];

      // Se for lojista, verificar se o benefício pertence à sua loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1 AND ativo = true',
          [req.user!.userId]
        );
        
        if (lojaResult.rows.length === 0) {
          return res.status(404).json({
            error: 'Loja não encontrada',
          });
        }

        if (beneficioAtual.loja_id !== lojaResult.rows[0].id) {
          return res.status(403).json({
            error: 'Você não tem permissão para editar este benefício',
          });
        }
      }

      // Em edição, loja_id não pode ser alterado - sempre usar o valor atual do banco
      // Atualizar benefício (loja_id não pode ser alterado em edição)
      const result = await pool.query(
        `UPDATE beneficios_loja 
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
      console.error('Erro ao atualizar benefício de loja:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * DELETE /api/beneficios/loja/:id
 * Exclui (desativa) um benefício de loja
 */
router.delete(
  '/loja/:id',
  authenticate,
  authorize('admin_mt', 'lojista'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se benefício existe
      const beneficioCheck = await pool.query(
        'SELECT loja_id FROM beneficios_loja WHERE id = $1',
        [id]
      );

      if (beneficioCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Benefício não encontrado',
        });
      }

      const beneficioAtual = beneficioCheck.rows[0];

      // Se for lojista, verificar se o benefício pertence à sua loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1 AND ativo = true',
          [req.user!.userId]
        );
        
        if (lojaResult.rows.length === 0) {
          return res.status(404).json({
            error: 'Loja não encontrada',
          });
        }

        if (beneficioAtual.loja_id !== lojaResult.rows[0].id) {
          return res.status(403).json({
            error: 'Você não tem permissão para excluir este benefício',
          });
        }
      }

      // Desativar benefício (soft delete)
      const result = await pool.query(
        `UPDATE beneficios_loja 
         SET ativo = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      res.json({
        message: 'Benefício excluído com sucesso',
        beneficio: result.rows[0],
      });
    } catch (error: any) {
      console.error('Erro ao excluir benefício de loja:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

