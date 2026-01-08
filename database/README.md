# Schema do Banco de Dados - Sistema Cliente VIP

Este diretório contém o schema completo do banco de dados PostgreSQL para o sistema Cliente VIP do Auto Shopping Itapoan.

## 📁 Arquivos

- **`schema.sql`** - Schema completo do banco de dados com todas as tabelas, views, funções e triggers
- **`queries_uteis.sql`** - Queries úteis para consultas comuns do sistema
- **`README.md`** - Este arquivo com documentação

## 🚀 Instalação

### Pré-requisitos

- PostgreSQL 12 ou superior
- Extensões: `uuid-ossp`, `pg_trgm`

### Passos

1. Conecte-se ao PostgreSQL:
```bash
psql -U postgres -d postgres
```

2. Crie o banco de dados:
```sql
CREATE DATABASE vip_connect;
\c vip_connect
```

3. Execute o schema:
```bash
psql -U postgres -d vip_connect -f database/schema.sql
```

## 📊 Estrutura do Banco

### Tabelas Principais

#### 1. **Usuários e Autenticação**
- `users` - Usuários do sistema com diferentes perfis
- Tipos de perfil: `admin_mt`, `admin_shopping`, `lojista`, `parceiro`, `cliente_vip`

#### 2. **Lojas e Parceiros**
- `lojas` - Lojas do Auto Shopping
- `parceiros` - Parceiros que validam benefícios

#### 3. **Clientes VIP**
- `clientes_vip` - Dados dos clientes VIP
- Status: `ativo`, `vencido`, `renovado`, `cancelado`
- QR Codes: digital (dinâmico) e físico (fixo)

#### 4. **Benefícios**
- `beneficios_oficiais` - Benefícios pré-configurados do shopping
- `beneficios_loja` - Benefícios adicionados por cada loja

#### 5. **Validações**
- `validacoes_beneficios` - Registro de validações pelos parceiros

#### 6. **Atendimento**
- `chamados` - Chamados de atendimento prioritário
- `chamados_historico` - Histórico de alterações nos chamados

#### 7. **Avaliações e Ranking**
- `avaliacoes` - Avaliações dos clientes sobre as lojas
- `ranking_lojas` (view) - Ranking público das lojas

#### 8. **Vendas e Renovações**
- `vendas` - Registro de vendas que geram VIP
- `renovacoes` - Registro de renovações do VIP

#### 9. **Notificações e Integrações**
- `notificacoes` - Notificações enviadas aos clientes
- `eventos_webhook` - Eventos para integração com MT Leads

## 🔑 Funcionalidades Principais

### Ativação Automática do VIP

Quando uma venda é registrada, o sistema:
1. Cria automaticamente o cliente VIP
2. Gera validade de 12 meses
3. Gera QR codes (digital e físico)
4. Dispara evento para MT Leads

### Validação de Benefícios

Parceiros podem validar benefícios escaneando o QR Code do cliente. O sistema registra:
- Data/hora da validação
- Parceiro que validou
- Cliente e benefício utilizado

### Ranking de Lojas

O sistema calcula automaticamente:
- Nota média por loja (0-10)
- Quantidade de avaliações
- Posição no ranking

### Renovação do VIP

30 dias antes do vencimento:
- Cliente recebe notificação
- Lojista pode renovar o VIP
- Sistema marca como potencial recompra

## 📈 Views de Relatórios

O schema inclui várias views para relatórios:

- `relatorio_clientes_vip_mes` - Clientes VIP por mês e por loja
- `relatorio_uso_beneficios` - Uso de benefícios por parceiro
- `relatorio_chamados_loja` - Chamados de pós-venda por loja
- `relatorio_clientes_vencimento_proximo` - Clientes próximos do vencimento
- `relatorio_clientes_renovados` - Clientes renovados/recompra
- `ranking_lojas` - Ranking público das lojas

## 🔧 Funções e Triggers

### Funções Principais

- `generate_qr_code()` - Gera QR code único
- `ativar_cliente_vip()` - Ativa cliente VIP automaticamente após venda
- `verificar_vencimentos_proximos()` - Verifica e notifica vencimentos
- `atualizar_status_vencidos()` - Atualiza status de clientes vencidos

### Triggers

- `update_updated_at_column()` - Atualiza `updated_at` automaticamente em várias tabelas

## 🔐 Segurança

### Usuários Padrão

O schema cria dois usuários padrão (senhas devem ser alteradas):
- `admin@autoshopping.com` - Admin MT
- `admin.shopping@autoshopping.com` - Admin Shopping

**⚠️ IMPORTANTE**: Altere as senhas antes de usar em produção!

## 📝 Permissões por Perfil

### Admin MT
- Acesso total ao sistema
- Pode gerenciar todos os usuários, lojas e parceiros

### Admin Shopping
- Visualiza relatórios completos
- Acesso a todas as lojas (somente leitura)

### Lojista
- Acessa apenas seus próprios clientes
- Pode adicionar benefícios para sua loja
- Vê apenas chamados da sua loja

### Parceiro
- Valida benefícios via QR Code
- Vê apenas validações realizadas por ele

### Cliente VIP
- Acessa seu cartão digital
- Pode abrir chamados
- Pode avaliar a loja

## 🔄 Manutenção

### Tarefas Diárias (Cron)

Execute diariamente:

```sql
-- Verificar vencimentos próximos
SELECT verificar_vencimentos_proximos();

-- Atualizar status de vencidos
SELECT atualizar_status_vencidos();
```

### Backup

Recomenda-se backup diário do banco de dados:

```bash
pg_dump -U postgres vip_connect > backup_$(date +%Y%m%d).sql
```

## 📚 Queries Úteis

Consulte o arquivo `queries_uteis.sql` para exemplos de:
- Consultas básicas
- Consultas para parceiros
- Consultas para lojistas
- Consultas de relatórios
- Consultas de integração

## 🔗 Integração com MT Leads

O sistema dispara eventos via webhook para o MT Leads. Os eventos são armazenados na tabela `eventos_webhook` e devem ser processados por um serviço externo.

Tipos de eventos:
- `vip_ativado` - Quando um cliente VIP é ativado
- `vencimento_proximo` - 30 dias antes do vencimento
- `vip_renovado` - Quando o VIP é renovado
- `beneficio_validado` - Quando um benefício é validado
- `chamado_aberto` - Quando um chamado é aberto

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação do projeto ou entre em contato com a equipe de desenvolvimento.

