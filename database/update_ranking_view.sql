-- Atualizar view ranking_lojas para incluir apenas lojas com avaliações
-- e garantir ordenação correta

DROP VIEW IF EXISTS ranking_lojas CASCADE;

CREATE OR REPLACE VIEW ranking_lojas AS
SELECT 
    l.id,
    l.nome,
    COUNT(a.id)::integer as quantidade_avaliacoes,
    ROUND(AVG(a.nota)::numeric, 2) as nota_media,
    ROW_NUMBER() OVER (ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking
FROM lojas l
INNER JOIN avaliacoes a ON l.id = a.loja_id
WHERE l.ativo = true
GROUP BY l.id, l.nome
HAVING COUNT(a.id) > 0
ORDER BY nota_media DESC, quantidade_avaliacoes DESC;

