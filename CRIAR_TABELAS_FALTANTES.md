# 🔧 Criar Tabelas Faltantes no Banco de Dados

## ❌ Problema

Os logs do backend mostram erros indicando que duas tabelas não existem no banco de dados:

1. **`veiculos_cliente_vip`** - Histórico de veículos dos clientes VIP
2. **`clientes_beneficios`** - Relacionamento entre clientes VIP e benefícios

### Erros Encontrados:

```
error: relation "veiculos_cliente_vip" does not exist
error: relation "clientes_beneficios" does not exist
```

## ✅ Solução

Execute o script SQL `database/criar_tabelas_faltantes.sql` no banco de dados.

## 🚀 Como Executar

### Opção 1: Via Docker (Recomendado)

1. **Copie o arquivo SQL para o container:**
   ```bash
   docker cp database/criar_tabelas_faltantes.sql vip-connect-db:/tmp/
   ```

2. **Execute o script dentro do container:**
   ```bash
   docker exec -i vip-connect-db psql -U postgres -d vip_connect < /tmp/criar_tabelas_faltantes.sql
   ```

   Ou diretamente:
   ```bash
   docker exec -i vip-connect-db psql -U postgres -d vip_connect < database/criar_tabelas_faltantes.sql
   ```

### Opção 2: Via Beekeeper Studio ou pgAdmin

1. Abra o Beekeeper Studio ou pgAdmin
2. Conecte-se ao banco de dados `vip_connect`
3. Abra o arquivo `database/criar_tabelas_faltantes.sql`
4. Execute o script completo

### Opção 3: Via SSH no VPS

1. **Conecte-se ao VPS via SSH**
2. **Copie o arquivo SQL para o VPS** (se ainda não estiver lá):
   ```bash
   # Se você tem o repositório clonado no VPS
   cd /caminho/para/vip-connect
   ```

3. **Execute o script:**
   ```bash
   docker exec -i vip-connect-db psql -U postgres -d vip_connect < database/criar_tabelas_faltantes.sql
   ```

## 📋 O que o Script Faz

1. **Cria a tabela `veiculos_cliente_vip`:**
   - Armazena histórico de veículos comprados por clientes VIP
   - Migra veículos existentes da tabela `clientes_vip` para o histórico
   - Cria índices para melhor performance

2. **Cria a tabela `clientes_beneficios`:**
   - Permite alocar benefícios específicos a clientes específicos
   - Suporta benefícios oficiais e de loja
   - Cria constraints e índices necessários
   - Configura trigger para atualizar `updated_at` automaticamente

## ✅ Verificar se Funcionou

Após executar o script, verifique se as tabelas foram criadas:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('veiculos_cliente_vip', 'clientes_beneficios');
```

Você deve ver ambas as tabelas listadas.

## 🔄 Após Criar as Tabelas

1. **Reinicie o Backend no Coolify:**
   - Vá em Backend → Deployments
   - Clique em "Redeploy" (ou aguarde o próximo deploy automático)

2. **Teste novamente:**
   - Tente criar um novo cliente VIP
   - Tente acessar os detalhes de um cliente existente
   - Verifique se os erros desapareceram dos logs

## 📝 Notas

- O script usa `CREATE TABLE IF NOT EXISTS`, então é seguro executar múltiplas vezes
- Veículos existentes na tabela `clientes_vip` serão migrados automaticamente para `veiculos_cliente_vip`
- O script não remove dados existentes

---

**Execute o script SQL e reinicie o backend!**

