# 🎯 VIP Connect - Sistema Cliente VIP

Sistema completo de fidelidade e gestão de clientes VIP para o Auto Shopping Itapoan. Plataforma moderna que gerencia benefícios exclusivos, validações, chamados prioritários, ranking de lojas e muito mais.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![Node](https://img.shields.io/badge/Node-20+-green)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Tecnologias](#-tecnologias)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Arquitetura](#-arquitetura)
- [API](#-api)
- [Banco de Dados](#-banco-de-dados)
- [Perfis de Usuário](#-perfis-de-usuário)
- [Documentação Adicional](#-documentação-adicional)
- [Contribuindo](#-contribuindo)

## 🎯 Visão Geral

O **VIP Connect** é uma plataforma completa desenvolvida para gerenciar o programa de fidelidade do Auto Shopping Itapoan. O sistema oferece:

- **Cartão Digital VIP** com QR Code único para cada cliente
- **Gestão de Benefícios** exclusivos e personalizados por loja
- **Validação de Benefícios** via QR Code pelos parceiros
- **Sistema de Chamados** prioritários para clientes VIP
- **Ranking de Lojas** baseado em avaliações dos clientes
- **Relatórios Completos** de uso, renovações e métricas
- **Integração com MT Leads** via webhooks
- **Dashboard Administrativo** completo para gestão

## 🛠 Tecnologias

### Frontend
- **React 18.3** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Componentes UI baseados em Radix UI
- **Framer Motion** - Animações e transições
- **React Router** - Roteamento
- **TanStack Query** - Gerenciamento de estado servidor
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **date-fns** - Manipulação de datas
- **qrcode.react** - Geração de QR Codes

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação via tokens
- **bcryptjs** - Hash de senhas
- **Axios** - Cliente HTTP para webhooks
- **Helmet** - Segurança HTTP
- **CORS** - Controle de acesso

### Banco de Dados
- **PostgreSQL 12+** - Sistema de gerenciamento de banco de dados
- **Extensões**: `uuid-ossp`, `pg_trgm`

## ✨ Funcionalidades

### 🎴 Cartão Digital VIP
- Cartão digital interativo com design premium
- QR Code único (digital e físico)
- Informações do cliente e histórico de veículos
- Status visual (Ativo, Expirando, Vencido, Renovado)
- Validade e datas de ativação

### 🎁 Gestão de Benefícios
- Benefícios oficiais do shopping
- Benefícios personalizados por loja
- Validação via QR Code pelos parceiros
- Histórico completo de validações
- Controle de uso e disponibilidade

### 📞 Sistema de Chamados
- Abertura de chamados prioritários por clientes VIP
- Atendimento por lojistas
- Histórico completo de interações
- Status de resolução
- Vinculação com veículos

### 🏆 Ranking de Lojas
- Sistema de avaliações (0-10)
- Ranking público das lojas
- Métricas de satisfação
- Histórico de avaliações

### 📊 Relatórios e Analytics
- Clientes VIP por mês e por loja
- Uso de benefícios por parceiro
- Chamados de pós-venda
- Clientes próximos do vencimento
- Clientes renovados/recompra
- Dashboard com métricas em tempo real

### 🔄 Renovação Automática
- Notificações 30 dias antes do vencimento
- Renovação simplificada pelos lojistas
- Rastreamento de recompra
- Histórico de renovações

### 🔗 Integração MT Leads
- Webhooks para eventos importantes
- Sincronização automática
- Eventos: ativação, vencimento, renovação, validação, chamados

## 📁 Estrutura do Projeto

```
vip-connect/
├── src/                          # Frontend React
│   ├── components/               # Componentes reutilizáveis
│   │   ├── ui/                  # Componentes UI (shadcn)
│   │   ├── modals/              # Modais do sistema
│   │   ├── cards/               # Cards de exibição
│   │   └── ...                  # Outros componentes
│   ├── pages/                   # Páginas da aplicação
│   │   ├── dashboard/           # Páginas do dashboard
│   │   ├── parceiro/            # Páginas do parceiro
│   │   └── ...                  # Outras páginas
│   ├── services/                # Serviços de API
│   ├── contexts/                # Contextos React
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilitários
│   └── styles/                  # Estilos globais
│
├── server/                       # Backend Node.js/Express
│   ├── src/
│   │   ├── config/              # Configurações
│   │   ├── middleware/          # Middlewares (auth, etc)
│   │   ├── routes/              # Rotas da API
│   │   ├── services/            # Serviços (MT Leads, etc)
│   │   ├── types/               # Tipos TypeScript
│   │   ├── utils/               # Utilitários (JWT, QR Code)
│   │   └── index.ts             # Entry point
│   └── dist/                    # Build compilado
│
├── database/                     # Scripts e documentação do banco
│   ├── schema.sql               # Schema completo do banco
│   ├── queries_uteis.sql        # Queries úteis
│   └── README.md                # Documentação do banco
│
├── public/                       # Arquivos estáticos
└── package.json                 # Dependências do frontend
```

## 🚀 Instalação

### Pré-requisitos

- **Node.js** 20+ ([instalar com nvm](https://github.com/nvm-sh/nvm))
- **PostgreSQL** 12+ instalado e rodando
- **npm** ou **yarn** ou **bun**

### 1. Clonar o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd vip-connect
```

### 2. Instalar Dependências

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd server
npm install
cd ..
```

### 3. Configurar Banco de Dados

Siga as instruções em [`database/README.md`](database/README.md) para:
- Criar o banco de dados `vip_connect`
- Executar o schema SQL
- Configurar extensões necessárias

## ⚙️ Configuração

### Variáveis de Ambiente

#### Frontend (`.env` na raiz)

```env
# API Backend
VITE_API_URL=http://localhost:3000/api

# Banco de Dados (opcional, usado apenas para referência)
VITE_DATABASE_HOST=localhost
VITE_DATABASE_PORT=5433
VITE_DATABASE_NAME=vip_connect
VITE_DATABASE_USER=clientvipasi
VITE_DATABASE_PASSWORD=sua_senha_aqui
```

#### Backend (`server/.env`)

```env
# Banco de Dados
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=vip_connect
DATABASE_USER=clientvipasi
DATABASE_PASSWORD=sua_senha_aqui

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_altere_em_producao

# CORS
CORS_ORIGIN=http://localhost:8080,http://localhost:5173

# Ambiente
NODE_ENV=development
PORT=3000

# MT Leads (opcional)
MT_LEADS_WEBHOOK_URL=https://seu-webhook-url.com
MT_LEADS_API_TOKEN=seu_token_aqui
```

⚠️ **IMPORTANTE**: 
- Nunca commite arquivos `.env` no Git
- Altere todas as senhas e secrets em produção
- Use variáveis de ambiente seguras em produção

## 🏃 Executando o Projeto

### Desenvolvimento

#### 1. Iniciar Backend

```bash
cd server
npm run dev
```

O backend estará disponível em `http://localhost:3000`

#### 2. Iniciar Frontend (em outro terminal)

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:8080`

### Produção

#### Build do Backend

```bash
cd server
npm run build
npm start
```

#### Build do Frontend

```bash
npm run build
npm run preview
```

O build será gerado na pasta `dist/`

## 🏗 Arquitetura

### Frontend

- **Arquitetura**: SPA (Single Page Application) com React Router
- **Estado**: React Context + TanStack Query para cache de servidor
- **Estilo**: Tailwind CSS com design system customizado
- **Componentes**: shadcn/ui + componentes customizados
- **Roteamento**: React Router com rotas protegidas

### Backend

- **Arquitetura**: RESTful API com Express.js
- **Autenticação**: JWT (JSON Web Tokens)
- **Autorização**: Middleware baseado em roles
- **Banco de Dados**: PostgreSQL com queries otimizadas
- **Segurança**: Helmet, CORS, validação de dados

### Fluxo de Dados

```
Frontend (React) 
    ↓ HTTP/REST
Backend (Express) 
    ↓ SQL
PostgreSQL Database
```

## 📡 API

### Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Dados do usuário autenticado

#### Clientes VIP
- `GET /api/clientes-vip` - Lista clientes VIP
- `GET /api/clientes-vip/:id` - Busca cliente por ID/QR Code
- `POST /api/clientes-vip` - Cria cliente VIP
- `POST /api/clientes-vip/ativar-venda` - Ativa VIP após venda

#### Benefícios
- `GET /api/beneficios/validar/:qr_code` - Info do cliente pelo QR
- `POST /api/beneficios/validar` - Valida benefício

#### Chamados
- `GET /api/chamados` - Lista chamados
- `POST /api/chamados` - Cria chamado
- `PATCH /api/chamados/:id` - Atualiza chamado

#### Ranking
- `GET /api/ranking/lojas` - Ranking público (sem auth)
- `GET /api/ranking/lojas/:id/avaliacoes` - Avaliações da loja
- `POST /api/ranking/avaliacoes` - Cria avaliação

#### Relatórios
- `GET /api/relatorios/clientes-vip-mes` - Clientes VIP por mês
- `GET /api/relatorios/uso-beneficios` - Uso de benefícios
- `GET /api/relatorios/chamados-loja` - Chamados por loja
- `GET /api/relatorios/clientes-vencimento-proximo` - Vencimentos próximos
- `GET /api/relatorios/clientes-renovados` - Clientes renovados

#### Renovação
- `POST /api/renovacao/:cliente_vip_id` - Renova VIP
- `POST /api/renovacao/verificar-vencimentos` - Verifica vencimentos (cron)

### Documentação Completa

Consulte [`server/README.md`](server/README.md) para documentação detalhada da API.

## 🗄 Banco de Dados

### Estrutura Principal

- **users** - Usuários do sistema (admins, lojistas, parceiros)
- **lojas** - Lojas do Auto Shopping
- **parceiros** - Parceiros que validam benefícios
- **clientes_vip** - Dados dos clientes VIP
- **beneficios_oficiais** - Benefícios pré-configurados
- **beneficios_loja** - Benefícios por loja
- **validacoes_beneficios** - Registro de validações
- **chamados** - Chamados de atendimento
- **avaliacoes** - Avaliações dos clientes
- **vendas** - Registro de vendas
- **renovacoes** - Registro de renovações
- **notificacoes** - Notificações enviadas
- **eventos_webhook** - Eventos para integração

### Documentação Completa

Consulte [`database/README.md`](database/README.md) para:
- Schema completo
- Views de relatórios
- Funções e triggers
- Queries úteis

## 👥 Perfis de Usuário

### 🔴 Admin MT
- Acesso total ao sistema
- Gerencia todos os usuários, lojas e parceiros
- Acesso a todos os relatórios e configurações

### 🟠 Admin Shopping
- Visualiza relatórios completos
- Acesso a todas as lojas (somente leitura)
- Gerencia benefícios oficiais

### 🟡 Lojista
- Acessa apenas seus próprios clientes
- Pode adicionar benefícios para sua loja
- Vê apenas chamados da sua loja
- Pode renovar VIP de seus clientes

### 🟢 Parceiro
- Valida benefícios via QR Code
- Vê apenas validações realizadas por ele
- Dashboard simplificado

### 🔵 Cliente VIP
- Acessa seu cartão digital
- Pode abrir chamados
- Pode avaliar lojas
- Visualiza seus benefícios

## 📚 Documentação Adicional

### 🚀 Deploy e Instalação
- [`INSTALL.md`](INSTALL.md) - ⚡ **Instalação rápida automatizada**
- [`COOLIFY_DEPLOY.md`](COOLIFY_DEPLOY.md) - 🚀 Guia completo de instalação no Coolify com deploy automático via GitHub
- [`COOLIFY_QUICK_START.md`](COOLIFY_QUICK_START.md) - ⚡ Guia rápido para deploy no Coolify
- [`scripts/README_INSTALL.md`](scripts/README_INSTALL.md) - 📋 Documentação do script de instalação automatizada
- [`CLOUDFLARE_DNS_SETUP.md`](CLOUDFLARE_DNS_SETUP.md) - 🌐 **Configuração de DNS no Cloudflare para subdomínios**
- [`CLOUDFLARE_QUICK_SETUP.md`](CLOUDFLARE_QUICK_SETUP.md) - ⚡ Configuração rápida DNS Cloudflare

### 📖 Desenvolvimento
- [`database/README.md`](database/README.md) - Documentação completa do banco de dados
- [`server/README.md`](server/README.md) - Documentação da API backend
- [`BACKEND_SETUP.md`](BACKEND_SETUP.md) - Guia de setup do backend
- [`README_ENV.md`](README_ENV.md) - Guia de variáveis de ambiente
- [`FRONTEND_BACKEND_CONECTADO.md`](FRONTEND_BACKEND_CONECTADO.md) - Guia de integração

## 🔧 Scripts Disponíveis

### Frontend
```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run build:dev    # Build em modo desenvolvimento
npm run preview      # Preview do build
npm run lint         # Executa ESLint
```

### Backend
```bash
cd server
npm run dev          # Inicia servidor com hot reload
npm run build        # Compila TypeScript
npm start            # Inicia servidor em produção
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript
```

## 🧪 Testando

### Health Check do Backend

```bash
curl http://localhost:3000/health
```

### Teste de Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autoshopping.com","password":"senha"}'
```

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Hash de senhas com bcryptjs
- ✅ Validação de dados com Zod
- ✅ Helmet para segurança HTTP
- ✅ CORS configurado
- ✅ Proteção contra SQL Injection (queries parametrizadas)
- ✅ Rotas protegidas por middleware de autenticação

⚠️ **Lembre-se**: Altere todas as senhas padrão e secrets antes de usar em produção!

## 📝 Tarefas Agendadas (Cron)

Execute diariamente:

1. **Verificar vencimentos próximos:**
   ```bash
   POST /api/renovacao/verificar-vencimentos
   ```

2. **Atualizar status de vencidos:**
   ```sql
   SELECT atualizar_status_vencidos();
   ```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 👨‍💻 Desenvolvido para

**Auto Shopping Itapoan** 🚗✨

---

**Versão**: 1.0.0  
**Última atualização**: 2025

Para dúvidas ou suporte, consulte a documentação adicional ou entre em contato com a equipe de desenvolvimento.
