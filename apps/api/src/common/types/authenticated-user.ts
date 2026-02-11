import { Request } from 'express';

export type AuthenticatedUser = {
  local_user_id: string;
  supabase_sub: string;
  email: string | null;
  role: 'user' | 'coach';
};

export type RequestWithAuthUser = Request & {
  authUser?: AuthenticatedUser;
  headers: {
    authorization?: string;
  };
};
