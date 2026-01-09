import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, authorizeLojista } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/ranking/lojas
 * Retorna ranking público de lojas
 */
router.get('/lojas', async (req, res) => {
  try {
    // Buscar ranking ordenado corretamente
    const result = await pool.query(
      `SELECT 
        id,
        nome,
        quantidade_avaliacoes,
        nota_media,
        posicao_ranking
      FROM ranking_lojas 
      WHERE quantidade_avaliacoes > 0
      ORDER BY nota_media DESC, quantidade_avaliacoes DESC, nome ASC`
    );
    
    // Recalcular posições para garantir sequência correta
    // (em caso de empates, manter a ordem já calculada)
    const rankingComPosicao = result.rows.map((loja, index) => ({
      ...loja,
      posicao_ranking: index + 1, // Recalcular posição baseado na ordem já ordenada
    }));
    
    console.log('[Ranking] Total de lojas com avaliações:', rankingComPosicao.length);
    if (rankingComPosicao.length > 0) {
      console.log('[Ranking] Top 3:', rankingComPosicao.slice(0, 3).map(l => ({
        posicao: l.posicao_ranking,
        nome: l.nome,
        nota: l.nota_media,
        avaliacoes: l.quantidade_avaliacoes
      })));
    }
    
    res.json(rankingComPosicao);
  } catch (error: any) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ranking/lojas/:loja_id/avaliacoes
 * Retorna avaliações detalhadas de uma loja (apenas a própria loja vê)
 */
router.get(
  '/lojas/:loja_id/avaliacoes',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { loja_id } = req.params;

      // Verificar se lojista pode ver esta loja
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [loja_id, req.user!.userId]
        );
        if (lojaResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Acesso negado. Você só pode ver avaliações da sua própria loja.',
          });
        }
      }
      
      // Admins podem ver todas as avaliações sem restrição

      const result = await pool.query(
        `SELECT 
          a.*,
          cv.nome as cliente_nome,
          CASE 
            WHEN a.anonima = true THEN 'Anônimo'
            ELSE cv.nome
          END as nome_exibido
        FROM avaliacoes a
        JOIN clientes_vip cv ON a.cliente_vip_id = cv.id
        WHERE a.loja_id = $1
        ORDER BY a.created_at DESC`,
        [loja_id]
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar avaliações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * GET /api/ranking/qr/:qrCode/avaliacao
 * Verifica se cliente já avaliou a loja usando QR Code (rota pública)
 */
router.get('/qr/:qrCode/avaliacao', async (req, res) => {
  try {
    const { qrCode } = req.params;

    // Buscar cliente por QR code
    const clienteResult = await pool.query(
      'SELECT id, loja_id FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
      [qrCode]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }

    const cliente = clienteResult.rows[0];

    // Buscar avaliação existente
    const avaliacaoResult = await pool.query(
      'SELECT * FROM avaliacoes WHERE cliente_vip_id = $1 AND loja_id = $2',
      [cliente.id, cliente.loja_id]
    );

    if (avaliacaoResult.rows.length > 0) {
      res.json(avaliacaoResult.rows[0]);
    } else {
      res.json(null);
    }
  } catch (error: any) {
    console.error('Erro ao verificar avaliação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ranking/avaliacoes
 * Cria nova avaliação (cliente VIP autenticado)
 */
router.post(
  '/avaliacoes',
  authenticate,
  authorize('cliente_vip', 'admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { cliente_vip_id, loja_id, nota, comentario } = req.body;

      if (!cliente_vip_id || !loja_id || !nota) {
        return res.status(400).json({
          error: 'Cliente VIP, loja e nota são obrigatórios',
        });
      }

      if (nota < 0 || nota > 10) {
        return res.status(400).json({
          error: 'Nota deve estar entre 0 e 10',
        });
      }

      // Verificar se já existe avaliação deste cliente para esta loja
      const existe = await pool.query(
        'SELECT id FROM avaliacoes WHERE cliente_vip_id = $1 AND loja_id = $2',
        [cliente_vip_id, loja_id]
      );

      if (existe.rows.length > 0) {
        return res.status(400).json({
          error: 'Você já avaliou esta loja. Cada cliente pode avaliar uma loja apenas uma vez.',
        });
      }

      // Criar avaliação (sempre com dados do cliente, não anônima)
      const result = await pool.query(
        `INSERT INTO avaliacoes (
          cliente_vip_id, loja_id, nota, comentario, anonima
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [cliente_vip_id, loja_id, nota, comentario || null, false]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar avaliação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/ranking/avaliacoes/qr
 * Cria nova avaliação usando QR Code (rota pública)
 */
  router.post('/avaliacoes/qr', async (req, res) => {
    try {
      const { qr_code, nota, comentario } = req.body;

      console.log('Criando avaliação por QR Code:', { qr_code, nota, comentario });

      if (!qr_code || !nota) {
        return res.status(400).json({
          error: 'QR Code e nota são obrigatórios',
        });
      }

      if (nota < 0 || nota > 10) {
        return res.status(400).json({
          error: 'Nota deve estar entre 0 e 10',
        });
      }

      // Buscar cliente por QR code
      console.log('Buscando cliente com QR Code:', qr_code);
      const clienteResult = await pool.query(
        'SELECT id, loja_id FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
        [qr_code]
      );

      if (clienteResult.rows.length === 0) {
        console.log('Cliente não encontrado com QR Code:', qr_code);
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }

      const cliente = clienteResult.rows[0];
      console.log('Cliente encontrado:', cliente.id, 'Loja:', cliente.loja_id);

    // Verificar se já existe avaliação deste cliente para esta loja
    const existe = await pool.query(
      'SELECT id FROM avaliacoes WHERE cliente_vip_id = $1 AND loja_id = $2',
      [cliente.id, cliente.loja_id]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: 'Você já avaliou esta loja. Cada cliente pode avaliar uma loja apenas uma vez.',
      });
    }

      // Criar avaliação (sempre com dados do cliente, não anônima)
      console.log('Criando avaliação no banco de dados...');
      const result = await pool.query(
        `INSERT INTO avaliacoes (
          cliente_vip_id, loja_id, nota, comentario, anonima
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [cliente.id, cliente.loja_id, nota, comentario || null, false]
      );

      console.log('Avaliação criada com sucesso:', result.rows[0].id);
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar avaliação por QR Code:', error);
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

export default router;

