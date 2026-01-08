# Guia: Usando Beekeeper Studio para Criar o Banco de Dados

## 📋 Pré-requisitos

1. **Beekeeper Studio instalado** - [Download aqui](https://www.beekeeperstudio.io/)
2. **PostgreSQL instalado e rodando** na sua máquina ou servidor
3. **Credenciais de acesso** ao PostgreSQL (usuário e senha)

## 🚀 Passo a Passo

### 1. Conectar ao PostgreSQL no Beekeeper

1. Abra o Beekeeper Studio
2. Clique em **"New Connection"** ou **"+"**
3. Selecione **PostgreSQL** como tipo de banco
4. **⚠️ IMPORTANTE**: Preencha o campo **"Name"** primeiro (ex: "VIP Connect" ou "Cliente VIP")
   - Este campo é obrigatório e aparece no topo do formulário
5. Preencha os dados de conexão:
   - **Connection Type**: `Postgres` (já deve estar selecionado)
   - **Authentication Method**: `Username / Password` (padrão)
   - **Connection Mode**: `Host and Port` (padrão)
   - **Host**: `localhost` (ou IP do servidor)
   - **Port**: `5432` (porta padrão do PostgreSQL)
   - **User**: seu usuário (ex: `clientvipasi`)
   - **Password**: sua senha
   - **Default Database**: deixe vazio ou coloque `postgres` (vamos criar o banco depois)
   - **Enable SSL**: deixe desabilitado (toggle OFF) se for conexão local
6. Clique em **"Test"** para verificar a conexão
   - Se der erro, verifique se o PostgreSQL está rodando
   - Verifique se as credenciais estão corretas
7. Se o teste passar, clique em **"Connect"**

### 2. Criar o Banco de Dados VIP Connect

1. No Beekeeper, abra uma nova query (aba SQL)
2. Execute o seguinte comando:

```sql
CREATE DATABASE vip_connect;
```

3. Para usar o novo banco, você pode:
   - **Opção A**: Desconectar e criar nova conexão apontando para `vip_connect`
   - **Opção B**: Executar `\c vip_connect` no terminal SQL (se disponível)
   - **Opção C**: Reconectar selecionando o banco `vip_connect` na lista de bancos

### 3. Executar o Schema SQL

1. No Beekeeper, abra uma nova query
2. Abra o arquivo `database/schema.sql` em um editor de texto
3. Copie TODO o conteúdo do arquivo
4. Cole no Beekeeper Studio
5. Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

⚠️ **Importante**: 
- O script pode demorar alguns segundos para executar
- Verifique se não há erros na aba de resultados
- Se houver erro, leia a mensagem e corrija antes de continuar

### 4. Verificar se Tudo Foi Criado

Execute esta query para verificar as tabelas criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver todas as tabelas:
- `avaliacoes`
- `beneficios_loja`
- `beneficios_oficiais`
- `chamados`
- `chamados_historico`
- `clientes_vip`
- `eventos_webhook`
- `lojas`
- `notificacoes`
- `parceiros`
- `renovacoes`
- `users`
- `validacoes_beneficios`
- `vendas`

### 5. Verificar Views Criadas

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver:
- `ranking_lojas`
- `relatorio_chamados_loja`
- `relatorio_clientes_renovados`
- `relatorio_clientes_vencimento_proximo`
- `relatorio_clientes_vip_mes`
- `relatorio_uso_beneficios`

### 6. (Opcional) Inserir Dados de Exemplo

1. Abra o arquivo `database/exemplos_dados.sql`
2. Copie e cole no Beekeeper
3. Execute para inserir dados de teste

## 🎯 Dicas para Usar o Beekeeper

### Executar Queries Úteis

1. Abra o arquivo `database/queries_uteis.sql`
2. Copie a query que você precisa
3. Cole e execute no Beekeeper

### Visualizar Estrutura das Tabelas

1. No painel lateral esquerdo, expanda o banco `vip_connect`
2. Expanda **"Tables"**
3. Clique em qualquer tabela para ver:
   - Colunas e tipos
   - Índices
   - Constraints
   - Triggers

### Editar Dados Visualmente

1. Clique com botão direito em uma tabela
2. Selecione **"View Data"** ou **"Edit Data"**
3. Você pode editar os dados diretamente na interface

### Exportar/Importar Dados

1. Clique com botão direito em uma tabela
2. Selecione **"Export"** para exportar dados
3. Ou **"Import"** para importar de CSV/JSON

## 🔧 Resolução de Problemas

### Erro: "database does not exist"
- Certifique-se de ter criado o banco `vip_connect` primeiro
- Verifique se está conectado ao banco correto

### Erro: "extension does not exist"
- Execute manualmente:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Erro: "permission denied"
- Verifique se seu usuário PostgreSQL tem permissões de criação
- Tente executar como superusuário (postgres)

### Erro ao executar o script completo
- Tente executar em partes menores
- Verifique se há algum erro de sintaxe
- Certifique-se de que o PostgreSQL está na versão 12 ou superior

## 📚 Recursos Adicionais

- **Documentação do Beekeeper**: https://docs.beekeeperstudio.io/
- **Documentação PostgreSQL**: https://www.postgresql.org/docs/

## ✅ Checklist Final

- [ ] Beekeeper Studio instalado
- [ ] PostgreSQL rodando
- [ ] Conexão estabelecida
- [ ] Banco `vip_connect` criado
- [ ] Schema executado com sucesso
- [ ] Tabelas verificadas
- [ ] Views verificadas
- [ ] (Opcional) Dados de exemplo inseridos

---

**Pronto!** Seu banco de dados está configurado e pronto para uso! 🎉

