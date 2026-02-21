-- =====================================================
-- SISTEMA CLIENTE VIP - AUTO SHOPPING ITAPOAN
-- Schema PostgreSQL Completo
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca de texto

-- =====================================================
-- 1. TIPOS DE USUÁRIO E AUTENTICAÇÃO
-- =====================================================

-- Enum para tipos de perfil
CREATE TYPE user_role AS ENUM (
    'admin_mt',      -- Admin MT - controla tudo
    'admin_shopping', -- Admin Shopping - visualiza relatórios completos
    'lojista',       -- Lojistas - acessam apenas seus clientes
    'parceiro',      -- Parceiros - validam benefícios
    'cliente_vip'    -- Cliente VIP - acessa cartão digital e abre chamados
);

-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_ativo ON users(ativo);

-- =====================================================
-- 2. LOJAS
-- =====================================================

-- Tabela de lojas
CREATE TABLE lojas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    ativo BOOLEAN DEFAULT true,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Usuário lojista associado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para lojas
CREATE INDEX idx_lojas_user_id ON lojas(user_id);
CREATE INDEX idx_lojas_ativo ON lojas(ativo);

-- =====================================================
-- 3. CLIENTES VIP
-- =====================================================

-- Enum para status do cliente VIP
CREATE TYPE vip_status AS ENUM (
    'ativo',
    'vencido',
    'renovado',
    'cancelado'
);

