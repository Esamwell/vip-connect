# 🌐 Configuração de DNS no Cloudflare - VIP Connect

Este guia detalha como configurar os subdomínios no Cloudflare para o sistema VIP Connect hospedado no Coolify.

## 📋 Subdomínios a Configurar

- **Frontend**: `asibeneficios.autoshoppingitapoan.com.br`
- **Backend**: `api.asibeneficios.autoshoppingitapoan.com.br`

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Conta no Cloudflare
- ✅ Domínio `autoshoppingitapoan.com.br` adicionado ao Cloudflare
- ✅ Acesso ao painel do Cloudflare
- ✅ IP da VPS onde o Coolify está instalado
- ✅ Coolify instalado e funcionando

---

## 🔍 Passo 1: Obter o IP da VPS

Primeiro, você precisa do IP público da sua VPS:

```bash
# Na VPS, execute:
curl ifconfig.me

# Ou
curl ipinfo.io/ip
```

**Anote este IP** - você precisará dele para configurar os registros DNS.

---

## 📝 Passo 2: Acessar o Cloudflare

1. Acesse [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Faça login na sua conta
3. Selecione o domínio `autoshoppingitapoan.com.br`

---

## 🌐 Passo 3: Configurar Registros DNS

### 3.1. Configurar Subdomínio do Frontend

1. No painel do Cloudflare, vá em **"DNS"** → **"Records"**
2. Clique em **"Add record"**
3. Configure:

   **Tipo**: `A`
   
   **Nome**: `asibeneficios`
   
   **IPv4 address**: `[IP_DA_SUA_VPS]` (ex: `192.0.2.100`)
   
   **Proxy status**: ⚠️ **Desative o proxy (nuvem cinza)** inicialmente
   
   **TTL**: `Auto` ou `3600`

4. Clique em **"Save"**

### 3.2. Configurar Subdomínio do Backend

1. Ainda em **"DNS"** → **"Records"**, clique em **"Add record"**
2. Configure:

   **Tipo**: `A`
   
   **Nome**: `api.asibeneficios`
   
   **IPv4 address**: `[IP_DA_SUA_VPS]` (mesmo IP do frontend)
   
   **Proxy status**: ⚠️ **Desative o proxy (nuvem cinza)** inicialmente
   
   **TTL**: `Auto` ou `3600`

3. Clique em **"Save"**

### 📸 Exemplo Visual dos Registros

Após configurar, você deve ter estes registros:

```
Tipo | Nome                    | Conteúdo          | Proxy | TTL
-----|-------------------------|-------------------|-------|-----
A    | asibeneficios           | 192.0.2.100      | 🟡    | Auto
A    | api.asibeneficios       | 192.0.2.100      | 🟡    | Auto
```

---

## ⏱️ Passo 4: Aguardar Propagação DNS

Após criar os registros:

1. **Aguarde 1-5 minutos** para propagação DNS
2. Verifique se os subdomínios estão resolvendo:

```bash
# Verificar Frontend
nslookup asibeneficios.autoshoppingitapoan.com.br

# Verificar Backend
nslookup api.asibeneficios.autoshoppingitapoan.com.br
```

Ambos devem retornar o IP da sua VPS.

---

## 🔒 Passo 5: Configurar SSL no Coolify

Após os DNS estarem propagados, configure o SSL no Coolify:

### 5.1. Configurar Frontend no Coolify

1. No Coolify, vá até a aplicação do **Frontend**
2. Vá em **"Settings"** → **"Domains"**
3. Adicione o domínio: `asibeneficios.autoshoppingitapoan.com.br`
4. Habilite **"Let's Encrypt SSL"**
5. Salve as configurações
6. O Coolify irá:
   - Verificar o DNS
   - Gerar certificado SSL automaticamente
   - Configurar HTTPS

### 5.2. Configurar Backend no Coolify

1. No Coolify, vá até a aplicação do **Backend**
2. Vá em **"Settings"** → **"Domains"**
3. Adicione o domínio: `api.asibeneficios.autoshoppingitapoan.com.br`
4. Habilite **"Let's Encrypt SSL"**
5. Salve as configurações
6. O Coolify irá gerar o certificado SSL automaticamente

---

## 🔄 Passo 6: Ativar Proxy do Cloudflare (Opcional)

⚠️ **IMPORTANTE**: Só ative o proxy do Cloudflare **DEPOIS** de configurar o SSL no Coolify.

### Por que desativar inicialmente?

- O Let's Encrypt precisa validar o domínio diretamente
- Com proxy ativo, o Cloudflare pode interferir na validação
- Após SSL configurado, você pode ativar o proxy para proteção adicional

### Como ativar o proxy:

1. No Cloudflare, vá em **"DNS"** → **"Records"**
2. Para cada registro (frontend e backend):
   - Clique no registro
   - Ative a **nuvem laranja** (Proxy)
   - Salve

### Vantagens do Proxy Cloudflare:

- ✅ Proteção DDoS
- ✅ Cache de conteúdo estático
- ✅ Redução de carga no servidor
- ✅ Analytics e estatísticas
- ✅ Firewall do Cloudflare

### ⚠️ Configurações Importantes com Proxy:

Se ativar o proxy, configure no Cloudflare:

1. **SSL/TLS** → **"Overview"**:
   - Modo: **"Full"** ou **"Full (strict)"**

2. **SSL/TLS** → **"Edge Certificates"**:
   - ✅ "Always Use HTTPS" - Ativado
   - ✅ "Automatic HTTPS Rewrites" - Ativado

3. **Speed** → **"Optimization"**:
   - Configure conforme necessário (cache, minificação, etc.)

---

## ✅ Passo 7: Verificação Final

### 7.1. Verificar DNS

```bash
# Frontend
dig asibeneficios.autoshoppingitapoan.com.br +short

# Backend
dig api.asibeneficios.autoshoppingitapoan.com.br +short
```

Ambos devem retornar o IP da VPS.

### 7.2. Verificar SSL

```bash
# Verificar certificado Frontend
openssl s_client -connect asibeneficios.autoshoppingitapoan.com.br:443 -servername asibeneficios.autoshoppingitapoan.com.br

# Verificar certificado Backend
openssl s_client -connect api.asibeneficios.autoshoppingitapoan.com.br:443 -servername api.asibeneficios.autoshoppingitapoan.com.br
```

### 7.3. Testar Acesso

**Frontend:**
```bash
curl -I https://asibeneficios.autoshoppingitapoan.com.br
```

**Backend:**
```bash
curl -I https://api.asibeneficios.autoshoppingitapoan.com.br/health
```

Ambos devem retornar `200 OK` ou `301/302` (redirect).

---

## 🔧 Configuração no Coolify

Após configurar os DNS, atualize as variáveis de ambiente no Coolify:

### Backend - Variáveis de Ambiente:

```env
DATABASE_HOST=vip-connect-db
DATABASE_PORT=5432
DATABASE_NAME=vip_connect
DATABASE_USER=postgres
DATABASE_PASSWORD=[sua_senha]
JWT_SECRET=[seu_jwt_secret]
CORS_ORIGIN=https://asibeneficios.autoshoppingitapoan.com.br
NODE_ENV=production
PORT=3000
```

### Frontend - Variáveis de Ambiente:

```env
VITE_API_URL=https://api.asibeneficios.autoshoppingitapoan.com.br/api
VITE_NODE_ENV=production
```

---

## 🛠️ Troubleshooting

### Problema: DNS não está resolvendo

**Solução:**
1. Verifique se o registro DNS está correto no Cloudflare
2. Aguarde mais tempo para propagação (pode levar até 24h, mas geralmente é rápido)
3. Limpe o cache DNS local:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Linux/Mac
   sudo systemd-resolve --flush-caches
   # ou
   sudo dscacheutil -flushcache
   ```

### Problema: SSL não está funcionando

**Solução:**
1. Verifique se o DNS está propagado corretamente
2. Certifique-se de que o proxy do Cloudflare está **desativado** durante a validação
3. Verifique os logs do Coolify para erros de validação
4. Tente regenerar o certificado no Coolify

### Problema: Erro 502 Bad Gateway

**Solução:**
1. Verifique se o Coolify está rodando
2. Verifique se as aplicações estão rodando no Coolify
3. Verifique os logs das aplicações no Coolify
4. Se estiver usando proxy Cloudflare, verifique configurações SSL (deve ser "Full")

### Problema: CORS Error

**Solução:**
1. Verifique se `CORS_ORIGIN` no backend inclui o domínio do frontend:
   ```
   CORS_ORIGIN=https://asibeneficios.autoshoppingitapoan.com.br
   ```
2. Certifique-se de que ambos usam HTTPS
3. Reinicie o backend após alterar variáveis

### Problema: Backend não conecta ao banco

**Solução:**
1. Verifique se o PostgreSQL está rodando
2. Verifique as variáveis de ambiente do backend
3. Verifique se `DATABASE_HOST` está correto (deve ser o nome do container)

---

## 📋 Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] DNS do Frontend configurado no Cloudflare
- [ ] DNS do Backend configurado no Cloudflare
- [ ] Proxy Cloudflare desativado inicialmente
- [ ] DNS propagado (verificado com nslookup/dig)
- [ ] Domínio Frontend adicionado no Coolify
- [ ] Domínio Backend adicionado no Coolify
- [ ] SSL configurado no Coolify para Frontend
- [ ] SSL configurado no Coolify para Backend
- [ ] Variáveis de ambiente atualizadas no Backend
- [ ] Variáveis de ambiente atualizadas no Frontend
- [ ] Frontend acessível via HTTPS
- [ ] Backend acessível via HTTPS
- [ ] Health check do Backend funcionando
- [ ] Proxy Cloudflare ativado (opcional, após SSL)

---

## 🔒 Segurança Adicional no Cloudflare

### Firewall Rules

Configure regras de firewall no Cloudflare:

1. **"Security"** → **"WAF"**:
   - Ative o WAF (Web Application Firewall)
   - Configure regras personalizadas se necessário

2. **"Security"** → **"Firewall Rules"**:
   - Bloquear países específicos (se necessário)
   - Rate limiting para proteção contra DDoS
   - Regras para proteger endpoints sensíveis

### Rate Limiting

Para o Backend API:

1. **"Security"** → **"Rate Limiting"**
2. Crie regra para `api.asibeneficios.autoshoppingitapoan.com.br`
3. Configure limites (ex: 100 requisições por minuto por IP)

---

## 📊 Monitoramento

### Analytics do Cloudflare

1. **"Analytics"** → **"Web Traffic"**
2. Monitore:
   - Requisições por segundo
   - Tráfego por país
   - Status codes
   - Top páginas

### Logs do Coolify

Monitore os logs das aplicações no Coolify para:
- Erros de aplicação
- Problemas de conexão
- Performance

---

## 📚 Recursos Adicionais

- [Documentação do Cloudflare DNS](https://developers.cloudflare.com/dns/)
- [Documentação SSL/TLS do Cloudflare](https://developers.cloudflare.com/ssl/)
- [Documentação do Coolify](https://coolify.io/docs)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no Coolify
2. Verifique os logs no Cloudflare (Analytics → Logs)
3. Consulte a seção de Troubleshooting acima
4. Verifique a documentação do projeto em `COOLIFY_DEPLOY.md`

---

**Versão**: 1.0.0  
**Última atualização**: 2025

