# 🚀 Início Rápido na VPS

## Problema: Script não encontrado

Se você recebeu o erro `bash: scripts/install-coolify-vip-connect.sh: No such file or directory`, siga estes passos:

## ✅ Solução 1: Clonar o Repositório (Recomendado)

```bash
# Na VPS, clone o repositório
git clone https://github.com/esamwell/vip-connect.git
cd vip-connect

# Executar o script
bash scripts/install-coolify-vip-connect.sh
```

## ✅ Solução 2: Baixar Script Diretamente

Se você não tem o repositório clonado, pode baixar apenas o script:

```bash
# Criar diretório scripts
mkdir -p scripts

# Baixar o script
curl -o scripts/install-coolify-vip-connect.sh https://raw.githubusercontent.com/seu-usuario/vip-connect/main/scripts/install-coolify-vip-connect.sh

# Dar permissão de execução
chmod +x scripts/install-coolify-vip-connect.sh

# Executar
bash scripts/install-coolify-vip-connect.sh
```

## ✅ Solução 3: Executar Diretamente via Curl (Mais Rápido)

```bash
# Executar diretamente sem baixar
curl -fsSL https://raw.githubusercontent.com/seu-usuario/vip-connect/main/scripts/install-coolify-vip-connect.sh | bash
```

⚠️ **IMPORTANTE**: Substitua `seu-usuario` pela URL real do seu repositório GitHub!

## 🔍 Verificar Onde Você Está

```bash
# Ver diretório atual
pwd

# Listar arquivos
ls -la

# Verificar se existe o diretório scripts
ls -la scripts/
```

## 📋 Passos Completos Recomendados

```bash
# 1. Navegar para home (se necessário)
cd ~

# 2. Clonar repositório
git clone https://github.com/seu-usuario/vip-connect.git

# 3. Entrar no diretório
cd vip-connect

# 4. Verificar se o script existe
ls -la scripts/install-coolify-vip-connect.sh

# 5. Executar script
bash scripts/install-coolify-vip-connect.sh
```

## 🆘 Se Ainda Não Funcionar

1. Verifique se você tem acesso ao GitHub:
   ```bash
   curl -I https://github.com
   ```

2. Verifique se o repositório é público ou se você precisa de autenticação

3. Se o repositório for privado, use SSH:
   ```bash
   git clone git@github.com:seu-usuario/vip-connect.git
   ```

4. Ou faça upload manual do script via SCP:
   ```bash
   # Do seu computador local:
   scp scripts/install-coolify-vip-connect.sh root@seu-ip-vps:/root/
   
   # Na VPS:
   bash /root/install-coolify-vip-connect.sh
   ```

---

**Versão**: 1.0.0

