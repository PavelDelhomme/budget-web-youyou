import { Router, Request, Response } from 'express';
import { loadUser } from '../utils';

const router = Router();

// POST /api/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email invalide' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }
  
  /*
   * Note: This example does not implement actual password verification.
   * In a real application, you would hash and verify passwords here.
   */
  
  // Set session user
  req.session.user = email;
  
  // Ensure user data exists
  const data = loadUser(email);
  
  res.json({ email, years: data.years });
});

// POST /api/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
    res.json({ done: true });
  });
});

export default router;

