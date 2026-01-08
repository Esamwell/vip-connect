# 👥 Criar Usuários de Teste

## 📋 Usuários que serão criados:

### 1. Admin VIP (Admin MT)
- **Email**: `admin@vipasi.com`
- **Senha**: `AdminVIP123!`
- **Role**: `admin_mt`
- **Permissões**: Controla tudo

### 2. Admin AutoShopping
- **Email**: `admin@autoshopping.com`
- **Senha**: `AdminShop123!`
- **Role**: `admin_shopping`
- **Permissões**: Visualiza relatórios completos

### 3. Lojistas (2 usuários)
- **Email**: `lojista1@exemplo.com` / `lojista2@exemplo.com`
- **Senha**: `Lojista123!`
- **Role**: `lojista`
- **Permissões**: Acessam apenas seus clientes
- **Lojas associadas**: Premium Motors e Auto Center

### 4. Parceiros (3 usuários)
- **Email**: 
  - `parceiro.lavagem@exemplo.com`
  - `parceiro.estetica@exemplo.com`
  - `parceiro.oficina@exemplo.com`
- **Senha**: `Parceiro123!`
- **Role**: `parceiro`
- **Permissões**: Validam benefícios

## 🚀 Como Criar os Usuários:

### Opção 1: Usar o Script SQL Direto (Mais Rápido)

1. **Abra o Beekeeper Studio**
2. **Conecte ao banco `vip_connect`**
3. **Abra o arquivo**: `database/criar_usuarios_completos.sql`
4. **Execute o script completo**

⚠️ **IMPORTANTE**: Os hashes bcrypt no script são exemplos. Para senhas reais, use a Opção 2.

### Opção 2: Gerar Hashes Bcrypt Corretos (Recomendado)

1. **Instale bcryptjs no servidor** (se ainda não tiver):
   ```bash
   cd server
   npm install bcryptjs
   ```

2. **Execute o script para gerar hashes**:
   ```bash
   node database/gerar_hashes.js
   ```

3. **Copie os hashes gerados**

4. **Atualize o arquivo `criar_usuarios_completos.sql`** com os hashes corretos

5. **Execute o script no Beekeeper**

### Opção 3: Criar Usuários Manualmente via Backend

Você pode criar um endpoint temporário no backend para criar usuários, ou usar o script Node.js abaixo.

## 📝 Script Node.js para Criar Usuários

Crie um arquivo `server/scripts/criar-usuarios.js`:

```javascript
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database').default;

const usuarios = [
  { email: 'admin@vipasi.com', senha: 'AdminVIP123!', role: 'admin_mt', nome: 'Admin VIP' },
  { email: 'admin@autoshopping.com', senha: 'AdminShop123!', role: 'admin_shopping', nome: 'Admin AutoShopping' },
  { email: 'lojista1@exemplo.com', senha: 'Lojista123!', role: 'lojista', nome: 'Lojista Premium Motors' },
  { email: 'lojista2@exemplo.com', senha: 'Lojista123!', role: 'lojista', nome: 'Lojista Auto Center' },
  { email: 'parceiro.lavagem@exemplo.com', senha: 'Parceiro123!', role: 'parceiro', nome: 'Parceiro Lavagem' },
  { email: 'parceiro.estetica@exemplo.com', senha: 'Parceiro123!', role: 'parceiro', nome: 'Parceiro Estética' },
  { email: 'parceiro.oficina@exemplo.com', senha: 'Parceiro123!', role: 'parceiro', nome: 'Parceiro Oficina' },
];

(async () => {
  for (const usuario of usuarios) {
    const hash = await bcrypt.hash(usuario.senha, 10);
    
    await pool.query(
      `INSERT INTO users (email, password_hash, role, nome, ativo)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         nome = EXCLUDED.nome,
         ativo = true`,
      [usuario.email, hash, usuario.role, usuario.nome]
    );
    
    console.log(`✅ Usuário criado: ${usuario.email}`);
  }
  
  console.log('\n✅ Todos os usuários foram criados!');
  process.exit(0);
})();
```

Execute:
```bash
cd server
node scripts/criar-usuarios.js
```

## ✅ Verificar Usuários Criados

Execute no Beekeeper:

```sql
SELECT 
  email,
  role,
  nome,
  ativo
FROM users
WHERE email IN (
  'admin@vipasi.com',
  'admin@autoshopping.com',
  'lojista1@exemplo.com',
  'lojista2@exemplo.com',
  'parceiro.lavagem@exemplo.com',
  'parceiro.estetica@exemplo.com',
  'parceiro.oficina@exemplo.com'
)
ORDER BY role, email;
```

## 🔐 Credenciais de Teste

| Email | Senha | Role | Descrição |
|-------|-------|------|-----------|
| `admin@vipasi.com` | `AdminVIP123!` | admin_mt | Controla tudo |
| `admin@autoshopping.com` | `AdminShop123!` | admin_shopping | Visualiza relatórios |
| `lojista1@exemplo.com` | `Lojista123!` | lojista | Premium Motors |
| `lojista2@exemplo.com` | `Lojista123!` | lojista | Auto Center |
| `parceiro.lavagem@exemplo.com` | `Parceiro123!` | parceiro | Valida benefícios |
| `parceiro.estetica@exemplo.com` | `Parceiro123!` | parceiro | Valida benefícios |
| `parceiro.oficina@exemplo.com` | `Parceiro123!` | parceiro | Valida benefícios |

## 🧪 Testar Login

Após criar os usuários, teste o login no frontend:

1. Acesse `http://localhost:8080/login`
2. Use uma das credenciais acima
3. Verifique se o login funciona

---

**Pronto!** Agora você tem usuários para testar todas as funcionalidades! 🎉

