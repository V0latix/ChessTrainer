import { Request } from 'express';

export type AuthenticatedUser = {
  local_user_id: string;
  supabase_sub: string;
  email: string | null;
  role: 'user' | 'coach';
};

export type RequestWithAuthUser = Request & {
  authUser?: AuthenticatedUser;
  traceId?: string;
  headers: {
    authorization?: string;
    'x-forwarded-proto'?: string;
    'x-trace-id'?: string;
  };
};
