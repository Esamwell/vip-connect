# 🔒 Resolver SSL no Coolify - Passo a Passo

## ❌ Problema Atual

O site está mostrando "Não seguro" (Not secure) porque o SSL não está configurado ou não foi ativado.

## ✅ Solução Completa

### PASSO 1: Verificar DNS no Cloudflare

**IMPORTANTE**: O SSL só funciona se o DNS estiver configurado corretamente.

1. Acesse: https://dash.cloudflare.com
2. Selecione o domínio: `autoshoppingitapoan.com.br`
3. Vá em **DNS** → **Records**

**Verifique se existem estes registros:**

**Frontend:**
- Tipo: `A`
- Nome: `asibeneficios`
- Conteúdo: `[IP_DO_SEU_VPS]` (ex: `84.46.241.73`)
- Proxy: **Desativado** (nuvem cinza) ⚠️ **CRÍTICO**

**Backend:**
- Tipo: `A`
- Nome: `api.asibeneficios`
- Conteúdo: `[IP_DO_SEU_VPS]` (mesmo IP)
- Proxy: **Desativado** (nuvem cinza) ⚠️ **CRÍTICO**

**⚠️ IMPORTANTE**: O Proxy do Cloudflare DEVE estar **desativado** (nuvem cinza) durante a validação do SSL. Depois que o SSL estiver funcionando, você pode ativar o proxy novamente.

### PASSO 2: Verificar Propagação DNS

Execute no terminal (ou use https://www.whatsmydns.net):

```bash
# Verificar Frontend
nslookup asibeneficios.autoshoppingitapoan.com.br

# Verificar Backend
nslookup api.asibeneficios.autoshoppingitapoan.com.br
```

Ambos devem retornar o IP do seu VPS. Se não retornar, aguarde alguns minutos e tente novamente.

### PASSO 3: Configurar SSL no Coolify - Frontend

1. **Acesse o Coolify** e vá até sua aplicação **Frontend**

2. **Vá em "Configuration" ou "Settings"**

3. **Procure por "Domains" ou "Domínios"**

4. **Verifique se o domínio está adicionado:**
   - Deve aparecer: `asibeneficios.autoshoppingitapoan.com.br`

5. **Habilitar SSL:**
   
   **Opção A - Se houver botão/toggle de SSL:**
   - Procure um botão **"Enable SSL"** ou **"Request Certificate"**
   - Ou um toggle/switch com label **"HTTPS"** ou **"SSL"**
   - Ou um ícone de cadeado 🔒 ao lado do domínio
   - Clique/ative o SSL

   **Opção B - Se não houver botão visível:**
   - Clique no domínio para editar
   - Procure por uma opção **"SSL"**, **"Let's Encrypt"**, ou **"HTTPS"**
   - Marque a opção para habilitar SSL
   - Salve as alterações

   **Opção C - Remover e readicionar domínio:**
   - Remova o domínio atual
   - Adicione novamente: `asibeneficios.autoshoppingitapoan.com.br`
   - Durante a adição, o Coolify pode perguntar se deseja habilitar SSL
   - Marque **"Enable SSL"** ou **"Request Let's Encrypt Certificate"**

6. **Aguardar validação:**
   - O Coolify vai solicitar o certificado SSL automaticamente
   - Isso pode levar 1-5 minutos
   - Verifique os logs da aplicação para ver o progresso

### PASSO 4: Configurar SSL no Coolify - Backend

Repita os mesmos passos para o **Backend**:

1. Vá até sua aplicação **Backend**
2. Vá em **"Configuration"** → **"Domains"**
3. Verifique se `api.asibeneficios.autoshoppingitapoan.com.br` está adicionado
4. Habilite SSL (mesmo processo do frontend)
5. Aguarde validação

### PASSO 5: Verificar Status do SSL

Após habilitar o SSL, verifique:

1. **Nos logs da aplicação** no Coolify:
   - Procure por mensagens sobre SSL ou Let's Encrypt
   - Pode aparecer "Certificate issued" ou "SSL enabled"

2. **Teste no navegador:**
   - Acesse: `https://asibeneficios.autoshoppingitapoan.com.br`
   - Deve mostrar cadeado verde 🔒
   - Se ainda mostrar "Não seguro", aguarde mais alguns minutos

3. **Teste via terminal:**
   ```bash
   curl -I https://asibeneficios.autoshoppingitapoan.com.br
   curl -I https://api.asibeneficios.autoshoppingitapoan.com.br/health
   ```

### PASSO 6: Se SSL Não Funcionar - Troubleshooting

#### Problema 1: DNS não propagado
**Solução**: Aguarde 5-10 minutos e verifique novamente com `nslookup`

#### Problema 2: Proxy Cloudflare ativado
**Solução**: 
- Desative o proxy no Cloudflare (nuvem cinza)
- Aguarde alguns minutos
- Tente habilitar SSL novamente no Coolify

#### Problema 3: Porta 80/443 bloqueada
**Solução**: Verifique se as portas estão abertas no firewall:
```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### Problema 4: Coolify não consegue validar domínio
**Solução**:
- Verifique se o domínio aponta para o IP correto do VPS
- Certifique-se de que o Coolify está acessível na porta 80/443
- Verifique os logs do Coolify para erros específicos

#### Problema 5: Certificado já existe mas não está sendo usado
**Solução**:
- No Coolify, vá em **Settings** → **Certificates**
- Verifique se há certificados existentes
- Tente remover e recriar o certificado

### PASSO 7: Após SSL Funcionando

1. **Atualizar CORS do Backend:**
   ```
   CORS_ORIGIN=https://asibeneficios.autoshoppingitapoan.com.br
   ```
   E faça **Redeploy** do Backend.

2. **Atualizar variáveis de ambiente do Frontend:**
   ```
   VITE_API_URL=https://api.asibeneficios.autoshoppingitapoan.com.br/api
   ```
   E faça **Redeploy** do Frontend.

3. **Opcional - Ativar Proxy Cloudflare:**
   - Após SSL funcionando, você pode ativar o proxy do Cloudflare novamente
   - Isso adiciona proteção DDoS e CDN
   - Mas mantenha desativado durante a validação inicial

## 🔍 Onde Procurar SSL no Coolify

Dependendo da versão do Coolify, o SSL pode estar em:

1. **Configuration** → **Domains** → [Domínio] → **SSL toggle**
2. **Settings** → **SSL** ou **Certificates**
3. **Security** → **Let's Encrypt**
4. Ao lado do domínio na lista de domínios

## 📸 O Que Você Deve Ver

Quando o SSL estiver funcionando:
- ✅ Cadeado verde no navegador
- ✅ URL começa com `https://`
- ✅ Sem aviso "Não seguro"
- ✅ Certificado válido ao clicar no cadeado

## 🆘 Se Ainda Não Funcionar

1. **Verifique a versão do Coolify:**
   - No canto superior direito do Coolify, veja a versão
   - Coolify v4 tem SSL mais integrado
   - Coolify v3 pode ter interface diferente

2. **Consulte a documentação oficial:**
   - https://coolify.io/docs
   - Procure por "SSL" ou "Let's Encrypt"

3. **Verifique logs do Coolify:**
   - Vá em **Settings** → **Logs** ou **System Logs**
   - Procure por erros relacionados a SSL ou certificados

4. **Tente via linha de comando (avançado):**
   ```bash
   # Conectar ao container do Coolify
   docker exec -it coolify-proxy bash
   
   # Verificar certificados
   ls -la /data/coolify/proxy/ssl/
   ```

---

**Siga os passos acima e me avise em qual etapa você está tendo dificuldade!**

