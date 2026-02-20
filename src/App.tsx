import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import VendedorDashboardLayout from "@/components/VendedorDashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ClientCard from "./pages/ClientCard";
import ValidatePartner from "./pages/ValidatePartner";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/dashboard/Dashboard";
import Clientes from "./pages/dashboard/Clientes";
import Chamados from "./pages/dashboard/Chamados";
import ChamadoDetail from "./pages/dashboard/ChamadoDetail";
import Relatorios from "./pages/dashboard/Relatorios";
import Ranking from "./pages/dashboard/Ranking";
import Renovacoes from "./pages/dashboard/Renovacoes";
import Lojas from "./pages/dashboard/Lojas";
import Parceiros from "./pages/dashboard/Parceiros";
import Beneficios from "./pages/dashboard/Beneficios";
import Configuracoes from "./pages/dashboard/Configuracoes";
import Vendedores from "./pages/dashboard/Vendedores";
import { ParceiroDashboardLayout } from "./components/ParceiroDashboardLayout";
import ParceiroClientes from "./pages/parceiro/Clientes";
import ParceiroBeneficios from "./pages/parceiro/Beneficios";
import ParceiroConfiguracoes from "./pages/parceiro/Configuracoes";
import VendedorDashboard from "./pages/vendedor/Dashboard";
import VendedorVouchers from "./pages/vendedor/Vouchers";
import VendedorPerfil from "./pages/vendedor/Perfil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/meu-cartao" element={<ClientCard />} />
            <Route path="/parceiro/validar" element={<ValidatePartner />} />
            
            {/* Parceiro Dashboard Routes */}
            <Route
              path="/parceiro/dashboard"
              element={
                <ProtectedRoute allowedRoles={['parceiro']}>
                  <ParceiroDashboardLayout>
                    <ParceiroClientes />
                  </ParceiroDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/parceiro/dashboard/clientes"
              element={
                <ProtectedRoute allowedRoles={['parceiro']}>
                  <ParceiroDashboardLayout>
                    <ParceiroClientes />
                  </ParceiroDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/parceiro/dashboard/beneficios"
              element={
                <ProtectedRoute allowedRoles={['parceiro']}>
                  <ParceiroDashboardLayout>
                    <ParceiroBeneficios />
                  </ParceiroDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/parceiro/dashboard/configuracoes"
              element={
                <ProtectedRoute allowedRoles={['parceiro']}>
                  <ParceiroDashboardLayout>
                    <ParceiroConfiguracoes />
                  </ParceiroDashboardLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Vendedor Dashboard Routes */}
            <Route
              path="/vendedor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['vendedor']}>
                  <VendedorDashboardLayout>
                    <VendedorDashboard />
                  </VendedorDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendedor/dashboard/vouchers"
              element={
                <ProtectedRoute allowedRoles={['vendedor']}>
                  <VendedorDashboardLayout>
                    <VendedorVouchers />
                  </VendedorDashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/vendedor/dashboard/perfil"
              element={
                <ProtectedRoute allowedRoles={['vendedor']}>
                  <VendedorDashboardLayout>
                    <VendedorPerfil />
                  </VendedorDashboardLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'admin_shopping', 'lojista']}>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/clientes"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'admin_shopping', 'lojista']}>
                  <DashboardLayout>
                    <Clientes />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/chamados"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'admin_shopping', 'lojista']}>
                  <DashboardLayout>
                    <Chamados />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/chamados/:id"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'admin_shopping', 'lojista']}>
                  <DashboardLayout>
                    <ChamadoDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/relatorios"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'admin_shopping', 'lojista']}>
                  <DashboardLayout>
                    <Relatorios />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/ranking"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'admin_shopping', 'lojista', 'vendedor']}>
                  <DashboardLayout>
                    <Ranking />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/renovacoes"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'admin_shopping', 'lojista']}>
                  <DashboardLayout>
                    <Renovacoes />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/lojas"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'admin_shopping']}>
                  <DashboardLayout>
                    <Lojas />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/parceiros"
              element={
                <ProtectedRoute allowedRoles={['admin_mt']}>
                  <DashboardLayout>
                    <Parceiros />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/vendedores"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'admin_shopping', 'lojista']}>
                  <DashboardLayout>
                    <Vendedores />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/beneficios"
              element={
                <ProtectedRoute allowedRoles={['admin_mt', 'lojista']}>
                  <DashboardLayout>
                    <Beneficios />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/configuracoes"
              element={
                <ProtectedRoute allowedRoles={['admin_mt']}>
                  <DashboardLayout>
                    <Configuracoes />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
