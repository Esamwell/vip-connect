# ⚡ Solução Rápida para SSL

## 🎯 Checklist Rápido

### ✅ 1. DNS Configurado?
- [ ] Cloudflare: `asibeneficios` → IP do VPS (Proxy DESATIVADO)
- [ ] Cloudflare: `api.asibeneficios` → IP do VPS (Proxy DESATIVADO)
- [ ] DNS propagado? Teste: `nslookup asibeneficios.autoshoppingitapoan.com.br`

### ✅ 2. Domínios Adicionados no Coolify?
- [ ] Frontend: `asibeneficios.autoshoppingitapoan.com.br`
- [ ] Backend: `api.asibeneficios.autoshoppingitapoan.com.br`

### ✅ 3. SSL Habilitado?
- [ ] Frontend → Configuration → Domains → [Domínio] → SSL ON
- [ ] Backend → Configuration → Domains → [Domínio] → SSL ON

### ✅ 4. Aguardou Validação?
- [ ] Aguardou 2-5 minutos após habilitar SSL
- [ ] Verificou logs do Coolify para "Certificate issued"

## 🚀 Solução em 3 Passos

### PASSO 1: Desativar Proxy Cloudflare (CRÍTICO)

No Cloudflare:
1. Vá em **DNS** → **Records**
2. Para ambos os registros (`asibeneficios` e `api.asibeneficios`):
   - Clique no registro
   - **Desative o Proxy** (nuvem deve ficar cinza)
   - Salve

### PASSO 2: Habilitar SSL no Coolify

**Frontend:**
1. Coolify → Frontend → Configuration → Domains
2. Clique no domínio `asibeneficios.autoshoppingitapoan.com.br`
3. Procure toggle/switch **"SSL"** ou **"HTTPS"** ou **"Let's Encrypt"**
4. **Ative** o SSL
5. Salve

**Backend:**
1. Coolify → Backend → Configuration → Domains
2. Clique no domínio `api.asibeneficios.autoshoppingitapoan.com.br`
3. **Ative** o SSL
4. Salve

### PASSO 3: Aguardar e Testar

1. Aguarde 2-5 minutos
2. Teste: `https://asibeneficios.autoshoppingitapoan.com.br`
3. Deve mostrar cadeado verde 🔒

## 🔍 Onde Está o Botão SSL?

Procure por:
- 🔒 Ícone de cadeado ao lado do domínio
- Toggle/switch com label "SSL" ou "HTTPS"
- Botão "Enable SSL" ou "Request Certificate"
- Seção "Certificates" ou "Security"

## ⚠️ Erro Comum

**"Certificate validation failed"** ou **"Domain not reachable"**

**Causa**: Proxy Cloudflare ativado ou DNS não propagado

**Solução**:
1. Desative proxy no Cloudflare
2. Aguarde 5 minutos
3. Tente habilitar SSL novamente

---

**Siga esses 3 passos e me avise o resultado!**

