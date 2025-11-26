import { Router, Request, Response } from 'express';
import { loadUser, saveUser, getDefaultYearData } from '../utils';
import { YearData } from '../types';

const router = Router();

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// GET /api/get?year=YYYY - Get data for a specific year (legacy endpoint)
router.get('/get', requireAuth, (req: Request, res: Response) => {
  const user = req.session.user!;
  const yearStr = req.query.year as string;
  
  if (!yearStr) {
    return res.status(400).json({ error: 'Année requise' });
  }
  
  const yearNum = parseInt(yearStr, 10);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
    return res.status(400).json({ error: 'Année invalide' });
  }
  
  const data = loadUser(user);
  const yearKey = String(yearNum);
  const dataset = data.datasets[yearKey];
  
  if (!dataset) {
    // Return default dataset
    const defaultData = getDefaultYearData();
    res.json(defaultData);
  } else {
    res.json(dataset);
  }
});

// PUT /api/put?year=YYYY - Update data for a specific year (legacy endpoint)
router.put('/put', requireAuth, (req: Request, res: Response) => {
  const user = req.session.user!;
  const yearStr = req.query.year as string;
  
  if (!yearStr) {
    return res.status(400).json({ error: 'Année requise' });
  }
  
  const yearNum = parseInt(yearStr, 10);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
    return res.status(400).json({ error: 'Année invalide' });
  }
  
  const payload = req.body as Partial<YearData>;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Payload invalide' });
  }
  
  const data = loadUser(user);
  const yearKey = String(yearNum);
  
  data.datasets[yearKey] = {
    categories: Array.isArray(payload.categories) ? payload.categories : [],
    expenses: Array.isArray(payload.expenses) ? payload.expenses : [],
    subs: Array.isArray(payload.subs) ? payload.subs : []
  };
  
  // Ensure year is in years array
  if (!data.years.includes(yearNum)) {
    data.years.push(yearNum);
    data.years.sort((a, b) => a - b);
  }
  
  saveUser(user, data);
  res.json({ ok: true });
});

export default router;

