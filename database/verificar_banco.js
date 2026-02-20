const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  host: '84.46.241.73',
  port: 5432,
  database: 'vip_connect',
  user: 'postgres',
  password: '1923731sS$',
  ssl: false
});

async function verificarBanco() {
  console.log('🔍 Iniciando verificação completa do banco VIP-CONNECT...\n');
  
  try {
    // Testar conexão
    const client = await pool.connect();
    console.log('✅ Conexão bem-sucedida com o banco de dados!');
    
    // 1. Verificar banco atual
    console.log('\n=== 1. INFORMAÇÕES DO BANCO ===');
    const bancoResult = await client.query('SELECT current_database(), current_user(), version()');
    console.log(`Banco: ${bancoResult.rows[0].current_database}`);
    console.log(`Usuário: ${bancoResult.rows[0].current_user}`);
    console.log(`Versão: ${bancoResult.rows[0].version.split(' ')[0]}`);
    
    // 2. Verificar roles disponíveis
    console.log('\n=== 2. ROLES DISPONÍVEIS ===');
    const rolesResult = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
      ORDER BY enumlabel
    `);
    const roles = rolesResult.rows.map(r => r.enumlabel);
    console.log('Roles:', roles.join(', '));
    console.log(`Role 'vendedor' existe: ${roles.includes('vendedor') ? '✅ SIM' : '❌ NÃO'}`);
    
    // 3. Verificar todas as tabelas
    console.log('\n=== 3. TODAS AS TABELAS DO BANCO ===');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const allTables = tablesResult.rows.map(r => r.table_name);
    console.log(`Total de tabelas: ${allTables.length}`);
    console.log('Tabelas:', allTables.join(', '));
    
    // 4. Verificar tabelas de vendedores
    console.log('\n=== 4. VERIFICANDO TABELAS DE VENDEDORES ===');
    const vendedorTables = ['vendedores', 'vouchers_vendedor', 'resgates_voucher_vendedor', 'premiacoes_ranking', 'premiacoes_recebidas'];
    
    for (const table of vendedorTables) {
      const exists = allTables.includes(table);
      console.log(`${table}: ${exists ? '✅ EXISTE' : '❌ NÃO ENCONTRADA'}`);
      
      if (exists) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`  → Registros: ${countResult.rows[0].count}`);
        } catch (err) {
          console.log(`  → Erro ao contar registros: ${err.message}`);
        }
      }
    }
    
    // 5. Verificar colunas vendedor_id
    console.log('\n=== 5. VERIFICANDO COLUNAS vendedor_id ===');
    const columnsResult = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name = 'vendedor_id'
      ORDER BY table_name
    `);
    
    if (columnsResult.rows.length > 0) {
      console.log('Colunas vendedor_id encontradas:');
      columnsResult.rows.forEach(col => {
        console.log(`  → ${col.table_name}.${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('❌ Nenhuma coluna vendedor_id encontrada');
    }
    
    // 6. Verificar views de ranking
    console.log('\n=== 6. VERIFICANDO VIEWS DE RANKING ===');
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%ranking%'
      ORDER BY table_name
    `);
    
    if (viewsResult.rows.length > 0) {
      console.log('Views de ranking encontradas:');
      viewsResult.rows.forEach(view => {
        console.log(`  → ${view.table_name}`);
      });
    } else {
      console.log('❌ Nenhuma view de ranking encontrada');
    }
    
    // 7. Verificar usuários vendedores
    console.log('\n=== 7. VERIFICANDO USUÁRIOS VENDEDORES ===');
    const vendedoresResult = await client.query(`
      SELECT id, email, nome, role, ativo
      FROM users 
      WHERE role = 'vendedor' 
      ORDER BY nome
    `);
    
    if (vendedoresResult.rows.length > 0) {
      console.log(`Usuários vendedores encontrados: ${vendedoresResult.rows.length}`);
      vendedoresResult.rows.forEach(user => {
        console.log(`  → ${user.nome} (${user.email}) - ${user.ativo ? 'Ativo' : 'Inativo'}`);
      });
    } else {
      console.log('❌ Nenhum usuário vendedor encontrado');
    }
    
    // 8. Verificar dados de exemplo (se existirem)
    console.log('\n=== 8. VERIFICANDO DADOS DE EXEMPLO ===');
    
    if (allTables.includes('vendedores')) {
      try {
        const vendedoresData = await client.query(`
          SELECT nome, codigo_vendedor, ativo, created_at
          FROM vendedores 
          ORDER BY created_at DESC 
          LIMIT 3
        `);
        
        if (vendedoresData.rows.length > 0) {
          console.log('Últimos vendedores cadastrados:');
          vendedoresData.rows.forEach(v => {
            console.log(`  → ${v.nome} (${v.codigo_vendedor}) - ${v.ativo ? 'Ativo' : 'Inativo'}`);
          });
        }
      } catch (err) {
        console.log(`Erro ao consultar vendedores: ${err.message}`);
      }
    }
    
    // 9. Resumo final
    console.log('\n=== 9. RESUMO FINAL ===');
    const summary = {
      'Tabelas de vendedores': vendedorTables.filter(t => allTables.includes(t)).length,
      'Views de ranking': viewsResult.rows.length,
      'Colunas vendedor_id': columnsResult.rows.length,
      'Usuários vendedores': vendedoresResult.rows.length,
      'Role vendedor disponível': roles.includes('vendedor')
    };
    
    Object.entries(summary).forEach(([key, value]) => {
      const status = typeof value === 'boolean' ? (value ? '✅' : '❌') : value;
      console.log(`${key}: ${status}`);
    });
    
    // 10. Recomendações
    console.log('\n=== 10. RECOMENDAÇÕES ===');
    
    if (!roles.includes('vendedor')) {
      console.log('⚠️  Execute o script para adicionar a role vendedor');
    }
    
    if (vendedorTables.filter(t => allTables.includes(t)).length < vendedorTables.length) {
      console.log('⚠️  Execute o script executar_vendedores.sql para criar as tabelas');
    }
    
    if (vendedoresResult.rows.length === 0) {
      console.log('⚠️  Crie usuários vendedores para testar o sistema');
    }
    
    if (roles.includes('vendedor') && 
        vendedorTables.filter(t => allTables.includes(t)).length === vendedorTables.length &&
        vendedoresResult.rows.length > 0) {
      console.log('✅ Sistema de vendedores parece estar completo!');
    }
    
    console.log('\n🎉 Verificação concluída com sucesso!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    console.error('Detalhes:', error);
  } finally {
    await pool.end();
  }
}

// Executar verificação
verificarBanco();
