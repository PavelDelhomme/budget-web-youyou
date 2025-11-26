import { Router, Request, Response } from 'express';
import { loadUser, saveUser } from '../utils';

const router = Router();

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// GET /api/years - Get all years for the authenticated user
router.get('/years', requireAuth, (req: Request, res: Response) => {
  const user = req.session.user!;
  const data = loadUser(user);
  res.json({ email: user, years: data.years });
});

// POST /api/years - Add a new year
router.post('/years', requireAuth, (req: Request, res: Response) => {
  const user = req.session.user!;
  const { year } = req.body;
  
  const yearNum = parseInt(String(year), 10);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
    return res.status(400).json({ error: 'Année invalide' });
  }
  
  const data = loadUser(user);
  if (!data.years.includes(yearNum)) {
    data.years.push(yearNum);
    data.years.sort((a, b) => a - b);
  }
  
  saveUser(user, data);
  res.json({ years: data.years });
});

// DELETE /api/years?year=YYYY - Delete a year
router.delete('/years', requireAuth, (req: Request, res: Response) => {
  const user = req.session.user!;
  const yearStr = req.query.year as string;
  
  if (!yearStr) {
    return res.status(400).json({ error: 'Année requise' });
  }
  
  const yearNum = parseInt(yearStr, 10);
  if (isNaN(yearNum)) {
    return res.status(400).json({ error: 'Année invalide' });
  }
  
  const data = loadUser(user);
  
  // Remove from years array
  data.years = data.years.filter(y => y !== yearNum);
  
  // Remove dataset if exists
  if (data.datasets[String(yearNum)]) {
    delete data.datasets[String(yearNum)];
  }
  
  saveUser(user, data);
  res.json({ years: data.years });
});

export default router;

