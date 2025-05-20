import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Session } from 'express-session';
import bcrypt from 'bcrypt';
import { getStaffData } from '../models/staffModel.js';

interface StaffSession extends Session {
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
export const login: RequestHandler = async (req, res, next) => {
  const session = req.session as unknown as StaffSession;
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
    session.staff = other;
    res.status(200).json({
      message: 'user signed in successfully',
      staffData: session.staff,
    });
  } catch (error: any) {
    return next(new AppError(error.message || 'could not sign in admin', 400));
  }
};

export const logout: RequestHandler = (req, res, next) => {
  const session = req.session as StaffSession;
  if (!session.staff) {
    return next(new AppError('user not logged in', 401));
  }
  session.destroy((err) => {
    if (err) {
      return next(new AppError('could not log out user', 400));
    }
    res.clearCookie('sid');
    res.status(200).json({
      message: 'user logged out successfully',
    });
  });
};

// TODO:fix the check auth code(getting a type mismatch error)
export const getSession: RequestHandler = (req, res, next) => {
  const session = req.session as unknown as StaffSession;
  try {
    if (!session?.staff) {
      console.log('session expired :', session?.staff);
      res.status(401).json({ message: 'Session expired' });
      return;
    }
    res.status(200).json({ user: session.staff });
  } catch (error) {
    next(new AppError('cannot check auth', 500));
  }
};
