import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, authorizeLojista } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Retorna estatísticas do dashboard baseadas no role do usuário
 */
router.get(
  '/stats',
  authenticate,
  authorizeLojista,
  async (req, res) => {
    try {
      const userRole = req.user!.role;
      const userId = req.user!.userId;
      
      // Variáveis para filtros baseados no role
      let lojaId: string | null = null;

      // Se for lojista, buscar sua loja
      if (userRole === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1 AND ativo = true',
          [userId]
        );
        if (lojaResult.rows.length > 0) {
          lojaId = lojaResult.rows[0].id;
          lojaFilter = ' AND cv.loja_id = $1';
          lojaParams = [lojaId];
        } else {
          // Lojista sem loja retorna zeros
          return res.json({
            totalClientes: 0,
            totalLojas: 0,
            chamadosAbertos: 0,
            clientesVencendo: 0,
            renovacoesMes: 0,
            beneficiosUsados: 0,
            crescimentoClientes: 0,
            crescimentoRenovacoes: 0,
          });
        }
      }

      // Calcular mês atual e mês anterior
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();
      const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
      const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;

      // 1. Total de Clientes VIP
      let clientesQuery = `
        SELECT COUNT(*) as total
        FROM clientes_vip cv
      `;
      const clientesParams: any[] = [];
      if (lojaId) {
        clientesQuery += ' WHERE cv.loja_id = $1';
        clientesParams.push(lojaId);
      }
      const clientesResult = await pool.query(clientesQuery, clientesParams);
      const totalClientes = parseInt(clientesResult.rows[0]?.total) || 0;

      // Clientes criados neste mês para cálculo de crescimento
      let clientesMesAtualQuery = `
        SELECT COUNT(*) as total
        FROM clientes_vip cv
        WHERE EXTRACT(MONTH FROM cv.created_at) = $1
          AND EXTRACT(YEAR FROM cv.created_at) = $2
      `;
      const clientesMesAtualParams: any[] = [mesAtual, anoAtual];
      if (lojaId) {
        clientesMesAtualQuery += ' AND cv.loja_id = $3';
        clientesMesAtualParams.push(lojaId);
      }
      const clientesMesAtualResult = await pool.query(
        clientesMesAtualQuery,
        clientesMesAtualParams
      );
      const totalClientesMesAtual = parseInt(clientesMesAtualResult.rows[0]?.total) || 0;

      // Clientes criados no mês anterior para cálculo de crescimento
      let clientesMesAnteriorQuery = `
        SELECT COUNT(*) as total
        FROM clientes_vip cv
        WHERE EXTRACT(MONTH FROM cv.created_at) = $1
          AND EXTRACT(YEAR FROM cv.created_at) = $2
      `;
      const clientesMesAnteriorParams: any[] = [mesAnterior, anoAnterior];
      if (lojaId) {
        clientesMesAnteriorQuery += ' AND cv.loja_id = $3';
        clientesMesAnteriorParams.push(lojaId);
      }
      const clientesMesAnteriorResult = await pool.query(
        clientesMesAnteriorQuery,
        clientesMesAnteriorParams
      );
      const totalClientesMesAnterior = parseInt(clientesMesAnteriorResult.rows[0]?.total) || 0;
      const crescimentoClientes = totalClientesMesAnterior > 0
        ? Math.round(((totalClientesMesAtual - totalClientesMesAnterior) / totalClientesMesAnterior) * 100)
        : (totalClientesMesAtual > 0 ? 100 : 0);

      // 2. Total de Lojas (apenas para admin_mt e admin_shopping)
      let totalLojas = 0;
      if (userRole === 'admin_mt' || userRole === 'admin_shopping') {
        const lojasQuery = 'SELECT COUNT(*) as total FROM lojas WHERE ativo = true';
        const lojasResult = await pool.query(lojasQuery);
        totalLojas = parseInt(lojasResult.rows[0]?.total) || 0;
      }

      // 3. Chamados Abertos
      let chamadosQuery = `
        SELECT COUNT(*) as total
        FROM chamados c
        WHERE c.status = 'aberto'
      `;
      const chamadosParams: any[] = [];
      if (lojaId) {
        chamadosQuery += ' AND c.loja_id = $1';
        chamadosParams.push(lojaId);
      }
      const chamadosResult = await pool.query(chamadosQuery, chamadosParams);
      const chamadosAbertos = parseInt(chamadosResult.rows[0]?.total) || 0;

      // 4. Clientes Vencendo em 30 dias
      let vencendoQuery = `
        SELECT COUNT(*) as total
        FROM clientes_vip cv
        WHERE cv.data_validade BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
          AND cv.status = 'ativo'
      `;
      const vencendoParams: any[] = [];
      if (lojaId) {
        vencendoQuery += ' AND cv.loja_id = $1';
        vencendoParams.push(lojaId);
      }
      const vencendoResult = await pool.query(vencendoQuery, vencendoParams);
      const clientesVencendo = parseInt(vencendoResult.rows[0]?.total) || 0;

      // 5. Renovações deste mês
      let renovacoesQuery = `
        SELECT COUNT(*) as total
        FROM renovacoes r
        WHERE EXTRACT(MONTH FROM r.data_renovacao) = $1
          AND EXTRACT(YEAR FROM r.data_renovacao) = $2
      `;
      const renovacoesParams: any[] = [mesAtual, anoAtual];
      if (lojaId) {
        renovacoesQuery += ' AND r.loja_id = $3';
        renovacoesParams.push(lojaId);
      }
      const renovacoesResult = await pool.query(renovacoesQuery, renovacoesParams);
      const renovacoesMes = parseInt(renovacoesResult.rows[0]?.total) || 0;

      // Renovações do mês anterior para cálculo de crescimento
      let renovacoesMesAnteriorQuery = `
        SELECT COUNT(*) as total
        FROM renovacoes r
        WHERE EXTRACT(MONTH FROM r.data_renovacao) = $1
          AND EXTRACT(YEAR FROM r.data_renovacao) = $2
      `;
      const renovacoesMesAnteriorParams: any[] = [mesAnterior, anoAnterior];
      if (lojaId) {
        renovacoesMesAnteriorQuery += ' AND r.loja_id = $3';
        renovacoesMesAnteriorParams.push(lojaId);
      }
      const renovacoesMesAnteriorResult = await pool.query(
        renovacoesMesAnteriorQuery,
        renovacoesMesAnteriorParams
      );
      const renovacoesMesAnterior = parseInt(renovacoesMesAnteriorResult.rows[0]?.total) || 0;
      const crescimentoRenovacoes = renovacoesMesAnterior > 0
        ? Math.round(((renovacoesMes - renovacoesMesAnterior) / renovacoesMesAnterior) * 100)
        : (renovacoesMes > 0 ? 100 : 0);

      // 6. Benefícios Usados (validações realizadas + benefícios resgatados)
      // Contar validações da tabela validacoes_beneficios
      let validacoesQuery = `
        SELECT COUNT(*) as total
        FROM validacoes_beneficios vb
        WHERE 1=1
      `;
      const validacoesParams: any[] = [];
      
      // Se for lojista, contar apenas benefícios de loja da sua loja
      if (userRole === 'lojista' && lojaId) {
        validacoesQuery += `
          AND EXISTS (
            SELECT 1 FROM beneficios_loja bl
            WHERE bl.id = vb.beneficio_loja_id
            AND bl.loja_id = $1
          )
        `;
        validacoesParams.push(lojaId);
      } else if (userRole === 'parceiro') {
        // Parceiros veem apenas validações dos seus benefícios
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1',
          [userId]
        );
        if (parceiroResult.rows.length > 0) {
          validacoesQuery += ' AND vb.parceiro_id = $1';
          validacoesParams.push(parceiroResult.rows[0].id);
        } else {
          validacoesQuery += ' AND 1=0'; // Sem parceiro = sem validações
        }
      }
      
      const validacoesResult = await pool.query(validacoesQuery, validacoesParams);
      const totalValidacoes = parseInt(validacoesResult.rows[0]?.total) || 0;

      // Contar benefícios resgatados da tabela clientes_beneficios
      let resgatesQuery = `
        SELECT COUNT(*) as total
        FROM clientes_beneficios cb
        WHERE cb.resgatado = true
          AND cb.data_resgate IS NOT NULL
      `;
      const resgatesParams: any[] = [];
      
      // Se for lojista, contar apenas benefícios de loja da sua loja
      if (userRole === 'lojista' && lojaId) {
        resgatesQuery += `
          AND EXISTS (
            SELECT 1 FROM beneficios_loja bl
            WHERE bl.id = cb.beneficio_loja_id
            AND bl.loja_id = $1
          )
        `;
        resgatesParams.push(lojaId);
      } else if (userRole === 'parceiro') {
        // Parceiros veem apenas benefícios oficiais vinculados a eles
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1',
          [userId]
        );
        if (parceiroResult.rows.length > 0) {
          resgatesQuery += `
            AND EXISTS (
              SELECT 1 FROM beneficios_oficiais bo
              WHERE bo.id = cb.beneficio_oficial_id
              AND bo.parceiro_id = $1
            )
          `;
          resgatesParams.push(parceiroResult.rows[0].id);
        } else {
          resgatesQuery += ' AND 1=0'; // Sem parceiro = sem resgates
        }
      }
      // Nota: Para admin_mt e admin_shopping sem filtro de loja, conta todos os resgates
      
      const resgatesResult = await pool.query(resgatesQuery, resgatesParams);
      const totalResgates = parseInt(resgatesResult.rows[0]?.total) || 0;

      // Total de benefícios usados = validações + resgates
      const beneficiosUsados = totalValidacoes + totalResgates;

      const stats = {
        totalClientes,
        totalLojas,
        chamadosAbertos,
        clientesVencendo,
        renovacoesMes,
        beneficiosUsados,
        crescimentoClientes,
        crescimentoRenovacoes,
      };

      console.log('[Dashboard Stats]', {
        userRole,
        userId,
        lojaId,
        stats,
      });

      res.json(stats);
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/dashboard/atividades-recentes
 * Retorna atividades recentes do sistema
 */
