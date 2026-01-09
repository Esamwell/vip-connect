import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, authorizeLojista } from '../middleware/auth';
import { enviarEventoMTLeads, EventosMTLeads } from '../services/mtleads';
import { generateQRCode, generateQRCodeFisico } from '../utils/qrcode';

const router = express.Router();

/**
 * POST /api/renovacao/:cliente_vip_id
 * Renova VIP de um cliente
 */
router.post(
  '/:cliente_vip_id',
  authenticate,
  authorize('admin_mt', 'admin_shopping', 'lojista'),
  async (req, res) => {
    try {
      const { cliente_vip_id } = req.params;
      const { motivo, observacoes, veiculo_marca, veiculo_modelo, veiculo_ano, veiculo_placa } = req.body;

      // Buscar cliente VIP
      const clienteResult = await pool.query(
        'SELECT * FROM clientes_vip WHERE id = $1',
        [cliente_vip_id]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Cliente VIP não encontrado',
        });
      }

      const cliente = clienteResult.rows[0];

      // Verificar se lojista pode renovar este cliente
      if (req.user!.role === 'lojista') {
        const lojaResult = await pool.query(
          'SELECT id FROM lojas WHERE id = $1 AND user_id = $2',
          [cliente.loja_id, req.user!.userId]
        );
        if (lojaResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Você só pode renovar clientes da sua própria loja',
          });
        }
      }

      // Calcular nova data de validade (12 meses a partir de hoje)
      const novaDataValidade = new Date();
      novaDataValidade.setMonth(novaDataValidade.getMonth() + 12);

      // Gerar novos códigos para a renovação
      let novoQRCodeDigital = generateQRCode();
      let novoQRCodeFisico = generateQRCodeFisico();

      // Garantir que os novos códigos sejam únicos
      let qrDigitalExiste = true;
      let qrFisicoExiste = true;
      let tentativas = 0;
      const maxTentativas = 10;

      while ((qrDigitalExiste || qrFisicoExiste) && tentativas < maxTentativas) {
        const checkQR = await pool.query(
          'SELECT id FROM clientes_vip WHERE qr_code_digital = $1 OR qr_code_fisico = $2 OR qr_code_digital = $2 OR qr_code_fisico = $1',
          [novoQRCodeDigital, novoQRCodeFisico]
        );

        if (checkQR.rows.length === 0) {
          qrDigitalExiste = false;
          qrFisicoExiste = false;
        } else {
          novoQRCodeDigital = generateQRCode();
          novoQRCodeFisico = generateQRCodeFisico();
          tentativas++;
        }
      }

      if (tentativas >= maxTentativas) {
        throw new Error('Não foi possível gerar códigos únicos após várias tentativas');
      }

      // Iniciar transação
      await pool.query('BEGIN');

      try {
        // Criar registro de renovação e obter o ID
        const renovacaoResult = await pool.query(
          `INSERT INTO renovacoes (
            cliente_vip_id, loja_id, nova_data_validade, motivo, observacoes
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id`,
          [
            cliente_vip_id,
            cliente.loja_id,
            novaDataValidade,
            motivo || 'Recompra',
            observacoes,
          ]
        );

        const renovacaoId = renovacaoResult.rows[0].id;

        // Se houver novo veículo, adicionar ao histórico (não substituir)
        if (veiculo_marca && veiculo_modelo && veiculo_ano && veiculo_placa) {
          await pool.query(
            `INSERT INTO veiculos_cliente_vip (
              cliente_vip_id, marca, modelo, ano, placa, data_compra, renovacao_id
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)`,
            [
              cliente_vip_id,
              veiculo_marca,
              veiculo_modelo,
              parseInt(veiculo_ano),
              veiculo_placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
              renovacaoId,
            ]
          );

          // Atualizar campos do veículo na tabela clientes_vip apenas para mostrar o mais recente
          // (para compatibilidade com código existente)
          await pool.query(
            `UPDATE clientes_vip
             SET veiculo_marca = $1,
                 veiculo_modelo = $2,
                 veiculo_ano = $3,
                 veiculo_placa = $4
             WHERE id = $5`,
            [
              veiculo_marca,
              veiculo_modelo,
              parseInt(veiculo_ano),
              veiculo_placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
              cliente_vip_id,
            ]
          );
        }

        // Atualizar cliente VIP (status, validade e novos códigos)
        const updateResult = await pool.query(
          `UPDATE clientes_vip
           SET status = 'renovado',
               data_validade = $1,
               data_renovacao = NOW(),
               qr_code_digital = $2,
               qr_code_fisico = $3,
               potencial_recompra = false,
               notificado_vencimento = false,
               updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [novaDataValidade, novoQRCodeDigital, novoQRCodeFisico, cliente_vip_id]
        );

        await pool.query('COMMIT');

        const clienteAtualizado = updateResult.rows[0];

        // Disparar evento para MT Leads
        await enviarEventoMTLeads(EventosMTLeads.VIP_RENOVADO, {
          cliente_id: clienteAtualizado.id,
          nome: clienteAtualizado.nome,
          whatsapp: clienteAtualizado.whatsapp,
          nova_data_validade: clienteAtualizado.data_validade,
          qr_code_digital: clienteAtualizado.qr_code_digital,
          qr_code_fisico: clienteAtualizado.qr_code_fisico,
          motivo: motivo || 'Recompra',
        });

        res.json({
          cliente: clienteAtualizado,
          mensagem: 'VIP renovado com sucesso! Novos códigos foram gerados.',
        });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error: any) {
      console.error('Erro ao renovar VIP:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * POST /api/renovacao/verificar-vencimentos
 * Verifica e notifica clientes próximos do vencimento
 * (Deve ser executado diariamente via cron)
 */
router.post(
  '/verificar-vencimentos',
  authenticate,
  authorize('admin_mt'),
  async (req, res) => {
    try {
      // Executar função do banco que verifica vencimentos
      await pool.query('SELECT verificar_vencimentos_proximos()');

      // Buscar notificações criadas
      const notificacoes = await pool.query(
        `SELECT n.*, cv.nome, cv.whatsapp, cv.data_validade
         FROM notificacoes n
         JOIN clientes_vip cv ON n.cliente_vip_id = cv.id
         WHERE n.tipo = 'vencimento_proximo' 
           AND n.enviada = false
           AND n.created_at >= CURRENT_DATE`
      );

      // Enviar eventos para MT Leads
      for (const notificacao of notificacoes.rows) {
        await enviarEventoMTLeads(EventosMTLeads.VENCIMENTO_PROXIMO, {
          cliente_id: notificacao.cliente_vip_id,
          nome: notificacao.nome,
          whatsapp: notificacao.whatsapp,
          data_validade: notificacao.data_validade,
          dias_restantes: Math.ceil(
            (new Date(notificacao.data_validade).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        });

        // Marcar como enviada
        await pool.query(
          'UPDATE notificacoes SET enviada = true, data_envio = NOW() WHERE id = $1',
          [notificacao.id]
        );
      }

      res.json({
        mensagem: 'Verificação de vencimentos concluída',
        notificacoes_enviadas: notificacoes.rows.length,
      });
    } catch (error: any) {
      console.error('Erro ao verificar vencimentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;

