# 🚀 Backend API - Sistema Cliente VIP

Backend completo para o Sistema Cliente VIP do Auto Shopping Itapoan.

## 📋 Tecnologias

- **Node.js** com **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Axios** - Cliente HTTP para webhooks

## 🚀 Instalação

### 1. Instalar dependências

```bash
cd server
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=vip_connect
DATABASE_USER=clientvipasi
DATABASE_PASSWORD=1923731sS$
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
```

### 3. Executar em desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

### 4. Build para produção

```bash
npm run build
npm start
```

## 📚 Estrutura do Projeto

```
server/
├── src/
│   ├── config/          # Configurações (banco de dados)
│   ├── middleware/      # Middlewares (auth, etc)
│   ├── routes/          # Rotas da API
│   ├── services/        # Serviços (MT Leads, etc)
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilitários (JWT, QR Code, etc)
│   └── index.ts         # Arquivo principal
├── .env                 # Variáveis de ambiente (não commitado)
├── .env.example         # Template de variáveis
├── package.json
└── tsconfig.json
```

## 🔐 Autenticação

Todas as rotas (exceto `/api/ranking/lojas`) requerem autenticação via JWT.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@autoshopping.com",
  "password": "senha"
}
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@autoshopping.com",
    "nome": "Admin",
    "role": "admin_mt"
  }
}
```

### Usar token nas requisições

```http
GET /api/clientes-vip
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📡 Rotas da API

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário autenticado

### Clientes VIP
- `GET /api/clientes-vip` - Lista clientes VIP
- `GET /api/clientes-vip/:id` - Busca cliente por ID ou QR Code
- `POST /api/clientes-vip` - Cria cliente VIP
- `POST /api/clientes-vip/ativar-venda` - Ativa VIP após venda

### Benefícios
- `GET /api/beneficios/validar/:qr_code` - Busca info do cliente pelo QR
- `POST /api/beneficios/validar` - Valida benefício

### Chamados
- `GET /api/chamados` - Lista chamados
- `POST /api/chamados` - Cria chamado
- `PATCH /api/chamados/:id` - Atualiza chamado

### Ranking
- `GET /api/ranking/lojas` - Ranking público (sem auth)
- `GET /api/ranking/lojas/:loja_id/avaliacoes` - Avaliações da loja
- `POST /api/ranking/avaliacoes` - Cria avaliação

### Relatórios
- `GET /api/relatorios/clientes-vip-mes` - Clientes VIP por mês
- `GET /api/relatorios/uso-beneficios` - Uso de benefícios
- `GET /api/relatorios/chamados-loja` - Chamados por loja
- `GET /api/relatorios/clientes-vencimento-proximo` - Vencimentos próximos
- `GET /api/relatorios/clientes-renovados` - Clientes renovados

### Renovação
- `POST /api/renovacao/:cliente_vip_id` - Renova VIP
- `POST /api/renovacao/verificar-vencimentos` - Verifica vencimentos (cron)

## 🔒 Permissões por Role

### Admin MT
- Acesso total a todas as rotas

### Admin Shopping
- Visualiza relatórios completos
- Acesso a todas as lojas (somente leitura)

### Lojista
- Acessa apenas seus próprios clientes
- Vê apenas chamados da sua loja
- Pode criar clientes VIP para sua loja
- Pode renovar VIP de seus clientes

### Parceiro
- Valida benefícios via QR Code
- Vê apenas validações realizadas por ele

### Cliente VIP
- Acessa seu próprio cartão digital
- Pode abrir chamados
- Pode avaliar lojas

## 🔄 Integração MT Leads

O sistema dispara eventos via webhook para o MT Leads:

- `vip_ativado` - Quando cliente VIP é ativado
- `vencimento_proximo` - 30 dias antes do vencimento
- `vip_renovado` - Quando VIP é renovado
- `beneficio_validado` - Quando benefício é validado
- `chamado_aberto` - Quando chamado é aberto
- `chamado_resolvido` - Quando chamado é resolvido

Configure `MT_LEADS_WEBHOOK_URL` e `MT_LEADS_API_TOKEN` no `.env`.

## ⏰ Tarefas Agendadas (Cron)

Execute diariamente:

1. **Verificar vencimentos próximos:**
   ```bash
   POST /api/renovacao/verificar-vencimentos
   ```

2. **Atualizar status de vencidos:**
   ```sql
   SELECT atualizar_status_vencidos();
   ```

## 🧪 Testando a API

### Com curl:

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autoshopping.com","password":"senha"}'

# Listar clientes (com token)
curl http://localhost:3000/api/clientes-vip \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Com Postman/Insomnia:

1. Importe a collection (se disponível)
2. Configure a variável `base_url` = `http://localhost:3000`
3. Faça login e copie o token
4. Configure a variável `token` com o token recebido

## 🐛 Debug

Para ver logs detalhados, configure `LOG_LEVEL=debug` no `.env`.

## 📝 Próximos Passos

1. ✅ Backend criado
2. ⏭️ Conectar frontend ao backend
3. ⏭️ Implementar os dois botões de acesso ("Acessar" e "Meu Cartão")
4. ⏭️ Testar todas as funcionalidades

---

**Desenvolvido para Auto Shopping Itapoan** 🚗✨

