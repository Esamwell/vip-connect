-- 1. Remover a restrição NOT NULL da coluna loja_id na tabela avaliacoes
-- Isso permite avaliações exclusivas para vendedores, sem exigir uma loja.
ALTER TABLE avaliacoes ALTER COLUMN loja_id DROP NOT NULL;

-- 2. Atualizar a View de Ranking das Lojas
-- Modificamos a contagem para considerar APENAS avaliações diretas às lojas (onde vendedor_id é nulo)
-- ou vinculadas à loja explicitamente.
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
