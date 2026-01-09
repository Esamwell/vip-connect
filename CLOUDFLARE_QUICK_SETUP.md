# ⚡ Configuração Rápida DNS Cloudflare

Guia rápido para configurar os subdomínios no Cloudflare.

## 🎯 Subdomínios

- **Frontend**: `asibeneficios.autoshoppingitapoan.com.br`
- **Backend**: `api.asibeneficios.autoshoppingitapoan.com.br`

## 🚀 Passos Rápidos

### 1. Obter IP da VPS

```bash
curl ifconfig.me
```

### 2. Configurar DNS no Cloudflare

Acesse: [dash.cloudflare.com](https://dash.cloudflare.com) → Selecione `autoshoppingitapoan.com.br` → **DNS** → **Records**

#### Frontend:
```
Tipo: A
Nome: asibeneficios
Conteúdo: [IP_DA_VPS]
Proxy: 🟡 Desativado (nuvem cinza)
TTL: Auto
```

#### Backend:
```
Tipo: A
Nome: api.asibeneficios
Conteúdo: [IP_DA_VPS]
Proxy: 🟡 Desativado (nuvem cinza)
TTL: Auto
```

### 3. Aguardar Propagação (1-5 min)

```bash
# Verificar
nslookup asibeneficios.autoshoppingitapoan.com.br
nslookup api.asibeneficios.autoshoppingitapoan.com.br
```

### 4. Configurar SSL no Coolify

**Frontend:**
- Coolify → Frontend → Settings → Domains
- Adicionar: `asibeneficios.autoshoppingitapoan.com.br`
- ✅ Ativar Let's Encrypt SSL

**Backend:**
- Coolify → Backend → Settings → Domains
- Adicionar: `api.asibeneficios.autoshoppingitapoan.com.br`
- ✅ Ativar Let's Encrypt SSL

### 5. Atualizar Variáveis de Ambiente

**Backend:**
```env
CORS_ORIGIN=https://asibeneficios.autoshoppingitapoan.com.br
```

**Frontend:**
```env
VITE_API_URL=https://api.asibeneficios.autoshoppingitapoan.com.br/api
```

### 6. (Opcional) Ativar Proxy Cloudflare

Após SSL funcionar, ative a nuvem laranja nos registros DNS.

## ✅ Verificação

```bash
# Frontend
curl -I https://asibeneficios.autoshoppingitapoan.com.br

# Backend
curl -I https://api.asibeneficios.autoshoppingitapoan.com.br/health
```

## 📚 Documentação Completa

Veja [`CLOUDFLARE_DNS_SETUP.md`](CLOUDFLARE_DNS_SETUP.md) para guia detalhado.

