import pool from './server/src/config/database.js';

async function fixDb() {
  try {
    const client = await pool.connect();
    
    console.log('Alterando regra de NOT NULL em avaliacoes.loja_id...');
    await client.query('ALTER TABLE avaliacoes ALTER COLUMN loja_id DROP NOT NULL;');
    
    console.log('Atualizando a view ranking_lojas para ignorar notas isoladas de vendedores...');
    await client.query(`
      CREATE OR REPLACE VIEW ranking_lojas AS
      SELECT 
          l.id,
          l.nome,
          COUNT(a.id)::integer as quantidade_avaliacoes,
          ROUND(AVG(a.nota)::numeric, 2) as nota_media,
          ROW_NUMBER() OVER (ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking
      FROM lojas l
      INNER JOIN avaliacoes a ON l.id = a.loja_id AND a.vendedor_id IS NULL
      WHERE l.ativo = true
      GROUP BY l.id, l.nome
      HAVING COUNT(a.id) > 0
      ORDER BY nota_media DESC, quantidade_avaliacoes DESC;
    `);
    
    console.log('Migração concluída com sucesso!');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

fixDb();
