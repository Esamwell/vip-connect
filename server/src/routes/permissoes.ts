import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Lógica de inicialização da tabela
let tableCheckPerformed = false;
async function ensureTableExists() {
  if (tableCheckPerformed) return;
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS role_permissions (
        role VARCHAR(50) NOT NULL,
        permission VARCHAR(100) NOT NULL,
        PRIMARY KEY (role, permission)
      );
    `;
    await pool.query(createTableQuery);

    const checkEmpty = await pool.query('SELECT COUNT(*) FROM role_permissions');
    if (parseInt(checkEmpty.rows[0].count) === 0) {
      const defaultPerms = [
          ['admin_mt', 'gestao:clientes'],
          ['admin_mt', 'gestao:lojas'],
          ['admin_mt', 'gestao:parceiros'],
          ['admin_mt', 'gestao:vendedores'],
          ['admin_mt', 'gestao:beneficios'],
          ['admin_mt', 'gestao:beneficios-asi'],
          ['admin_mt', 'atendimento:chamados'],
          ['admin_mt', 'atendimento:renovacoes'],
          ['admin_mt', 'analise:ranking'],
          ['admin_mt', 'analise:relatorios'],
          ['admin_mt', 'sistema:configuracoes'],
          ['admin_mt', 'sistema:usuarios'],
          ['admin_mt', 'sistema:permissoes']
        ];
        
        for (const [role, perm] of defaultPerms) {
          await pool.query('INSERT INTO role_permissions (role, permission) VALUES ($1, $2) ON CONFLICT DO NOTHING', [role, perm]);
        }
    }
    tableCheckPerformed = true;
    console.log('✅ Tabela role_permissions verificada/criada.');
  } catch (error) {
    console.error('❌ Erro ao garantir tabela de permissões:', error);
  }
}

/**
 * GET /api/permissoes
 * Lista todas as permissões agrupadas por role
 */
router.get('/', authenticate, authorize('admin_mt'), async (req, res) => {
  try {
    await ensureTableExists();
    const query = 'SELECT role, permission FROM role_permissions';
    const result = await pool.query(query);
    
    // Agrupar por role
    const permissionsByRole: Record<string, string[]> = {};
    result.rows.forEach(row => {
      if (!permissionsByRole[row.role]) {
        permissionsByRole[row.role] = [];
      }
      permissionsByRole[row.role].push(row.permission);
    });
    
    res.json(permissionsByRole);
  } catch (error: any) {
    console.error('Erro ao listar permissões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/permissoes/my
 * Retorna as permissões do usuário logado
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    await ensureTableExists();
    if (!req.user?.role) {
      return res.status(400).json({ error: 'Papel do usuário não identificado' });
    }

    const query = 'SELECT permission FROM role_permissions WHERE role = $1';
    const result = await pool.query(query, [req.user.role]);
    
    const permissions = result.rows.map(row => row.permission);
    res.json(permissions);
  } catch (error: any) {
    console.error('Erro ao buscar permissões próprias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/permissoes/update

 * Atualiza as permissões de uma role
 */
router.post('/update', authenticate, authorize('admin_mt'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { role, permissions } = req.body; // permissions: string[]

    if (!role || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Role e lista de permissões são obrigatórios' });
    }

    await client.query('BEGIN');

    // Remover permissões atuais da role
    await client.query('DELETE FROM role_permissions WHERE role = $1', [role]);

    // Inserir novas permissões
    if (permissions.length > 0) {
      const insertValues = permissions.map((_, i) => `($1, $${i + 2})`).join(', ');
      const insertQuery = `INSERT INTO role_permissions (role, permission) VALUES ${insertValues}`;
      await client.query(insertQuery, [role, ...permissions]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Permissões atualizadas com sucesso' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar permissões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

export default router;
