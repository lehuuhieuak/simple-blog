import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { executeQuery } from './db';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export interface User {
  id: number;
  email: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(payload: User): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as User;
  } catch {
    return null;
  }
}

export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const result = await executeQuery(
      'SELECT id, email, username FROM users WHERE id = @param0',
      [id]
    );
    
    return result.recordset[0] || null;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<(User & { password: string }) | null> {
  try {
    const result = await executeQuery(
      'SELECT id, email, username, password FROM users WHERE email = @param0',
      [email]
    );
    
    return result.recordset[0] || null;
  } catch {
    return null;
  }
}