-- Tabela de clientes VIP
CREATE TABLE clientes_vip (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    status vip_status DEFAULT 'ativo',
    data_venda DATE NOT NULL,
    data_ativacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_validade DATE NOT NULL, -- 12 meses após a venda
    data_renovacao DATE, -- Data da última renovação
    qr_code_digital VARCHAR(255) UNIQUE NOT NULL, -- QR Code dinâmico para validação
    qr_code_fisico VARCHAR(255) UNIQUE, -- QR Code fixo do cartão físico
    veiculo_marca VARCHAR(100),
    veiculo_modelo VARCHAR(100),
    veiculo_ano INTEGER,
    veiculo_placa VARCHAR(10),
    veiculo_valor NUMERIC(12, 2),
    potencial_recompra BOOLEAN DEFAULT false, -- Marca se é potencial para recompra
    notificado_vencimento BOOLEAN DEFAULT false, -- Se já foi notificado sobre vencimento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para clientes VIP
CREATE INDEX idx_clientes_vip_loja_id ON clientes_vip(loja_id);
CREATE INDEX idx_clientes_vip_status ON clientes_vip(status);
CREATE INDEX idx_clientes_vip_data_validade ON clientes_vip(data_validade);
CREATE INDEX idx_clientes_vip_qr_digital ON clientes_vip(qr_code_digital);
CREATE INDEX idx_clientes_vip_qr_fisico ON clientes_vip(qr_code_fisico);
CREATE INDEX idx_clientes_vip_whatsapp ON clientes_vip(whatsapp);
CREATE INDEX idx_clientes_vip_potencial_recompra ON clientes_vip(potencial_recompra);

-- =====================================================
-- 4. PARCEIROS
-- =====================================================

-- Tabela de parceiros (lavagem, estética, oficina, etc.)
CREATE TABLE parceiros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    tipo VARCHAR(100) NOT NULL, -- lavagem, estetica, oficina, etc.
    ativo BOOLEAN DEFAULT true,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Usuário parceiro associado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para parceiros
CREATE INDEX idx_parceiros_user_id ON parceiros(user_id);
CREATE INDEX idx_parceiros_tipo ON parceiros(tipo);
CREATE INDEX idx_parceiros_ativo ON parceiros(ativo);

-- =====================================================
-- 5. BENEFÍCIOS
-- =====================================================

-- Enum para tipo de benefício
CREATE TYPE tipo_beneficio AS ENUM (
    'oficial',  -- Benefício oficial do shopping
    'loja'      -- Benefício adicionado pela loja
);

-- Tabela de benefícios oficiais do shopping
CREATE TABLE beneficios_oficiais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    parceiro_id UUID REFERENCES parceiros(id) ON DELETE RESTRICT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para benefícios oficiais
CREATE INDEX idx_beneficios_oficiais_parceiro_id ON beneficios_oficiais(parceiro_id);
CREATE INDEX idx_beneficios_oficiais_ativo ON beneficios_oficiais(ativo);

-- Tabela de benefícios adicionados pelas lojas
CREATE TABLE beneficios_loja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(100), -- lavagem_gratis, revisao, brinde, condicao_especial
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para benefícios de loja
CREATE INDEX idx_beneficios_loja_loja_id ON beneficios_loja(loja_id);
CREATE INDEX idx_beneficios_loja_ativo ON beneficios_loja(ativo);

-- =====================================================
-- 6. VALIDAÇÃO DE BENEFÍCIOS
-- =====================================================

-- Tabela de validações de benefícios (quando parceiro confirma uso)
CREATE TABLE validacoes_beneficios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_vip_id UUID NOT NULL REFERENCES clientes_vip(id) ON DELETE RESTRICT,
    parceiro_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    beneficio_oficial_id UUID REFERENCES beneficios_oficiais(id) ON DELETE SET NULL,
    beneficio_loja_id UUID REFERENCES beneficios_loja(id) ON DELETE SET NULL,
    tipo tipo_beneficio NOT NULL, -- oficial ou loja
    data_validacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    codigo_qr VARCHAR(255), -- Código QR usado na validação
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Garantir que pelo menos um benefício está preenchido
ALTER TABLE validacoes_beneficios 
ADD CONSTRAINT check_beneficio_preenchido 
CHECK (
    (beneficio_oficial_id IS NOT NULL AND beneficio_loja_id IS NULL) OR
    (beneficio_oficial_id IS NULL AND beneficio_loja_id IS NOT NULL)
);

-- Índices para validações
CREATE INDEX idx_validacoes_cliente_vip_id ON validacoes_beneficios(cliente_vip_id);
CREATE INDEX idx_validacoes_parceiro_id ON validacoes_beneficios(parceiro_id);
CREATE INDEX idx_validacoes_data_validacao ON validacoes_beneficios(data_validacao);
CREATE INDEX idx_validacoes_beneficio_oficial_id ON validacoes_beneficios(beneficio_oficial_id);
CREATE INDEX idx_validacoes_beneficio_loja_id ON validacoes_beneficios(beneficio_loja_id);

-- =====================================================
-- 7. ATENDIMENTO PRIORITÁRIO (CHAMADOS)
-- =====================================================

-- Enum para tipo de chamado
CREATE TYPE tipo_chamado AS ENUM (
    'documentacao',
    'ajuste_pos_venda',
    'problema_loja',
    'duvidas_gerais'
);

-- Enum para status do chamado
CREATE TYPE status_chamado AS ENUM (
    'aberto',
    'em_andamento',
    'resolvido',
    'cancelado'
);

-- Tabela de chamados de atendimento prioritário
CREATE TABLE chamados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_vip_id UUID NOT NULL REFERENCES clientes_vip(id) ON DELETE RESTRICT,
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    tipo tipo_chamado NOT NULL,
    status status_chamado DEFAULT 'aberto',
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    prioridade INTEGER DEFAULT 1, -- 1 = baixa, 2 = média, 3 = alta
    responsavel_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Usuário da central que está responsável
    data_resolucao TIMESTAMP,
    observacoes_resolucao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para chamados
CREATE INDEX idx_chamados_cliente_vip_id ON chamados(cliente_vip_id);
CREATE INDEX idx_chamados_loja_id ON chamados(loja_id);
CREATE INDEX idx_chamados_status ON chamados(status);
CREATE INDEX idx_chamados_tipo ON chamados(tipo);
CREATE INDEX idx_chamados_responsavel_id ON chamados(responsavel_id);
CREATE INDEX idx_chamados_created_at ON chamados(created_at);

-- Tabela de histórico de chamados (para auditoria)
CREATE TABLE chamados_historico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL, -- criado, atualizado, resolvido, etc.
    status_anterior status_chamado,
    status_novo status_chamado,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para histórico de chamados
CREATE INDEX idx_chamados_historico_chamado_id ON chamados_historico(chamado_id);
CREATE INDEX idx_chamados_historico_created_at ON chamados_historico(created_at);

-- =====================================================
-- 8. AVALIAÇÕES E RANKING
-- =====================================================

-- Tabela de avaliações dos clientes
CREATE TABLE avaliacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_vip_id UUID NOT NULL REFERENCES clientes_vip(id) ON DELETE RESTRICT,
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 10),
    comentario TEXT,
    anonima BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_vip_id, loja_id) -- Um cliente só pode avaliar uma loja uma vez
);

