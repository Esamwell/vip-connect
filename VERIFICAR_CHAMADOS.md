# 🔧 Verificar e Corrigir Tabela Chamados

## ❌ Problema

A tabela `chamados` pode estar faltando a coluna `veiculo_id`, que é necessária para relacionar chamados com veículos.

## ✅ Solução

Execute o script SQL `database/verificar_e_corrigir_chamados.sql` para verificar e adicionar a coluna se necessário.

## 🚀 Como Executar

### Opção 1: Via Docker (Recomendado)

```bash
docker exec -i vip-connect-db psql -U postgres -d vip_connect < database/verificar_e_corrigir_chamados.sql
```

### Opção 2: Via Beekeeper Studio

1. Abra o Beekeeper Studio
2. Conecte-se ao banco `vip_connect`
3. Abra o arquivo `database/verificar_e_corrigir_chamados.sql`
4. Execute o script completo

## 📋 O que o Script Faz

1. **Verifica se a coluna `veiculo_id` existe** na tabela `chamados`
2. **Adiciona a coluna** se não existir, com referência à tabela `veiculos_cliente_vip`
3. **Cria índice** para melhor performance
4. **Mostra a estrutura** completa da tabela `chamados`
5. **Verifica se a tabela `veiculos_cliente_vip` existe**
6. **Mostra estatísticas** de chamados com e sem veículo

## ✅ Verificar se Funcionou

Após executar o script, você verá:
- ✅ Se a coluna foi adicionada ou já existia
- A estrutura completa da tabela `chamados`
- Se a tabela `veiculos_cliente_vip` existe
- Estatísticas de chamados

## 🔄 Após Executar o Script

1. **Faça commit e push** (se ainda não fez):
   ```bash
   git add server/src/routes/chamados.ts
   git commit -m "fix: melhorar logs e tratamento de erros em chamados"
   git push
   ```

2. **Fazer Redeploy no Coolify:**
   - Vá em Backend → Deployments
   - Clique em "Redeploy"

3. **Teste novamente:**
   - Tente criar um chamado na página do cartão do cliente
   - Verifique os logs do backend no Coolify

## 📝 Notas

- O script é seguro e pode ser executado múltiplas vezes
- Se a coluna já existir, o script não fará nada
- A coluna `veiculo_id` é nullable, então chamados sem veículo podem ter NULL

---

**Execute o script SQL e depois faça redeploy!**

