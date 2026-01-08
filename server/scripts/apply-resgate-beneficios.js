const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vip_connect'
});

async function applyMigration() {
  try {
    const sqlPath = path.join(__dirname, '../../database/add_resgate_beneficios.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('✅ Migração de resgate de benefícios aplicada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();

