import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { BarChart3, TrendingUp, Users, Calendar, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

interface RelatorioClientesMes {
  id: string;
  cliente_nome: string;
  mes: string;
  data_ativacao: string;
  loja_nome?: string;
  status: string;
}

interface RelatorioUsoBeneficios {
  cliente_nome: string;
  beneficio_nome: string;
  parceiro_nome: string;
  data_uso: string;
  tipo_uso: 'resgatado' | 'validado';
}

export default function Relatorios() {
  const [clientesMes, setClientesMes] = useState<RelatorioClientesMes[]>([]);
  const [usoBeneficios, setUsoBeneficios] = useState<RelatorioUsoBeneficios[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadRelatorios();
  }, [mesSelecionado]);

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      const mesQuery = mesSelecionado && mesSelecionado !== 'all' ? `?mes=${mesSelecionado}` : '';
      const [clientes, beneficios] = await Promise.all([
        api.get(`/relatorios/clientes-vip-mes${mesQuery}`).catch(() => []),
        api.get(`/relatorios/uso-beneficios${mesQuery}`).catch(() => []),
      ]);

      setClientesMes(Array.isArray(clientes) ? clientes : []);
      setUsoBeneficios(Array.isArray(beneficios) ? beneficios : []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarPDF = () => {
    try {
      setExporting(true);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Título do relatório
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatórios do Sistema', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Data e filtro
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      doc.text(`Data: ${dataAtual}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      if (mesSelecionado !== 'all') {
        const meses = [
          '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        doc.text(`Filtro: ${meses[parseInt(mesSelecionado)]}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }

      yPosition += 10;

      // Seção: Clientes VIP por Mês
      if (clientesMes.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Clientes VIP por Mês', 14, yPosition);
        yPosition += 8;

        const clientesData = clientesMes.map((item) => [
          item.cliente_nome,
          item.loja_nome || 'N/A',
          format(new Date(item.data_ativacao), 'dd/MM/yyyy', { locale: ptBR }),
          item.status.charAt(0).toUpperCase() + item.status.slice(1)
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Cliente', 'Loja', 'Data Ativação', 'Status']],
          body: clientesData,
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });

        const finalY = (doc as any).lastAutoTable?.finalY;
        yPosition = finalY ? finalY + 15 : yPosition + 50;
      }

      // Seção: Uso de Benefícios
      if (usoBeneficios.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Uso de Benefícios', 14, yPosition);
        yPosition += 8;

        const beneficiosData = usoBeneficios.map((item) => [
          item.cliente_nome,
          item.beneficio_nome,
          item.parceiro_nome || 'N/A',
          item.tipo_uso === 'resgatado' ? 'Resgatado' : 'Validado',
          format(new Date(item.data_uso), 'dd/MM/yyyy', { locale: ptBR })
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Cliente', 'Benefício', 'Parceiro', 'Tipo', 'Data']],
          body: beneficiosData,
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });
      }

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Salvar PDF
      const nomeArquivo = `relatorios_${mesSelecionado === 'all' ? 'todos' : mesSelecionado}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(nomeArquivo);

      toast({
        title: 'PDF exportado com sucesso!',
        description: `Relatório exportado: ${nomeArquivo}`,
      });
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro ao exportar PDF',
        description: error.message || 'Ocorreu um erro ao gerar o PDF',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Relatórios</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Visualize relatórios e estatísticas do sistema
          </p>
        </div>
        <Button
          onClick={handleExportarPDF}
          disabled={exporting || (clientesMes.length === 0 && usoBeneficios.length === 0)}
          variant="outline"
        >
          <FileDown className={`w-4 h-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
          {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            <SelectItem value="1">Janeiro</SelectItem>
            <SelectItem value="2">Fevereiro</SelectItem>
            <SelectItem value="3">Março</SelectItem>
            <SelectItem value="4">Abril</SelectItem>
            <SelectItem value="5">Maio</SelectItem>
            <SelectItem value="6">Junho</SelectItem>
            <SelectItem value="7">Julho</SelectItem>
            <SelectItem value="8">Agosto</SelectItem>
            <SelectItem value="9">Setembro</SelectItem>
            <SelectItem value="10">Outubro</SelectItem>
            <SelectItem value="11">Novembro</SelectItem>
            <SelectItem value="12">Dezembro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clientes VIP por Mês
            </CardTitle>
            <CardDescription>
              Total de clientes VIP cadastrados por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientesMes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum dado disponível
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {clientesMes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.cliente_nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.loja_nome && (
                          <>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.loja_nome}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.data_ativacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Uso de Benefícios
            </CardTitle>
            <CardDescription>
              Validações de benefícios por parceiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usoBeneficios.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum dado disponível
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {usoBeneficios.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.cliente_nome}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {item.beneficio_nome}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.parceiro_nome && (
                          <>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.parceiro_nome}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                          </>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.tipo_uso === 'resgatado' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {item.tipo_uso === 'resgatado' ? 'Resgatado' : 'Validado'}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.data_uso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

