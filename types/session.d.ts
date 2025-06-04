// types/session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    staff?: {
      id: number;
      email: string;
      role: string;
    };
  }
}
