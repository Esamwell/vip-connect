import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, authorizeLojista } from '../middleware/auth';
import { enviarEventoMTLeads, EventosMTLeads } from '../services/mtleads';

const router = express.Router();

/**
 * GET /api/chamados
 * Lista chamados (filtrado por loja para lojistas)
 */
router.get(
  '/',
  authenticate,
  authorizeLojista,
  async (req, res) => {
    try {
      const { loja_id, status, tipo } = req.query;
      let query = `
        SELECT 
          c.*,
          cv.nome as cliente_nome,
          cv.whatsapp as cliente_whatsapp,
          l.nome as loja_nome,
          u.nome as responsavel_nome
        FROM chamados c
        JOIN clientes_vip cv ON c.cliente_vip_id = cv.id
        JOIN lojas l ON c.loja_id = l.id
        LEFT JOIN users u ON c.responsavel_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      // Se for lojista, filtrar apenas sua loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1',
          [req.user!.userId]
        );
        if (lojaResult.rows.length > 0) {
          query += ` AND c.loja_id = $${paramCount}`;
          params.push(lojaResult.rows[0].id);
          paramCount++;
        } else {
          return res.json([]);
        }
      } else if (loja_id) {
        query += ` AND c.loja_id = $${paramCount}`;
        params.push(loja_id);
        paramCount++;
      }

      if (status) {
        query += ` AND c.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (tipo) {
        query += ` AND c.tipo = $${paramCount}`;
        params.push(tipo);
        paramCount++;
      }

      query += ` ORDER BY c.created_at DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao listar chamados:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/chamados
 * Cria novo chamado (cliente VIP ou lojista)
 */
router.post(
  '/',
  authenticate,
  async (req, res) => {
    try {
      const { cliente_vip_id, tipo, titulo, descricao, prioridade } = req.body;

      if (!cliente_vip_id || !tipo || !titulo || !descricao) {
        return res.status(400).json({
          error: 'Cliente VIP, tipo, título e descrição são obrigatórios',
        });
      }

      // Buscar cliente VIP para pegar loja_id
      const clienteResult = await pool.query(
        'SELECT loja_id FROM clientes_vip WHERE id = $1',
        [cliente_vip_id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Cliente VIP não encontrado',
        });
      }

      const lojaId = clienteResult.rows[0].loja_id;

      // Se for cliente VIP, verificar se está criando para si mesmo
      if (req.user!.role === 'cliente_vip') {
        // Aqui você precisaria ter uma relação entre users e clientes_vip
        // Por enquanto, assumindo que o cliente_vip_id vem do token
      }

      // Criar chamado
      const result = await pool.query(
        `INSERT INTO chamados (
          cliente_vip_id, loja_id, tipo, status, titulo, 
          descricao, prioridade
        ) VALUES ($1, $2, $3, 'aberto', $4, $5, $6)
        RETURNING *`,
        [
          cliente_vip_id,
          lojaId,
          tipo,
          titulo,
          descricao,
          prioridade || 1,
        ]
      );

      const chamado = result.rows[0];

      // Registrar no histórico
      await pool.query(
        `INSERT INTO chamados_historico (
          chamado_id, usuario_id, acao, status_novo
        ) VALUES ($1, $2, 'criado', 'aberto')`,
        [chamado.id, req.user!.userId]
      );

      // Disparar evento para MT Leads
      await enviarEventoMTLeads(EventosMTLeads.CHAMADO_ABERTO, {
        chamado_id: chamado.id,
        cliente_vip_id: chamado.cliente_vip_id,
        loja_id: chamado.loja_id,
        tipo: chamado.tipo,
        titulo: chamado.titulo,
      });

      res.status(201).json(chamado);
    } catch (error: any) {
      console.error('Erro ao criar chamado:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * PATCH /api/chamados/:id
 * Atualiza status do chamado
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, responsavel_id, observacoes_resolucao } = req.body;

      // Buscar chamado atual
      const chamadoAtual = await pool.query(
        'SELECT * FROM chamados WHERE id = $1',
        [id]
      );

      if (chamadoAtual.rows.length === 0) {
        return res.status(404).json({
          error: 'Chamado não encontrado',
        });
      }

      const statusAnterior = chamadoAtual.rows[0].status;

      // Atualizar chamado
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (status) {
        updateFields.push(`status = $${paramCount}`);
        params.push(status);
        paramCount++;
      }

      if (responsavel_id !== undefined) {
        updateFields.push(`responsavel_id = $${paramCount}`);
        params.push(responsavel_id);
        paramCount++;
      }

      if (observacoes_resolucao) {
        updateFields.push(`observacoes_resolucao = $${paramCount}`);
        params.push(observacoes_resolucao);
        paramCount++;
      }

      if (status === 'resolvido') {
        updateFields.push(`data_resolucao = NOW()`);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'Nenhum campo para atualizar',
        });
      }

      updateFields.push(`updated_at = NOW()`);
      params.push(id);

      const result = await pool.query(
        `UPDATE chamados 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        params
      );

      const chamado = result.rows[0];

      // Registrar no histórico
      await pool.query(
        `INSERT INTO chamados_historico (
          chamado_id, usuario_id, acao, status_anterior, status_novo
        ) VALUES ($1, $2, 'atualizado', $3, $4)`,
        [id, req.user!.userId, statusAnterior, chamado.status]
      );

      // Disparar evento se resolvido
      if (chamado.status === 'resolvido') {
        await enviarEventoMTLeads(EventosMTLeads.CHAMADO_RESOLVIDO, {
          chamado_id: chamado.id,
          cliente_vip_id: chamado.cliente_vip_id,
        });
      }

      res.json(chamado);
    } catch (error: any) {
      console.error('Erro ao atualizar chamado:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

