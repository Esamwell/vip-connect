import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, authorizeLojista } from '../middleware/auth';
import { generateQRCode, generateQRCodeFisico } from '../utils/qrcode';
import { enviarEventoMTLeads, EventosMTLeads } from '../services/mtleads';

const router = express.Router();

/**
 * GET /api/clientes-vip
 * Lista clientes VIP (com filtros por loja para lojistas)
 */
router.get(
  '/',
  authenticate,
  authorizeLojista,
  async (req, res) => {
    try {
      const { loja_id, status, search } = req.query;
      let query = `
        SELECT 
          cv.*,
          l.nome as loja_nome,
          COUNT(DISTINCT a.id) as total_avaliacoes,
          COALESCE(AVG(a.nota), 0) as nota_media_avaliacoes
        FROM clientes_vip cv
        JOIN lojas l ON cv.loja_id = l.id
        LEFT JOIN avaliacoes a ON cv.id = a.cliente_vip_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      // Se for lojista, filtrar apenas sua loja
      if (req.user!.role === 'lojista') {
        // Buscar loja do lojista
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1',
          [req.user!.userId]
        );
        if (lojaResult.rows.length > 0) {
          query += ` AND cv.loja_id = $${paramCount}`;
          params.push(lojaResult.rows[0].id);
          paramCount++;
        } else {
          return res.json([]); // Lojista sem loja não vê ninguém
        }
      } else if (loja_id) {
        query += ` AND cv.loja_id = $${paramCount}`;
        params.push(loja_id);
        paramCount++;
      }

      if (status) {
        query += ` AND cv.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (search) {
        query += ` AND (cv.nome ILIKE $${paramCount} OR cv.whatsapp ILIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      query += ` GROUP BY cv.id, l.nome ORDER BY cv.data_ativacao DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao listar clientes VIP:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/clientes-vip/qr/:qrCode
 * Busca cliente VIP por QR Code (rota pública para clientes)
 * IMPORTANTE: Esta rota deve vir ANTES de todas as rotas /:id para evitar conflitos
 */
router.get('/qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    console.log('Buscando cliente VIP por QR Code (público):', qrCode);

    // Buscar cliente por QR code (digital ou físico)
    const qrCheck = await pool.query(
      'SELECT id FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
      [qrCode]
    );
    
    if (qrCheck.rows.length === 0) {
      console.log('Cliente não encontrado com QR:', qrCode);
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }
    
    // Usar o ID real do cliente encontrado pelo QR code
    const clienteId = qrCheck.rows[0].id;

    // Buscar cliente com dados da loja usando o ID real
    const result = await pool.query(
      `SELECT 
        cv.*,
        l.nome as loja_nome,
        l.telefone as loja_telefone
      FROM clientes_vip cv
      LEFT JOIN lojas l ON cv.loja_id = l.id
      WHERE cv.id = $1`,
      [clienteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }

    const cliente = result.rows[0];
    console.log('Cliente encontrado (público):', cliente.nome);

    res.json(cliente);
  } catch (error: any) {
    console.error('Erro ao buscar cliente VIP por QR Code:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message || 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/clientes-vip/qr/:qrCode/beneficios
 * Lista benefícios disponíveis por QR Code (rota pública para clientes)
 * Retorna APENAS benefícios explicitamente alocados ao cliente
 */
router.get('/qr/:qrCode/beneficios', async (req, res) => {
  try {
    const { qrCode } = req.params;
    console.log('Buscando benefícios por QR Code (público):', qrCode);

    // Buscar cliente por QR code
    const qrCheck = await pool.query(
      'SELECT id FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
      [qrCode]
    );
    
    if (qrCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }
    
    const clienteId = qrCheck.rows[0].id;

    // Buscar APENAS benefícios que foram explicitamente alocados ao cliente
    const beneficiosAlocados = await pool.query(
      `SELECT 
        cb.id as alocacao_id,
        COALESCE(bo.id, bl.id) as id,
        COALESCE(bo.nome, bl.nome) as nome,
        COALESCE(bo.descricao, bl.descricao) as descricao,
        cb.tipo,
        p.nome as parceiro_nome,
        l.nome as loja_nome,
        COALESCE(bo.ativo, bl.ativo) as ativo,
        cb.ativo as alocacao_ativa
      FROM clientes_beneficios cb
      LEFT JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id AND cb.tipo = 'oficial'
      LEFT JOIN beneficios_loja bl ON cb.beneficio_loja_id = bl.id AND cb.tipo = 'loja'
      LEFT JOIN parceiros p ON bo.parceiro_id = p.id
      LEFT JOIN lojas l ON bl.loja_id = l.id
      WHERE cb.cliente_vip_id = $1 
        AND cb.ativo = true
        AND (bo.ativo = true OR bl.ativo = true)
      ORDER BY cb.tipo, nome`,
      [clienteId]
    );

    // Retornar apenas benefícios que foram explicitamente alocados
    res.json(beneficiosAlocados.rows);
  } catch (error: any) {
    console.error('Erro ao buscar benefícios por QR Code:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/clientes-vip/qr/:qrCode/validacoes
 * Lista histórico de validações de benefícios por QR Code (rota pública para clientes)
 */
router.get('/qr/:qrCode/validacoes', async (req, res) => {
  try {
    const { qrCode } = req.params;
    console.log('Buscando histórico de validações por QR Code (público):', qrCode);

    // Buscar cliente por QR code
    const qrCheck = await pool.query(
      'SELECT id FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
      [qrCode]
    );
    
    if (qrCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }
    
    const clienteId = qrCheck.rows[0].id;

    // Buscar validações
    const validacoesResult = await pool.query(
      `SELECT 
        vb.id,
        vb.data_validacao,
        vb.tipo,
        p.nome as parceiro_nome,
        COALESCE(bo.nome, bl.nome) as beneficio_nome
      FROM validacoes_beneficios vb
      JOIN parceiros p ON vb.parceiro_id = p.id
      LEFT JOIN beneficios_oficiais bo ON vb.beneficio_oficial_id = bo.id
      LEFT JOIN beneficios_loja bl ON vb.beneficio_loja_id = bl.id
      WHERE vb.cliente_vip_id = $1
      ORDER BY vb.data_validacao DESC
      LIMIT 50`,
      [clienteId]
    );

    res.json(validacoesResult.rows);
  } catch (error: any) {
    console.error('Erro ao buscar histórico de validações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/clientes-vip/:id/beneficios
 * Lista benefícios disponíveis para um cliente VIP
 * IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflitos
 */
router.get(
  '/:id/beneficios',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se cliente existe e buscar loja
      const clienteResult = await pool.query(
        'SELECT id, loja_id FROM clientes_vip WHERE id = $1',
        [id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }

      const cliente = clienteResult.rows[0];

      // Verificar permissões (lojista só vê seus próprios clientes)
      if (req.user!.role === 'lojista') {
        const lojaCheck = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [cliente.loja_id, req.user!.userId]
        );

        if (lojaCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Você não tem permissão para ver este cliente',
          });
        }
      }

      // Buscar APENAS benefícios que foram explicitamente alocados ao cliente
      // Benefícios não aparecem automaticamente - devem ser alocados manualmente
      const beneficiosAlocados = await pool.query(
        `SELECT 
          cb.id as alocacao_id,
          COALESCE(bo.id, bl.id) as id,
          COALESCE(bo.nome, bl.nome) as nome,
          COALESCE(bo.descricao, bl.descricao) as descricao,
          cb.tipo,
          p.nome as parceiro_nome,
          l.nome as loja_nome,
          COALESCE(bo.ativo, bl.ativo) as ativo,
          cb.ativo as alocacao_ativa
        FROM clientes_beneficios cb
        LEFT JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id AND cb.tipo = 'oficial'
        LEFT JOIN beneficios_loja bl ON cb.beneficio_loja_id = bl.id AND cb.tipo = 'loja'
        LEFT JOIN parceiros p ON bo.parceiro_id = p.id
        LEFT JOIN lojas l ON bl.loja_id = l.id
        WHERE cb.cliente_vip_id = $1 
          AND cb.ativo = true
          AND (bo.ativo = true OR bl.ativo = true)
        ORDER BY cb.tipo, nome`,
        [id]
      );

      // Retornar apenas benefícios que foram explicitamente alocados
      // Se não houver benefícios alocados, retorna array vazio
      res.json(beneficiosAlocados.rows);
    } catch (error: any) {
      console.error('Erro ao buscar benefícios do cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/clientes-vip/:id/beneficios/alocar
 * Aloca benefícios específicos a um cliente VIP
 * IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflitos
 */
router.post(
  '/:id/beneficios/alocar',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { beneficios } = req.body; // Array de objetos: [{ beneficio_oficial_id?: string, beneficio_loja_id?: string, tipo: 'oficial' | 'loja' }]

      if (!beneficios || !Array.isArray(beneficios) || beneficios.length === 0) {
        return res.status(400).json({
          error: 'Lista de benefícios é obrigatória',
        });
      }

      // Verificar se cliente existe
      const clienteResult = await pool.query(
        'SELECT id, loja_id FROM clientes_vip WHERE id = $1',
        [id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }

      const cliente = clienteResult.rows[0];

      // Verificar permissões (lojista só pode alocar a seus próprios clientes)
      if (req.user!.role === 'lojista') {
        const lojaCheck = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [cliente.loja_id, req.user!.userId]
        );

        if (lojaCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Você não tem permissão para alocar benefícios a este cliente',
          });
        }
      }

      const beneficiosAlocados = [];
      const erros = [];

      // Alocar cada benefício
      for (const beneficio of beneficios) {
        try {
          const { beneficio_oficial_id, beneficio_loja_id, tipo } = beneficio;

          // Validar tipo e IDs
          if (!tipo || (tipo !== 'oficial' && tipo !== 'loja')) {
            erros.push({ beneficio, erro: 'Tipo de benefício inválido' });
            continue;
          }

          if (tipo === 'oficial' && !beneficio_oficial_id) {
            erros.push({ beneficio, erro: 'beneficio_oficial_id é obrigatório para tipo oficial' });
            continue;
          }

          if (tipo === 'loja' && !beneficio_loja_id) {
            erros.push({ beneficio, erro: 'beneficio_loja_id é obrigatório para tipo loja' });
            continue;
          }

          // Verificar se o benefício existe e está ativo
          if (tipo === 'oficial') {
            const beneficioCheck = await pool.query(
              'SELECT id FROM beneficios_oficiais WHERE id = $1 AND ativo = true',
              [beneficio_oficial_id]
            );

            if (beneficioCheck.rows.length === 0) {
              erros.push({ beneficio, erro: 'Benefício oficial não encontrado ou inativo' });
              continue;
            }
          } else {
            const beneficioCheck = await pool.query(
              'SELECT id FROM beneficios_loja WHERE id = $1 AND ativo = true',
              [beneficio_loja_id]
            );

            if (beneficioCheck.rows.length === 0) {
              erros.push({ beneficio, erro: 'Benefício de loja não encontrado ou inativo' });
              continue;
            }
          }

          // Verificar se já existe alocação
          const existingCheck = tipo === 'oficial'
            ? await pool.query(
                'SELECT id FROM clientes_beneficios WHERE cliente_vip_id = $1 AND beneficio_oficial_id = $2',
                [id, beneficio_oficial_id]
              )
            : await pool.query(
                'SELECT id FROM clientes_beneficios WHERE cliente_vip_id = $1 AND beneficio_loja_id = $2',
                [id, beneficio_loja_id]
              );

          let result;
          if (existingCheck.rows.length > 0) {
            // Atualizar alocação existente (reativar se estiver inativa)
            result = await pool.query(
              `UPDATE clientes_beneficios 
               SET ativo = true, 
                   updated_at = CURRENT_TIMESTAMP,
                   alocado_por = $1
               WHERE id = $2
               RETURNING *`,
              [req.user!.userId, existingCheck.rows[0].id]
            );
          } else {
            // Inserir nova alocação
            const insertQuery = tipo === 'oficial'
              ? `INSERT INTO clientes_beneficios (
                  cliente_vip_id, 
                  beneficio_oficial_id, 
                  beneficio_loja_id, 
                  tipo, 
                  ativo, 
                  alocado_por
                ) VALUES ($1, $2, NULL, $3, true, $4)
                RETURNING *`
              : `INSERT INTO clientes_beneficios (
                  cliente_vip_id, 
                  beneficio_oficial_id, 
                  beneficio_loja_id, 
                  tipo, 
                  ativo, 
                  alocado_por
                ) VALUES ($1, NULL, $2, $3, true, $4)
                RETURNING *`;
            
            const params = tipo === 'oficial'
              ? [id, beneficio_oficial_id, tipo, req.user!.userId]
              : [id, beneficio_loja_id, tipo, req.user!.userId];
            
            result = await pool.query(insertQuery, params);
          }

          beneficiosAlocados.push(result.rows[0]);
        } catch (error: any) {
          console.error('Erro ao alocar benefício:', error);
          erros.push({ beneficio, erro: error.message });
        }
      }

      res.status(200).json({
        message: `${beneficiosAlocados.length} benefício(s) alocado(s) com sucesso`,
        alocados: beneficiosAlocados,
        erros: erros.length > 0 ? erros : undefined,
      });
    } catch (error: any) {
      console.error('Erro ao alocar benefícios:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * DELETE /api/clientes-vip/:id/beneficios/:beneficioId
 * Remove alocação de um benefício específico de um cliente VIP
 */
router.delete(
  '/:id/beneficios/:beneficioId',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { id, beneficioId } = req.params;
      const { tipo } = req.query; // 'oficial' ou 'loja'

      if (!tipo || (tipo !== 'oficial' && tipo !== 'loja')) {
        return res.status(400).json({
          error: 'Tipo de benefício é obrigatório (oficial ou loja)',
        });
      }

      // Verificar se cliente existe
      const clienteResult = await pool.query(
        'SELECT id, loja_id FROM clientes_vip WHERE id = $1',
        [id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }

      const cliente = clienteResult.rows[0];

      // Verificar permissões
      if (req.user!.role === 'lojista') {
        const lojaCheck = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [cliente.loja_id, req.user!.userId]
        );

        if (lojaCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Você não tem permissão para remover benefícios deste cliente',
          });
        }
      }

      // Remover alocação (marcar como inativa em vez de deletar para manter histórico)
      const deleteQuery = tipo === 'oficial'
        ? `UPDATE clientes_beneficios 
           SET ativo = false, updated_at = CURRENT_TIMESTAMP
           WHERE cliente_vip_id = $1 
           AND beneficio_oficial_id = $2 
           AND tipo = 'oficial'
           RETURNING *`
        : `UPDATE clientes_beneficios 
           SET ativo = false, updated_at = CURRENT_TIMESTAMP
           WHERE cliente_vip_id = $1 
           AND beneficio_loja_id = $2 
           AND tipo = 'loja'
           RETURNING *`;

      const result = await pool.query(deleteQuery, [id, beneficioId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Benefício não encontrado ou já removido' });
      }

      res.json({
        message: 'Benefício removido com sucesso',
        beneficioremovido: result.rows[0],
      });
    } catch (error: any) {
      console.error('Erro ao remover benefício:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/clientes-vip/:id/beneficios/alocar
 * Aloca benefícios específicos a um cliente VIP
 * IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflitos
 */
router.post(
  '/:id/beneficios/alocar',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { beneficios } = req.body; // Array de objetos: [{ beneficio_oficial_id?: string, beneficio_loja_id?: string, tipo: 'oficial' | 'loja' }]

      if (!beneficios || !Array.isArray(beneficios) || beneficios.length === 0) {
        return res.status(400).json({
          error: 'Lista de benefícios é obrigatória',
        });
      }

      // Verificar se cliente existe
      const clienteResult = await pool.query(
        'SELECT id, loja_id FROM clientes_vip WHERE id = $1',
        [id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }

      const cliente = clienteResult.rows[0];

      // Verificar permissões (lojista só pode alocar a seus próprios clientes)
      if (req.user!.role === 'lojista') {
        const lojaCheck = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [cliente.loja_id, req.user!.userId]
        );

        if (lojaCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Você não tem permissão para alocar benefícios a este cliente',
          });
        }
      }

      const beneficiosAlocados = [];
      const erros = [];

      // Alocar cada benefício
      for (const beneficio of beneficios) {
        try {
          const { beneficio_oficial_id, beneficio_loja_id, tipo } = beneficio;

          // Validar tipo e IDs
          if (!tipo || (tipo !== 'oficial' && tipo !== 'loja')) {
            erros.push({ beneficio, erro: 'Tipo de benefício inválido' });
            continue;
          }

          if (tipo === 'oficial' && !beneficio_oficial_id) {
            erros.push({ beneficio, erro: 'beneficio_oficial_id é obrigatório para tipo oficial' });
            continue;
          }

          if (tipo === 'loja' && !beneficio_loja_id) {
            erros.push({ beneficio, erro: 'beneficio_loja_id é obrigatório para tipo loja' });
            continue;
          }

          // Verificar se o benefício existe e está ativo
          if (tipo === 'oficial') {
            const beneficioCheck = await pool.query(
              'SELECT id FROM beneficios_oficiais WHERE id = $1 AND ativo = true',
              [beneficio_oficial_id]
            );

            if (beneficioCheck.rows.length === 0) {
              erros.push({ beneficio, erro: 'Benefício oficial não encontrado ou inativo' });
              continue;
            }
          } else {
            const beneficioCheck = await pool.query(
              'SELECT id FROM beneficios_loja WHERE id = $1 AND ativo = true',
              [beneficio_loja_id]
            );

            if (beneficioCheck.rows.length === 0) {
              erros.push({ beneficio, erro: 'Benefício de loja não encontrado ou inativo' });
              continue;
            }
          }

          // Inserir ou atualizar alocação (usar INSERT ... ON CONFLICT para evitar duplicatas)
          // Nota: ON CONFLICT só funciona com constraints UNIQUE, então vamos usar uma abordagem diferente
          // Primeiro verificar se já existe
          const checkQuery = tipo === 'oficial'
            ? 'SELECT id FROM clientes_beneficios WHERE cliente_vip_id = $1 AND beneficio_oficial_id = $2 AND tipo = $3'
            : 'SELECT id FROM clientes_beneficios WHERE cliente_vip_id = $1 AND beneficio_loja_id = $2 AND tipo = $3';
          
          const checkParams = tipo === 'oficial'
            ? [id, beneficio_oficial_id, tipo]
            : [id, beneficio_loja_id, tipo];
          
          const existing = await pool.query(checkQuery, checkParams);

          if (existing.rows.length > 0) {
            // Atualizar se já existe
            const updateQuery = tipo === 'oficial'
              ? `UPDATE clientes_beneficios 
                 SET ativo = true, updated_at = CURRENT_TIMESTAMP, alocado_por = $1
                 WHERE cliente_vip_id = $2 AND beneficio_oficial_id = $3 AND tipo = $4
                 RETURNING *`
              : `UPDATE clientes_beneficios 
                 SET ativo = true, updated_at = CURRENT_TIMESTAMP, alocado_por = $1
                 WHERE cliente_vip_id = $2 AND beneficio_loja_id = $3 AND tipo = $4
                 RETURNING *`;
            
            const updateParams = tipo === 'oficial'
              ? [req.user!.userId, id, beneficio_oficial_id, tipo]
              : [req.user!.userId, id, beneficio_loja_id, tipo];
            
            const result = await pool.query(updateQuery, updateParams);
            beneficiosAlocados.push(result.rows[0]);
          } else {
            // Inserir se não existe
            const insertQuery = tipo === 'oficial'
              ? `INSERT INTO clientes_beneficios (
                  cliente_vip_id, 
                  beneficio_oficial_id, 
                  beneficio_loja_id, 
                  tipo, 
                  ativo, 
                  alocado_por
                ) VALUES ($1, $2, NULL, $3, true, $4)
                RETURNING *`
              : `INSERT INTO clientes_beneficios (
                  cliente_vip_id, 
                  beneficio_oficial_id, 
                  beneficio_loja_id, 
                  tipo, 
                  ativo, 
                  alocado_por
                ) VALUES ($1, NULL, $2, $3, true, $4)
                RETURNING *`;

            const insertParams = tipo === 'oficial'
              ? [id, beneficio_oficial_id, tipo, req.user!.userId]
              : [id, beneficio_loja_id, tipo, req.user!.userId];

            const result = await pool.query(insertQuery, insertParams);
            beneficiosAlocados.push(result.rows[0]);
          }
        } catch (error: any) {
          console.error('Erro ao alocar benefício:', error);
          erros.push({ beneficio, erro: error.message });
        }
      }

      res.status(200).json({
        message: `${beneficiosAlocados.length} benefício(s) alocado(s) com sucesso`,
        alocados: beneficiosAlocados,
        erros: erros.length > 0 ? erros : undefined,
      });
    } catch (error: any) {
      console.error('Erro ao alocar benefícios:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * DELETE /api/clientes-vip/:id/beneficios/:beneficioId
 * Remove alocação de um benefício específico de um cliente VIP
 * IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflitos
 */
router.delete(
  '/:id/beneficios/:beneficioId',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { id, beneficioId } = req.params;
      const { tipo } = req.query; // 'oficial' ou 'loja'

      if (!tipo || (tipo !== 'oficial' && tipo !== 'loja')) {
        return res.status(400).json({
          error: 'Tipo de benefício é obrigatório (oficial ou loja)',
        });
      }

      // Verificar se cliente existe
      const clienteResult = await pool.query(
        'SELECT id, loja_id FROM clientes_vip WHERE id = $1',
        [id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }

      const cliente = clienteResult.rows[0];

      // Verificar permissões
      if (req.user!.role === 'lojista') {
        const lojaCheck = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [cliente.loja_id, req.user!.userId]
        );

        if (lojaCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Você não tem permissão para remover benefícios deste cliente',
          });
        }
      }

      // Remover alocação (marcar como inativa em vez de deletar para manter histórico)
      const deleteQuery = tipo === 'oficial'
        ? `UPDATE clientes_beneficios 
           SET ativo = false, updated_at = CURRENT_TIMESTAMP
           WHERE cliente_vip_id = $1 
           AND beneficio_oficial_id = $2 
           AND tipo = 'oficial'
           RETURNING *`
        : `UPDATE clientes_beneficios 
           SET ativo = false, updated_at = CURRENT_TIMESTAMP
           WHERE cliente_vip_id = $1 
           AND beneficio_loja_id = $2 
           AND tipo = 'loja'
           RETURNING *`;

      const result = await pool.query(deleteQuery, [id, beneficioId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Benefício não encontrado ou já removido' });
      }

      res.json({
        message: 'Benefício removido com sucesso',
        beneficioremovido: result.rows[0],
      });
    } catch (error: any) {
      console.error('Erro ao remover benefício:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/clientes-vip/:id/validacoes
 * Lista histórico de validações de benefícios de um cliente VIP
 * IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflitos
 */
router.get(
  '/:id/validacoes',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se cliente existe e buscar loja
      const clienteResult = await pool.query(
        'SELECT id, loja_id FROM clientes_vip WHERE id = $1',
        [id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }

      const cliente = clienteResult.rows[0];

      // Verificar permissões (lojista só vê seus próprios clientes)
      if (req.user!.role === 'lojista') {
        const lojaCheck = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [cliente.loja_id, req.user!.userId]
        );

        if (lojaCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Você não tem permissão para ver este cliente',
          });
        }
      }

      // Buscar validações
      const validacoesResult = await pool.query(
        `SELECT 
          vb.id,
          vb.data_validacao,
          vb.tipo,
          p.nome as parceiro_nome,
          COALESCE(bo.nome, bl.nome) as beneficio_nome
        FROM validacoes_beneficios vb
        JOIN parceiros p ON vb.parceiro_id = p.id
        LEFT JOIN beneficios_oficiais bo ON vb.beneficio_oficial_id = bo.id
        LEFT JOIN beneficios_loja bl ON vb.beneficio_loja_id = bl.id
        WHERE vb.cliente_vip_id = $1
        ORDER BY vb.data_validacao DESC
        LIMIT 50`,
        [id]
      );

      res.json(validacoesResult.rows);
    } catch (error: any) {
      console.error('Erro ao buscar validações do cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/clientes-vip/:id
 * Busca cliente VIP por ID ou QR Code (rota protegida para dashboard)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Buscando cliente VIP com ID:', id);
    console.log('Usuário autenticado:', req.user?.role);

    // Buscar cliente por ID ou QR Code (digital ou físico)
    let clienteId = id;
    
    // Primeiro, tentar buscar por ID
    let clienteCheck = await pool.query(
      'SELECT id FROM clientes_vip WHERE id = $1',
      [id]
    );

    // Se não encontrou por ID, tentar buscar por QR code
    if (clienteCheck.rows.length === 0) {
      const qrCheck = await pool.query(
        'SELECT id FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
        [id]
      );
      
      if (qrCheck.rows.length === 0) {
        console.log('Cliente não encontrado com ID ou QR:', id);
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }
      
      // Usar o ID real do cliente encontrado pelo QR code
      clienteId = qrCheck.rows[0].id;
    }

    // Buscar cliente com dados da loja usando o ID real
    const result = await pool.query(
      `SELECT 
        cv.*,
        l.nome as loja_nome,
        l.telefone as loja_telefone
      FROM clientes_vip cv
      LEFT JOIN lojas l ON cv.loja_id = l.id
      WHERE cv.id = $1`,
      [clienteId]
    );

    console.log('Resultado da query:', result.rows.length, 'registros encontrados');

    if (result.rows.length === 0) {
      console.log('Cliente não encontrado com ID:', id);
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }

    const cliente = result.rows[0];
    console.log('Cliente encontrado:', cliente.nome, 'Loja:', cliente.loja_nome);

    // Verificar se lojista pode ver este cliente
    if (req.user!.role === 'lojista') {
      const lojaResult = await pool.query(
        'SELECT id FROM lojas WHERE user_id = $1',
        [req.user!.userId]
      );
      if (lojaResult.rows.length === 0 || 
          lojaResult.rows[0].id !== cliente.loja_id) {
        console.log('Acesso negado para lojista');
        return res.status(403).json({ 
          error: 'Acesso negado' 
        });
      }
    }

    res.json(cliente);
  } catch (error: any) {
    console.error('Erro ao buscar cliente VIP:', error);
    console.error('Mensagem do erro:', error.message);
    console.error('Stack trace completo:', error.stack);
    console.error('Detalhes do erro:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message || 'Erro desconhecido',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.detail,
        hint: error.hint
      })
    });
  }
});

/**
 * POST /api/clientes-vip
 * Cria novo cliente VIP (ativação automática após venda)
 */
router.post(
  '/',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const {
        nome,
        whatsapp,
        email,
        loja_id,
        data_venda,
        veiculo_marca,
        veiculo_modelo,
        veiculo_ano,
        veiculo_placa,
      } = req.body;

      if (!nome || !whatsapp || !loja_id || !data_venda) {
        return res.status(400).json({
          error: 'Nome, WhatsApp, loja e data da venda são obrigatórios',
        });
      }

      // Verificar se lojista está criando para sua própria loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [loja_id, req.user!.userId]
        );
        if (lojaResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Você só pode criar clientes para sua própria loja',
          });
        }
      }

      // Gerar QR codes
      const qrCodeDigital = generateQRCode();
      const qrCodeFisico = generateQRCodeFisico();

      // Calcular data de validade (12 meses)
      const dataVenda = new Date(data_venda);
      const dataValidade = new Date(dataVenda);
      dataValidade.setMonth(dataValidade.getMonth() + 12);

      // Criar cliente VIP
      const result = await pool.query(
        `INSERT INTO clientes_vip (
          nome, whatsapp, email, loja_id, status, data_venda, 
          data_ativacao, data_validade, qr_code_digital, qr_code_fisico,
          veiculo_marca, veiculo_modelo, veiculo_ano, veiculo_placa
        ) VALUES ($1, $2, $3, $4, 'ativo', $5, NOW(), $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          nome,
          whatsapp,
          email,
          loja_id,
          data_venda,
          dataValidade,
          qrCodeDigital,
          qrCodeFisico,
          veiculo_marca,
          veiculo_modelo,
          veiculo_ano,
          veiculo_placa,
        ]
      );

      const cliente = result.rows[0];

      // Disparar evento para MT Leads
      await enviarEventoMTLeads(EventosMTLeads.VIP_ATIVADO, {
        cliente_id: cliente.id,
        nome: cliente.nome,
        whatsapp: cliente.whatsapp,
        loja_id: cliente.loja_id,
        data_validade: cliente.data_validade,
        qr_code_digital: cliente.qr_code_digital,
      });

      res.status(201).json(cliente);
    } catch (error: any) {
      console.error('Erro ao criar cliente VIP:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/clientes-vip/ativar-venda
 * Ativa cliente VIP automaticamente após venda
 * (Esta rota será chamada quando uma venda for registrada)
 */
router.post(
  '/ativar-venda',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const {
        loja_id,
        nome,
        whatsapp,
        email,
        data_venda,
        valor,
        veiculo_marca,
        veiculo_modelo,
        veiculo_ano,
        veiculo_placa,
      } = req.body;

      // Registrar venda (o trigger vai criar o cliente VIP automaticamente)
      const vendaResult = await pool.query(
        `INSERT INTO vendas (
          loja_id, nome, whatsapp, email, data_venda, valor,
          veiculo_marca, veiculo_modelo, veiculo_ano, veiculo_placa
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          loja_id,
          nome,
          whatsapp,
          email,
          data_venda,
          valor,
          veiculo_marca,
          veiculo_modelo,
          veiculo_ano,
          veiculo_placa,
        ]
      );

      const venda = vendaResult.rows[0];

      // Buscar cliente VIP criado pelo trigger
      const clienteResult = await pool.query(
        'SELECT * FROM clientes_vip WHERE id = (SELECT cliente_vip_id FROM vendas WHERE id = $1)',
        [venda.id]
      );

      if (clienteResult.rows.length > 0) {
        const cliente = clienteResult.rows[0];

        // Disparar evento para MT Leads
        await enviarEventoMTLeads(EventosMTLeads.VIP_ATIVADO, {
          cliente_id: cliente.id,
          nome: cliente.nome,
          whatsapp: cliente.whatsapp,
          loja_id: cliente.loja_id,
          data_validade: cliente.data_validade,
          qr_code_digital: cliente.qr_code_digital,
        });

        res.status(201).json({
          venda,
          cliente_vip: cliente,
        });
      } else {
        res.status(201).json({ venda });
      }
    } catch (error: any) {
      console.error('Erro ao ativar VIP após venda:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

