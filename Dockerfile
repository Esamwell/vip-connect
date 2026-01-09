# Dockerfile para Frontend VIP Connect
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
# As variáveis de ambiente serão injetadas no build pelo Coolify
RUN npm run build

# Estágio de produção com Nginx
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx (opcional)
# Se não existir, o nginx usará a configuração padrão
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Comando de inicialização
CMD ["nginx", "-g", "daemon off;"]

