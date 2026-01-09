# 🔧 Corrigir Erro 500 ao Criar/Buscar Cliente VIP

## ❌ Problema

- Erro 500 ao criar cliente VIP (mas o cliente aparece na lista depois)
- Erro 500 ao buscar detalhes do cliente por ID
- Mensagem: "Erro interno do servidor"

## 🔍 Causas Possíveis

1. **Problema com valores NULL/undefined** na query SQL
2. **Erro na função `enviarEventoMTLeads`** (mesmo que não deveria lançar erro)
3. **Problema com conversão de datas**
4. **Problema com o banco de dados** (tabela não existe, coluna não existe, etc.)

## ✅ Correções Aplicadas

### 1. Logs Detalhados

Adicionei logs mais detalhados para identificar o problema:
- Log dos dados antes de criar o cliente
- Log de sucesso após criar
- Log detalhado de erros com código, detalhe, hint, etc.

### 2. Tratamento de Valores NULL

Garantido que valores opcionais sejam `null` ao invés de `undefined`:
```typescript
email || null,
veiculo_marca || null,
veiculo_modelo || null,
veiculo_ano || null,
veiculo_placa || null,
```

### 3. Tratamento de Erro em MT Leads

A função `enviarEventoMTLeads` agora está envolvida em try/catch para não quebrar o fluxo:
```typescript
try {
  await enviarEventoMTLeads(...);
} catch (mtLeadsError) {
  console.warn('Erro ao enviar evento para MT Leads (não crítico)');
  // Continua mesmo se falhar
}
```

### 4. Mensagens de Erro Mais Informativas

Em desenvolvimento, as mensagens de erro agora incluem detalhes úteis.

## 🚀 Próximos Passos

1. **Faça commit e push:**
   ```bash
   git add server/src/routes/clientes-vip.ts
   git commit -m "fix: melhorar tratamento de erros e logs em criação/busca de clientes VIP"
   git push
   ```

2. **No Coolify, faça Redeploy do Backend:**
   - Vá em Backend → Deployments
   - Clique em "Redeploy"
   - Aguarde o build completar

3. **Teste novamente:**
   - Tente criar um novo cliente VIP
   - Tente acessar os detalhes de um cliente existente
   - Verifique os logs no Coolify → Backend → Logs

4. **Verifique os Logs:**
   - Se ainda der erro, os logs agora mostrarão detalhes específicos
   - Procure por mensagens como:
     - "Criando cliente VIP com dados:"
     - "Erro ao criar cliente VIP:"
     - "Detalhes do erro:"

## 🔍 Diagnóstico Adicional

Se o problema persistir, verifique:

1. **Estrutura do Banco de Dados:**
   ```sql
   -- Conecte ao banco e verifique se a tabela existe
   \d clientes_vip
   
   -- Verifique se as colunas existem
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'clientes_vip';
   ```

2. **Verifique se há Constraints Violadas:**
   - `qr_code_digital` deve ser UNIQUE
   - `qr_code_fisico` deve ser UNIQUE
   - `loja_id` deve existir na tabela `lojas`

3. **Verifique os Logs do Backend no Coolify:**
   - Vá em Backend → Logs
   - Procure por erros específicos do PostgreSQL
   - Procure por mensagens de erro detalhadas

## 📝 Exemplo de Erro Comum

Se você ver um erro como:
```
duplicate key value violates unique constraint "clientes_vip_qr_code_digital_key"
```

Isso significa que o QR code já existe. Nesse caso, o problema está na função `generateQRCode()` que pode estar gerando códigos duplicados.

---

**Faça commit, push e redeploy! Depois verifique os logs para identificar o problema específico.**

