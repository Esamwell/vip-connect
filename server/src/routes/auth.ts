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

    console.log('Tentativa de login:', { email, passwordLength: password?.length });

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Buscar usuário
    console.log('Buscando usuário no banco:', email);
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND ativo = true',
      [email]
    );

    console.log('Usuários encontrados:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('Usuário não encontrado ou inativo:', email);
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    const user = result.rows[0];
    console.log('Usuário encontrado:', { id: user.id, email: user.email, role: user.role });

    // Verificar senha
    console.log('Verificando senha...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      console.log('Senha inválida para usuário:', email);
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    console.log('Login bem-sucedido para:', email);

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

/**
 * PATCH /api/auth/profile
 * Atualiza o nome do usuário autenticado
 */
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome || nome.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Nome é obrigatório' 
      });
    }

    const result = await pool.query(
      `UPDATE users 
       SET nome = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, email, nome, role, whatsapp, ativo`,
      [nome.trim(), req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * PATCH /api/auth/password
 * Atualiza a senha do usuário autenticado
 */
router.patch('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Senha atual e nova senha são obrigatórias' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'A nova senha deve ter no mínimo 6 caracteres' 
      });
    }

    // Buscar usuário e senha atual
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    const user = userResult.rows[0];

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Senha atual incorreta' 
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [hashedPassword, req.user!.userId]
    );

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;

