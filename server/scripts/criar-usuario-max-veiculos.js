/**
 * Script para criar usuário para loja Max Veículos
 * Execute: node server/scripts/criar-usuario-max-veiculos.js
 */

require('dotenv').config({ path: '../.env' });
const pg = require('pg');

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  database: process.env.DATABASE_NAME || 'vip_connect',
  user: process.env.DATABASE_USER || 'clientvipasi',
  password: process.env.DATABASE_PASSWORD || '1923731sS$',
});

async function criarUsuarioMaxVeiculos() {
  console.log('🚀 Criando usuário para loja Max Veículos...\n');

  try {
    // Criar usuário lojista
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) 
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         nome = EXCLUDED.nome,
         whatsapp = EXCLUDED.whatsapp,
         ativo = true
       RETURNING id, email, nome`,
      [
        'lojista.maxveiculos@exemplo.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // Senha: Lojista123!
        'lojista',
        'Lojista Max Veículos',
        '71999999999'
      ]
    );

    const user = userResult.rows[0];
    console.log(`✅ Usuário criado: ${user.email} (${user.nome})`);
    console.log(`   ID: ${user.id}\n`);

    // Associar usuário à loja Max Veículos
    const updateResult = await pool.query(
      `UPDATE lojas
       SET user_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE (LOWER(nome) LIKE '%max veículos%' OR LOWER(nome) LIKE '%max veiculos%')
         AND (user_id IS NULL OR user_id != $1)
       RETURNING id, nome, user_id`,
      [user.id]
    );

    if (updateResult.rows.length > 0) {
      console.log(`✅ Loja associada ao usuário:`);
      updateResult.rows.forEach(loja => {
        console.log(`   - ${loja.nome} (ID: ${loja.id})`);
      });
    } else {
      console.log(`⚠️  Nenhuma loja "Max Veículos" encontrada ou já está associada a outro usuário.`);
      
      // Verificar lojas existentes
      const lojasCheck = await pool.query(
        `SELECT id, nome, user_id FROM lojas 
         WHERE LOWER(nome) LIKE '%max veículos%' OR LOWER(nome) LIKE '%max veiculos%'`
      );
      
      if (lojasCheck.rows.length > 0) {
        console.log(`\n📋 Lojas encontradas:`);
        lojasCheck.rows.forEach(loja => {
          console.log(`   - ${loja.nome} (ID: ${loja.id}, User ID: ${loja.user_id || 'NULL'})`);
        });
      } else {
        console.log(`\n❌ Nenhuma loja com nome "Max Veículos" encontrada no banco.`);
      }
    }

    // Verificar resultado final
    console.log(`\n📊 Verificação final:`);
    const verifyResult = await pool.query(
      `SELECT 
        l.id as loja_id,
        l.nome as loja_nome,
        l.user_id,
        u.id as user_id,
        u.email,
        u.nome as user_nome,
        u.role
      FROM lojas l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE LOWER(l.nome) LIKE '%max veículos%' OR LOWER(l.nome) LIKE '%max veiculos%'`
    );

    if (verifyResult.rows.length > 0) {
      verifyResult.rows.forEach(row => {
        console.log(`\n   Loja: ${row.loja_nome}`);
        console.log(`   User ID: ${row.user_id || 'NULL'}`);
        if (row.user_id) {
          console.log(`   Email: ${row.email}`);
          console.log(`   Nome: ${row.user_nome}`);
          console.log(`   Role: ${row.role}`);
        } else {
          console.log(`   ⚠️  Loja não associada a nenhum usuário`);
        }
      });
    }

    console.log(`\n✅ Processo concluído!\n`);
    console.log(`📧 Credenciais de acesso:`);
    console.log(`   Email: lojista.maxveiculos@exemplo.com`);
    console.log(`   Senha: Lojista123!\n`);

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar
criarUsuarioMaxVeiculos()
  .then(() => {
    console.log('✨ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro ao executar script:', error);
    process.exit(1);
  });

