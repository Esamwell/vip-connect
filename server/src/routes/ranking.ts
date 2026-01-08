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
    const result = await pool.query(
      `SELECT * FROM ranking_lojas ORDER BY posicao_ranking`
    );
    res.json(result.rows);
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
  authorizeLojista,
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
 * POST /api/ranking/avaliacoes
 * Cria nova avaliação (cliente VIP)
 */
router.post(
  '/avaliacoes',
  authenticate,
  authorize('cliente_vip', 'admin_mt', 'admin_shopping'),
  async (req, res) => {
    try {
      const { cliente_vip_id, loja_id, nota, comentario, anonima } = req.body;

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

      // Criar avaliação
      const result = await pool.query(
        `INSERT INTO avaliacoes (
          cliente_vip_id, loja_id, nota, comentario, anonima
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [cliente_vip_id, loja_id, nota, comentario || null, anonima || false]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar avaliação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

