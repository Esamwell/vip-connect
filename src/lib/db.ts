/**
 * Configuração de conexão com o banco de dados PostgreSQL
 * 
 * Este arquivo será usado quando você criar o backend/API.
 * Por enquanto, o frontend React não se conecta diretamente ao banco.
 * 
 * Para usar este arquivo, você precisará:
 * 1. Instalar: npm install pg @types/pg
 * 2. Criar um servidor Node.js/Express
 * 3. Usar este arquivo no backend
 */

// Importar variáveis de ambiente
const dbConfig = {
  host: import.meta.env.VITE_DATABASE_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DATABASE_PORT || '5433'),
  database: import.meta.env.VITE_DATABASE_NAME || 'vip_connect',
  user: import.meta.env.VITE_DATABASE_USER || 'clientvipasi',
  password: import.meta.env.VITE_DATABASE_PASSWORD || '1923731sS$',
  ssl: false, // Para desenvolvimento local
};

// Connection string format
export const getDatabaseUrl = (): string => {
  return `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
};

// Exportar configuração
export default dbConfig;

/**
 * EXEMPLO DE USO NO BACKEND (Node.js/Express):
 * 
 * import pg from 'pg';
 * import dbConfig from './lib/db';
 * 
 * const pool = new pg.Pool(dbConfig);
 * 
 * // Exemplo de query
 * const result = await pool.query('SELECT * FROM clientes_vip LIMIT 10');
 * console.log(result.rows);
 */

