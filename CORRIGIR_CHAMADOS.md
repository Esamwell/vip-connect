# 🔧 Corrigir Erro 500 ao Criar Chamados

## ❌ Problema

Ao criar um chamado na página do cartão do cliente, ocorre erro 500:
- GET `/api/chamados/qr/:qrCode` retorna 500
- POST `/api/chamados` retorna 500

## ✅ Correções Aplicadas

1. **Logs detalhados** adicionados em todas as rotas de chamados
2. **Tratamento melhorado** de `veiculo_id` vazio ou inválido
3. **Tratamento de erro** em MT Leads (não quebra o fluxo)
4. **Mensagens de erro** mais informativas

## 🚀 Próximos Passos

### 1. Verificar se a Tabela `veiculos_cliente_vip` Existe

Execute no banco de dados:

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'veiculos_cliente_vip'
);
```

Se retornar `false`, execute:

```bash
docker exec -i vip-connect-db psql -U postgres -d vip_connect < database/create_veiculos_historico.sql
```

### 2. Verificar se a Tabela `clientes_beneficios` Tem as Colunas de Resgate

Execute no banco de dados:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clientes_beneficios' 
  AND column_name IN ('resgatado', 'data_resgate', 'resgatado_por');
```

Se faltar alguma coluna, execute:

```bash
docker exec -i vip-connect-db psql -U postgres -d vip_connect < database/adicionar_colunas_resgate.sql
```

### 3. Fazer Commit e Push

```bash
git add server/src/routes/chamados.ts
git commit -m "fix: melhorar logs e tratamento de erros em chamados"
git push
```

### 4. Fazer Redeploy no Coolify

- Vá em Backend → Deployments
- Clique em "Redeploy"
- Aguarde o build completar

### 5. Verificar os Logs

Após o deploy, verifique os logs do backend no Coolify. Você verá mensagens como:

**Para GET `/api/chamados/qr/:qrCode`:**
- "Buscando chamados por QR Code:"
- "Cliente encontrado:"
- "Chamados encontrados:"
- Ou mensagens de erro detalhadas

**Para POST `/api/chamados`:**
- "Criando chamado por QR Code:" ou "Criando chamado no banco de dados..."
- "Cliente encontrado:"
- "Verificando veículo:" (se houver veículo)
- "Chamado criado com sucesso:"
- Ou mensagens de erro detalhadas

## 🔍 Possíveis Causas do Erro

1. **Tabela `veiculos_cliente_vip` não existe**
   - Solução: Execute `database/create_veiculos_historico.sql`

2. **Tabela `clientes_beneficios` sem colunas de resgate**
   - Solução: Execute `database/adicionar_colunas_resgate.sql`

3. **Erro na query SQL**
   - Os logs mostrarão o erro específico do PostgreSQL

4. **Veículo não encontrado**
   - Os logs mostrarão "Veículo não encontrado ou não pertence ao cliente"

## 📝 Scripts SQL Disponíveis

1. **`database/create_veiculos_historico.sql`** - Cria tabela `veiculos_cliente_vip`
2. **`database/adicionar_colunas_resgate.sql`** - Adiciona colunas de resgate em `clientes_beneficios`
3. **`database/criar_tabelas_faltantes.sql`** - Cria ambas as tabelas e adiciona todas as colunas necessárias

## ✅ Verificar se Tudo Está OK

Execute estas queries para verificar:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('veiculos_cliente_vip', 'clientes_beneficios', 'chamados');

-- Verificar colunas de veiculos_cliente_vip
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'veiculos_cliente_vip';

-- Verificar colunas de resgate em clientes_beneficios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clientes_beneficios' 
  AND column_name IN ('resgatado', 'data_resgate', 'resgatado_por');
```

---

**Execute os scripts SQL necessários, faça commit/push e verifique os logs!**