-- Índices para avaliações
CREATE INDEX idx_avaliacoes_cliente_vip_id ON avaliacoes(cliente_vip_id);
CREATE INDEX idx_avaliacoes_loja_id ON avaliacoes(loja_id);
CREATE INDEX idx_avaliacoes_nota ON avaliacoes(nota);
CREATE INDEX idx_avaliacoes_created_at ON avaliacoes(created_at);

-- View para ranking de lojas (calcula nota média e quantidade)
-- Apenas inclui lojas que têm pelo menos uma avaliação
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

-- =====================================================
-- 9. VENDAS (para rastreamento e ativação automática)
-- =====================================================

-- Tabela de vendas (registro de vendas que geram VIP)
CREATE TABLE vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    cliente_vip_id UUID REFERENCES clientes_vip(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL, -- Nome do cliente (necessário para ativação automática)
    whatsapp VARCHAR(20) NOT NULL, -- WhatsApp do cliente (necessário para ativação automática)
    email VARCHAR(255), -- Email opcional
    data_venda DATE NOT NULL,
    valor DECIMAL(10, 2),
    veiculo_marca VARCHAR(100),
    veiculo_modelo VARCHAR(100),
    veiculo_ano INTEGER,
    veiculo_placa VARCHAR(10),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para vendas
CREATE INDEX idx_vendas_loja_id ON vendas(loja_id);
CREATE INDEX idx_vendas_cliente_vip_id ON vendas(cliente_vip_id);
CREATE INDEX idx_vendas_data_venda ON vendas(data_venda);

-- =====================================================
-- 10. NOTIFICAÇÕES E RENOVAÇÕES
-- =====================================================

-- Enum para tipo de notificação
CREATE TYPE tipo_notificacao AS ENUM (
    'vencimento_proximo', -- 30 dias antes do vencimento
    'vip_renovado',
    'beneficio_validado',
    'chamado_aberto',
    'chamado_resolvido'
);

-- Tabela de notificações
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_vip_id UUID REFERENCES clientes_vip(id) ON DELETE CASCADE,
    loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
    tipo tipo_notificacao NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    enviada BOOLEAN DEFAULT false,
    data_envio TIMESTAMP,
    enviada_para_mt_leads BOOLEAN DEFAULT false, -- Se foi enviada para MT Leads
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para notificações
CREATE INDEX idx_notificacoes_cliente_vip_id ON notificacoes(cliente_vip_id);
CREATE INDEX idx_notificacoes_loja_id ON notificacoes(loja_id);
CREATE INDEX idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX idx_notificacoes_enviada ON notificacoes(enviada);

-- Tabela de renovações
CREATE TABLE renovacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_vip_id UUID NOT NULL REFERENCES clientes_vip(id) ON DELETE RESTRICT,
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    data_renovacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nova_data_validade DATE NOT NULL,
    motivo VARCHAR(255), -- recompra, oferta, etc.
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para renovações
CREATE INDEX idx_renovacoes_cliente_vip_id ON renovacoes(cliente_vip_id);
CREATE INDEX idx_renovacoes_loja_id ON renovacoes(loja_id);
CREATE INDEX idx_renovacoes_data_renovacao ON renovacoes(data_renovacao);

-- =====================================================
-- 11. WEBHOOKS E EVENTOS (integração com MT Leads)
-- =====================================================

-- Tabela de eventos para webhooks
CREATE TABLE eventos_webhook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(100) NOT NULL, -- vip_ativado, vencimento_proximo, etc.
    entidade_tipo VARCHAR(100) NOT NULL, -- cliente_vip, chamado, etc.
    entidade_id UUID NOT NULL,
    payload JSONB NOT NULL,
    enviado BOOLEAN DEFAULT false,
    data_envio TIMESTAMP,
    tentativas INTEGER DEFAULT 0,
    erro TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para eventos webhook
CREATE INDEX idx_eventos_webhook_tipo ON eventos_webhook(tipo);
CREATE INDEX idx_eventos_webhook_enviado ON eventos_webhook(enviado);
CREATE INDEX idx_eventos_webhook_created_at ON eventos_webhook(created_at);

-- =====================================================
-- 12. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger de updated_at nas tabelas necessárias
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lojas_updated_at BEFORE UPDATE ON lojas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_vip_updated_at BEFORE UPDATE ON clientes_vip
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parceiros_updated_at BEFORE UPDATE ON parceiros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chamados_updated_at BEFORE UPDATE ON chamados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar QR Code único
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'VIP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 16));
END;
$$ LANGUAGE plpgsql;

-- Função para ativar cliente VIP automaticamente após venda
CREATE OR REPLACE FUNCTION ativar_cliente_vip()
RETURNS TRIGGER AS $$
DECLARE
    v_qr_digital VARCHAR(255);
    v_qr_fisico VARCHAR(255);
    v_data_validade DATE;
BEGIN
    -- Gerar QR codes únicos
    v_qr_digital := generate_qr_code();
    v_qr_fisico := 'FISICO-' || generate_qr_code();
    
    -- Calcular data de validade (12 meses após a venda)
    v_data_validade := NEW.data_venda + INTERVAL '12 months';
    
    -- Criar cliente VIP
    INSERT INTO clientes_vip (
        nome,
        whatsapp,
        email,
        loja_id,
        data_venda,
        data_validade,
        qr_code_digital,
        qr_code_fisico,
        veiculo_marca,
        veiculo_modelo,
        veiculo_ano,
        veiculo_placa,
        status
    ) VALUES (
        NEW.nome,
        NEW.whatsapp,
        NEW.email,
        NEW.loja_id,
        NEW.data_venda,
        v_data_validade,
        v_qr_digital,
        v_qr_fisico,
        NEW.veiculo_marca,
        NEW.veiculo_modelo,
        NEW.veiculo_ano,
        NEW.veiculo_placa,
        'ativo'
    ) RETURNING id INTO NEW.cliente_vip_id;
    
    -- Criar evento para webhook (MT Leads)
    INSERT INTO eventos_webhook (
        tipo,
        entidade_tipo,
        entidade_id,
        payload
    ) VALUES (
        'vip_ativado',
        'cliente_vip',
        NEW.cliente_vip_id,
        jsonb_build_object(
            'cliente_id', NEW.cliente_vip_id,
            'nome', NEW.nome,
            'whatsapp', NEW.whatsapp,
            'loja_id', NEW.loja_id,
            'data_validade', v_data_validade
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ativar VIP automaticamente quando uma venda for inserida
CREATE TRIGGER trigger_ativar_vip_apos_venda
    AFTER INSERT ON vendas
    FOR EACH ROW
    WHEN (NEW.cliente_vip_id IS NULL) -- Só ativa se ainda não tiver cliente VIP associado
    EXECUTE FUNCTION ativar_cliente_vip();

-- Função para verificar e notificar vencimentos próximos
CREATE OR REPLACE FUNCTION verificar_vencimentos_proximos()
RETURNS void AS $$
DECLARE
    v_cliente RECORD;
BEGIN
    -- Buscar clientes que vencem em 30 dias e ainda não foram notificados
    FOR v_cliente IN 
        SELECT id, nome, whatsapp, loja_id, data_validade
        FROM clientes_vip
        WHERE status = 'ativo'
        AND data_validade BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        AND notificado_vencimento = false
    LOOP
        -- Criar notificação
        INSERT INTO notificacoes (
            cliente_vip_id,
            loja_id,
            tipo,
            titulo,
            mensagem
        ) VALUES (
            v_cliente.id,
            v_cliente.loja_id,
            'vencimento_proximo',
            'Seu VIP está próximo do vencimento',
            'Seu cartão VIP vence em ' || EXTRACT(DAY FROM (v_cliente.data_validade - CURRENT_DATE)) || ' dias. Renove agora!'
        );
        
        -- Criar evento para webhook
        INSERT INTO eventos_webhook (
            tipo,
            entidade_tipo,
            entidade_id,
            payload
        ) VALUES (
            'vencimento_proximo',
            'cliente_vip',
            v_cliente.id,
            jsonb_build_object(
                'cliente_id', v_cliente.id,
                'nome', v_cliente.nome,
                'whatsapp', v_cliente.whatsapp,
                'data_validade', v_cliente.data_validade,
                'dias_restantes', EXTRACT(DAY FROM (v_cliente.data_validade - CURRENT_DATE))
            )
        );
        
        -- Marcar como notificado
        UPDATE clientes_vip
        SET notificado_vencimento = true
        WHERE id = v_cliente.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status de clientes vencidos
CREATE OR REPLACE FUNCTION atualizar_status_vencidos()
RETURNS void AS $$
BEGIN
    UPDATE clientes_vip
    SET status = 'vencido'
    WHERE status = 'ativo'
    AND data_validade < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 13. VIEWS ÚTEIS PARA RELATÓRIOS
-- =====================================================

-- View: Clientes VIP por mês e por loja
CREATE OR REPLACE VIEW relatorio_clientes_vip_mes AS
SELECT 
    DATE_TRUNC('month', data_ativacao) as mes,
    loja_id,
    l.nome as loja_nome,
    COUNT(*) as total_clientes,
    COUNT(*) FILTER (WHERE status = 'ativo') as clientes_ativos,
    COUNT(*) FILTER (WHERE status = 'vencido') as clientes_vencidos,
    COUNT(*) FILTER (WHERE status = 'renovado') as clientes_renovados
FROM clientes_vip cv
JOIN lojas l ON cv.loja_id = l.id
GROUP BY DATE_TRUNC('month', data_ativacao), loja_id, l.nome
ORDER BY mes DESC, total_clientes DESC;

-- View: Uso de benefícios por parceiro
CREATE OR REPLACE VIEW relatorio_uso_beneficios AS
SELECT 
    p.id as parceiro_id,
    p.nome as parceiro_nome,
    p.tipo as parceiro_tipo,
    COUNT(vb.id) as total_validacoes,
    COUNT(DISTINCT vb.cliente_vip_id) as clientes_unicos,
    DATE_TRUNC('month', vb.data_validacao) as mes
FROM parceiros p
LEFT JOIN validacoes_beneficios vb ON p.id = vb.parceiro_id
WHERE vb.beneficio_oficial_id IS NOT NULL
GROUP BY p.id, p.nome, p.tipo, DATE_TRUNC('month', vb.data_validacao)
ORDER BY mes DESC, total_validacoes DESC;

-- View: Chamados de pós-venda por loja
CREATE OR REPLACE VIEW relatorio_chamados_loja AS
SELECT 
    l.id as loja_id,
    l.nome as loja_nome,
    COUNT(c.id) as total_chamados,
    COUNT(*) FILTER (WHERE c.status = 'aberto') as chamados_abertos,
    COUNT(*) FILTER (WHERE c.status = 'em_andamento') as chamados_em_andamento,
    COUNT(*) FILTER (WHERE c.status = 'resolvido') as chamados_resolvidos,
    DATE_TRUNC('month', c.created_at) as mes
FROM lojas l
LEFT JOIN chamados c ON l.id = c.loja_id
GROUP BY l.id, l.nome, DATE_TRUNC('month', c.created_at)
ORDER BY mes DESC, total_chamados DESC;

-- View: Clientes próximos do vencimento
CREATE OR REPLACE VIEW relatorio_clientes_vencimento_proximo AS
SELECT 
    cv.id,
    cv.nome,
    cv.whatsapp,
    cv.loja_id,
    l.nome as loja_nome,
    cv.data_validade,
    (cv.data_validade - CURRENT_DATE) as dias_restantes,
    cv.potencial_recompra,
    cv.notificado_vencimento
FROM clientes_vip cv
JOIN lojas l ON cv.loja_id = l.id
WHERE cv.status = 'ativo'
AND cv.data_validade BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY cv.data_validade ASC;

-- View: Clientes renovados / recompra
CREATE OR REPLACE VIEW relatorio_clientes_renovados AS
SELECT 
    r.id as renovacao_id,
    r.cliente_vip_id,
    cv.nome as cliente_nome,
    cv.whatsapp,
    r.loja_id,
    l.nome as loja_nome,
    r.data_renovacao,
    r.nova_data_validade,
    r.motivo,
    cv.potencial_recompra
FROM renovacoes r
JOIN clientes_vip cv ON r.cliente_vip_id = cv.id
JOIN lojas l ON r.loja_id = l.id
ORDER BY r.data_renovacao DESC;

-- =====================================================
-- 14. COMENTÁRIOS NAS TABELAS (DOCUMENTAÇÃO)
-- =====================================================

COMMENT ON TABLE users IS 'Usuários do sistema com diferentes perfis (Admin MT, Admin Shopping, Lojistas, Parceiros, Cliente VIP)';
COMMENT ON TABLE lojas IS 'Lojas do Auto Shopping Itapoan';
COMMENT ON TABLE clientes_vip IS 'Clientes VIP do programa de fidelidade';
COMMENT ON TABLE parceiros IS 'Parceiros que validam benefícios (lavagem, estética, oficina, etc.)';
COMMENT ON TABLE beneficios_oficiais IS 'Benefícios oficiais pré-configurados do shopping';
COMMENT ON TABLE beneficios_loja IS 'Benefícios adicionados individualmente por cada loja';
COMMENT ON TABLE validacoes_beneficios IS 'Registro de validações de benefícios pelos parceiros';
COMMENT ON TABLE chamados IS 'Chamados de atendimento prioritário (pós-venda)';
COMMENT ON TABLE avaliacoes IS 'Avaliações dos clientes sobre as lojas';
COMMENT ON TABLE vendas IS 'Registro de vendas que geram ativação automática do VIP';
COMMENT ON TABLE notificacoes IS 'Notificações enviadas aos clientes (integração com MT Leads)';
COMMENT ON TABLE renovacoes IS 'Registro de renovações do VIP';
COMMENT ON TABLE eventos_webhook IS 'Eventos para integração com sistemas externos (MT Leads)';

-- =====================================================
-- 15. DADOS INICIAIS (SEEDS)
-- =====================================================

-- Inserir usuário Admin MT padrão (senha deve ser alterada)
-- Senha padrão: 'admin123' (hash bcrypt - você deve gerar o hash real)
INSERT INTO users (email, password_hash, role, nome, ativo) VALUES
('admin@autoshopping.com', '$2b$10$exemplo_hash_aqui_altere_antes_de_usar', 'admin_mt', 'Admin MT', true);

-- Inserir usuário Admin Shopping padrão
INSERT INTO users (email, password_hash, role, nome, ativo) VALUES
('admin.shopping@autoshopping.com', '$2b$10$exemplo_hash_aqui_altere_antes_de_usar', 'admin_shopping', 'Admin Shopping', true);

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================

