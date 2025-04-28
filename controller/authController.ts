import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { getStaffData } from '../models/staffModel.js';

interface StaffSession {
  staff?: {
    staffId?: number;
    firstName: string;
    lastName: string;
    role: 'user' | 'supervisor' | 'admin';
    phoneNumber: string;
    hireDate: string;
    status: 'active' | 'inactive';
    email: string;
  };
}
export async function login(
  req: Request & { session: StaffSession },
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError('all fields must be provided', 400));
    }
    const staffData = await getStaffData(req.app.get('db'), email);

    if (!staffData) {
      return next(new AppError('staff not found', 404));
    }
    const isValid = await bcrypt.compare(password, staffData.password);
    if (!isValid) {
      return next(new AppError('invalid credentials', 401));
    }
    const { password: _, ...other } = staffData;
    req.session.staff = other;
    return res.status(200).json({
      message: 'user signed in successfully',
      staffData: req.session.staff,
    });
  } catch (error: any) {
    return next(new AppError(error.message || 'could not sign in admin', 400));
  }
}

export function logout(
  req: Request & { session: StaffSession },
  res: Response,
  next: NextFunction
) {
  if (!req.session.staff) {
    return next(new AppError('user not logged in', 401));
  }
  req.session.destroy((err) => {
    if (err) {
      return next(new AppError('could not log out user', 400));
    }
    res.clearCookie('sid');
    res.status(200).json({
      message: 'user logged out successfully',
    });
  });
}

// TODO:fix the check auth code(getting a type mismatch error)
export function getSession(
  req: Request & { session: StaffSession },
  res: Response,
  next: NextFunction
) {
  try {
    const session = req.session as any;
    if (!session?.staff) {
      console.log('session expired :', session?.staff);
      return res.status(401).json({ message: 'Session expired' });
    }
    return res.status(200).json({ user: session.staff });
  } catch (error) {
    next(new AppError('cannot check auth', 500));
  }
}
