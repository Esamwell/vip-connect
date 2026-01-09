# 🔧 Corrigir Erro 404 ao Recarregar Página (SPA Routing)

## ❌ Problema

- Página `/login` abre normalmente
- Login funciona
- Mas ao recarregar (`F5`), dá erro 404
- Erro: "404 Not Found" do nginx/Caddy

## 🔍 Causa

O Coolify usa **Caddy** e ele não está configurado para fazer fallback para `index.html` em rotas SPA.

Quando você recarrega `/login`, o Caddy tenta procurar um arquivo físico `/login`, mas não existe porque é uma rota do React Router.

## ✅ Solução: Adicionar Caddyfile

Criei o arquivo `Caddyfile` na raiz do projeto com a configuração correta.

### O que fazer agora:

1. **Faça commit e push:**
   ```bash
   git add Caddyfile
   git commit -m "fix: adicionar Caddyfile para SPA routing"
   git push
   ```

2. **No Coolify, faça Redeploy do Frontend:**
   - Vá em Frontend → Deployments
   - Clique em "Redeploy"
   - Aguarde o build completar

3. **Teste:**
   - Acesse: `https://asibeneficios.autoshoppingitapoan.com.br/login`
   - Recarregue a página (`F5`)
   - Deve continuar na página de login (não dar 404)

## 🔍 O que o Caddyfile faz

- Configura o root para `/app/dist` (onde estão os arquivos buildados)
- Configura `try_files {path} /index.html` - faz fallback para index.html em todas as rotas
- Adiciona headers de segurança
- Configura cache para arquivos estáticos
- Habilita compressão gzip

## 📝 Alternativa: Verificar se está usando Dockerfile

Se o Coolify estiver usando o Dockerfile (com Nginx), verifique se o `nginx.conf` está sendo copiado corretamente.

No Coolify → Frontend → Configuration → Build:
- Verifique se está usando "Dockerfile" ou "Nixpacks"
- Se usar Dockerfile, o `nginx.conf` já tem a configuração correta

---

**Faça commit do Caddyfile e redeploy!**
