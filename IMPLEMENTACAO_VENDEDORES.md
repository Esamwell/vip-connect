# Implementação do Sistema de Vendedores

## Overview

Foi implementado um sistema completo de gestão de vendedores para o VIP Connect, incluindo:

- Cadastro e gestão de vendedores
- Sistema de vouchers/benefícios para vendedores
- Ranking de vendedores (vendas e avaliações)
- Sistema de premiação por ranking
- Dashboard exclusivo para vendedores

## Estrutura do Banco de Dados

### Novas Tabelas Criadas

1. **vendedores** - Informações dos vendedores
2. **vouchers_vendedor** - Vouchers disponíveis para resgate
3. **resgates_vouchers_vendedor** - Registro de resgates
4. **premiacoes_ranking** - Configuração de premiações
5. **premiacoes_recebidas** - Premiações recebidas pelos vendedores

### Alterações em Tabelas Existentes

- **users** - Adicionado role 'vendedor'
- **vendas** - Adicionado campo vendedor_id
- **avaliacoes** - Adicionado campo vendedor_id

## Backend

### Novas Rotas API

#### Gestão de Vendedores (`/api/vendedores`)
- `POST /` - Criar novo vendedor
- `GET /` - Listar vendedores
- `GET /:id` - Obter vendedor específico
- `PUT /:id` - Atualizar vendedor
- `PATCH /:id/senha` - Alterar senha
- `DELETE /:id` - Desativar vendedor
- `GET /loja/:lojaId` - Listar vendedores de uma loja

#### Vouchers para Vendedores (`/api/vouchers-vendedor`)
- `POST /` - Criar voucher
- `GET /` - Listar vouchers disponíveis
- `GET /:id` - Obter voucher específico
- `POST /:id/resgatar` - Resgatar voucher
- `PUT /:id` - Atualizar voucher
- `DELETE /:id` - Desativar voucher
- `GET /vendedor/:vendedorId` - Vouchers de um vendedor
- `GET /resgates/vendedor/:vendedorId` - Resgates de um vendedor

#### Ranking de Vendedores (`/api/ranking-vendedores`)
- `GET /vendas` - Ranking por vendas
- `GET /avaliacoes` - Ranking por avaliações
- `GET /minha-posicao` - Posição do vendedor logado
- `GET /historico/:vendedorId` - Histórico de rankings
- `GET /metas/:vendedorId` - Metas e desempenho

#### Premiações (`/api/premiacoes`)
- `POST /` - Criar premiação
- `GET /` - Listar premiações
- `GET /:id` - Obter premiação específica
- `PUT /:id` - Atualizar premiação
- `DELETE /:id` - Desativar premiação
- `GET /calcular/:periodo` - Calcular premiações do período
- `POST /conceder` - Conceder premiações calculadas
- `GET /vendedor/:vendedorId` - Premiações de um vendedor
- `PATCH /recebidas/:id/status` - Atualizar status de premiação

### Views do Banco de Dados

- **ranking_vendedores** - Ranking por vendas
- **ranking_avaliacao_vendedores** - Ranking por avaliações

## Frontend

### Novos Componentes

- **VendedorDashboardLayout** - Layout do dashboard do vendedor
- **VendedorDashboard** - Dashboard principal do vendedor
- **VendedorVouchers** - Gestão de vouchers do vendedor

### Novas Rotas

- `/vendedor/dashboard` - Dashboard do vendedor
- `/vendedor/dashboard/vouchers` - Vouchers disponíveis

## Funcionalidades Implementadas

### 1. Gestão de Vendedores
- Cadastro de vendedores com login e senha
- Associação com lojas
- Código único de vendedor
- Metas de vendas e faturamento
- Comissão padrão

### 2. Sistema de Vouchers
- Criação de vouchers pelos admins
- Resgate de vouchers pelos vendedores
- Controle de validade e quantidade
- Histórico de resgates

### 3. Ranking de Vendedores
- Ranking por número de vendas
- Ranking por valor de vendas
- Ranking por avaliações dos clientes
- Filtros por período (hoje, semana, mês, etc.)
- Ranking por loja e geral

### 4. Sistema de Premiação
- Configuração de premiações por posição no ranking
- Tipos de premiação (mensal, trimestral, anual)
- Cálculo automático de premiações
- Concessão e gestão de premiações

### 5. Dashboard do Vendedor
- Estatísticas de desempenho
- Progresso das metas
- Posição nos rankings
- Vouchers disponíveis
- Ações rápidas

## Permissões e Acesso

### Roles
- **admin_mt** - Acesso total a todas as funcionalidades
- **admin_shopping** - Gestão de vendedores, vouchers, rankings e premiações
- **lojista** - Gestão de vendedores da própria loja
- **vendedor** - Acesso ao dashboard pessoal e resgate de vouchers

### Controle de Acesso
- Vendedores só visualizam/editam seus próprios dados
- Lojistas só gerenciam vendedores de sua loja
- Admins têm acesso total conforme suas permissões

## Instalação e Configuração

### 1. Executar Script do Banco de Dados
```sql
-- Executar o arquivo create_vendedores_table.sql
\i database/create_vendedores_table.sql
```

### 2. Reiniciar o Servidor Backend
```bash
cd server
npm install
npm run dev
```

### 3. Iniciar o Frontend
```bash
cd ..
npm install
npm run dev
```

## Fluxo de Uso

### 1. Cadastro de Vendedor
1. Admin ou lojista acessa o sistema
2. Cria novo usuário com role 'vendedor'
3. Associa o vendedor a uma loja
4. Define metas e comissão

### 2. Gestão de Vouchers
1. Admin cria vouchers para vendedores
2. Define tipo, valor, validade e quantidade
3. Vendedores visualizam vouchers disponíveis
4. Vendedores resgatam vouchers quando desejado

### 3. Acompanhamento de Desempenho
1. Vendedores acompanham vendas e avaliações
2. Visualizam posição nos rankings
3. Acompanham progresso das metas
4. Recebem premiações conforme ranking

### 4. Sistema de Premiação
1. Admin configura premiações por ranking
2. Sistema calcula premiações do período
3. Admin concede premiações calculadas
4. Vendedores acompanham premiações recebidas

## Considerações Técnicas

### Segurança
- Senhas criptografadas com bcrypt
- Validação de permissões em todas as rotas
- Controle de acesso por role e loja

### Performance
- Views otimizadas para rankings
- Índices apropriados nas tabelas
- Cache de estatísticas no frontend

### Escalabilidade
- Arquitetura modular
- Separação clara de responsabilidades
- APIs RESTful bem definidas

## Próximos Passos

1. Implementar páginas adicionais do dashboard vendedor
2. Adicionar notificações para vendedores
3. Implementar relatórios específicos para vendedores
4. Adicionar integração com sistemas de pagamento
5. Implementar gamificação avançada

## Suporte e Manutenção

- Monitorar performance das queries de ranking
- Manter índices atualizados
- Backup regular das novas tabelas
- Documentação atualizada dos endpoints
