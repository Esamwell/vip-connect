/**
 * Script para gerar hashes bcrypt para as senhas dos usuários
 * Execute: node database/gerar_hashes.js
 */

const bcrypt = require('bcryptjs');

const usuarios = [
  { email: 'admin@vipasi.com', senha: 'AdminVIP123!', role: 'admin_mt' },
  { email: 'admin@autoshopping.com', senha: 'AdminShop123!', role: 'admin_shopping' },
  { email: 'lojista1@exemplo.com', senha: 'Lojista123!', role: 'lojista' },
  { email: 'lojista2@exemplo.com', senha: 'Lojista123!', role: 'lojista' },
  { email: 'parceiro.lavagem@exemplo.com', senha: 'Parceiro123!', role: 'parceiro' },
  { email: 'parceiro.estetica@exemplo.com', senha: 'Parceiro123!', role: 'parceiro' },
  { email: 'parceiro.oficina@exemplo.com', senha: 'Parceiro123!', role: 'parceiro' },
];

console.log('Gerando hashes bcrypt para os usuários...\n');

usuarios.forEach(async (usuario) => {
  const hash = await bcrypt.hash(usuario.senha, 10);
  console.log(`-- ${usuario.email} (${usuario.role})`);
  console.log(`-- Senha: ${usuario.senha}`);
  console.log(`-- Hash: ${hash}\n`);
});

// Gerar todos os hashes
(async () => {
  console.log('=== HAShes BCrypt Gerados ===\n');
  
  for (const usuario of usuarios) {
    const hash = await bcrypt.hash(usuario.senha, 10);
    console.log(`Email: ${usuario.email}`);
    console.log(`Senha: ${usuario.senha}`);
    console.log(`Hash:  ${hash}`);
    console.log('---\n');
  }
  
  console.log('\n=== SQL Atualizado ===\n');
  console.log('Copie os hashes acima e cole no arquivo criar_usuarios_teste.sql');
})();

