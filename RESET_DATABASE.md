# 🔄 Reset Completo do Banco de Dados

Script para limpar e recriar o banco de dados PostgreSQL do zero.

## 📋 O Que o Script Faz

1. ✅ Para e remove o container PostgreSQL existente
2. ✅ Remove o volume de dados (opcional)
3. ✅ Cria rede Docker se necessário
4. ✅ Recria o container PostgreSQL
5. ✅ Cria o banco de dados `vip_connect`
6. ✅ Instala extensões (`uuid-ossp`, `pg_trgm`)
7. ✅ Baixa e executa o schema SQL do GitHub
8. ✅ Configura para aceitar conexões externas
9. ✅ Verifica se tudo está funcionando

## 🚀 Como Usar

### Na VPS, execute:

```bash
# Baixar o script (se ainda não tiver)
cd /root
curl -fsSL https://raw.githubusercontent.com/esamwell/vip-connect/main/scripts/reset-database.sh -o reset-database.sh

# Dar permissão de execução
chmod +x reset-database.sh

# Executar o script
sudo bash reset-database.sh
```

### Ou se já tiver o repositório clonado:

```bash
cd /root/vip-connect  # ou onde estiver o repositório
chmod +x scripts/reset-database.sh
sudo bash scripts/reset-database.sh
```

## ⚠️ ATENÇÃO

- **Este script APAGA todos os dados do banco de dados!**
- Você precisará confirmar digitando `SIM` para continuar
- O script perguntará se deseja remover o volume também
- Faça backup antes se tiver dados importantes!

## 📝 Durante a Execução

O script vai:
1. Pedir confirmação (digite `SIM`)
2. Perguntar se deseja remover o volume (y/n)
3. Executar todos os passos automaticamente
4. Mostrar um resumo final com informações de conexão

## 🔍 Verificar Status

Após executar, verifique:

```bash
# Ver se container está rodando
docker ps | grep vip-connect-db

# Ver logs
docker logs vip-connect-db

# Testar conexão
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "SELECT version();"
```

## 🔧 Informações de Conexão

Após executar o script, **TODAS as informações detalhadas serão exibidas automaticamente**, incluindo:

✅ **IP da VPS** (detectado automaticamente)  
✅ **URL de conexão completa** para Beekeeper  
✅ **Credenciais completas** (usuário, senha, banco)  
✅ **Variáveis de ambiente** para Coolify  
✅ **Comandos de teste** para verificar conexão  
✅ **Instruções passo a passo** para Beekeeper Studio  

O script mostra um resumo completo no final com todas as informações necessárias!

## 🆘 Troubleshooting

### Se o script falhar:

1. Verifique os logs:
   ```bash
   docker logs vip-connect-db
   ```

2. Verifique se o container está rodando:
   ```bash
   docker ps -a | grep vip-connect-db
   ```

3. Verifique se a porta está exposta:
   ```bash
   docker port vip-connect-db
   ```

4. Verifique firewall:
   ```bash
   sudo ufw status
   sudo ufw allow 5432/tcp
   ```

## 📚 Próximos Passos

Após executar o script com sucesso:

1. ✅ Teste a conexão no Beekeeper
2. ✅ Verifique se as tabelas foram criadas
3. ✅ Configure as variáveis de ambiente no Coolify
4. ✅ Faça deploy do backend novamente

---

**Execute o script na VPS para resetar o banco de dados completamente!**

