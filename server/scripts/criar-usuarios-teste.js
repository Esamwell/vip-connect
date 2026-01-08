/**
 * Script para criar usuários de teste no banco de dados
 * Execute: node server/scripts/criar-usuarios-teste.js
 */

require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const pg = require('pg');

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  database: process.env.DATABASE_NAME || 'vip_connect',
  user: process.env.DATABASE_USER || 'clientvipasi',
  password: process.env.DATABASE_PASSWORD || '1923731sS$',
});

const usuarios = [
  { 
    email: 'admin@vipasi.com', 
    senha: 'AdminVIP123!', 
    role: 'admin_mt', 
    nome: 'Admin VIP',
    whatsapp: '71999999999'
  },
  { 
    email: 'admin@autoshopping.com', 
    senha: 'AdminShop123!', 
    role: 'admin_shopping', 
    nome: 'Admin AutoShopping',
    whatsapp: '71888888888'
  },
  { 
    email: 'lojista1@exemplo.com', 
    senha: 'Lojista123!', 
    role: 'lojista', 
    nome: 'Lojista Premium Motors',
    whatsapp: '71777777777'
  },
  { 
    email: 'lojista2@exemplo.com', 
    senha: 'Lojista123!', 
    role: 'lojista', 
    nome: 'Lojista Auto Center',
    whatsapp: '71666666666'
  },
  { 
    email: 'parceiro.lavagem@exemplo.com', 
    senha: 'Parceiro123!', 
    role: 'parceiro', 
    nome: 'Parceiro Lavagem Premium',
    whatsapp: '71555555555'
  },
  { 
    email: 'parceiro.estetica@exemplo.com', 
    senha: 'Parceiro123!', 
    role: 'parceiro', 
    nome: 'Parceiro Estética Automotiva',
    whatsapp: '71444444444'
  },
  { 
    email: 'parceiro.oficina@exemplo.com', 
    senha: 'Parceiro123!', 
    role: 'parceiro', 
    nome: 'Parceiro Oficina Mecânica',
    whatsapp: '71333333333'
  },
];

async function criarUsuarios() {
  console.log('🚀 Criando usuários de teste...\n');

  try {
    for (const usuario of usuarios) {
      const hash = await bcrypt.hash(usuario.senha, 10);
      
      // Criar ou atualizar usuário
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           nome = EXCLUDED.nome,
           whatsapp = EXCLUDED.whatsapp,
           ativo = true
         RETURNING id, email, role, nome`,
        [usuario.email, hash, usuario.role, usuario.nome, usuario.whatsapp]
      );
      
      const user = result.rows[0];
      console.log(`✅ ${usuario.role.toUpperCase()}: ${usuario.email} (${usuario.nome})`);
      
      // Se for lojista, criar loja associada
      if (usuario.role === 'lojista') {
        const lojaNome = usuario.nome.includes('Premium') ? 'Premium Motors' : 'Auto Center';
        const lojaCnpj = usuario.nome.includes('Premium') ? '12.345.678/0001-90' : '98.765.432/0001-10';
        const lojaTel = usuario.nome.includes('Premium') ? '(71) 3333-3333' : '(71) 4444-4444';
        
        await pool.query(
          `INSERT INTO lojas (nome, cnpj, telefone, email, endereco, ativo, user_id)
           VALUES ($1, $2, $3, $4, $5, true, $6)
           ON CONFLICT DO NOTHING`,
          [
            lojaNome,
            lojaCnpj,
            lojaTel,
            `loja${user.id}@exemplo.com`,
            'Auto Shopping Itapoan',
            user.id
          ]
        );
        console.log(`   └─ Loja criada: ${lojaNome}`);
      }
      
      // Se for parceiro, criar parceiro associado
      if (usuario.role === 'parceiro') {
        let tipo = 'lavagem';
        let nomeParceiro = 'Lavagem Premium';
        let cnpj = '11.111.111/0001-11';
        let telefone = '(71) 5555-5555';
        
        if (usuario.email.includes('estetica')) {
          tipo = 'estetica';
          nomeParceiro = 'Estética Automotiva';
          cnpj = '22.222.222/0001-22';
          telefone = '(71) 6666-6666';
        } else if (usuario.email.includes('oficina')) {
          tipo = 'oficina';
          nomeParceiro = 'Oficina Mecânica';
          cnpj = '33.333.333/0001-33';
          telefone = '(71) 7777-7777';
        }
        
        await pool.query(
          `INSERT INTO parceiros (nome, cnpj, telefone, email, tipo, ativo, user_id)
           VALUES ($1, $2, $3, $4, $5, true, $6)
           ON CONFLICT DO NOTHING`,
          [
            nomeParceiro,
            cnpj,
            telefone,
            `${tipo}@exemplo.com`,
            tipo,
            user.id
          ]
        );
        console.log(`   └─ Parceiro criado: ${nomeParceiro} (${tipo})`);
      }
    }
    
    console.log('\n✅ Todos os usuários foram criados com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   - 1 Admin VIP (admin_mt)');
    console.log('   - 1 Admin AutoShopping (admin_shopping)');
    console.log('   - 2 Lojistas (com lojas associadas)');
    console.log('   - 3 Parceiros (com parceiros associados)');
    console.log('\n🔐 Credenciais:');
    console.log('   Admin VIP: admin@vipasi.com / AdminVIP123!');
    console.log('   Admin Shop: admin@autoshopping.com / AdminShop123!');
    console.log('   Lojistas: lojista1@exemplo.com / Lojista123!');
    console.log('   Parceiros: parceiro.lavagem@exemplo.com / Parceiro123!');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

criarUsuarios();

