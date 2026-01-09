# 🔒 Como Configurar SSL no Coolify

## 📍 Onde Encontrar SSL no Coolify

O SSL no Coolify pode estar em diferentes lugares dependendo da versão. Siga estes passos:

### Opção 1: Através da Configuração de Domínios

1. No Coolify, vá até sua aplicação **Backend**
2. Clique na aba **"Configuration"** ou **"Settings"**
3. Procure por **"Domains"** ou **"Domínios"**
4. Ao lado do domínio `api.asibeneficios.autoshoppingitapoan.com.br`, deve haver:
   - Um botão **"SSL"** ou **"Certificates"**
   - Ou um toggle/switch para **"HTTPS"** ou **"SSL"**
   - Ou um ícone de cadeado 🔒

### Opção 2: Através da Seção de Certificados

1. No Coolify, vá até sua aplicação **Backend**
2. Procure por uma aba ou seção chamada:
   - **"Certificates"**
   - **"SSL/TLS"**
   - **"Security"**
   - **"Let's Encrypt"**

### Opção 3: Configuração Automática

No Coolify v4, o SSL pode ser configurado automaticamente:

1. Vá até **Settings** → **Domains**
2. Adicione o domínio se ainda não estiver lá
3. O Coolify pode solicitar automaticamente certificado SSL
4. Procure por uma mensagem ou botão **"Request SSL Certificate"** ou **"Enable SSL"**

### Opção 4: Através do Menu Lateral

1. No menu lateral esquerdo do Coolify
2. Procure por:
   - **"Certificates"**
   - **"SSL"**
   - **"Security"**

## 🔍 Passo a Passo Detalhado

### 1. Verificar se o Domínio Está Adicionado

1. Vá até sua aplicação Backend
2. Clique em **"Configuration"** ou **"Settings"**
3. Na seção **"Domains"**, verifique se `api.asibeneficios.autoshoppingitapoan.com.br` está listado

### 2. Procurar Botão/Toggle de SSL

Ao lado do domínio, procure por:
- 🔒 Ícone de cadeado
- Botão **"Enable SSL"** ou **"Request Certificate"**
- Toggle/switch para **"HTTPS"**
- Link **"Configure SSL"**

### 3. Se Não Encontrar, Tentar Adicionar Domínio Novamente

1. Remova o domínio atual (se possível)
2. Adicione novamente: `api.asibeneficios.autoshoppingitapoan.com.br`
3. Durante a adição, o Coolify pode perguntar se deseja habilitar SSL
4. Marque a opção **"Enable SSL"** ou **"Request Let's Encrypt Certificate"**

## 🆘 Alternativas se Não Encontrar SSL

### Opção A: Testar Sem SSL Primeiro

O Coolify pode funcionar sem SSL configurado inicialmente. Teste:

```
http://api.asibeneficios.autoshoppingitapoan.com.br/health
```

Se funcionar, o SSL pode ser configurado depois.

### Opção B: Verificar Versão do Coolify

1. No canto superior direito do Coolify, veja a versão
2. Se for Coolify v3, o SSL pode estar em local diferente
3. Se for Coolify v4, o SSL deve estar mais integrado

### Opção C: Verificar Documentação

Consulte a documentação do Coolify:
- https://coolify.io/docs
- Procure por "SSL" ou "Let's Encrypt"

## 📸 O Que Procurar Visualmente

Procure por:
- 🔒 Ícone de cadeado
- Botão verde/azul com texto "SSL" ou "HTTPS"
- Toggle/switch com label "Enable SSL"
- Seção "Certificates" ou "Security"
- Mensagem "SSL Certificate" ou "Let's Encrypt"

## 💡 Dica Importante

No Coolify v4, o SSL pode ser **automático** quando você adiciona um domínio. Se o domínio já está adicionado e você não vê opção de SSL, pode ser que:

1. O SSL já está sendo processado em background
2. O SSL precisa ser habilitado em outro lugar
3. A versão do Coolify tem interface diferente

## 🔄 Próximos Passos

1. **Tente testar primeiro sem SSL:**
   ```
   http://api.asibeneficios.autoshoppingitapoan.com.br/health
   ```

2. **Se funcionar**, você pode configurar SSL depois

3. **Se não funcionar**, me envie uma captura de tela da tela de configuração do domínio no Coolify para eu ajudar melhor

---

**Me avise o que você encontrou ou se conseguiu testar pelo domínio!**

