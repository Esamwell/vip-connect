# 👥 Como Criar Usuários de Teste

## 🚀 Método Mais Rápido: Script Node.js

### 1. Execute o script:

```bash
cd server
node scripts/criar-usuarios-teste.js
```

Este script vai:
- ✅ Criar todos os 7 usuários
- ✅ Gerar hashes bcrypt automaticamente
- ✅ Criar lojas associadas aos lojistas
- ✅ Criar parceiros associados aos parceiros
- ✅ Mostrar resumo completo

### 2. Pronto! Usuários criados

## 📋 Usuários Criados:

### Admin VIP (Admin MT)
- **Email**: `admin@vipasi.com`
- **Senha**: `AdminVIP123!`
- **Permissões**: Controla tudo

### Admin AutoShopping
- **Email**: `admin@autoshopping.com`
- **Senha**: `AdminShop123!`
- **Permissões**: Visualiza relatórios completos

### Lojistas (2)
- **Email**: `lojista1@exemplo.com` / `lojista2@exemplo.com`
- **Senha**: `Lojista123!`
- **Lojas**: Premium Motors e Auto Center (criadas automaticamente)

### Parceiros (3)
- **Email**: 
  - `parceiro.lavagem@exemplo.com`
  - `parceiro.estetica@exemplo.com`
  - `parceiro.oficina@exemplo.com`
- **Senha**: `Parceiro123!`
- **Parceiros**: Criados automaticamente (Lavagem, Estética, Oficina)

## 🧪 Testar Login

1. Inicie o backend:
   ```bash
   cd server
   npm run dev
   ```

2. Inicie o frontend:
   ```bash
   npm run dev
   ```

3. Acesse: `http://localhost:8080/login`

4. Use uma das credenciais acima

## ✅ Verificar no Beekeeper

Execute esta query:

```sql
SELECT 
  u.email,
  u.role,
  u.nome,
  u.ativo,
  l.nome as loja,
  p.nome as parceiro,
  p.tipo as tipo_parceiro
FROM users u
LEFT JOIN lojas l ON u.id = l.user_id
LEFT JOIN parceiros p ON u.id = p.user_id
WHERE u.email IN (
  'admin@vipasi.com',
  'admin@autoshopping.com',
  'lojista1@exemplo.com',
  'lojista2@exemplo.com',
  'parceiro.lavagem@exemplo.com',
  'parceiro.estetica@exemplo.com',
  'parceiro.oficina@exemplo.com'
)
ORDER BY u.role, u.email;
```

---

**Pronto para testar!** 🎉

