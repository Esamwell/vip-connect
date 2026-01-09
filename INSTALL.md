# 🚀 Instalação Rápida VIP Connect

## ⚡ Instalação Automatizada (Recomendado)

Para instalação automatizada em uma VPS com Coolify, use nosso script:

### Opção 1: Executar Diretamente (Mais Rápido)

```bash
# Conectar à VPS
ssh root@seu-ip-vps

# Executar script de instalação diretamente
curl -fsSL https://raw.githubusercontent.com/seu-usuario/vip-connect/main/scripts/install-coolify-vip-connect.sh | bash
```

⚠️ **IMPORTANTE**: Substitua `seu-usuario` pela URL real do seu repositório GitHub!

### Opção 2: Clonar Repositório Primeiro

```bash
# Conectar à VPS
ssh root@seu-ip-vps

# Clonar repositório
git clone https://github.com/seu-usuario/vip-connect.git
cd vip-connect

# Executar script
bash scripts/install-coolify-vip-connect.sh
```

### Problema: Script não encontrado?

Se receber erro `No such file or directory`, veja [`QUICK_START_VPS.md`](QUICK_START_VPS.md) para soluções.

O script irá:
- ✅ Instalar Coolify automaticamente
- ✅ Configurar Docker
- ✅ Gerar senhas seguras
- ✅ Criar scripts auxiliares
- ✅ Gerar arquivo de configuração completo

Após a execução, siga as instruções em `/tmp/vip-connect-coolify-config.txt`

## 📚 Documentação Completa

- **[COOLIFY_DEPLOY.md](COOLIFY_DEPLOY.md)** - Guia completo passo a passo
- **[COOLIFY_QUICK_START.md](COOLIFY_QUICK_START.md)** - Guia rápido de referência
- **[scripts/README_INSTALL.md](scripts/README_INSTALL.md)** - Documentação do script de instalação

## 🔧 Instalação Manual

Se preferir instalação manual, consulte:

- [COOLIFY_DEPLOY.md](COOLIFY_DEPLOY.md) - Instruções detalhadas
- [README.md](README.md) - Documentação geral do projeto

## 📋 Pré-requisitos

- ✅ VPS com Ubuntu 22.04+ ou Debian equivalente
- ✅ Acesso root ou sudo
- ✅ Domínio configurado (recomendado)
- ✅ Repositório GitHub do projeto

## 🆘 Suporte

Para problemas ou dúvidas:
1. Consulte a seção de Troubleshooting em [COOLIFY_DEPLOY.md](COOLIFY_DEPLOY.md)
2. Verifique os logs no Coolify
3. Abra uma issue no repositório

---

**Versão**: 1.0.0

