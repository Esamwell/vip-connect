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
    
    res.json(rankingComPosicao);
  } catch (error: any) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ranking/vendedores
 * Retorna ranking público de vendedores
 */
router.get('/vendedores', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.id,
        v.nome,
        v.loja_id,
        l.nome as loja_nome,
        COUNT(a.id)::integer as quantidade_avaliacoes,
        COALESCE(AVG(a.nota), 0) as nota_media
      FROM vendedores v
      LEFT JOIN lojas l ON v.loja_id = l.id
      LEFT JOIN avaliacoes a ON v.id = a.vendedor_id
      WHERE v.ativo = true
      GROUP BY v.id, v.nome, v.loja_id, l.nome
      HAVING COUNT(a.id) > 0
      ORDER BY nota_media DESC, quantidade_avaliacoes DESC, v.nome ASC
    `;
    const result = await pool.query(query);
    const rankingComPosicao = result.rows.map((vendedor, index) => ({
      ...vendedor,
      nota_media: Number(vendedor.nota_media),
      quantidade_avaliacoes: Number(vendedor.quantidade_avaliacoes),
      posicao_ranking: index + 1,
    }));
    res.json(rankingComPosicao);
  } catch (error: any) {
    console.error('Erro ao buscar ranking de vendedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ranking/vendedores/:vendedor_id/avaliacoes
 * Retorna avaliações públicas de um vendedor
 */
router.get('/vendedores/:vendedor_id/avaliacoes', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        a.id,
        a.nota,
        a.comentario,
        a.created_at,
        c.nome as cliente_nome,
        CASE 
          WHEN a.anonima THEN 'Cliente Anônimo'
          ELSE COALESCE(c.nome, 'Cliente VIP')
        END as nome_exibido
      FROM avaliacoes a
      LEFT JOIN clientes_vip c ON a.cliente_vip_id = c.id
      WHERE a.vendedor_id = $1 AND a.status = 'aprovada'
      ORDER BY a.created_at DESC`,
      [req.params.vendedor_id]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao buscar avaliações do vendedor:', error);
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
      'SELECT id, loja_id, vendedor_id FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
      [qrCode]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente VIP não encontrado' });
    }

    const cliente = clienteResult.rows[0];

    // Buscar avaliações existentes (loja e vendedor)
    const avaliacaoLojaResult = await pool.query(
      'SELECT * FROM avaliacoes WHERE cliente_vip_id = $1 AND loja_id = $2 AND vendedor_id IS NULL',
      [cliente.id, cliente.loja_id]
    );

    const avaliacaoVendedorResult = await pool.query(
      'SELECT * FROM avaliacoes WHERE cliente_vip_id = $1 AND vendedor_id = $2 AND loja_id IS NULL',
      [cliente.id, cliente.vendedor_id]
    );

    if (avaliacaoLojaResult.rows.length > 0 || avaliacaoVendedorResult.rows.length > 0) {
      res.json({
        loja: avaliacaoLojaResult.rows.length > 0 ? avaliacaoLojaResult.rows[0] : null,
        vendedor: avaliacaoVendedorResult.rows.length > 0 ? avaliacaoVendedorResult.rows[0] : null
      });
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
      const { cliente_vip_id, loja_id, vendedor_id, nota, comentario, nota_loja, comentario_loja, nota_vendedor, comentario_vendedor } = req.body;

      if (!cliente_vip_id || !loja_id) {
        return res.status(400).json({
          error: 'Cliente VIP e Loja são obrigatórios',
        });
      }

      // Compatibilidade antiga (nota) ou formato novo (nota_loja e nota_vendedor)
      const nLoja = nota_loja !== undefined ? nota_loja : nota;
      const cLoja = comentario_loja !== undefined ? comentario_loja : comentario;
      
      if (nLoja === undefined || nLoja < 0 || nLoja > 10) {
        return res.status(400).json({ error: 'Nota da loja deve estar entre 0 e 10' });
      }

      // Iniciar transação p/ múltiplos inserts
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // 1. Inserir avaliação da Loja (se ainda não existir)
        const existeLoja = await client.query(
          'SELECT id FROM avaliacoes WHERE cliente_vip_id = $1 AND loja_id = $2 AND vendedor_id IS NULL',
          [cliente_vip_id, loja_id]
        );

        let resultLoja;
        if (existeLoja.rows.length === 0) {
          resultLoja = await client.query(
            `INSERT INTO avaliacoes (
              cliente_vip_id, loja_id, vendedor_id, nota, comentario, anonima
            ) VALUES ($1, $2, NULL, $3, $4, $5)
            RETURNING *`,
            [cliente_vip_id, loja_id, nLoja, cLoja || null, false]
          );
        }

        // 2. Inserir avaliação do Vendedor (se fornecida e se ele tiver vendedor)
        let resultVendedor;
        if (vendedor_id && nota_vendedor !== undefined && nota_vendedor >= 0 && nota_vendedor <= 10) {
          const existeVendedor = await client.query(
            'SELECT id FROM avaliacoes WHERE cliente_vip_id = $1 AND vendedor_id = $2 AND loja_id IS NULL',
            [cliente_vip_id, vendedor_id]
          );

          if (existeVendedor.rows.length === 0) {
            resultVendedor = await client.query(
              `INSERT INTO avaliacoes (
                cliente_vip_id, loja_id, vendedor_id, nota, comentario, anonima
              ) VALUES ($1, NULL, $2, $3, $4, $5)
              RETURNING *`,
              [cliente_vip_id, vendedor_id, nota_vendedor, comentario_vendedor || null, false]
            );
          }
        }

        await client.query('COMMIT');
        
        res.status(201).json({
          loja: resultLoja ? resultLoja.rows[0] : null,
          vendedor: resultVendedor ? resultVendedor.rows[0] : null
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
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
      const { qr_code, nota, comentario, nota_loja, comentario_loja, nota_vendedor, comentario_vendedor } = req.body;

      console.log('Criando avaliação por QR Code:', req.body);

      if (!qr_code) {
        return res.status(400).json({
          error: 'QR Code é obrigatório',
        });
      }

      const nLoja = nota_loja !== undefined ? nota_loja : nota;
      const cLoja = comentario_loja !== undefined ? comentario_loja : comentario;

      if (nLoja === undefined || nLoja < 0 || nLoja > 10) {
        return res.status(400).json({
          error: 'Nota da loja deve estar entre 0 e 10',
        });
      }

      // Buscar cliente por QR code para descobrir ID, Loja e Vendedor
      console.log('Buscando cliente com QR Code:', qr_code);
      const clienteResult = await pool.query(
        'SELECT id, loja_id, vendedor_id FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $1',
        [qr_code]
      );

      if (clienteResult.rows.length === 0) {
        console.log('Cliente não encontrado com QR Code:', qr_code);
        return res.status(404).json({ error: 'Cliente VIP não encontrado' });
      }

      const cliente = clienteResult.rows[0];
      console.log('Cliente encontrado:', cliente.id, 'Loja:', cliente.loja_id, 'Vendedor:', cliente.vendedor_id);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 1. Inserir Avaliação da Loja
        const existeLoja = await client.query(
          'SELECT id FROM avaliacoes WHERE cliente_vip_id = $1 AND loja_id = $2 AND vendedor_id IS NULL',
          [cliente.id, cliente.loja_id]
        );

        let resultLoja;
        if (existeLoja.rows.length > 0) {
          // Já avaliou a loja
          console.log('Cliente já avaliou esta loja');
        } else {
          resultLoja = await client.query(
            `INSERT INTO avaliacoes (
              cliente_vip_id, loja_id, vendedor_id, nota, comentario, anonima
            ) VALUES ($1, $2, NULL, $3, $4, $5)
            RETURNING *`,
            [cliente.id, cliente.loja_id, nLoja, cLoja || null, false]
          );
        }

        // 2. Inserir Avaliação do Vendedor
        let resultVendedor;
        if (cliente.vendedor_id && nota_vendedor !== undefined && nota_vendedor >= 0 && nota_vendedor <= 10) {
          const existeVendedor = await client.query(
            'SELECT id FROM avaliacoes WHERE cliente_vip_id = $1 AND vendedor_id = $2 AND loja_id IS NULL',
            [cliente.id, cliente.vendedor_id]
          );

          if (existeVendedor.rows.length === 0) {
            resultVendedor = await client.query(
              `INSERT INTO avaliacoes (
                cliente_vip_id, loja_id, vendedor_id, nota, comentario, anonima
              ) VALUES ($1, NULL, $2, $3, $4, $5)
              RETURNING *`,
              [cliente.id, cliente.vendedor_id, nota_vendedor, comentario_vendedor || null, false]
            );
          }
        }

        await client.query('COMMIT');
        res.status(201).json({
          loja: resultLoja ? resultLoja.rows[0] : null,
          vendedor: resultVendedor ? resultVendedor.rows[0] : null,
          aviso: !resultLoja && !resultVendedor ? 'Você já avaliou este atendimento anteriormente.' : undefined
        });

      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

    } catch (error: any) {
      console.error('Erro ao criar avaliação por QR Code:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });

export default router;

