import { BadRequestException } from '@nestjs/common';
import { CoachContextController } from './coach-context.controller';

describe('CoachContextController', () => {
  it('lists authorized students for coach', async () => {
    const listAuthorizedStudents = jest.fn().mockResolvedValue({
      coach_user_id: 'coach-1',
      students: [
        {
          student_user_id: 'student-1',
          email: 'leo@example.com',
          role: 'user',
          chess_com_usernames: ['leoChess'],
          last_game_import_at: '2026-02-11T10:00:00.000Z',
          granted_at: '2026-02-10T10:00:00.000Z',
        },
      ],
    });

    const controller = new CoachContextController({
      listAuthorizedStudents,
      selectStudentContext: jest.fn(),
    } as any);

    await expect(
      controller.listAuthorizedStudents({
        local_user_id: 'coach-1',
        supabase_sub: 'sub-coach-1',
        email: 'coach@example.com',
        role: 'coach',
      }),
    ).resolves.toEqual({
      data: {
        coach_user_id: 'coach-1',
        students: [expect.objectContaining({ student_user_id: 'student-1' })],
      },
    });

    expect(listAuthorizedStudents).toHaveBeenCalledWith({
      coach_user_id: 'coach-1',
      actor_role: 'coach',
    });
  });

  it('selects one authorized student context', async () => {
    const selectStudentContext = jest.fn().mockResolvedValue({
      context_id: 'coach-1:student-1',
      coach_user_id: 'coach-1',
      student: {
        student_user_id: 'student-1',
        email: 'leo@example.com',
        role: 'user',
        chess_com_usernames: ['leoChess'],
        last_game_import_at: '2026-02-11T10:00:00.000Z',
        granted_at: '2026-02-10T10:00:00.000Z',
      },
      selected_at: '2026-02-11T11:00:00.000Z',
    });

    const controller = new CoachContextController({
      listAuthorizedStudents: jest.fn(),
      selectStudentContext,
    } as any);

    await expect(
      controller.selectStudentContext(
        {
          local_user_id: 'coach-1',
          supabase_sub: 'sub-coach-1',
          email: 'coach@example.com',
          role: 'coach',
        },
        {
          student_user_id: 'student-1',
        },
      ),
    ).resolves.toEqual({
      data: {
        context_id: 'coach-1:student-1',
        coach_user_id: 'coach-1',
        student: expect.objectContaining({
          student_user_id: 'student-1',
        }),
        selected_at: '2026-02-11T11:00:00.000Z',
      },
    });

    expect(selectStudentContext).toHaveBeenCalledWith({
      coach_user_id: 'coach-1',
      actor_role: 'coach',
      student_user_id: 'student-1',
    });
  });

  it('rejects missing student_user_id', async () => {
    const controller = new CoachContextController({
      listAuthorizedStudents: jest.fn(),
      selectStudentContext: jest.fn(),
    } as any);

    await expect(
      controller.selectStudentContext(
        {
          local_user_id: 'coach-1',
          supabase_sub: 'sub-coach-1',
          email: 'coach@example.com',
          role: 'coach',
        },
        {},
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
