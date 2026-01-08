# 📝 Configuração de Variáveis de Ambiente

## ✅ Arquivo .env Criado!

O arquivo `.env` foi criado com as configurações do banco de dados.

## ⚠️ IMPORTANTE: Variáveis no Vite

No **Vite** (que é o que você está usando), as variáveis de ambiente **devem começar com `VITE_`** para serem acessíveis no frontend.

### Exemplo:
```env
# ✅ Correto (acessível no frontend)
VITE_DATABASE_HOST=localhost
VITE_API_URL=http://localhost:3000/api

# ❌ Errado (não será acessível)
DATABASE_HOST=localhost
API_URL=http://localhost:3000/api
```

## 📋 Variáveis Configuradas

### Banco de Dados
- `VITE_DATABASE_HOST` - Host do PostgreSQL (localhost)
- `VITE_DATABASE_PORT` - Porta do PostgreSQL (5433)
- `VITE_DATABASE_NAME` - Nome do banco (vip_connect)
- `VITE_DATABASE_USER` - Usuário do banco (clientvipasi)
- `VITE_DATABASE_PASSWORD` - Senha do banco
- `VITE_DATABASE_URL` - String de conexão completa

### Aplicação
- `VITE_NODE_ENV` - Ambiente (development/production)
- `VITE_PORT` - Porta do servidor frontend (8080)
- `VITE_API_URL` - URL da API backend (quando criar)

## 🔒 Segurança

⚠️ **NUNCA commite o arquivo `.env` no Git!**

O arquivo `.env` já está no `.gitignore` e não será commitado.

## 🚀 Como Usar no Código

### No Frontend (React/Vite):

```typescript
// Acessar variáveis de ambiente
const dbHost = import.meta.env.VITE_DATABASE_HOST;
const apiUrl = import.meta.env.VITE_API_URL;

// Ou usar o arquivo de configuração
import { databaseConfig } from '@/config/database';
console.log(databaseConfig.host);
```

### Exemplo Prático:

```typescript
// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const fetchClientes = async () => {
  const response = await fetch(`${API_URL}/clientes`);
  return response.json();
};
```

## 🔧 Quando Criar o Backend

Quando você criar o backend (Node.js/Express), você pode:

1. **Criar um arquivo `.env` separado no diretório do backend**
2. **Usar variáveis sem o prefixo `VITE_`** (pois o backend não precisa do prefixo)
3. **Usar bibliotecas como `dotenv`** para carregar as variáveis

### Exemplo Backend (.env):
```env
# Sem prefixo VITE_ no backend
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=vip_connect
DATABASE_USER=clientvipasi
DATABASE_PASSWORD=1923731sS$
```

## 📚 Arquivos Criados

1. **`.env`** - Suas configurações reais (não commitado)
2. **`.env.example`** - Template de exemplo (pode ser commitado)
3. **`src/config/database.ts`** - Configuração centralizada
4. **`src/lib/db.ts`** - Utilitários de conexão (para quando criar backend)

## ✅ Próximos Passos

1. ✅ Arquivo `.env` criado
2. ✅ Configurações do banco definidas
3. ⏭️ Criar backend/API para conectar ao banco
4. ⏭️ Usar as variáveis de ambiente no código

---

**Pronto!** Suas configurações estão prontas para uso! 🎉

