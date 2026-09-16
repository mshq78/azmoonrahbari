import type { AdminRow, AdminSessionRow } from '../db/schema/admins';

declare global {
   
  namespace Express {
    interface Request {
      /**
       * Ownership is always derived from the session cookie, never from a
       * client-supplied attempt id.
       */
      participantSession?: {
        attemptId: number;
        participantId: number;
        csrfToken: string;
        expiresAt: number;
      };
      adminSession?: {
        admin: AdminRow;
        session: AdminSessionRow;
      };
    }
  }
}

export {};
