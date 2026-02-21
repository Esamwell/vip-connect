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

    // Buscar histórico de veículos do cliente
    const veiculosResult = await pool.query(
      `SELECT 
        id,
        marca,
        modelo,
        ano,
        placa,
        data_compra,
        created_at
      FROM veiculos_cliente_vip
      WHERE cliente_vip_id = $1
      ORDER BY data_compra ASC, created_at ASC`,
      [clienteId]
    );

    cliente.veiculos_historico = veiculosResult.rows;

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
        cb.ativo as alocacao_ativa,
        cb.resgatado,
        cb.data_resgate,
        u.nome as resgatado_por_nome
      FROM clientes_beneficios cb
      LEFT JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id AND cb.tipo = 'oficial'
      LEFT JOIN beneficios_loja bl ON cb.beneficio_loja_id = bl.id AND cb.tipo = 'loja'
      LEFT JOIN parceiros p ON bo.parceiro_id = p.id
      LEFT JOIN lojas l ON bl.loja_id = l.id
      LEFT JOIN users u ON cb.resgatado_por = u.id
      WHERE cb.cliente_vip_id = $1 
        AND cb.ativo = true
        AND (bo.ativo = true OR bl.ativo = true)
      ORDER BY cb.resgatado ASC, cb.tipo, nome`,
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
  authorize('admin_mt', 'admin_shopping', 'lojista', 'parceiro'),
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

      // Verificar permissões (parceiro só vê clientes que têm benefícios vinculados a ele)
      if (req.user!.role === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1 AND ativo = true',
          [req.user!.userId]
        );

        if (parceiroResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Parceiro não encontrado',
          });
        }

        const parceiroId = parceiroResult.rows[0].id;

        // Verificar se o cliente tem algum benefício oficial vinculado a este parceiro
        const clienteParceiroCheck = await pool.query(
          `SELECT 1 
           FROM clientes_beneficios cb
           INNER JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id AND cb.tipo = 'oficial'
           WHERE cb.cliente_vip_id = $1 AND bo.parceiro_id = $2 AND cb.ativo = true AND bo.ativo = true
           LIMIT 1`,
          [id, parceiroId]
        );

        if (clienteParceiroCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Você não tem permissão para ver este cliente',
          });
        }
      }

      // Buscar APENAS benefícios que foram explicitamente alocados ao cliente
      // Benefícios não aparecem automaticamente - devem ser alocados manualmente
      // Se for parceiro, filtrar apenas benefícios oficiais vinculados a ele
      let beneficiosQuery = `
        SELECT 
          cb.id as alocacao_id,
          COALESCE(bo.id, bl.id) as id,
          COALESCE(bo.nome, bl.nome) as nome,
          COALESCE(bo.descricao, bl.descricao) as descricao,
          cb.tipo,
          p.nome as parceiro_nome,
          l.nome as loja_nome,
          COALESCE(bo.ativo, bl.ativo) as ativo,
          cb.ativo as alocacao_ativa,
          cb.resgatado,
          cb.data_resgate,
          u.nome as resgatado_por_nome
        FROM clientes_beneficios cb
        LEFT JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id AND cb.tipo = 'oficial'
        LEFT JOIN beneficios_loja bl ON cb.beneficio_loja_id = bl.id AND cb.tipo = 'loja'
        LEFT JOIN parceiros p ON bo.parceiro_id = p.id
        LEFT JOIN lojas l ON bl.loja_id = l.id
        LEFT JOIN users u ON cb.resgatado_por = u.id
        WHERE cb.cliente_vip_id = $1 
          AND cb.ativo = true
          AND (bo.ativo = true OR bl.ativo = true)
      `;

      const queryParams: any[] = [id];

      // Se for parceiro, filtrar apenas benefícios oficiais vinculados a ele
      if (req.user!.role === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1 AND ativo = true',
          [req.user!.userId]
        );
        
        if (parceiroResult.rows.length > 0) {
          const parceiroId = parceiroResult.rows[0].id;
          beneficiosQuery += ` AND (bo.parceiro_id = $2 OR cb.tipo = 'loja')`;
          queryParams.push(parceiroId);
        }
      }

      beneficiosQuery += ` ORDER BY cb.resgatado ASC, cb.tipo, nome`;

      const beneficiosAlocados = await pool.query(beneficiosQuery, queryParams);

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
 * POST /api/clientes-vip/:id/beneficios/:alocacaoId/resgatar
 * Marca um benefício como resgatado/inutilizado
 */
router.post(
  '/:id/beneficios/:alocacaoId/resgatar',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { id, alocacaoId } = req.params;

      // Verificar se cliente existe
      const clienteResult = await pool.query(
        'SELECT id, loja_id FROM clientes_vip WHERE id = $1',
        [id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }

      const cliente = clienteResult.rows[0];

      // Verificar permissões (lojista só pode resgatar benefícios de seus próprios clientes)
      if (req.user!.role === 'lojista') {
        const lojaCheck = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [cliente.loja_id, req.user!.userId]
        );

        if (lojaCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Você não tem permissão para resgatar benefícios deste cliente',
          });
        }
      }

      // Verificar se a alocação existe e pertence ao cliente
      const alocacaoCheck = await pool.query(
        'SELECT id, resgatado FROM clientes_beneficios WHERE id = $1 AND cliente_vip_id = $2',
        [alocacaoId, id]
      );

      if (alocacaoCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Alocação de benefício não encontrada' });
      }

      const alocacao = alocacaoCheck.rows[0];

      // Se já está resgatado, retornar erro
      if (alocacao.resgatado) {
        return res.status(400).json({ error: 'Este benefício já foi resgatado' });
      }

      // Marcar como resgatado
      const result = await pool.query(
        `UPDATE clientes_beneficios 
         SET resgatado = true, 
             data_resgate = CURRENT_TIMESTAMP,
             resgatado_por = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [req.user!.userId, alocacaoId]
      );

      res.json({
        message: 'Benefício marcado como resgatado com sucesso',
        alocacao: result.rows[0],
      });
    } catch (error: any) {
      console.error('Erro ao resgatar benefício:', error);
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
              'SELECT id, parceiro_id, nome FROM beneficios_oficiais WHERE id = $1 AND ativo = true',
              [beneficio_oficial_id]
            );

            if (beneficioCheck.rows.length === 0) {
              erros.push({ beneficio, erro: 'Benefício oficial não encontrado ou inativo' });
              continue;
            }
            
            // Log para debug
            console.log(`[DEBUG] Alocando benefício oficial:`, {
              beneficio_id: beneficio_oficial_id,
              beneficio_nome: beneficioCheck.rows[0].nome,
              parceiro_id: beneficioCheck.rows[0].parceiro_id,
              cliente_vip_id: id
            });
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
            
            console.log(`[DEBUG] Alocação atualizada:`, result.rows[0]);
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
            
            console.log(`[DEBUG] Nova alocação criada:`, result.rows[0]);
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
  authorize('admin_mt', 'admin_shopping', 'lojista', 'parceiro'),
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

      // Verificar permissões (parceiro só vê clientes que têm benefícios vinculados a ele)
      let parceiroId: string | null = null;
      if (req.user!.role === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1 AND ativo = true',
          [req.user!.userId]
        );

        if (parceiroResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Parceiro não encontrado',
          });
        }

        parceiroId = parceiroResult.rows[0].id;

        // Verificar se o cliente tem algum benefício oficial vinculado a este parceiro
        const clienteParceiroCheck = await pool.query(
          `SELECT 1 
           FROM clientes_beneficios cb
           INNER JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id AND cb.tipo = 'oficial'
           WHERE cb.cliente_vip_id = $1 AND bo.parceiro_id = $2 AND cb.ativo = true AND bo.ativo = true
           LIMIT 1`,
          [id, parceiroId]
        );

        if (clienteParceiroCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Você não tem permissão para ver este cliente',
          });
        }
      }

      // Buscar validações feitas por parceiros
      let validacoesQuery = `
        SELECT 
          vb.id,
          vb.data_validacao as data_resgate,
          vb.data_validacao,
          vb.tipo,
          p.nome as parceiro_nome,
          COALESCE(bo.nome, bl.nome) as beneficio_nome,
          'validacao' as origem,
          NULL as resgatado_por_nome
        FROM validacoes_beneficios vb
        JOIN parceiros p ON vb.parceiro_id = p.id
        LEFT JOIN beneficios_oficiais bo ON vb.beneficio_oficial_id = bo.id
        LEFT JOIN beneficios_loja bl ON vb.beneficio_loja_id = bl.id
        WHERE vb.cliente_vip_id = $1
      `;

      const validacoesParams: any[] = [id];

      // Se for parceiro, filtrar apenas validações relacionadas aos benefícios dele
      if (req.user!.role === 'parceiro' && parceiroId) {
        validacoesQuery += ` AND (vb.parceiro_id = $2 OR bo.parceiro_id = $2)`;
        validacoesParams.push(parceiroId);
      }

      validacoesQuery += ` ORDER BY vb.data_validacao DESC`;

      const validacoesResult = await pool.query(validacoesQuery, validacoesParams);

      console.log(`[DEBUG] Validações encontradas para cliente ${id}:`, validacoesResult.rows.length);

      // Buscar benefícios resgatados pelo admin/lojista ou parceiro
      let beneficiosResgatadosQuery = `
        SELECT 
          cb.id,
          cb.data_resgate,
          cb.data_resgate as data_validacao,
          cb.tipo,
          p.nome as parceiro_nome,
          COALESCE(bo.nome, bl.nome) as beneficio_nome,
          'resgate_admin' as origem,
          u.nome as resgatado_por_nome
        FROM clientes_beneficios cb
        LEFT JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id AND cb.tipo = 'oficial'
        LEFT JOIN beneficios_loja bl ON cb.beneficio_loja_id = bl.id AND cb.tipo = 'loja'
        LEFT JOIN parceiros p ON bo.parceiro_id = p.id
        LEFT JOIN users u ON cb.resgatado_por = u.id
        WHERE cb.cliente_vip_id = $1 
          AND cb.resgatado = true
          AND cb.data_resgate IS NOT NULL
      `;

      const beneficiosResgatadosParams: any[] = [id];

      // Se for parceiro, filtrar apenas benefícios oficiais vinculados a ele
      if (req.user!.role === 'parceiro' && parceiroId) {
        beneficiosResgatadosQuery += ` AND (bo.parceiro_id = $2 OR cb.tipo = 'loja')`;
        beneficiosResgatadosParams.push(parceiroId);
      }

      beneficiosResgatadosQuery += ` ORDER BY cb.data_resgate DESC`;

      const beneficiosResgatados = await pool.query(beneficiosResgatadosQuery, beneficiosResgatadosParams);

      console.log(`[DEBUG] Benefícios resgatados encontrados para cliente ${id}:`, beneficiosResgatados.rows.length);
      console.log(`[DEBUG] Detalhes dos benefícios resgatados:`, JSON.stringify(beneficiosResgatados.rows, null, 2));

      // Combinar resultados e ordenar por data (mais recente primeiro)
      const historico = [
        ...validacoesResult.rows,
        ...beneficiosResgatados.rows,
      ].sort((a, b) => {
        const dateA = new Date(a.data_resgate || a.data_validacao).getTime();
        const dateB = new Date(b.data_resgate || b.data_validacao).getTime();
        return dateB - dateA; // Mais recente primeiro
      }).slice(0, 50); // Limitar a 50 registros

      console.log(`[DEBUG] Histórico combinado para cliente ${id}:`, historico.length, 'registros');

      res.json(historico);
    } catch (error: any) {
      console.error('Erro ao buscar validações do cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/clientes-vip/meus-clientes
 * Lista clientes VIP vinculados ao vendedor logado
 * IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflitos
 */
router.get('/meus-clientes', authenticate, authorize('vendedor'), async (req, res) => {
  console.log('\n=== INÍCIO /meus-clientes ===');
  console.log('[MEUS-CLIENTES] Headers:', Object.keys(req.headers));
  console.log('[MEUS-CLIENTES] Authorization header presente:', !!req.headers.authorization);
  console.log('[MEUS-CLIENTES] Query params:', req.query);
  
  try {
    console.log('[MEUS-CLIENTES] Rota /meus-clientes atingida!');
    console.log('[MEUS-CLIENTES] req.user:', req.user);
    console.log('[MEUS-CLIENTES] user_id do JWT:', req.user!.userId);
    console.log('[MEUS-CLIENTES] role:', req.user!.role);
    console.log('[MEUS-CLIENTES] email:', req.user!.email);

    const vendedorResult = await pool.query(
      'SELECT id, loja_id, nome FROM vendedores WHERE user_id = $1 AND ativo = true',
      [req.user!.userId]
    );

    console.log('[MEUS-CLIENTES] Query executada: SELECT id, loja_id, nome FROM vendedores WHERE user_id =', req.user!.userId, 'AND ativo = true');
    console.log('[MEUS-CLIENTES] Vendedor encontrado:', vendedorResult.rows.length, 'registros');
    console.log('[MEUS-CLIENTES] Resultado bruto:', vendedorResult.rows);
    
    if (vendedorResult.rows.length > 0) {
      console.log('[MEUS-CLIENTES] Vendedor ID:', vendedorResult.rows[0].id);
      console.log('[MEUS-CLIENTES] Vendedor Nome:', vendedorResult.rows[0].nome);
      console.log('[MEUS-CLIENTES] Loja ID:', vendedorResult.rows[0].loja_id);
    }

    if (vendedorResult.rows.length === 0) {
      console.log('[MEUS-CLIENTES] ❌ Vendedor não encontrado! Retornando 403');
      return res.status(403).json({ error: 'Vendedor não encontrado ou inativo' });
    }

    const vendedor = vendedorResult.rows[0];
    const { status, search } = req.query;
    console.log('[MEUS-CLIENTES] Filtros - status:', status, 'search:', search);

    // Verificar se a coluna vendedor_id existe
    const colCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'clientes_vip' AND column_name = 'vendedor_id'
    `);

    console.log('[MEUS-CLIENTES] Coluna vendedor_id existe:', colCheck.rows.length > 0);

    if (colCheck.rows.length === 0) {
      console.log('[MEUS-CLIENTES] ⚠️ Coluna vendedor_id não existe, criando...');
      try {
        await pool.query('ALTER TABLE clientes_vip ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_clientes_vip_vendedor_id ON clientes_vip(vendedor_id)');
        console.log('[MEUS-CLIENTES] ✅ Coluna vendedor_id criada automaticamente');
      } catch (alterError: any) {
        console.error('[MEUS-CLIENTES] ❌ Erro ao criar coluna vendedor_id:', alterError.message);
        return res.json([]);
      }
    }

    // Debug: verificar totais
    const debugCount = await pool.query(
      'SELECT COUNT(*) as total, COUNT(vendedor_id) as com_vendedor FROM clientes_vip'
    );
    console.log('[MEUS-CLIENTES] 📊 Total clientes na tabela:', debugCount.rows[0].total);
    console.log('[MEUS-CLIENTES] 📊 Clientes com vendedor_id preenchido:', debugCount.rows[0].com_vendedor);

    // Debug: verificar clientes com este vendedor_id específico
    const debugVendedor = await pool.query(
      'SELECT COUNT(*) as total FROM clientes_vip WHERE vendedor_id = $1',
      [vendedor.id]
    );
    console.log('[MEUS-CLIENTES] 📊 Clientes com vendedor_id =', vendedor.id, ':', debugVendedor.rows[0].total);

    // Debug: mostrar os IDs dos clientes deste vendedor
    const debugClientes = await pool.query(
      'SELECT id, nome, whatsapp FROM clientes_vip WHERE vendedor_id = $1 LIMIT 5',
      [vendedor.id]
    );
    console.log('[MEUS-CLIENTES] 📋 Primeiros 5 clientes do vendedor:', debugClientes.rows);

    let query = `
      SELECT c.*, l.nome as loja_nome
      FROM clientes_vip c
      JOIN lojas l ON c.loja_id = l.id
      WHERE c.vendedor_id = $1
    `;
    const params: any[] = [vendedor.id];
    let paramIndex = 2;

    if (status && status !== 'todos') {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
      console.log('[MEUS-CLIENTES] Adicionando filtro status:', status);
    }

    if (search) {
      query += ` AND (c.nome ILIKE $${paramIndex} OR c.whatsapp ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
      console.log('[MEUS-CLIENTES] Adicionando filtro search:', search);
    }

    query += ' ORDER BY c.created_at DESC';
    console.log('[MEUS-CLIENTES] Query final:', query);
    console.log('[MEUS-CLIENTES] Parâmetros:', params);

    const result = await pool.query(query, params);
    console.log('[MEUS-CLIENTES] ✅ Query executada com sucesso!');
    console.log('[MEUS-CLIENTES] 📊 Resultado final:', result.rows.length, 'clientes encontrados');
    console.log('[MEUS-CLIENTES] 📋 IDs dos clientes retornados:', result.rows.map(c => c.id));
    console.log('=== FIM /meus-clientes ===\n');
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('[MEUS-CLIENTES] ❌ ERRO CAPTURADO:');
    console.error('[MEUS-CLIENTES] Mensagem:', error.message);
    console.error('[MEUS-CLIENTES] Código:', error.code);
    console.error('[MEUS-CLIENTES] Detalhe:', error.detail);
    console.error('[MEUS-CLIENTES] Stack:', error.stack);
    console.log('=== FIM /meus-clientes (COM ERRO) ===\n');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/clientes-vip/:id
 * Busca cliente VIP por ID ou QR Code (rota protegida para dashboard)
 */
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  // Fallback: se /:id capturar 'meus-clientes', executar a lógica aqui
  if (id === 'meus-clientes') {
    console.log('\n🚨 ATENÇÃO: /:id capturou "meus-clientes" - Isso significa que a ordem das rotas está errada!');
    console.log('[FALLBACK] Iniciando execução do fallback...');
    
    try {
      console.log('[FALLBACK] req.user:', req.user);
      console.log('[FALLBACK] role:', req.user!.role);
      
      if (req.user!.role !== 'vendedor') {
        console.log('[FALLBACK] ❌ Usuário não é vendedor:', req.user!.role);
        return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
      }

      console.log('[FALLBACK] ✅ Usuário é vendedor, continuando...');
      console.log('[FALLBACK] user_id:', req.user!.userId);

      const vendedorResult = await pool.query(
        'SELECT id, loja_id, nome FROM vendedores WHERE user_id = $1 AND ativo = true',
        [req.user!.userId]
      );

      console.log('[FALLBACK] Query vendedor executada, resultado:', vendedorResult.rows.length, 'registros');

      if (vendedorResult.rows.length === 0) {
        console.log('[FALLBACK] ❌ Vendedor não encontrado!');
        return res.status(403).json({ error: 'Vendedor não encontrado ou inativo' });
      }

      const vendedor = vendedorResult.rows[0];
      console.log('[FALLBACK] ✅ Vendedor encontrado - ID:', vendedor.id, 'Nome:', vendedor.nome);

      // Garantir que a coluna vendedor_id existe
      await pool.query('ALTER TABLE clientes_vip ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL').catch(() => {});

      const { status, search } = req.query;
      console.log('[FALLBACK] Filtros - status:', status, 'search:', search);
      
      let query = `
        SELECT c.*, l.nome as loja_nome
        FROM clientes_vip c
        JOIN lojas l ON c.loja_id = l.id
        WHERE c.vendedor_id = $1
      `;
      const params: any[] = [vendedor.id];
      let paramIndex = 2;

      if (status && status !== 'todos') {
        query += ` AND c.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      if (search) {
        query += ` AND (c.nome ILIKE $${paramIndex} OR c.whatsapp ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      query += ' ORDER BY c.created_at DESC';

      console.log('[FALLBACK] Query final:', query);
      console.log('[FALLBACK] Parâmetros:', params);

      const result = await pool.query(query, params);
      console.log('[FALLBACK] ✅ Query executada!');
      console.log('[FALLBACK] 📊 Clientes encontrados:', result.rows.length);
      console.log('[FALLBACK] 📋 IDs:', result.rows.map(c => c.id));
      console.log('[FALLBACK] 📤 Enviando response para frontend...');
      console.log('[FALLBACK] 📋 Dados que serão enviados:', JSON.stringify(result.rows, null, 2));
      console.log('=== FIM FALLBACK ===\n');
      
      return res.json(result.rows);
    } catch (error: any) {
      console.error('[FALLBACK] ❌ ERRO NO FALLBACK:');
      console.error('[FALLBACK] Mensagem:', error.message);
      console.error('[FALLBACK] Stack:', error.stack);
      console.log('=== FIM FALLBACK (COM ERRO) ===\n');
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  try {
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

    // Buscar histórico de veículos do cliente
    const veiculosResult = await pool.query(
      `SELECT 
        id,
        marca,
        modelo,
        ano,
        placa,
        data_compra,
        created_at
      FROM veiculos_cliente_vip
      WHERE cliente_vip_id = $1
      ORDER BY data_compra ASC, created_at ASC`,
      [clienteId]
    );

    cliente.veiculos_historico = veiculosResult.rows;

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

    console.log('Cliente VIP encontrado com sucesso:', cliente.id);
    res.json(cliente);
  } catch (error: any) {
    console.error('Erro ao buscar cliente VIP:', error);
    console.error('ID buscado:', id);
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
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.detail : undefined,
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
  authorize('admin_mt', 'admin_shopping', 'lojista', 'vendedor'),
  async (req, res) => {
    try {
      const {
        nome,
        whatsapp,
        email,
        loja_id: body_loja_id,
        vendedor_id: body_vendedor_id,
        data_venda,
        veiculo_marca,
        veiculo_modelo,
        veiculo_ano,
        veiculo_placa,
      } = req.body;

      let loja_id = body_loja_id;
      let vendedor_id = body_vendedor_id || null;

      // Se for vendedor, auto-resolver loja_id e vendedor_id
      if (req.user!.role === 'vendedor') {
        const vendedorResult = await pool.query(
          'SELECT id, loja_id FROM vendedores WHERE user_id = $1 AND ativo = true',
          [req.user!.userId]
        );
        if (vendedorResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Vendedor não encontrado ou inativo',
          });
        }
        vendedor_id = vendedorResult.rows[0].id;
        loja_id = vendedorResult.rows[0].loja_id;
      }

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

      // Validar vendedor_id se fornecido (para admin/lojista)
      if (vendedor_id && req.user!.role !== 'vendedor') {
        const vendedorCheck = await pool.query(
          'SELECT id FROM vendedores WHERE id = $1 AND loja_id = $2 AND ativo = true',
          [vendedor_id, loja_id]
        );
        if (vendedorCheck.rows.length === 0) {
          return res.status(400).json({
            error: 'Vendedor não encontrado ou não pertence a esta loja',
          });
        }
      }

      // Gerar QR codes
      const qrCodeDigital = generateQRCode();
      const qrCodeFisico = generateQRCodeFisico();

      // Calcular data de validade (12 meses)
      // Converter data_venda para Date (pode vir como string "DD/MM/YYYY" ou ISO)
      let dataVenda: Date;
      if (typeof data_venda === 'string' && data_venda.includes('/')) {
        // Formato brasileiro DD/MM/YYYY
        const [dia, mes, ano] = data_venda.split('/');
        dataVenda = new Date(`${ano}-${mes}-${dia}`);
      } else {
        dataVenda = new Date(data_venda);
      }
      
      // Validar se a data é válida
      if (isNaN(dataVenda.getTime())) {
        return res.status(400).json({
          error: 'Data da venda inválida',
        });
      }

      const dataValidade = new Date(dataVenda);
      dataValidade.setMonth(dataValidade.getMonth() + 12);
      
      // Formatar para YYYY-MM-DD para PostgreSQL
      const dataVendaFormatada = dataVenda.toISOString().split('T')[0];
      const dataValidadeFormatada = dataValidade.toISOString().split('T')[0];

      // Garantir que a coluna vendedor_id existe
      await pool.query('ALTER TABLE clientes_vip ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL').catch(() => {});

      // Criar cliente VIP
      console.log('Criando cliente VIP com dados:', {
        nome,
        whatsapp,
        email,
        loja_id,
        vendedor_id,
        data_venda_original: data_venda,
        data_venda_formatada: dataVendaFormatada,
        data_validade_formatada: dataValidadeFormatada,
        qrCodeDigital,
        qrCodeFisico,
        veiculo_marca,
        veiculo_modelo,
        veiculo_ano,
        veiculo_placa,
      });

      const clienteResult = await pool.query(
        `INSERT INTO clientes_vip (
          nome, whatsapp, email, loja_id, vendedor_id, status, data_venda, 
          data_ativacao, data_validade, qr_code_digital, qr_code_fisico,
          veiculo_marca, veiculo_modelo, veiculo_ano, veiculo_placa
        ) VALUES ($1, $2, $3, $4, $5, 'ativo', $6, NOW(), $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          nome,
          whatsapp,
          email || null,
          loja_id,
          vendedor_id,
          dataVendaFormatada,
          dataValidadeFormatada,
          qrCodeDigital,
          qrCodeFisico,
          veiculo_marca || null,
          veiculo_modelo || null,
          veiculo_ano || null,
          veiculo_placa || null,
        ]
      );

      const cliente = clienteResult.rows[0];

      // Se houver veículo, criar registro no histórico
      if (veiculo_marca && veiculo_modelo && veiculo_ano && veiculo_placa) {
        await pool.query(
          `INSERT INTO veiculos_cliente_vip (
            cliente_vip_id, marca, modelo, ano, placa, data_compra
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            cliente.id,
            veiculo_marca,
            veiculo_modelo,
            veiculo_ano,
            veiculo_placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
            dataVendaFormatada,
          ]
        );
      }

      // Disparar evento para MT Leads (não crítico - não deve quebrar o fluxo)
      try {
        await enviarEventoMTLeads(EventosMTLeads.VIP_ATIVADO, {
          cliente_id: cliente.id,
          nome: cliente.nome,
          whatsapp: cliente.whatsapp,
          loja_id: cliente.loja_id,
          data_validade: cliente.data_validade,
          qr_code_digital: cliente.qr_code_digital,
        });
      } catch (mtLeadsError: any) {
        console.warn('Erro ao enviar evento para MT Leads (não crítico):', mtLeadsError.message);
        // Continua mesmo se falhar
      }

      console.log('Cliente VIP criado com sucesso:', cliente.id);
      res.status(201).json(cliente);
    } catch (error: any) {
      console.error('Erro ao criar cliente VIP:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        position: error.position,
        stack: error.stack,
      });
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        details: process.env.NODE_ENV === 'development' ? error.detail : undefined,
      });
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

/**
 * PATCH /api/clientes-vip/:id/cancelar
 * Cancela o cartão VIP de um cliente
 */
router.patch(
  '/:id/cancelar',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Buscar cliente VIP
      const clienteResult = await pool.query(
        'SELECT id, loja_id, status FROM clientes_vip WHERE id = $1',
        [id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Cliente VIP não encontrado',
        });
      }

      const cliente = clienteResult.rows[0];

      // Verificar permissões (lojista só pode cancelar clientes da própria loja)
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [cliente.loja_id, req.user!.userId]
        );
        if (lojaResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Você só pode cancelar clientes da sua própria loja',
          });
        }
      }

      // Verificar se já está cancelado
      if (cliente.status === 'cancelado') {
        return res.status(400).json({
          error: 'Este cliente já está cancelado',
        });
      }

      // Atualizar status para cancelado
      const updateResult = await pool.query(
        `UPDATE clientes_vip
         SET status = 'cancelado',
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      const clienteAtualizado = updateResult.rows[0];

      res.json({
        cliente: clienteAtualizado,
        mensagem: 'Cartão VIP cancelado com sucesso! O cliente ainda pode acessar seus dados.',
      });
    } catch (error: any) {
      console.error('Erro ao cancelar cartão VIP:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

