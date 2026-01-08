import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../types';

// Estender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret_aqui';

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de autenticação não fornecido' 
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Token inválido ou expirado' 
    });
  }
};

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem a role necessária
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão insuficiente.' 
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se é lojista e acessa apenas sua loja
 */
export const authorizeLojista = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  if (req.user.role !== 'lojista') {
    return next(); // Se não for lojista, passa adiante
  }

  // Se for lojista, verificar se está acessando apenas sua loja
  const lojaId = req.params.lojaId || req.body.loja_id || req.query.loja_id;

  if (lojaId) {
    // Verificar se a loja pertence ao lojista
    // Isso será implementado quando criarmos as rotas de lojas
    // Por enquanto, apenas passa adiante
  }

  next();
};

