import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface NovoBeneficioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  apenasOficiais?: boolean; // Se true, só permite criar benefícios oficiais
  beneficioEditando?: BeneficioOficial | BeneficioLoja | null; // Benefício sendo editado
}

interface BeneficioOficial {
  id: string;
  nome: string;
  descricao?: string;
  parceiro_id?: string;
  parceiro_nome?: string;
  ativo: boolean;
  tipo?: 'oficial';
}

interface BeneficioLoja {
  id: string;
  nome: string;
  descricao?: string;
  loja_id?: string;
  loja_nome?: string;
  ativo: boolean;
  tipo?: 'loja';
}

interface Parceiro {
  id: string;
  nome: string;
  tipo?: string;
}

interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
}

interface FormData {
  nome: string;
  descricao?: string;
  tipo: 'oficial' | 'loja';
  parceiro_id?: string;
  loja_id?: string;
}

export function NovoBeneficioModal({ open, onOpenChange, onSuccess, apenasOficiais = false, beneficioEditando = null }: NovoBeneficioModalProps) {
  const [loading, setLoading] = useState(false);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [tipo, setTipo] = useState<'oficial' | 'loja'>('oficial');
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>();

  const parceiroSelecionado = watch('parceiro_id');
  const lojaSelecionada = watch('loja_id');

  useEffect(() => {
    if (open) {
      if (beneficioEditando) {
        // Modo edição
        const tipoEditando = beneficioEditando.tipo || (beneficioEditando as any).parceiro_id ? 'oficial' : 'loja';
        setTipo(tipoEditando);
        setValue('tipo', tipoEditando);
        
        const beneficioOficial = beneficioEditando as BeneficioOficial;
        const beneficioLoja = beneficioEditando as BeneficioLoja;
        
        reset({
          nome: beneficioEditando.nome,
          descricao: beneficioEditando.descricao || '',
          tipo: tipoEditando,
          parceiro_id: beneficioOficial.parceiro_id || '',
          loja_id: beneficioLoja.loja_id || '',
        });

        if (tipoEditando === 'oficial') {
          if (user?.role === 'admin_mt') {
            loadParceiros().then(() => {
              if (beneficioOficial.parceiro_id) {
                setValue('parceiro_id', beneficioOficial.parceiro_id);
              }
            });
          }
        }
        if (tipoEditando === 'loja') {
          if (user?.role === 'admin_mt') {
            loadLojas().then(() => {
              if (beneficioLoja.loja_id) {
                setValue('loja_id', beneficioLoja.loja_id);
              }
            });
          }
        }
      } else {
        // Modo criação
        // Lojistas só podem criar benefícios de loja
        if (user?.role === 'lojista') {
          setTipo('loja');
          setValue('tipo', 'loja');
          reset({
            tipo: 'loja',
          });
        } else {
          // Admin e parceiros podem criar benefícios oficiais
          setTipo('oficial');
          setValue('tipo', 'oficial');
          // Só carregar parceiros se for admin (parceiros não precisam selecionar)
          if (user?.role === 'admin_mt') {
            loadParceiros();
            loadLojas(); // Carregar lojas também para quando mudar para aba de loja
          }
          reset({
            tipo: 'oficial',
          });
          // Se for parceiro, buscar o parceiro dele automaticamente
          if (user?.role === 'parceiro') {
            api.get('/parceiros/me').then((parceiro: any) => {
              if (parceiro?.id) {
                setValue('parceiro_id', parceiro.id);
              }
            }).catch(() => {});
          }
        }
      }
    }
  }, [open, user, beneficioEditando]);

  const loadParceiros = async () => {
    try {
      const data = await api.get<Parceiro[]>('/parceiros').catch(() => []);
      setParceiros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error);
      setParceiros([]);
    }
  };

  const loadLojas = async () => {
    try {
      const data = await api.get<Loja[]>('/lojas').catch(() => []);
      setLojas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      setLojas([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!data.nome) {
      toast({
        title: 'Campo obrigatório',
        description: 'Nome do benefício é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      if (tipo === 'oficial' || apenasOficiais) {
        // Admin_mt e parceiros podem criar/editar benefícios oficiais
        if (user?.role !== 'admin_mt' && user?.role !== 'parceiro') {
          toast({
            title: 'Permissão negada',
            description: 'Apenas administradores e parceiros podem criar benefícios oficiais.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        // Se for parceiro, não precisa selecionar parceiro (usa o próprio)
        // Se for admin, precisa selecionar parceiro (exceto em edição se já tiver)
        if (user?.role === 'admin_mt' && !parceiroSelecionado && !beneficioEditando) {
          toast({
            title: 'Campo obrigatório',
            description: 'Parceiro é obrigatório para benefícios oficiais.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        // Criar ou atualizar benefício oficial
        if (beneficioEditando) {
          // Editar - não enviar parceiro_id pois não pode ser alterado
          await api.put(`/beneficios/oficiais/${beneficioEditando.id}`, {
            nome: data.nome,
            descricao: data.descricao,
          });
        } else {
          // Criar
          await api.post('/beneficios/oficiais', {
            nome: data.nome,
            descricao: data.descricao,
            parceiro_id: user?.role === 'parceiro' ? undefined : parceiroSelecionado,
          });
        }
      } else {
        // Criar ou atualizar benefício de loja
        // Admin precisa fornecer loja_id ao criar (não precisa ao editar se já tiver)
        if (user?.role === 'admin_mt' && !data.loja_id && !beneficioEditando) {
          toast({
            title: 'Campo obrigatório',
            description: 'Loja é obrigatória para benefícios de loja.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        if (beneficioEditando) {
          // Editar - não enviar loja_id pois não pode ser alterado
          await api.put(`/beneficios/loja/${beneficioEditando.id}`, {
            nome: data.nome,
            descricao: data.descricao,
          });
        } else {
          // Criar
          await api.post('/beneficios/loja', {
            nome: data.nome,
            descricao: data.descricao,
            loja_id: data.loja_id, // Admin especifica, lojista será ignorado e usado o da sessão
          });
        }
      }

      toast({
        title: 'Sucesso!',
        description: beneficioEditando ? 'Benefício atualizado com sucesso.' : 'Benefício criado com sucesso.',
      });
      reset();
      // Resetar tipo baseado no role do usuário
      if (user?.role === 'lojista') {
        setTipo('loja');
      } else {
        setTipo('oficial');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar benefício',
        description: error.message || 'Ocorreu um erro ao criar o benefício.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {beneficioEditando ? 'Editar Benefício' : 'Novo Benefício'}
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            {beneficioEditando 
              ? 'Edite as informações do benefício.'
              : user?.role === 'lojista' 
              ? 'Cadastre um novo benefício de loja para seus clientes.'
              : user?.role === 'parceiro'
              ? 'Cadastre um novo benefício oficial do seu serviço.'
              : 'Cadastre um novo benefício oficial do shopping ou da loja.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {user?.role === 'lojista' ? (
            // Lojistas só podem criar benefícios de loja
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_loja" className="text-sm font-medium">
                  Nome do Benefício *
                </Label>
                <Input
                  id="nome_loja"
                  placeholder="Ex: Revisão com desconto"
                  {...register('nome', { required: 'Nome é obrigatório' })}
                  className={errors.nome ? 'border-destructive' : ''}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_loja" className="text-sm font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="descricao_loja"
                  placeholder="Descreva o benefício oferecido pela loja"
                  {...register('descricao')}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          ) : !apenasOficiais && user?.role === 'admin_mt' ? (
            <Tabs 
              value={tipo} 
              onValueChange={(v) => {
                if (beneficioEditando) return; // Não permitir mudar tipo em edição
                const newTipo = v as 'oficial' | 'loja';
                setTipo(newTipo);
                setValue('tipo', newTipo, { shouldValidate: true });
                if (newTipo === 'oficial') {
                  loadParceiros();
                } else if (newTipo === 'loja' && user?.role === 'admin_mt') {
                  loadLojas();
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-2" disabled={!!beneficioEditando}>
                <TabsTrigger value="oficial" disabled={!!beneficioEditando}>Benefício Oficial</TabsTrigger>
                <TabsTrigger value="loja" disabled={!!beneficioEditando}>Benefício de Loja</TabsTrigger>
              </TabsList>

              <TabsContent value="oficial" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium">
                    Nome do Benefício *
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Lavagem Completa Grátis"
                    {...register('nome', { required: 'Nome é obrigatório' })}
                    className={errors.nome ? 'border-destructive' : ''}
                  />
                  {errors.nome && (
                    <p className="text-xs text-destructive">{errors.nome.message}</p>
                  )}
                </div>

                {/* Admin precisa selecionar parceiro, parceiros não precisam (usam o próprio) */}
                {user?.role === 'admin_mt' ? (
                  <div className="space-y-2">
                    <Label htmlFor="parceiro_id" className="text-sm font-medium">
                      Parceiro *
                    </Label>
                    {beneficioEditando ? (
                      <div className="p-3 bg-muted rounded-md border">
                        <p className="text-sm text-muted-foreground">
                          {(beneficioEditando as BeneficioOficial).parceiro_nome || 
                           parceiros.find(p => p.id === parceiroSelecionado)?.nome || 
                           'Parceiro vinculado'}
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={parceiroSelecionado}
                        onValueChange={(value) => setValue('parceiro_id', value, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o parceiro" />
                        </SelectTrigger>
                        <SelectContent>
                          {parceiros.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum parceiro disponível
                            </SelectItem>
                          ) : (
                            parceiros.map((parceiro) => (
                              <SelectItem key={parceiro.id} value={parceiro.id}>
                                {parceiro.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ) : user?.role === 'parceiro' ? (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Este benefício será vinculado ao seu parceiro automaticamente.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-sm font-medium">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descreva o benefício oferecido"
                    {...register('descricao')}
                    className="min-h-[100px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="loja" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_loja" className="text-sm font-medium">
                    Nome do Benefício *
                  </Label>
                  <Input
                    id="nome_loja"
                    placeholder="Ex: Revisão com desconto"
                    {...register('nome', { required: 'Nome é obrigatório' })}
                    className={errors.nome ? 'border-destructive' : ''}
                  />
                  {errors.nome && (
                    <p className="text-xs text-destructive">{errors.nome.message}</p>
                  )}
                </div>

                {/* Admin precisa selecionar loja, lojistas não precisam (usam a própria) */}
                {user?.role === 'admin_mt' ? (
                  <div className="space-y-2">
                    <Label htmlFor="loja_id" className="text-sm font-medium">
                      Loja *
                    </Label>
                    {beneficioEditando ? (
                      <div className="p-3 bg-muted rounded-md border">
                        <p className="text-sm text-muted-foreground">
                          {(beneficioEditando as BeneficioLoja).loja_nome || 
                           lojas.find(l => l.id === lojaSelecionada)?.nome || 
                           'Loja vinculada'}
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={lojaSelecionada}
                        onValueChange={(value) => setValue('loja_id', value, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a loja" />
                        </SelectTrigger>
                        <SelectContent>
                          {lojas.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhuma loja disponível
                            </SelectItem>
                          ) : (
                            lojas.filter(loja => loja.ativo).map((loja) => (
                              <SelectItem key={loja.id} value={loja.id}>
                                {loja.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="descricao_loja" className="text-sm font-medium">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao_loja"
                    placeholder="Descreva o benefício oferecido pela loja"
                    {...register('descricao')}
                    className="min-h-[100px]"
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : apenasOficiais && (user?.role === 'admin_mt' || user?.role === 'parceiro') ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">
                  Nome do Benefício *
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Lavagem Completa Grátis"
                  {...register('nome', { required: 'Nome é obrigatório' })}
                  className={errors.nome ? 'border-destructive' : ''}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>

              {/* Admin precisa selecionar parceiro, parceiros não precisam */}
              {user?.role === 'admin_mt' ? (
                <div className="space-y-2">
                  <Label htmlFor="parceiro_id" className="text-sm font-medium">
                    Parceiro *
                  </Label>
                  {beneficioEditando ? (
                    <div className="p-3 bg-muted rounded-md border">
                      <p className="text-sm text-muted-foreground">
                        {(beneficioEditando as BeneficioOficial).parceiro_nome || 
                         parceiros.find(p => p.id === parceiroSelecionado)?.nome || 
                         'Parceiro vinculado'}
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={parceiroSelecionado}
                      onValueChange={(value) => setValue('parceiro_id', value, { shouldValidate: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o parceiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {parceiros.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Nenhum parceiro disponível
                          </SelectItem>
                        ) : (
                          parceiros.map((parceiro) => (
                            <SelectItem key={parceiro.id} value={parceiro.id}>
                              {parceiro.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : user?.role === 'parceiro' ? (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Este benefício será vinculado ao seu parceiro automaticamente.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-sm font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o benefício oferecido"
                  {...register('descricao')}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {beneficioEditando ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                beneficioEditando ? 'Salvar Alterações' : 'Criar Benefício'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

