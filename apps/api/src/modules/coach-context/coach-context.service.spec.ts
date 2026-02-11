import { ForbiddenException } from '@nestjs/common';
import { CoachContextService } from './coach-context.service';

describe('CoachContextService', () => {
  it('lists authorized students for a coach', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        createdAt: new Date('2026-02-10T10:00:00.000Z'),
        student: {
          id: 'student-1',
          email: 'leo@example.com',
          role: 'user',
          games: [
            {
              chessComUsername: 'leoChess',
              createdAt: new Date('2026-02-11T10:00:00.000Z'),
            },
            {
              chessComUsername: 'leoChess',
              createdAt: new Date('2026-02-10T10:00:00.000Z'),
            },
          ],
        },
      },
    ]);

    const service = new CoachContextService({
      coachStudentAccess: {
        findMany,
      },
    } as any);

    await expect(
      service.listAuthorizedStudents({
        coach_user_id: 'coach-1',
        actor_role: 'coach',
      }),
    ).resolves.toEqual({
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
  });

  it('selects authorized student context', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      createdAt: new Date('2026-02-10T10:00:00.000Z'),
      student: {
        id: 'student-1',
        email: 'leo@example.com',
        role: 'user',
        games: [
          {
            chessComUsername: 'leoChess',
            createdAt: new Date('2026-02-11T10:00:00.000Z'),
          },
        ],
      },
    });

    const service = new CoachContextService({
      coachStudentAccess: {
        findFirst,
      },
    } as any);

    const result = await service.selectStudentContext({
      coach_user_id: 'coach-1',
      actor_role: 'coach',
      student_user_id: 'student-1',
    });

    expect(result).toEqual({
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
      selected_at: expect.any(String),
    });
  });

  it('blocks non-coach actors', async () => {
    const service = new CoachContextService({
      coachStudentAccess: {
        findMany: jest.fn(),
      },
    } as any);

    await expect(
      service.listAuthorizedStudents({
        coach_user_id: 'coach-1',
        actor_role: 'user',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks unauthorized student selection', async () => {
    const service = new CoachContextService({
      coachStudentAccess: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any);

    await expect(
      service.selectStudentContext({
        coach_user_id: 'coach-1',
        actor_role: 'coach',
        student_user_id: 'student-9',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
