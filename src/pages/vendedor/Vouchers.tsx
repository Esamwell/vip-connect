import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Gift, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Tag,
  Search,
  Filter
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/api";

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
  ativo: boolean;
  created_at: string;
}

interface Resgate {
  id: string;
  voucher_id: string;
  data_resgate: string;
  status: string;
  observacoes?: string;
  voucher_nome: string;
  voucher_codigo: string;
}

const VendedorVouchers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | "disponiveis" | "resgatados" | "expirados">("todos");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [resgateObservacoes, setResgateObservacoes] = useState("");
  const [resgateDialogOpen, setResgateDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Buscar vouchers disponíveis
  const { data: vouchers = [], isLoading } = useQuery<Voucher[]>({
    queryKey: ["vendedor-vouchers"],
    queryFn: async () => {
      return api.get<Voucher[]>('/vouchers-vendedor');
    },
  });

  // Buscar resgates realizados
  const { data: resgates = [] } = useQuery<Resgate[]>({
    queryKey: ["vendedor-resgates"],
    queryFn: async () => {
      // Primeiro buscar o ID do vendedor logado
      const perfil = await api.get<{ id: string }>('/vendedores/meu-perfil');
      return api.get<Resgate[]>(`/vouchers-vendedor/resgates/vendedor/${perfil.id}`);
    },
  });

  // Mutação para resgatar voucher
  const resgatarVoucherMutation = useMutation({
    mutationFn: async (voucherId: string) => {
      return api.post(`/vouchers-vendedor/${voucherId}/resgatar`, {
        observacoes: resgateObservacoes,
      });
    },
    onSuccess: () => {
      toast.success("Voucher resgatado com sucesso!");
      setResgateDialogOpen(false);
      setResgateObservacoes("");
      setSelectedVoucher(null);
      queryClient.invalidateQueries({ queryKey: ["vendedor-vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["vendedor-resgates"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao resgatar voucher");
    },
  });

  // Filtrar vouchers
  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch = voucher.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const isExpired = voucher.valido_ate && new Date(voucher.valido_ate) < new Date();
    const isExhausted = voucher.quantidade_utilizada >= voucher.quantidade_disponivel;
    const isResgatado = resgates.some(r => r.voucher_id === voucher.id && r.status === 'resgatado');

    switch (filterStatus) {
      case "disponiveis":
        return !isExpired && !isExhausted && !isResgatado;
      case "resgatados":
        return isResgatado;
      case "expirados":
        return isExpired || isExhausted;
      default:
        return true;
    }
  });

  const handleResgatar = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setResgateDialogOpen(true);
  };

  const confirmarResgate = () => {
    if (selectedVoucher) {
      resgatarVoucherMutation.mutate(selectedVoucher.id);
    }
  };

  const getVoucherStatus = (voucher: Voucher) => {
    const isExpired = voucher.valido_ate && new Date(voucher.valido_ate) < new Date();
    const isExhausted = voucher.quantidade_utilizada >= voucher.quantidade_disponivel;
    const isResgatado = resgates.some(r => r.voucher_id === voucher.id && r.status === 'resgatado');

    if (isResgatado) return { status: "Resgatado", color: "bg-green-100 text-green-800", icon: CheckCircle };
    if (isExpired) return { status: "Expirado", color: "bg-red-100 text-red-800", icon: XCircle };
    if (isExhausted) return { status: "Esgotado", color: "bg-orange-100 text-orange-800", icon: XCircle };
    return { status: "Disponível", color: "bg-blue-100 text-blue-800", icon: Gift };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meus Vouchers</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus vouchers de benefícios e premiações
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disponíveis</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vouchers.filter(v => {
                const isExpired = v.valido_ate && new Date(v.valido_ate) < new Date();
                const isExhausted = v.quantidade_utilizada >= v.quantidade_disponivel;
                const isResgatado = resgates.some(r => r.voucher_id === v.id && r.status === 'resgatado');
                return !isExpired && !isExhausted && !isResgatado;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Já Resgatados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resgates.filter(r => r.status === 'resgatado').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vouchers.filter(v => {
                const isExpired = v.valido_ate && new Date(v.valido_ate) < new Date();
                const isExhausted = v.quantidade_utilizada >= v.quantidade_disponivel;
                return isExpired || isExhausted;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {vouchers.reduce((total, v) => total + (v.valor || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar vouchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {["todos", "disponiveis", "resgatados", "expirados"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status as any)}
                >
                  {status === "todos" && "Todos"}
                  {status === "disponiveis" && "Disponíveis"}
                  {status === "resgatados" && "Resgatados"}
                  {status === "expirados" && "Expirados"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVouchers.map((voucher) => {
          const statusInfo = getVoucherStatus(voucher);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={voucher.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{voucher.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{voucher.descricao}</p>
                  </div>
                  <Badge className={statusInfo.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Código:</span>
                  <span className="font-mono text-sm font-medium">{voucher.codigo}</span>
                </div>
                
                {voucher.valor && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor:</span>
                    <span className="font-medium">R$ {voucher.valor.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Disponibilidade:</span>
                  <span className="text-sm">
                    {voucher.quantidade_disponivel - voucher.quantidade_utilizada} / {voucher.quantidade_disponivel}
                  </span>
                </div>

                {voucher.valido_ate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Válido até: {new Date(voucher.valido_ate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {statusInfo.status === "Disponível" && (
                  <Dialog open={resgateDialogOpen && selectedVoucher?.id === voucher.id} onOpenChange={setResgateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        onClick={() => handleResgatar(voucher)}
                        disabled={resgatarVoucherMutation.isPending}
                      >
                        {resgatarVoucherMutation.isPending ? "Resgatando..." : "Resgatar Voucher"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Resgate</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium">{voucher.nome}</p>
                          <p className="text-sm text-muted-foreground">{voucher.descricao}</p>
                          {voucher.valor && (
                            <p className="text-sm font-medium mt-2">Valor: R$ {voucher.valor.toFixed(2)}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="observacoes">Observações (opcional)</Label>
                          <Textarea
                            id="observacoes"
                            placeholder="Adicione alguma observação sobre este resgate..."
                            value={resgateObservacoes}
                            onChange={(e) => setResgateObservacoes(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setResgateDialogOpen(false)}
                            disabled={resgatarVoucherMutation.isPending}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={confirmarResgate}
                            disabled={resgatarVoucherMutation.isPending}
                          >
                            {resgatarVoucherMutation.isPending ? "Resgatando..." : "Confirmar Resgate"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredVouchers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhum voucher encontrado</h3>
            <p className="text-muted-foreground mt-2">
              {searchTerm || filterStatus !== "todos" 
                ? "Tente ajustar os filtros para ver mais resultados."
                : "Você não possui vouchers disponíveis no momento."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendedorVouchers;
