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
          u.nome as responsavel_nome,
          v.marca as veiculo_marca,
          v.modelo as veiculo_modelo,
          v.ano as veiculo_ano,
          v.placa as veiculo_placa
        FROM chamados c
        JOIN clientes_vip cv ON c.cliente_vip_id = cv.id
        JOIN lojas l ON c.loja_id = l.id
        LEFT JOIN users u ON c.responsavel_id = u.id
        LEFT JOIN veiculos_cliente_vip v ON c.veiculo_id = v.id
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
 * GET /api/chamados/qr/:qrCode
 * Lista chamados de um cliente por QR Code (rota pública para clientes)
 */
router.get('/qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    console.log('Buscando chamados por QR Code:', qrCode);

    // Buscar cliente VIP por QR code
    const clienteResult = await pool.query(
      'SELECT id, status FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
      [qrCode]
    );

    if (clienteResult.rows.length === 0) {
      console.log('Cliente não encontrado com QR Code:', qrCode);
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }

    const cliente = clienteResult.rows[0];
    console.log('Cliente encontrado:', cliente.id, 'Status:', cliente.status);

    // Verificar se o cartão está cancelado
    if (cliente.status === 'cancelado') {
      return res.status(403).json({ 
        error: 'Acesso negado: Este cartão VIP está cancelado e não tem permissão para acessar chamados.' 
      });
    }

    const clienteId = cliente.id;

    // Buscar chamados do cliente
    console.log('Buscando chamados para cliente:', clienteId);
    const result = await pool.query(
      `SELECT 
        c.*,
        l.nome as loja_nome,
        u.nome as responsavel_nome,
        v.marca as veiculo_marca,
        v.modelo as veiculo_modelo,
        v.ano as veiculo_ano,
        v.placa as veiculo_placa
      FROM chamados c
      JOIN lojas l ON c.loja_id = l.id
      LEFT JOIN users u ON c.responsavel_id = u.id
      LEFT JOIN veiculos_cliente_vip v ON c.veiculo_id = v.id
      WHERE c.cliente_vip_id = $1
      ORDER BY c.created_at DESC`,
      [clienteId]
    );
    
    console.log('Chamados encontrados:', result.rows.length);

    // Para chamados que têm observações mas não têm responsável, buscar o último usuário que atualizou no histórico
    const chamadosComResponsavel = await Promise.all(
      result.rows.map(async (chamado) => {
        // Se já tem responsavel_nome, retornar como está
        if (chamado.responsavel_nome) {
          return chamado;
        }

        // Se tem observações mas não tem responsável, buscar no histórico
        if (chamado.observacoes_resolucao) {
          const historicoResult = await pool.query(
            `SELECT 
              u.nome as usuario_nome
            FROM chamados_historico ch
            LEFT JOIN users u ON ch.usuario_id = u.id
            WHERE ch.chamado_id = $1 
              AND ch.usuario_id IS NOT NULL
            ORDER BY ch.created_at DESC
            LIMIT 1`,
            [chamado.id]
          );

          if (historicoResult.rows.length > 0 && historicoResult.rows[0].usuario_nome) {
            chamado.responsavel_nome = historicoResult.rows[0].usuario_nome;
          }
        }

        return chamado;
      })
    );

    console.log('Retornando chamados com responsável');
    res.json(chamadosComResponsavel);
  } catch (error: any) {
    console.error('Erro ao buscar chamados por QR Code:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack,
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/chamados/qr/:qrCode/:chamadoId/respostas
 * Lista todas as respostas de um chamado (rota pública para clientes)
 */
router.get('/qr/:qrCode/:chamadoId/respostas', async (req, res) => {
  try {
    const { qrCode, chamadoId } = req.params;

    // Buscar cliente VIP por QR code
    const clienteResult = await pool.query(
      'SELECT id, status FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
      [qrCode]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }

    const cliente = clienteResult.rows[0];

    // Verificar se o cartão está cancelado
    if (cliente.status === 'cancelado') {
      return res.status(403).json({ 
        error: 'Acesso negado: Este cartão VIP está cancelado e não tem permissão para acessar respostas de chamados.' 
      });
    }

    const clienteId = cliente.id;

    // Verificar se o chamado pertence ao cliente
    const chamadoResult = await pool.query(
      'SELECT id FROM chamados WHERE id = $1 AND cliente_vip_id = $2',
      [chamadoId, clienteId]
    );

    if (chamadoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }

    // Buscar todas as respostas do histórico
    const respostasResult = await pool.query(
      `SELECT 
        ch.id,
        ch.observacao as mensagem,
        ch.acao,
        ch.status_novo,
        ch.created_at,
        u.nome as usuario_nome
      FROM chamados_historico ch
      LEFT JOIN users u ON ch.usuario_id = u.id
      WHERE ch.chamado_id = $1 
        AND ch.observacao IS NOT NULL 
        AND ch.observacao != ''
      ORDER BY ch.created_at ASC`,
      [chamadoId]
    );

    let respostas = respostasResult.rows;

    // Se não houver respostas no histórico, mas o chamado tem observacoes_resolucao,
    // incluir como resposta (para compatibilidade com dados antigos)
    if (respostas.length === 0) {
      const chamadoComObs = await pool.query(
        `SELECT 
          c.id,
          c.observacoes_resolucao as mensagem,
          c.updated_at as created_at,
          c.responsavel_id,
          u.nome as usuario_nome
        FROM chamados c
        LEFT JOIN users u ON c.responsavel_id = u.id
        WHERE c.id = $1 AND c.observacoes_resolucao IS NOT NULL AND c.observacoes_resolucao != ''`,
        [chamadoId]
      );

      if (chamadoComObs.rows.length > 0) {
        respostas = [{
          id: chamadoComObs.rows[0].id,
          mensagem: chamadoComObs.rows[0].mensagem,
          acao: 'resposta',
          status_novo: null,
          created_at: chamadoComObs.rows[0].created_at,
          usuario_nome: chamadoComObs.rows[0].usuario_nome
        }];
      }
    }

    res.json(respostas);
  } catch (error: any) {
    console.error('Erro ao buscar respostas do chamado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/chamados/qr
 * Cria novo chamado usando QR Code (rota pública para clientes)
 */
router.post('/qr', async (req, res) => {
  try {
    const { qr_code, tipo, titulo, descricao, prioridade, veiculo_id } = req.body;

    console.log('Criando chamado por QR Code:', { qr_code, tipo, titulo, veiculo_id });

    if (!qr_code || !tipo || !titulo || !descricao) {
      return res.status(400).json({
        error: 'QR Code, tipo, título e descrição são obrigatórios',
      });
    }

    // Se for ajuste pós-venda, veículo é obrigatório
    if (tipo === 'ajuste_pos_venda' && (!veiculo_id || veiculo_id === '')) {
      return res.status(400).json({
        error: 'Veículo é obrigatório para chamados de ajuste pós-venda',
      });
    }

    // Buscar cliente VIP por QR code
    const clienteResult = await pool.query(
      'SELECT id, loja_id, status FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
      [qr_code]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }

    const cliente = clienteResult.rows[0];
    console.log('Cliente encontrado:', cliente.id, 'Loja:', cliente.loja_id);

    // Verificar se o cartão está cancelado
    if (cliente.status === 'cancelado') {
      return res.status(403).json({ 
        error: 'Acesso negado: Este cartão VIP está cancelado e não pode criar novos chamados.' 
      });
    }

    // Se veiculo_id foi fornecido, verificar se pertence ao cliente
    if (veiculo_id && veiculo_id.trim() !== '') {
      console.log('Verificando veículo:', veiculo_id, 'para cliente:', cliente.id);
      const veiculoCheck = await pool.query(
        'SELECT id FROM veiculos_cliente_vip WHERE id = $1 AND cliente_vip_id = $2',
        [veiculo_id, cliente.id]
      );

      if (veiculoCheck.rows.length === 0) {
        console.log('Veículo não encontrado ou não pertence ao cliente');
        return res.status(400).json({
          error: 'Veículo não encontrado ou não pertence a este cliente',
        });
      }
      console.log('Veículo validado:', veiculoCheck.rows[0].id);
    }

    // Criar chamado
    console.log('Criando chamado no banco de dados...');
    const result = await pool.query(
      `INSERT INTO chamados (
        cliente_vip_id, loja_id, tipo, status, titulo, 
        descricao, prioridade, veiculo_id
      ) VALUES ($1, $2, $3, 'aberto', $4, $5, $6, $7)
      RETURNING *`,
      [
        cliente.id,
        cliente.loja_id,
        tipo,
        titulo,
        descricao,
        prioridade || 1,
        veiculo_id && veiculo_id.trim() !== '' ? veiculo_id : null,
      ]
    );

    const chamado = result.rows[0];
    console.log('Chamado criado com sucesso:', chamado.id);

    // Registrar no histórico (sem usuario_id, pois é público)
    await pool.query(
      `INSERT INTO chamados_historico (
        chamado_id, acao, status_novo
      ) VALUES ($1, 'criado', 'aberto')`,
      [chamado.id]
    );

    // Disparar evento para MT Leads (não crítico)
    try {
      await enviarEventoMTLeads(EventosMTLeads.CHAMADO_ABERTO, {
        chamado_id: chamado.id,
        cliente_vip_id: chamado.cliente_vip_id,
        loja_id: chamado.loja_id,
        tipo: chamado.tipo,
        titulo: chamado.titulo,
      });
    } catch (mtLeadsError: any) {
      console.warn('Erro ao enviar evento para MT Leads (não crítico):', mtLeadsError.message);
    }

    res.status(201).json(chamado);
  } catch (error: any) {
    console.error('Erro ao criar chamado por QR Code:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack,
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/chamados
 * Cria novo chamado (cliente VIP ou lojista autenticado)
 */
router.post(
  '/',
  authenticate,
  async (req, res) => {
    try {
      const { cliente_vip_id, tipo, titulo, descricao, prioridade, veiculo_id } = req.body;

      if (!cliente_vip_id || !tipo || !titulo || !descricao) {
        return res.status(400).json({
          error: 'Cliente VIP, tipo, título e descrição são obrigatórios',
        });
      }

      // Se for ajuste pós-venda, veículo é obrigatório
      if (tipo === 'ajuste_pos_venda' && (!veiculo_id || veiculo_id === '')) {
        return res.status(400).json({
          error: 'Veículo é obrigatório para chamados de ajuste pós-venda',
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

      // Se veiculo_id foi fornecido, verificar se pertence ao cliente
      if (veiculo_id && veiculo_id.trim() !== '') {
        console.log('Verificando veículo:', veiculo_id, 'para cliente:', cliente_vip_id);
        const veiculoCheck = await pool.query(
          'SELECT id FROM veiculos_cliente_vip WHERE id = $1 AND cliente_vip_id = $2',
          [veiculo_id, cliente_vip_id]
        );

        if (veiculoCheck.rows.length === 0) {
          console.log('Veículo não encontrado ou não pertence ao cliente');
          return res.status(400).json({
            error: 'Veículo não encontrado ou não pertence a este cliente',
          });
        }
        console.log('Veículo validado:', veiculoCheck.rows[0].id);
      }

      // Se for cliente VIP, verificar se está criando para si mesmo
      if (req.user!.role === 'cliente_vip') {
        // Aqui você precisaria ter uma relação entre users e clientes_vip
        // Por enquanto, assumindo que o cliente_vip_id vem do token
      }

      // Criar chamado
      console.log('Criando chamado no banco de dados...');
      const result = await pool.query(
        `INSERT INTO chamados (
          cliente_vip_id, loja_id, tipo, status, titulo, 
          descricao, prioridade, veiculo_id
        ) VALUES ($1, $2, $3, 'aberto', $4, $5, $6, $7)
        RETURNING *`,
        [
          cliente_vip_id,
          lojaId,
          tipo,
          titulo,
          descricao,
          prioridade || 1,
          veiculo_id && veiculo_id.trim() !== '' ? veiculo_id : null,
        ]
      );

      const chamado = result.rows[0];
      console.log('Chamado criado com sucesso:', chamado.id);

      // Registrar no histórico
      await pool.query(
        `INSERT INTO chamados_historico (
          chamado_id, usuario_id, acao, status_novo
        ) VALUES ($1, $2, 'criado', 'aberto')`,
        [chamado.id, req.user!.userId]
      );

      // Disparar evento para MT Leads (não crítico)
      try {
        await enviarEventoMTLeads(EventosMTLeads.CHAMADO_ABERTO, {
          chamado_id: chamado.id,
          cliente_vip_id: chamado.cliente_vip_id,
          loja_id: chamado.loja_id,
          tipo: chamado.tipo,
          titulo: chamado.titulo,
        });
      } catch (mtLeadsError: any) {
        console.warn('Erro ao enviar evento para MT Leads (não crítico):', mtLeadsError.message);
      }

      res.status(201).json(chamado);
  } catch (error: any) {
    console.error('Erro ao criar chamado:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack,
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
  }
);

/**
 * GET /api/chamados/:id
 * Busca chamado por ID
 */
router.get(
  '/:id',
  authenticate,
  authorizeLojista,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      let query = `
        SELECT 
          c.*,
          cv.nome as cliente_nome,
          cv.whatsapp as cliente_whatsapp,
          cv.email as cliente_email,
          l.nome as loja_nome,
          l.telefone as loja_telefone,
          u.nome as responsavel_nome,
          v.marca as veiculo_marca,
          v.modelo as veiculo_modelo,
          v.ano as veiculo_ano,
          v.placa as veiculo_placa
        FROM chamados c
        JOIN clientes_vip cv ON c.cliente_vip_id = cv.id
        JOIN lojas l ON c.loja_id = l.id
        LEFT JOIN users u ON c.responsavel_id = u.id
        LEFT JOIN veiculos_cliente_vip v ON c.veiculo_id = v.id
        WHERE c.id = $1
      `;
      const params: any[] = [id];
      let paramCount = 2;

      // Se for lojista, filtrar apenas sua loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1',
          [req.user!.userId]
        );
        if (lojaResult.rows.length > 0) {
          query += ` AND c.loja_id = $${paramCount}`;
          params.push(lojaResult.rows[0].id);
        } else {
          return res.status(404).json({ error: 'Chamado não encontrado' });
        }
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      // Buscar histórico do chamado
      const historicoResult = await pool.query(
        `SELECT 
          ch.*,
          u.nome as usuario_nome
        FROM chamados_historico ch
        LEFT JOIN users u ON ch.usuario_id = u.id
        WHERE ch.chamado_id = $1
        ORDER BY ch.created_at ASC`,
        [id]
      );

      const chamado = result.rows[0];
      chamado.historico = historicoResult.rows;

      res.json(chamado);
    } catch (error: any) {
      console.error('Erro ao buscar chamado:', error);
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
  authorize('admin_mt', 'admin_shopping', 'lojista'),
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

      // Verificar se lojista tem acesso ao chamado
      if (req.user!.role === 'lojista') {
        // Buscar loja do lojista
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1 AND ativo = true LIMIT 1',
          [req.user!.userId]
        );
        if (lojaResult.rows.length > 0 && chamadoAtual.rows[0].loja_id !== lojaResult.rows[0].id) {
          return res.status(403).json({
            error: 'Você não tem permissão para atualizar este chamado',
          });
        }
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
        
        // Se observações foram adicionadas e não há responsável definido no chamado atual, definir o usuário atual como responsável
        const chamadoAtualData = chamadoAtual.rows[0];
        if (!chamadoAtualData.responsavel_id && responsavel_id === undefined) {
          console.log('Definindo responsável:', req.user!.userId, 'para chamado:', id);
          updateFields.push(`responsavel_id = $${paramCount}`);
          params.push(req.user!.userId);
          paramCount++;
        }
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

      // Registrar no histórico (incluindo observação se houver)
      await pool.query(
        `INSERT INTO chamados_historico (
          chamado_id, usuario_id, acao, status_anterior, status_novo, observacao
        ) VALUES ($1, $2, 'atualizado', $3, $4, $5)`,
        [id, req.user!.userId, statusAnterior, chamado.status, observacoes_resolucao || null]
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