router.get(
  '/atividades-recentes',
  authenticate,
  authorizeLojista,
  async (req, res) => {
    try {
      const userRole = req.user!.role;
      const userId = req.user!.userId;
      let lojaId: string | null = null;

      // Se for lojista, buscar sua loja
      if (userRole === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE user_id = $1 AND ativo = true',
          [userId]
        );
        if (lojaResult.rows.length > 0) {
          lojaId = lojaResult.rows[0].id;
        } else {
          return res.json([]);
        }
      }

      const atividades: any[] = [];

      // 1. Novos clientes VIP cadastrados (últimos 5)
      let clientesQuery = `
        SELECT 
          cv.id,
          cv.nome,
          cv.created_at as data,
          'cliente_cadastrado' as tipo,
          l.nome as loja_nome
        FROM clientes_vip cv
        JOIN lojas l ON cv.loja_id = l.id
        WHERE 1=1
      `;
      const clientesParams: any[] = [];
      if (lojaId) {
        clientesQuery += ' AND cv.loja_id = $1';
        clientesParams.push(lojaId);
      }
      clientesQuery += ' ORDER BY cv.created_at DESC LIMIT 5';
      
      const clientesResult = await pool.query(clientesQuery, clientesParams);
      clientesResult.rows.forEach((row: any) => {
        atividades.push({
          id: row.id,
          tipo: 'cliente_cadastrado',
          titulo: 'Novo cliente VIP cadastrado',
          descricao: row.nome,
          data: row.data,
          loja_nome: row.loja_nome,
        });
      });

      // 2. VIPs renovados (últimos 5)
      let renovacoesQuery = `
        SELECT 
          r.id,
          cv.nome as cliente_nome,
          r.data_renovacao as data,
          'vip_renovado' as tipo,
          l.nome as loja_nome
        FROM renovacoes r
        JOIN clientes_vip cv ON r.cliente_vip_id = cv.id
        JOIN lojas l ON r.loja_id = l.id
        WHERE 1=1
      `;
      const renovacoesParams: any[] = [];
      if (lojaId) {
        renovacoesQuery += ' AND r.loja_id = $1';
        renovacoesParams.push(lojaId);
      }
      renovacoesQuery += ' ORDER BY r.data_renovacao DESC LIMIT 5';
      
      const renovacoesResult = await pool.query(renovacoesQuery, renovacoesParams);
      renovacoesResult.rows.forEach((row: any) => {
        atividades.push({
          id: row.id,
          tipo: 'vip_renovado',
          titulo: 'VIP renovado com sucesso',
          descricao: row.cliente_nome,
          data: row.data,
          loja_nome: row.loja_nome,
        });
      });

      // 3. Benefícios validados (últimos 5)
      let validacoesQuery = `
        SELECT 
          vb.id,
          cv.nome as cliente_nome,
          vb.data_validacao as data,
          'beneficio_validado' as tipo,
          COALESCE(bo.nome, bl.nome) as beneficio_nome,
          p.nome as parceiro_nome
        FROM validacoes_beneficios vb
        JOIN clientes_vip cv ON vb.cliente_vip_id = cv.id
        LEFT JOIN beneficios_oficiais bo ON vb.beneficio_oficial_id = bo.id
        LEFT JOIN beneficios_loja bl ON vb.beneficio_loja_id = bl.id
        LEFT JOIN parceiros p ON vb.parceiro_id = p.id
        WHERE 1=1
      `;
      const validacoesParams: any[] = [];
      
      if (userRole === 'lojista' && lojaId) {
        validacoesQuery += `
          AND EXISTS (
            SELECT 1 FROM beneficios_loja bl2
            WHERE bl2.id = vb.beneficio_loja_id
            AND bl2.loja_id = $1
          )
        `;
        validacoesParams.push(lojaId);
      } else if (userRole === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1',
          [userId]
        );
        if (parceiroResult.rows.length > 0) {
          validacoesQuery += ' AND vb.parceiro_id = $1';
          validacoesParams.push(parceiroResult.rows[0].id);
        } else {
          validacoesQuery += ' AND 1=0';
        }
      }
      
      validacoesQuery += ' ORDER BY vb.data_validacao DESC LIMIT 5';
      
      const validacoesResult = await pool.query(validacoesQuery, validacoesParams);
      validacoesResult.rows.forEach((row: any) => {
        atividades.push({
          id: row.id,
          tipo: 'beneficio_validado',
          titulo: 'Benefício validado',
          descricao: `${row.beneficio_nome} - ${row.cliente_nome}`,
          data: row.data,
          parceiro_nome: row.parceiro_nome,
        });
      });

      // 4. Benefícios resgatados (últimos 5)
      let resgatesQuery = `
        SELECT 
          cb.id,
          cv.nome as cliente_nome,
          cb.data_resgate as data,
          'beneficio_resgatado' as tipo,
          COALESCE(bo.nome, bl.nome) as beneficio_nome,
          u.nome as resgatado_por_nome
        FROM clientes_beneficios cb
        JOIN clientes_vip cv ON cb.cliente_vip_id = cv.id
        LEFT JOIN beneficios_oficiais bo ON cb.beneficio_oficial_id = bo.id
        LEFT JOIN beneficios_loja bl ON cb.beneficio_loja_id = bl.id
        LEFT JOIN users u ON cb.resgatado_por = u.id
        WHERE cb.resgatado = true
          AND cb.data_resgate IS NOT NULL
      `;
      const resgatesParams: any[] = [];
      
      if (userRole === 'lojista' && lojaId) {
        resgatesQuery += `
          AND EXISTS (
            SELECT 1 FROM beneficios_loja bl2
            WHERE bl2.id = cb.beneficio_loja_id
            AND bl2.loja_id = $1
          )
        `;
        resgatesParams.push(lojaId);
      } else if (userRole === 'parceiro') {
        const parceiroResult = await pool.query(
          'SELECT id FROM parceiros WHERE user_id = $1',
          [userId]
        );
        if (parceiroResult.rows.length > 0) {
          resgatesQuery += `
            AND EXISTS (
              SELECT 1 FROM beneficios_oficiais bo2
              WHERE bo2.id = cb.beneficio_oficial_id
              AND bo2.parceiro_id = $1
            )
          `;
          resgatesParams.push(parceiroResult.rows[0].id);
        } else {
          resgatesQuery += ' AND 1=0';
        }
      }
      
      resgatesQuery += ' ORDER BY cb.data_resgate DESC LIMIT 5';
      
      const resgatesResult = await pool.query(resgatesQuery, resgatesParams);
      resgatesResult.rows.forEach((row: any) => {
        atividades.push({
          id: row.id,
          tipo: 'beneficio_resgatado',
          titulo: 'Benefício resgatado',
          descricao: `${row.beneficio_nome} - ${row.cliente_nome}`,
          data: row.data,
          resgatado_por_nome: row.resgatado_por_nome,
        });
      });

      // Ordenar todas as atividades por data (mais recente primeiro) e pegar as 5 mais recentes
      atividades.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      const atividadesRecentes = atividades.slice(0, 5);

      res.json(atividadesRecentes);
    } catch (error: any) {
      console.error('Erro ao buscar atividades recentes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

