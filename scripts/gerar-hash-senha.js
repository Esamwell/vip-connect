// Script para gerar hash bcrypt de senha
// Uso: node scripts/gerar-hash-senha.js

const bcrypt = require('bcryptjs');

const senha = process.argv[2] || 'AdminVIP123!';

bcrypt.hash(senha, 10)
  .then(hash => {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  Hash Bcrypt Gerado');
    console.log('════════════════════════════════════════════════════════════\n');
    console.log('Senha:', senha);
    console.log('Hash:', hash);
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  SQL para Inserir Usuário');
    console.log('════════════════════════════════════════════════════════════\n');
    console.log(`INSERT INTO users (email, password_hash, role, nome, ativo, created_at, updated_at)`);
    console.log(`VALUES (`);
    console.log(`    'admin@vipasi.com',`);
    console.log(`    '${hash}',`);
    console.log(`    'admin_mt',`);
    console.log(`    'Admin MT - VIP ASI',`);
    console.log(`    true,`);
    console.log(`    CURRENT_TIMESTAMP,`);
    console.log(`    CURRENT_TIMESTAMP`);
    console.log(`)`);
    console.log(`ON CONFLICT (email) DO UPDATE`);
    console.log(`SET `);
    console.log(`    password_hash = EXCLUDED.password_hash,`);
    console.log(`    role = EXCLUDED.role,`);
    console.log(`    nome = EXCLUDED.nome,`);
    console.log(`    ativo = true,`);
    console.log(`    updated_at = CURRENT_TIMESTAMP;`);
    console.log('\n════════════════════════════════════════════════════════════\n');
  })
  .catch(err => {
    console.error('Erro ao gerar hash:', err);
    process.exit(1);
  });

