# 🔧 Troubleshooting: Domínio Retornando 404

## ✅ O Que Está Funcionando

- ✅ Backend rodando na porta 3000
- ✅ Servidor respondendo em `localhost:3000`

## ❌ O Que Não Está Funcionando

- ❌ Domínio `api.asibeneficios.autoshoppingitapoan.com.br` retornando 404

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar Configuração do Domínio no Coolify

No Coolify, vá até sua aplicação Backend:

1. Clique na aba **"Configuration"** ou **"Settings"**
2. Procure por **"Domains"** ou **"Domínios"**
3. Verifique se `api.asibeneficios.autoshoppingitapoan.com.br` está adicionado
4. Se não estiver, adicione agora

### 2. Verificar DNS no Cloudflare

1. Acesse: https://dash.cloudflare.com
2. Domínio: `autoshoppingitapoan.com.br`
3. Vá em **DNS** → **Records**
4. Verifique se existe o registro:
   - Tipo: `A`
   - Nome: `api.asibeneficios`
   - Conteúdo: `84.46.241.73`
   - Proxy: **Desativado** (nuvem cinza)

### 3. Testar Conexão Direta pelo IP

Primeiro, teste se o backend responde pelo IP:

```bash
# Teste pelo IP direto
curl http://84.46.241.73:3000/health
```

Se funcionar, o problema é DNS/domínio.

### 4. Verificar Propagação DNS

Execute no terminal (ou use https://dnschecker.org):

```bash
nslookup api.asibeneficios.autoshoppingitapoan.com.br
```

Deve retornar: `84.46.241.73`

### 5. Verificar Porta no Coolify

No Coolify, verifique se:

1. **Port** está configurado como `3000`
2. O domínio está configurado para usar essa porta
3. Se estiver usando SSL, verifique se está configurado

## 🔧 Soluções Possíveis

### Solução 1: Adicionar Domínio no Coolify

1. No Coolify → Backend → **Settings** → **Domains**
2. Clique em **"Add Domain"** ou **"Adicionar Domínio"**
3. Digite: `api.asibeneficios.autoshoppingitapoan.com.br`
4. Salve
5. Faça **Redeploy**

### Solução 2: Verificar Porta Externa

Se o Coolify não estiver expondo a porta 3000 externamente:

1. No Coolify → Backend → **Settings**
2. Procure por **"Port"** ou **"Ports"**
3. Verifique se a porta `3000` está mapeada
4. Se não estiver, adicione

### Solução 3: Usar Porta Padrão HTTP (80)

O Coolify pode estar esperando requisições na porta 80 (HTTP padrão):

- Tente acessar: `http://api.asibeneficios.autoshoppingitapoan.com.br` (sem porta)
- O Coolify deve fazer proxy automático para a porta 3000

### Solução 4: Verificar Nginx/Proxy do Coolify

O Coolify usa Traefik/Nginx como proxy reverso. Verifique:

1. Se o domínio está configurado corretamente
2. Se há algum erro nos logs do Traefik/Nginx
3. Se o SSL está configurado (pode causar problemas se não estiver)

## 📋 Checklist Rápido

- [ ] Domínio adicionado no Coolify?
- [ ] DNS configurado no Cloudflare?
- [ ] DNS propagado? (teste com nslookup)
- [ ] Porta 3000 configurada no Coolify?
- [ ] Backend respondendo em `localhost:3000`?
- [ ] SSL configurado? (pode causar problemas se não estiver)

## 🆘 Teste Rápido

1. **Teste pelo IP:**
   ```bash
   curl http://84.46.241.73:3000/health
   ```

2. **Teste pelo domínio sem porta:**
   ```bash
   curl http://api.asibeneficios.autoshoppingitapoan.com.br/health
   ```

3. **Verifique DNS:**
   ```bash
   nslookup api.asibeneficios.autoshoppingitapoan.com.br
   ```

## 💡 Próximos Passos

1. Verifique se o domínio está adicionado no Coolify
2. Verifique se o DNS está configurado no Cloudflare
3. Aguarde propagação DNS (pode levar alguns minutos)
4. Teste novamente

---

**Me avise o resultado dos testes acima!**

