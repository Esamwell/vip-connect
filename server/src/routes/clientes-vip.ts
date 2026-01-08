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

      // Buscar benefícios oficiais (disponíveis para todos)
      const beneficiosOficiais = await pool.query(
        `SELECT 
          bo.id,
          bo.nome,
          bo.descricao,
          'oficial' as tipo,
          p.nome as parceiro_nome,
          bo.ativo
        FROM beneficios_oficiais bo
        LEFT JOIN parceiros p ON bo.parceiro_id = p.id
        WHERE bo.ativo = true
        ORDER BY bo.nome`
      );

      // Buscar benefícios da loja do cliente
      const beneficiosLoja = await pool.query(
        `SELECT 
          bl.id,
          bl.nome,
          bl.descricao,
          'loja' as tipo,
          l.nome as loja_nome,
          bl.ativo
        FROM beneficios_loja bl
        JOIN lojas l ON bl.loja_id = l.id
        WHERE bl.loja_id = $1 AND bl.ativo = true
        ORDER BY bl.nome`,
        [cliente.loja_id]
      );

      // Combinar resultados
      const beneficios = [
        ...beneficiosOficiais.rows.map((b) => ({
          ...b,
          tipo: 'oficial' as const,
        })),
        ...beneficiosLoja.rows.map((b) => ({
          ...b,
          tipo: 'loja' as const,
        })),
      ];

      res.json(beneficios);
    } catch (error: any) {
      console.error('Erro ao buscar benefícios do cliente:', error);
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

