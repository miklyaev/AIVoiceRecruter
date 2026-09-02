import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { getRoleTitle } from '../types';

const router = Router();

// Basic Auth middleware — проверяет логин/пароль из server/.env
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const login = process.env.ADMIN_LOGIN || 'admin';
  const password = process.env.ADMIN_PASSWORD;

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

// GET /api/admin/candidates — список кандидатов с фильтрами по role и hiring_recommendation
router.get('/candidates', requireAuth, async (req: Request, res: Response) => {
  try {
    const { role, hiringRecommendation } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];

    if (role && typeof role === 'string') {
      params.push(role);
      conditions.push(`c.role = $${params.length}`);
    }

    if (hiringRecommendation && typeof hiringRecommendation === 'string') {
      if (hiringRecommendation === 'none') {
        conditions.push('c.hiring_recommendation IS NULL');
      } else {
        params.push(hiringRecommendation);
        conditions.push(`c.hiring_recommendation = $${params.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT c.id, c.interview_id, c.name, c.email, c.phone_number, c.role, c.experiance,
              c.hiring_recommendation, c.created_at, i.status AS interview_status,
              i.final_report IS NOT NULL AS has_report
       FROM candidates c
       LEFT JOIN interviews i ON i.id = c.interview_id
       ${whereClause}
       ORDER BY c.created_at DESC`,
      params
    );

    const candidates = result.rows.map((row: any) => ({
      id: row.id,
      interviewId: row.interview_id,
      name: row.name,
      email: row.email,
      phoneNumber: row.phone_number,
      role: getRoleTitle(row.role),
      roleId: row.role,
      experiance: row.experiance,
      hiringRecommendation: row.hiring_recommendation,
      createdAt: row.created_at,
      interviewCompleted: row.has_report === true,
    }));

    return res.json({ candidates });
  } catch (err) {
    console.error('Admin candidates error:', err);
    return res.status(500).json({ error: 'Ошибка получения списка кандидатов' });
  }
});

// GET /api/admin/candidates/:id — кандидат с итоговым отчётом интервью
router.get('/candidates/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT c.id, c.interview_id, c.name, c.email, c.phone_number, c.role, c.experiance,
              c.hiring_recommendation, c.created_at, i.final_report, i.status AS interview_status
       FROM candidates c
       LEFT JOIN interviews i ON i.id = c.interview_id
       WHERE c.id = $1`,
      [req.params.id]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Кандидат не найден' });
    }

    return res.json({
      id: row.id,
      interviewId: row.interview_id,
      name: row.name,
      email: row.email,
      phoneNumber: row.phone_number,
      role: getRoleTitle(row.role),
      roleId: row.role,
      experiance: row.experiance,
      hiringRecommendation: row.hiring_recommendation,
      createdAt: row.created_at,
      interviewCompleted: row.interview_status === 'completed',
      report: row.final_report || null,
    });
  } catch (err) {
    console.error('Admin candidate detail error:', err);
    return res.status(500).json({ error: 'Ошибка получения данных кандидата' });
  }
});

export default router;