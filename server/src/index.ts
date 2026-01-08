import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Importar rotas
import authRoutes from './routes/auth';
import clientesVipRoutes from './routes/clientes-vip';
import beneficiosRoutes from './routes/beneficios';
import chamadosRoutes from './routes/chamados';
import rankingRoutes from './routes/ranking';
import relatoriosRoutes from './routes/relatorios';
import renovacaoRoutes from './routes/renovacao';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet()); // Segurança
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/clientes-vip', clientesVipRoutes);
app.use('/api/beneficios', beneficiosRoutes);
app.use('/api/chamados', chamadosRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/renovacao', renovacaoRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API disponível em: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

export default app;

