# 🚀 Script de Instalação Automatizada

Este diretório contém scripts para automatizar a instalação do VIP Connect no Coolify.

## 📋 Scripts Disponíveis

### `install-coolify-vip-connect.sh`

Script principal que automatiza a instalação completa:

- ✅ Instalação do Coolify na VPS
- ✅ Configuração do Docker
- ✅ Geração de senhas seguras
- ✅ Criação de scripts auxiliares
- ✅ Geração de arquivo de configuração completo

## 🚀 Como Usar

### 1. Preparação

Certifique-se de ter:
- Acesso root ou sudo à VPS
- Ubuntu 22.04 LTS ou superior (ou Debian equivalente)
- Domínio configurado (opcional, mas recomendado)
- Repositório GitHub do projeto

### 2. Executar o Script

```bash
# Fazer download do script
curl -o install-coolify-vip-connect.sh https://raw.githubusercontent.com/seu-usuario/vip-connect/main/scripts/install-coolify-vip-connect.sh

# Ou clonar o repositório
git clone https://github.com/seu-usuario/vip-connect.git
cd vip-connect/scripts

# Dar permissão de execução
chmod +x install-coolify-vip-connect.sh

# Executar como root
sudo bash install-coolify-vip-connect.sh
```

### 3. Durante a Execução

O script irá solicitar:

1. **Repositório GitHub**: `usuario/vip-connect`
2. **Branch**: `main` (padrão)
3. **Domínio do Frontend**: `vip-connect.seudominio.com`
4. **Domínio do Backend**: `api.vip-connect.seudominio.com`
5. **Senha PostgreSQL**: (ou pressione Enter para gerar automaticamente)
6. **JWT Secret**: (ou pressione Enter para gerar automaticamente)
7. **URL do Coolify**: `http://seu-ip:8000` ou `https://coolify.seudominio.com`
8. **Token da API Coolify**: (opcional, para automação completa)

### 4. Após a Instalação

O script criará:

- `/tmp/setup-vip-connect-db.sh` - Script para configurar o banco de dados
- `/tmp/vip-connect-coolify-config.txt` - Instruções completas de configuração

Siga as instruções no arquivo de configuração para:

1. Configurar PostgreSQL no Coolify
2. Configurar Backend no Coolify
3. Configurar Frontend no Coolify

## 📝 Exemplo de Uso

```bash
# Conectar à VPS
ssh root@seu-ip-vps

# Baixar e executar script
curl -fsSL https://raw.githubusercontent.com/seu-usuario/vip-connect/main/scripts/install-coolify-vip-connect.sh | bash
```

## 🔧 O Que o Script Faz

### Automático

- ✅ Instala dependências do sistema (curl, wget, git, jq, openssl)
- ✅ Instala Docker (se não estiver instalado)
- ✅ Instala Coolify
- ✅ Gera senhas seguras (PostgreSQL e JWT)
- ✅ Cria scripts auxiliares
- ✅ Gera arquivo de configuração completo

### Manual (via Coolify Web UI)

Após a instalação, você precisará:

1. **Acessar o Coolify** e criar conta de administrador
2. **Criar PostgreSQL** seguindo as instruções geradas
3. **Criar Backend** seguindo as instruções geradas
4. **Criar Frontend** seguindo as instruções geradas

## 📚 Arquivos Gerados

### `/tmp/setup-vip-connect-db.sh`

Script para executar no terminal do PostgreSQL no Coolify. Ele:

- Cria o banco `vip_connect`
- Cria extensões necessárias
- Baixa e executa o schema SQL

### `/tmp/vip-connect-coolify-config.txt`

Arquivo com todas as instruções detalhadas, incluindo:

- Todas as variáveis de ambiente necessárias
- Passo a passo completo
- Comandos para verificação
- Troubleshooting

## 🔒 Segurança

⚠️ **IMPORTANTE**: 

- As senhas geradas são exibidas apenas uma vez
- Guarde as senhas em local seguro
- Não compartilhe o arquivo de configuração publicamente
- Altere as senhas padrão após a primeira instalação

## 🆘 Troubleshooting

### Script não executa

```bash
# Verificar permissões
chmod +x install-coolify-vip-connect.sh

# Executar com bash explicitamente
bash install-coolify-vip-connect.sh
```

### Coolify não inicia

```bash
# Verificar status
docker ps | grep coolify

# Ver logs
docker logs coolify

# Reiniciar
docker restart coolify
```

### Erro ao baixar schema

O script tenta baixar o schema do GitHub. Se falhar:

1. Faça upload manual do arquivo `database/schema.sql` para o container PostgreSQL
2. Execute: `psql -U postgres -d vip_connect -f /caminho/para/schema.sql`

## 📖 Documentação Completa

Para documentação completa, consulte:

- [`COOLIFY_DEPLOY.md`](../COOLIFY_DEPLOY.md) - Guia completo de instalação
- [`COOLIFY_QUICK_START.md`](../COOLIFY_QUICK_START.md) - Guia rápido

## 🤝 Contribuindo

Se encontrar problemas ou tiver sugestões, abra uma issue no repositório.

---

**Versão**: 1.0.0  
**Última atualização**: 2025

