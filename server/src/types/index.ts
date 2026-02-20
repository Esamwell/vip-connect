// Tipos de usuário
export type UserRole = 
  | 'admin_mt' 
  | 'admin_shopping' 
  | 'lojista' 
  | 'parceiro' 
  | 'vendedor'
  | 'cliente_vip';

// Status do cliente VIP
export type VipStatus = 'ativo' | 'vencido' | 'renovado' | 'cancelado';

// Tipo de benefício
export type TipoBeneficio = 'oficial' | 'loja';

// Tipo de chamado
export type TipoChamado = 
  | 'documentacao' 
  | 'ajuste_pos_venda' 
  | 'problema_loja' 
  | 'duvidas_gerais';

// Status do chamado
export type StatusChamado = 
  | 'aberto' 
  | 'em_andamento' 
  | 'resolvido' 
  | 'cancelado';

// Interface do usuário
export interface User {
  id: string;
  email: string;
  role: UserRole;
  nome: string;
  whatsapp?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface do cliente VIP
export interface ClienteVip {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  loja_id: string;
  status: VipStatus;
  data_venda: Date;
  data_ativacao: Date;
  data_validade: Date;
  data_renovacao?: Date;
  qr_code_digital: string;
  qr_code_fisico?: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: number;
  veiculo_placa?: string;
  potencial_recompra: boolean;
  notificado_vencimento: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface da loja
export interface Loja {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
  user_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Interface do parceiro
export interface Parceiro {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  tipo: string;
  ativo: boolean;
  user_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Interface de benefício oficial
export interface BeneficioOficial {
  id: string;
  nome: string;
  descricao?: string;
  parceiro_id: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface de benefício de loja
export interface BeneficioLoja {
  id: string;
  loja_id: string;
  nome: string;
  descricao?: string;
  tipo?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface de validação de benefício
export interface ValidacaoBeneficio {
  id: string;
  cliente_vip_id: string;
  parceiro_id: string;
  beneficio_oficial_id?: string;
  beneficio_loja_id?: string;
  tipo: TipoBeneficio;
  data_validacao: Date;
  codigo_qr?: string;
  observacoes?: string;
  created_at: Date;
}

// Interface de chamado
export interface Chamado {
  id: string;
  cliente_vip_id: string;
  loja_id: string;
  tipo: TipoChamado;
  status: StatusChamado;
  titulo: string;
  descricao: string;
  prioridade: number;
  responsavel_id?: string;
  data_resolucao?: Date;
  observacoes_resolucao?: string;
  created_at: Date;
  updated_at: Date;
}

// Interface de avaliação
export interface Avaliacao {
  id: string;
  cliente_vip_id: string;
  loja_id: string;
  vendedor_id?: string;
  nota: number;
  comentario?: string;
  anonima: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface de venda
export interface Venda {
  id: string;
  loja_id: string;
  cliente_vip_id?: string;
  vendedor_id?: string;
  nome: string;
  whatsapp: string;
  email?: string;
  data_venda: Date;
  valor?: number;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: number;
  veiculo_placa?: string;
  observacoes?: string;
  created_at: Date;
}

// Payload JWT
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Interface de vendedor
export interface Vendedor {
  id: string;
  user_id: string;
  loja_id: string;
  nome: string;
  whatsapp?: string;
  email?: string;
  codigo_vendedor: string;
  comissao_padrao: number;
  meta_vendas: number;
  meta_vendas_valor: number;
  ativo: boolean;
  data_contratacao: Date;
  created_at: Date;
  updated_at: Date;
}

// Interface de voucher para vendedor
export interface VoucherVendedor {
  id: string;
  vendedor_id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  valor?: number;
  codigo: string;
  valido_de?: Date;
  valido_ate?: Date;
  quantidade_disponivel: number;
  quantidade_utilizada: number;
  ativo: boolean;
  criado_por?: string;
  created_at: Date;
  updated_at: Date;
}

// Interface de resgate de voucher
export interface ResgateVoucherVendedor {
  id: string;
  vendedor_id: string;
  voucher_id: string;
  data_resgate: Date;
  status: string;
  observacoes?: string;
  validado_por?: string;
  created_at: Date;
}

// Interface de premiação por ranking
export interface PremiacaoRanking {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  posicao_minima: number;
  posicao_maxima: number;
  premio: string;
  valor_premio?: number;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface de premiação recebida
export interface PremiacaoRecebida {
  id: string;
  vendedor_id: string;
  premiacoes_ranking_id: string;
  periodo_referencia: Date;
  posicao_ranking: number;
  data_premiacao: Date;
  status: string;
  observacoes?: string;
  created_at: Date;
}

// Interface de ranking de vendedores
export interface RankingVendedor {
  id: string;
  nome: string;
  loja_id: string;
  loja_nome: string;
  total_vendas: number;
  valor_total_vendas: number;
  nota_media_avaliacao: number;
  total_avaliacoes: number;
  posicao_ranking_loja: number;
  posicao_ranking_geral: number;
}

// Interface de ranking de avaliação de vendedores
export interface RankingAvaliacaoVendedor {
  id: string;
  nome: string;
  loja_id: string;
  loja_nome: string;
  total_avaliacoes: number;
  nota_media: number;
  avaliacoes_9_10: number;
  avaliacoes_7_8: number;
  avaliacoes_abaixo_7: number;
  posicao_ranking_loja: number;
  posicao_ranking_geral: number;
}

