# 🔍 Diagnóstico Completo: Frontend "no available server"

## ❌ Problema Atual

- Erro: "no available server" ao acessar `https://asibeneficios.autoshoppingitapoan.com.br`
- Caddy está rodando mas não encontra os arquivos

## 📋 Checklist de Diagnóstico

### 1. ✅ Verificar Status do Deploy

No Coolify → Frontend → Deployments:
- [ ] Último deploy foi "Success"?
- [ ] Quando foi o último deploy?
- [ ] Há algum deploy em andamento?

### 2. ✅ Verificar Logs do Build

No Coolify → Frontend → Logs:
- [ ] Procure por "Build completed" ou "Build failed"
- [ ] Há erros durante o build?
- [ ] Os arquivos foram gerados em `dist/`?

### 3. ✅ Verificar Configuração

No Coolify → Frontend → Configuration → Build:
- [ ] Install Command: `npm install`
- [ ] Build Command: `npm run build`
- [ ] Start Command: (vazio)
- [ ] Base Directory: `./`
- [ ] **Publish Directory: `dist`** ⚠️ CRÍTICO

### 4. ✅ Verificar Domínio

No Coolify → Frontend → Configuration → Domains:
- [ ] `asibeneficios.autoshoppingitapoan.com.br` está adicionado?
- [ ] Há algum erro de validação?

### 5. ✅ Verificar Variáveis de Ambiente

No Coolify → Frontend → Environment Variables:
- [ ] `VITE_API_URL=https://api.asibeneficios.autoshoppingitapoan.com.br/api`
- [ ] `VITE_NODE_ENV=production`

## 🔧 Soluções Passo a Passo

### Solução 1: Fazer Redeploy Completo

1. Vá até Frontend → Deployments
2. Clique em **"Redeploy"**
3. Aguarde o build completar (pode levar 2-5 minutos)
4. Verifique os logs durante o build
5. Teste novamente após concluir

### Solução 2: Verificar Logs Detalhados

Nos logs, procure por:
- `npm run build` - confirma que o build foi executado
- `dist` - confirma que a pasta foi criada
- `vite build` - confirma que o Vite rodou
- Erros relacionados a `dist` ou `build`

### Solução 3: Verificar se Build Está Gerando Arquivos

Nos logs do build, você deve ver algo como:
```
> vite build
vite v5.x.x building for production...
dist/index.html
dist/assets/index-xxx.js
dist/assets/index-xxx.css
```

Se não ver isso, o build pode ter falhado.

### Solução 4: Testar HTTP ao Invés de HTTPS

Tente acessar:
```
http://asibeneficios.autoshoppingitapoan.com.br
```

Se funcionar com HTTP mas não com HTTPS, o problema é SSL.

### Solução 5: Verificar Container

No Coolify → Frontend → Terminal (se disponível):
- Verifique se o container está rodando
- Verifique se os arquivos estão em `/app/dist` ou `/dist`

## 🆘 Informações Necessárias

Para ajudar melhor, preciso saber:

1. **Status do último deploy:**
   - Success / Failed / Building?

2. **O que aparece nos logs do build:**
   - Há mensagens de "Build completed"?
   - Há erros?
   - Os arquivos foram gerados?

3. **Você fez Redeploy após alterar Publish Directory?**
   - Sim / Não

4. **O que aparece nos logs do container (não do build):**
   - Há mensagens do Caddy?
   - Há erros?

## 💡 Próximos Passos

1. Verifique o status do deploy
2. Veja os logs completos do build
3. Faça um Redeploy se necessário
4. Me envie o que você encontrou

---

**Me envie essas informações para eu ajudar melhor!**

