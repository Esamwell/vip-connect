/**
 * Configuração centralizada do banco de dados
 * 
 * Este arquivo centraliza todas as configurações relacionadas ao banco de dados.
 * Use este arquivo para acessar as configurações em qualquer parte da aplicação.
 */

// Configurações do banco de dados a partir das variáveis de ambiente
export const databaseConfig = {
  // Configurações de conexão
  host: import.meta.env.VITE_DATABASE_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DATABASE_PORT || '5433'),
  database: import.meta.env.VITE_DATABASE_NAME || 'vip_connect',
  user: import.meta.env.VITE_DATABASE_USER || 'clientvipasi',
  password: import.meta.env.VITE_DATABASE_PASSWORD || '1923731sS$',
  
  // Connection string completa
  get connectionString() {
    return `postgresql://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;
  },
  
  // Configurações de pool (quando usar pg.Pool)
  pool: {
    max: 20, // Máximo de conexões no pool
    idleTimeoutMillis: 30000, // Tempo de inatividade antes de fechar conexão
    connectionTimeoutMillis: 2000, // Timeout para obter conexão do pool
  },
  
  // SSL (desabilitado para desenvolvimento local)
  ssl: false,
};

// Configurações da API (quando criar o backend)
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000, // 10 segundos
};

// Exportar tudo
export default {
  database: databaseConfig,
  api: apiConfig,
};

