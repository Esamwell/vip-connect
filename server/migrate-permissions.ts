import pool from './src/config/database';

async function migrate() {
  try {
    console.log('Iniciando migração...');
    
    // Criar tabela de permissões se não existir
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS role_permissions (
        role VARCHAR(50) NOT NULL,
        permission VARCHAR(100) NOT NULL,
        PRIMARY KEY (role, permission)
      );
    `;
    await pool.query(createTableQuery);
    console.log('Tabela role_permissions garantida.');

    // Inserir permissões padrão para admin_mt se a tabela estiver vazia
    const checkEmpty = await pool.query('SELECT COUNT(*) FROM role_permissions');
    if (parseInt(checkEmpty.rows[0].count) === 0) {
      console.log('Inserindo permissões padrão...');
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
        await pool.query('INSERT INTO role_permissions (role, permission) VALUES ($1, $2)', [role, perm]);
      }
      console.log('Permissões padrão inseridas.');
    }

    console.log('Migração concluída com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

migrate();
