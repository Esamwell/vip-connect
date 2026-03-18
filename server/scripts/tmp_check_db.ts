import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'vip_connect',
  user: 'clientvipasi',
  password: '1923731sS$',
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'avaliacoes';
    `);
    console.log("Colunas de avaliacoes:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
