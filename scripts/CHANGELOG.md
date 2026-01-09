# 📝 Changelog - Script de Instalação

## Versão 1.1.0 - Criação Automática do PostgreSQL

### ✨ Novas Funcionalidades

- ✅ **Criação automática do PostgreSQL**: O script agora cria o container PostgreSQL automaticamente
- ✅ **Configuração automática do banco**: Cria o banco `vip_connect`, extensões e executa o schema SQL
- ✅ **Rede Docker compartilhada**: Cria/usa rede Docker para comunicação entre containers
- ✅ **Integração com Coolify**: Detecta e usa rede do Coolify se disponível
- ✅ **Validação e recuperação**: Verifica se container já existe e oferece opções

### 🔧 Melhorias

- Script agora pergunta se deseja criar PostgreSQL automaticamente
- Cria rede Docker compartilhada para facilitar comunicação
- Baixa e executa schema SQL automaticamente do GitHub
- Melhor tratamento de erros e mensagens informativas
- Documentação atualizada com instruções para usar PostgreSQL criado

### 📋 O Que Foi Adicionado

1. **Função `create_docker_network()`**:
   - Detecta rede do Coolify se existir
   - Cria rede compartilhada se necessário
   - Retorna nome da rede para uso posterior

2. **Função `create_postgresql_automatically()`**:
   - Cria container PostgreSQL com PostgreSQL 15
   - Configura volume persistente
   - Conecta à rede Docker compartilhada
   - Cria banco `vip_connect`
   - Instala extensões (`uuid-ossp`, `pg_trgm`)
   - Baixa e executa schema SQL do GitHub

3. **Melhorias na função principal**:
   - Aguarda Coolify estar pronto antes de criar PostgreSQL
   - Pergunta ao usuário se deseja criar PostgreSQL automaticamente
   - Salva informações da rede para uso posterior

### 🎯 Como Usar

O script agora pergunta durante a execução:

```bash
Deseja criar o PostgreSQL automaticamente agora? (recomendado)
Criar PostgreSQL automaticamente? (y/n) [y]:
```

Se responder `y` (padrão):
- ✅ PostgreSQL será criado automaticamente
- ✅ Banco será configurado
- ✅ Schema será executado
- ✅ Tudo pronto para usar!

### 📝 Arquivos Modificados

- `scripts/install-coolify-vip-connect.sh` - Script principal atualizado
- `scripts/CHANGELOG.md` - Este arquivo

### 🔄 Próximas Versões

- [ ] Suporte para criar PostgreSQL via API do Coolify (quando disponível)
- [ ] Opção para usar PostgreSQL externo
- [ ] Backup automático do banco
- [ ] Restauração de backup

---

**Data**: 2025  
**Versão**: 1.1.0

