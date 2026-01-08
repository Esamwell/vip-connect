import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { generateToken } from '../utils/jwt';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Buscar usuário
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND ativo = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    const user = result.rows[0];

    // Verificar senha (assumindo que está usando bcrypt)
    // Se a senha não estiver hasheada, você precisará atualizar isso
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        whatsapp: user.whatsapp,
      },
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, nome, role, whatsapp, ativo FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;

