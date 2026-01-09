# 🔧 Troubleshooting: Frontend "no available server"

## ❌ Problema

- Erro: "no available server" ao acessar `https://asibeneficios.autoshoppingitapoan.com.br`
- Caddy está rodando mas não está servindo o frontend

## 🔍 Verificações Necessárias

### 1. Verificar se o Deploy foi Concluído

No Coolify → Frontend → Deployments:
- Verifique se o último deploy foi **"Success"**
- Se ainda estiver em "Building" ou "Failed", aguarde ou corrija o erro

### 2. Verificar Logs do Frontend

No Coolify → Frontend → Logs:
- Verifique se há erros
- Verifique se o build foi concluído
- Verifique se os arquivos estão sendo servidos

### 3. Verificar Configuração do Domínio

No Coolify → Frontend → Configuration → Domains:
- Verifique se `asibeneficios.autoshoppingitapoan.com.br` está adicionado
- Verifique se há algum erro de validação DNS

### 4. Verificar Publish Directory

No Coolify → Frontend → Configuration → Build:
- **Publish Directory** deve ser: `dist`
- Se estiver diferente, altere para `dist`

### 5. Verificar Build Command

No Coolify → Frontend → Configuration → Build:
- **Build Command** deve ser: `npm run build`
- Ou deixe vazio (Nixpacks detecta automaticamente)

## 🔧 Soluções Possíveis

### Solução 1: Verificar se Build Foi Concluído

1. Vá até Frontend → Deployments
2. Verifique se o último deploy foi bem-sucedido
3. Se falhou, veja os logs e corrija o erro

### Solução 2: Verificar Publish Directory

1. Vá até Frontend → Configuration → Build
2. Verifique se **Publish Directory** está como `dist`
3. Se não estiver, altere e faça Redeploy

### Solução 3: Verificar Variáveis de Ambiente

No Coolify → Frontend → Environment Variables:
- Verifique se tem:
  ```
  VITE_API_URL=https://api.asibeneficios.autoshoppingitapoan.com.br/api
  VITE_NODE_ENV=production
  ```

### Solução 4: Fazer Redeploy

1. Vá até Frontend → Deployments
2. Clique em **"Redeploy"**
3. Aguarde o build completar
4. Verifique os logs

### Solução 5: Verificar se Arquivos Estão Sendo Gerados

Nos logs do build, procure por:
- `dist` folder created
- Build completed successfully
- Files copied to dist

## 📋 Checklist

- [ ] Deploy foi concluído com sucesso?
- [ ] Publish Directory está como `dist`?
- [ ] Build Command está configurado?
- [ ] Variáveis de ambiente estão configuradas?
- [ ] Domínio está adicionado no Coolify?
- [ ] Logs mostram build bem-sucedido?

## 🆘 Próximos Passos

1. Verifique o status do deploy no Coolify
2. Verifique os logs do build
3. Verifique a configuração do Publish Directory
4. Se necessário, faça um Redeploy

---

**Me avise o que você encontrou nos logs e no status do deploy!**

