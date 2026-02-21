import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Search,
  Loader2,
  Phone,
  Mail,
  Calendar,
  Car,
  QrCode,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { api } from "@/services/api";

interface ClienteVip {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  loja_id: string;
  loja_nome: string;
  status: "ativo" | "vencido" | "renovado" | "cancelado";
  data_venda: string;
  data_ativacao: string;
  data_validade: string;
  qr_code_digital: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: number;
  veiculo_placa?: string;
  created_at: string;
}

interface NovoClienteForm {
  nome: string;
  whatsapp: string;
  email?: string;
  data_venda: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: string;
  veiculo_placa?: string;
  veiculo_valor?: string;
}

const VendedorMeusClientes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteDetalhe, setClienteDetalhe] = useState<ClienteVip | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NovoClienteForm>({
    defaultValues: {
      data_venda: new Date().toISOString().split("T")[0],
    },
  });

  // Buscar clientes do vendedor
  const { data: clientes = [], isLoading, error } = useQuery<ClienteVip[]>({
    queryKey: ["vendedor-meus-clientes", statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "todos") params.append("status", statusFilter);
      if (search) params.append("search", search);
      const query = params.toString();

      const endpoint = `/clientes-vip/meus-clientes${query ? `?${query}` : ""}`;
      console.log('[MeusClientes] Fetching via api client:', endpoint);

      const data = await api.get<ClienteVip[]>(endpoint);
      console.log('[MeusClientes] Data received:', data?.length, 'clientes');
      return data;
    },
  });

  // Mutation para criar cliente
  const criarCliente = useMutation({
    mutationFn: async (data: NovoClienteForm) => {
      return api.post<ClienteVip>('/clientes-vip', data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Cliente VIP criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["vendedor-meus-clientes"] });
      queryClient.invalidateQueries({ queryKey: ["vendedor-stats"] });
      setModalOpen(false);
      reset({
        data_venda: new Date().toISOString().split("T")[0],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NovoClienteForm) => {
    criarCliente.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "vencido":
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
      case "renovado":
        return <Badge className="bg-blue-100 text-blue-800">Renovado</Badge>;
      case "cancelado":
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const clientesAtivos = clientes.filter((c) => c.status === "ativo").length;
  const clientesVencidos = clientes.filter((c) => c.status === "vencido").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">Erro ao carregar clientes:</p>
          <p className="text-sm mt-1">{(error as Error).message}</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Clientes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os clientes VIP que você cadastrou
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{clientesAtivos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{clientesVencidos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, WhatsApp ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="renovado">Renovado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes ({clientes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground mt-2">
                {search || statusFilter !== "todos"
                  ? "Tente ajustar os filtros de busca."
                  : "Cadastre seu primeiro cliente clicando em 'Novo Cliente'."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setClienteDetalhe(cliente)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{cliente.nome}</h3>
                      {getStatusBadge(cliente.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {cliente.whatsapp}
                      </span>
                      {cliente.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {cliente.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Venda: {formatDate(cliente.data_venda)}
                      </span>
                    </div>
                    {cliente.veiculo_marca && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Car className="h-3 w-3" />
                        {cliente.veiculo_marca} {cliente.veiculo_modelo}{" "}
                        {cliente.veiculo_ano} - {cliente.veiculo_placa}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground ml-4">
                    <p>Validade</p>
                    <p className="font-medium">{formatDate(cliente.data_validade)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Novo Cliente */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Novo Cliente VIP
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed">
              Cadastre um novo cliente VIP. Ele será vinculado automaticamente a
              você e à sua loja.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  placeholder="João Silva"
                  {...register("nome", { required: "Nome é obrigatório" })}
                  className={errors.nome ? "border-destructive" : ""}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm font-medium">
                  WhatsApp *
                </Label>
                <Input
                  id="whatsapp"
                  placeholder="(71) 99999-9999"
                  {...register("whatsapp", {
                    required: "WhatsApp é obrigatório",
                    pattern: {
                      value: /^[\d\s\(\)\-\+]+$/,
                      message: "Formato inválido",
                    },
                  })}
                  className={errors.whatsapp ? "border-destructive" : ""}
                />
                {errors.whatsapp && (
                  <p className="text-xs text-destructive">
                    {errors.whatsapp.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@email.com"
                  {...register("email")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_venda" className="text-sm font-medium">
                  Data da Venda *
                </Label>
                <Input
                  id="data_venda"
                  type="date"
                  {...register("data_venda", {
                    required: "Data da venda é obrigatória",
                  })}
                  className={errors.data_venda ? "border-destructive" : ""}
                />
                {errors.data_venda && (
                  <p className="text-xs text-destructive">
                    {errors.data_venda.message}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                Dados do Veículo (Opcional)
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="veiculo_marca" className="text-sm font-medium">
                    Marca
                  </Label>
                  <Input
                    id="veiculo_marca"
                    placeholder="Toyota"
                    {...register("veiculo_marca")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="veiculo_modelo" className="text-sm font-medium">
                    Modelo
                  </Label>
                  <Input
                    id="veiculo_modelo"
                    placeholder="Corolla"
                    {...register("veiculo_modelo")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="veiculo_ano" className="text-sm font-medium">
                    Ano
                  </Label>
                  <Input
                    id="veiculo_ano"
                    type="number"
                    placeholder="2024"
                    {...register("veiculo_ano")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="veiculo_placa" className="text-sm font-medium">
                    Placa
                  </Label>
                  <Input
                    id="veiculo_placa"
                    placeholder="ABC-1234"
                    {...register("veiculo_placa")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="veiculo_valor" className="text-sm font-medium">
                    Valor do Veículo
                  </Label>
                  <Input
                    id="veiculo_valor"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="50000.00"
                    {...register("veiculo_valor")}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={criarCliente.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={criarCliente.isPending}>
                {criarCliente.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Cliente VIP"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhe do Cliente */}
      <Dialog
        open={!!clienteDetalhe}
        onOpenChange={(open) => !open && setClienteDetalhe(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {clienteDetalhe?.nome}
            </DialogTitle>
            <DialogDescription>Detalhes do cliente VIP</DialogDescription>
          </DialogHeader>

          {clienteDetalhe && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(clienteDetalhe.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{clienteDetalhe.whatsapp}</p>
                </div>
                {clienteDetalhe.email && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{clienteDetalhe.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Data da Venda</p>
                  <p className="font-medium">
                    {formatDate(clienteDetalhe.data_venda)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Validade</p>
                  <p className="font-medium">
                    {formatDate(clienteDetalhe.data_validade)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Loja</p>
                  <p className="font-medium">{clienteDetalhe.loja_nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">QR Code</p>
                  <p className="font-medium flex items-center gap-1">
                    <QrCode className="h-3 w-3" />
                    {clienteDetalhe.qr_code_digital}
                  </p>
                </div>
              </div>

              {clienteDetalhe.veiculo_marca && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                    Veículo
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Marca/Modelo</p>
                      <p className="font-medium">
                        {clienteDetalhe.veiculo_marca}{" "}
                        {clienteDetalhe.veiculo_modelo}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ano</p>
                      <p className="font-medium">{clienteDetalhe.veiculo_ano}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Placa</p>
                      <p className="font-medium">{clienteDetalhe.veiculo_placa}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendedorMeusClientes;
