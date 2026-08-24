import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { getRoleTitle } from '../types';

const router = Router();

// Basic Auth middleware — проверяет логин/пароль из server/.env
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const login = process.env.ADMIN_LOGIN || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const authHeader = req.headers.authorization || '';
  const [scheme, encoded] = authHeader.split(' ');

  if (scheme !== 'Basic' || !encoded) {
    res.setHeader('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  const [user, pass] = decoded.split(':');

  if (user !== login || pass !== password) {
    res.setHeader('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  next();
}

// GET /api/admin/reports — список завершённых интервью с отчётами
router.get('/reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, role, question_count, planned_question_count, started_at, completed_at, final_report
       FROM interviews
       WHERE status = 'completed' AND final_report IS NOT NULL
       ORDER BY completed_at DESC`
    );

    const reports = result.rows.map((row: any) => ({
      id: row.id,
      role: getRoleTitle(row.role),
      questionCount: row.question_count,
      plannedQuestionCount: row.planned_question_count,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      report: row.final_report,
    }));

    return res.json({ reports });
  } catch (err) {
    console.error('Admin reports error:', err);
    return res.status(500).json({ error: 'Ошибка получения отчётов' });
  }
});

export default router;