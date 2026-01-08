/**
 * Script para aplicar a tabela clientes_beneficios no banco de dados
 * Execute: node server/scripts/apply-clientes-beneficios.js
 */

const fs = require('fs');
const path = require('path');
const pg = require('pg');

const { Pool } = pg;

// Configuração do pool de conexões (usar as mesmas variáveis do .env)
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  database: process.env.DATABASE_NAME || 'vip_connect',
  user: process.env.DATABASE_USER || 'clientvipasi',
  password: process.env.DATABASE_PASSWORD || '1923731sS$',
});

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migração: clientes_beneficios...\n');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '../../database/apply_clientes_beneficios.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Executar o SQL
    await pool.query(sql);

    console.log('✅ Tabela clientes_beneficios criada com sucesso!');
    console.log('✅ Índices criados!');
    console.log('✅ Triggers criados!');
    console.log('✅ Comentários adicionados!\n');

    // Verificar se a tabela foi criada
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'clientes_beneficios'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verificação: Tabela clientes_beneficios existe no banco de dados!\n');
    } else {
      console.log('⚠️  Aviso: Tabela não encontrada após criação\n');
    }

    // Verificar estrutura
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'clientes_beneficios'
      ORDER BY ordinal_position
    `);

    console.log('📋 Estrutura da tabela:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n✅ Migração aplicada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message);
    if (error.code === '42P07') {
      console.log('⚠️  Tabela já existe. Nada a fazer.');
    } else {
      console.error('Detalhes:', error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

applyMigration();

