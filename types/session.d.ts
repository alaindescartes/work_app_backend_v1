// types/session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    staff?: {
      staffId: number;
      email: string;
      role: string;
    };
  }
}
