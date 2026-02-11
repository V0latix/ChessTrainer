import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('returns snake_case identity payload', () => {
    const controller = new AuthController();

    const response = controller.getCurrentUser({
      local_user_id: 'local-user-1',
      supabase_sub: 'supabase-sub-1',
      email: 'leo@example.com',
      role: 'user',
    });

    expect(response).toEqual({
      data: {
        user_id: 'local-user-1',
        supabase_sub: 'supabase-sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
    });
  });
});
