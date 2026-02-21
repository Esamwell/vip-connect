import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Voucher {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  valor?: number;
  codigo: string;
  valido_de?: string;
  valido_ate?: string;
  quantidade_disponivel: number;
  quantidade_utilizada: number;
  total_resgates?: number;
  ativo: boolean;
  created_at: string;
}

interface NovoVoucherForm {
  nome: string;
  descricao: string;
  tipo: string;
  valor: string;
  valido_de: string;
  valido_ate: string;
  quantidade_disponivel: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedorId: string;
  vendedorNome: string;
}

export function GerenciarVouchersVendedorModal({ open, onOpenChange, vendedorId, vendedorNome }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [novoForm, setNovoForm] = useState<NovoVoucherForm>({
    nome: '',
    descricao: '',
    tipo: 'desconto',
    valor: '',
    valido_de: '',
    valido_ate: '',
    quantidade_disponivel: '1',
  });

  const { data: vouchers = [], isLoading } = useQuery<Voucher[]>({
    queryKey: ['vouchers-vendedor', vendedorId],
    queryFn: () => api.get<Voucher[]>(`/vouchers-vendedor/vendedor/${vendedorId}`),
    enabled: open && !!vendedorId,
  });

  const criarVoucher = useMutation({
    mutationFn: (data: any) => api.post('/vouchers-vendedor', data),
    onSuccess: () => {
      toast({ title: 'Voucher criado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['vouchers-vendedor', vendedorId] });
      setNovoForm({
        nome: '',
        descricao: '',
        tipo: 'desconto',
        valor: '',
        valido_de: '',
        valido_ate: '',
        quantidade_disponivel: '1',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar voucher', description: error.message, variant: 'destructive' });
    },
  });

  const desativarVoucher = useMutation({
    mutationFn: (voucherId: string) => api.delete(`/vouchers-vendedor/${voucherId}`),
    onSuccess: () => {
      toast({ title: 'Voucher desativado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['vouchers-vendedor', vendedorId] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao desativar voucher', description: error.message, variant: 'destructive' });
    },
  });

  const handleCriar = () => {
    if (!novoForm.nome || !novoForm.tipo) {
      toast({ title: 'Preencha nome e tipo do voucher', variant: 'destructive' });
      return;
    }
    criarVoucher.mutate({
      vendedor_id: vendedorId,
      nome: novoForm.nome,
      descricao: novoForm.descricao || undefined,
      tipo: novoForm.tipo,
      valor: novoForm.valor ? parseFloat(novoForm.valor) : undefined,
      valido_de: novoForm.valido_de || undefined,
      valido_ate: novoForm.valido_ate || undefined,
      quantidade_disponivel: parseInt(novoForm.quantidade_disponivel) || 1,
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const isVoucherValido = (v: Voucher) => {
    if (!v.ativo) return false;
    if (v.valido_ate && new Date(v.valido_ate) < new Date()) return false;
    if (v.quantidade_disponivel <= (v.total_resgates ?? v.quantidade_utilizada)) return false;
    return true;
  };

  const getTipoBadge = (tipo: string) => {
    const map: Record<string, string> = {
      desconto: 'bg-blue-100 text-blue-800',
      brinde: 'bg-purple-100 text-purple-800',
      cashback: 'bg-green-100 text-green-800',
      servico: 'bg-orange-100 text-orange-800',
      outros: 'bg-gray-100 text-gray-800',
    };
    return map[tipo] || map['outros'];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Gift className="w-5 h-5" />
            Vouchers de {vendedorNome}
          </DialogTitle>
          <DialogDescription>
            Gerencie os vouchers disponíveis para este vendedor.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lista">
          <TabsList className="w-full">
            <TabsTrigger value="lista" className="flex-1">
              Vouchers ({vouchers.length})
            </TabsTrigger>
            <TabsTrigger value="novo" className="flex-1">
              <Plus className="w-4 h-4 mr-1" />
              Novo Voucher
            </TabsTrigger>
          </TabsList>

          {/* Lista de Vouchers */}
          <TabsContent value="lista" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : vouchers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum voucher cadastrado</p>
                <p className="text-sm mt-1">Crie o primeiro voucher na aba "Novo Voucher".</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vouchers.map((voucher) => {
                  const valido = isVoucherValido(voucher);
                  const resgates = voucher.total_resgates ?? voucher.quantidade_utilizada;
                  return (
                    <Card key={voucher.id} className={!valido ? 'opacity-60' : ''}>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold truncate">{voucher.nome}</span>
                              <Badge className={getTipoBadge(voucher.tipo)}>
                                {voucher.tipo}
                              </Badge>
                              {valido ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inativo
                                </Badge>
                              )}
                            </div>

                            {voucher.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">{voucher.descricao}</p>
                            )}

                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {voucher.codigo}
                              </span>
                              {voucher.valor && (
                                <span className="font-medium text-green-700">
                                  R$ {Number(voucher.valor).toFixed(2)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {voucher.valido_de ? `${formatDate(voucher.valido_de)} até ` : ''}
                                {voucher.valido_ate ? formatDate(voucher.valido_ate) : 'Sem validade'}
                              </span>
                              <span>
                                {resgates}/{voucher.quantidade_disponivel} resgates
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                            onClick={() => desativarVoucher.mutate(voucher.id)}
                            disabled={desativarVoucher.isPending}
                            title="Desativar voucher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Novo Voucher */}
          <TabsContent value="novo" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome do Voucher *</Label>
                  <Input
                    placeholder="Ex: Desconto 10% na revisão"
                    value={novoForm.nome}
                    onChange={(e) => setNovoForm({ ...novoForm, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={novoForm.tipo}
                    onValueChange={(v) => setNovoForm({ ...novoForm, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desconto">Desconto</SelectItem>
                      <SelectItem value="brinde">Brinde</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                      <SelectItem value="servico">Serviço</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={novoForm.valor}
                    onChange={(e) => setNovoForm({ ...novoForm, valor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Válido de</Label>
                  <Input
                    type="date"
                    value={novoForm.valido_de}
                    onChange={(e) => setNovoForm({ ...novoForm, valido_de: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Válido até</Label>
                  <Input
                    type="date"
                    value={novoForm.valido_ate}
                    onChange={(e) => setNovoForm({ ...novoForm, valido_ate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantidade disponível</Label>
                  <Input
                    type="number"
                    min="1"
                    value={novoForm.quantidade_disponivel}
                    onChange={(e) => setNovoForm({ ...novoForm, quantidade_disponivel: e.target.value })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva os detalhes do voucher..."
                    rows={3}
                    value={novoForm.descricao}
                    onChange={(e) => setNovoForm({ ...novoForm, descricao: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCriar} disabled={criarVoucher.isPending}>
                  {criarVoucher.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Voucher
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
