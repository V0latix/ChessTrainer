import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CoachStudentResult = {
  student_user_id: string;
  email: string | null;
  role: 'user' | 'coach';
  chess_com_usernames: string[];
  last_game_import_at: string | null;
  granted_at: string;
};

export type CoachStudentsListResult = {
  coach_user_id: string;
  students: CoachStudentResult[];
};

export type CoachContextSelectionResult = {
  context_id: string;
  coach_user_id: string;
  student: CoachStudentResult;
  selected_at: string;
};

@Injectable()
export class CoachContextService {
  constructor(private readonly prisma: PrismaService) {}

  async listAuthorizedStudents(params: {
    coach_user_id: string;
    actor_role: 'user' | 'coach';
  }): Promise<CoachStudentsListResult> {
    this.assertCoachRole(params.actor_role);

    const links = await this.prisma.coachStudentAccess.findMany({
      where: {
        coachId: params.coach_user_id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
        student: {
          select: {
            id: true,
            email: true,
            role: true,
            games: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 20,
              select: {
                chessComUsername: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    return {
      coach_user_id: params.coach_user_id,
      students: links.map((link) => {
        const usernames = Array.from(
          new Set(
            link.student.games
              .map((game) => game.chessComUsername.trim())
              .filter(Boolean),
          ),
        );

        return {
          student_user_id: link.student.id,
          email: link.student.email,
          role: link.student.role,
          chess_com_usernames: usernames,
          last_game_import_at:
            link.student.games[0]?.createdAt.toISOString() ?? null,
          granted_at: link.createdAt.toISOString(),
        };
      }),
    };
  }

  async selectStudentContext(params: {
    coach_user_id: string;
    actor_role: 'user' | 'coach';
    student_user_id: string;
  }): Promise<CoachContextSelectionResult> {
    this.assertCoachRole(params.actor_role);

    const link = await this.prisma.coachStudentAccess.findFirst({
      where: {
        coachId: params.coach_user_id,
        studentId: params.student_user_id,
      },
      select: {
        createdAt: true,
        student: {
          select: {
            id: true,
            email: true,
            role: true,
            games: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 20,
              select: {
                chessComUsername: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!link) {
      throw new ForbiddenException(
        'Student context is not authorized for this coach.',
      );
    }

    const usernames = Array.from(
      new Set(
        link.student.games
          .map((game) => game.chessComUsername.trim())
          .filter(Boolean),
      ),
    );

    return {
      context_id: `${params.coach_user_id}:${params.student_user_id}`,
      coach_user_id: params.coach_user_id,
      student: {
        student_user_id: link.student.id,
        email: link.student.email,
        role: link.student.role,
        chess_com_usernames: usernames,
        last_game_import_at:
          link.student.games[0]?.createdAt.toISOString() ?? null,
        granted_at: link.createdAt.toISOString(),
      },
      selected_at: new Date().toISOString(),
    };
  }

  private assertCoachRole(role: 'user' | 'coach') {
    if (role !== 'coach') {
      throw new ForbiddenException('Coach role is required.');
    }
  }
}
