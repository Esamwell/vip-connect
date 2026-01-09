# 🔧 Adicionar Colunas de Resgate na Tabela clientes_beneficios

## ❌ Problema

Os benefícios alocados ao cliente não estão aparecendo porque a tabela `clientes_beneficios` está faltando as colunas:
- `resgatado` (BOOLEAN)
- `data_resgate` (TIMESTAMP)
- `resgatado_por` (UUID)

Essas colunas são necessárias para a query que busca os benefícios do cliente.

## ✅ Solução

Execute o script SQL `database/adicionar_colunas_resgate.sql` no banco de dados.

## 🚀 Como Executar

### Opção 1: Via Docker (Recomendado)

```bash
docker exec -i vip-connect-db psql -U postgres -d vip_connect < database/adicionar_colunas_resgate.sql
```

### Opção 2: Via Beekeeper Studio ou pgAdmin

1. Abra o Beekeeper Studio ou pgAdmin
2. Conecte-se ao banco de dados `vip_connect`
3. Abra o arquivo `database/adicionar_colunas_resgate.sql`
4. Execute o script completo

### Opção 3: Via SSH no VPS

```bash
# Se você tem o repositório clonado no VPS
cd /caminho/para/vip-connect
docker exec -i vip-connect-db psql -U postgres -d vip_connect < database/adicionar_colunas_resgate.sql
```

## 📋 O que o Script Faz

1. **Adiciona a coluna `resgatado`:**
   - Tipo: BOOLEAN
   - Default: false
   - Indica se o benefício foi resgatado/inutilizado

2. **Adiciona a coluna `data_resgate`:**
   - Tipo: TIMESTAMP
   - Nullable: true
   - Data e hora em que o benefício foi resgatado

3. **Adiciona a coluna `resgatado_por`:**
   - Tipo: UUID (referência a users)
   - Nullable: true
   - Usuário que marcou o benefício como resgatado

4. **Cria índices** para melhor performance

5. **Adiciona comentários** nas colunas

## ✅ Verificar se Funcionou

Após executar o script, verifique se as colunas foram criadas:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes_beneficios' 
  AND column_name IN ('resgatado', 'data_resgate', 'resgatado_por')
ORDER BY column_name;
```

Você deve ver as 3 colunas listadas.

## 🔄 Após Adicionar as Colunas

1. **Reinicie o Backend no Coolify:**
   - Vá em Backend → Deployments
   - Clique em "Redeploy"

2. **Teste novamente:**
   - Acesse os detalhes de um cliente VIP
   - Verifique se os benefícios alocados aparecem
   - Os erros 500 devem desaparecer

## 📝 Notas

- O script usa `IF NOT EXISTS`, então é seguro executar múltiplas vezes
- Se as colunas já existirem, o script não fará nada
- O script não remove dados existentes

---

**Execute o script SQL e reinicie o backend!**

