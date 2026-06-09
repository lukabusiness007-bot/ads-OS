import { Response } from 'express';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('====== REGISTER REQUEST START ======');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    const { email, password, salonName } = req.body;

    // Validacija
    if (!email || !password || !salonName) {
      console.error('Missing fields:', { email: !!email, password: !!password, salonName: !!salonName });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    console.log('Input validation passed');

    // Provjera da li korisnik već postoji
    console.log('Checking if user exists with email:', email);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('User already exists');
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    console.log('User does not exist, hashing password...');
    // Hash lozinke
    const hashedPassword = hashPassword(password);
    console.log('Password hashed successfully');

    console.log('Creating user in database...');
    // Kreiraj korisnika
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        salonName,
      },
    });
    console.log('User created successfully:', { id: user.id, email: user.email });

    // Generiraj token
    console.log('Generating JWT token...');
    const token = generateToken({ userId: user.id, email: user.email });
    console.log('Token generated successfully');

    console.log('====== REGISTER REQUEST SUCCESS ======');
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        salonName: user.salonName,
      },
    });
  } catch (error: any) {
    console.error('====== REGISTER REQUEST ERROR ======');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
    console.error('====== END ERROR ======');
    
    // Also write to file for debugging
    const logMessage = `\n[${new Date().toISOString()}] Registration Error:\nType: ${error.constructor.name}\nMessage: ${error.message}\nCode: ${error.code || 'N/A'}\nMeta: ${JSON.stringify(error.meta || {})}\nFull Error: ${JSON.stringify(error, null, 2)}\n`;
    try {
      fs.appendFileSync(path.join(process.cwd(), 'registration-errors.log'), logMessage);
    } catch (fserror) {
      console.error('Failed to write to log file:', fserror);
    }
    
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validacija
    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    // Pronađi korisnika
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Provjeri lozinku
    const passwordMatch = verifyPassword(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generiraj token
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        salonName: user.salonName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = (_req: AuthRequest, res: Response): void => {
  // Token je obrisan na client-side
  res.json({ message: 'Logged out successfully' });
};
