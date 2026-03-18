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


-- 3. Adicionar Tipo "asi" e tabelas para a nova categoria de Benefícios ASI
ALTER TYPE tipo_beneficio ADD VALUE IF NOT EXISTS 'asi';

CREATE TABLE IF NOT EXISTS beneficios_asi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alterando a tabela que salva o benefício nos clientes para suportar o ID de benefício ASI
ALTER TABLE clientes_beneficios ADD COLUMN IF NOT EXISTS beneficio_asi_id UUID REFERENCES beneficios_asi(id) ON DELETE CASCADE;

-- Atualizar enum no check se necessário (Postgres pode permitir se não houver constraint rígida na estrutura)
-- Relaxar validações de constraint, caso haja na tabela clientes_beneficios ou validacoes_beneficios
ALTER TABLE validacoes_beneficios ADD COLUMN IF NOT EXISTS beneficio_asi_id UUID REFERENCES beneficios_asi(id) ON DELETE SET NULL;
ALTER TABLE validacoes_beneficios DROP CONSTRAINT IF EXISTS check_beneficio_preenchido;

ALTER TABLE validacoes_beneficios 
ADD CONSTRAINT check_beneficio_preenchido 
CHECK (
    (beneficio_oficial_id IS NOT NULL AND beneficio_loja_id IS NULL AND beneficio_asi_id IS NULL) OR
    (beneficio_oficial_id IS NULL AND beneficio_loja_id IS NOT NULL AND beneficio_asi_id IS NULL) OR
    (beneficio_oficial_id IS NULL AND beneficio_loja_id IS NULL AND beneficio_asi_id IS NOT NULL)
);
