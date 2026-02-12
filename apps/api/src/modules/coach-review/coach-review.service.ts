import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  ImportsService,
  type ReimportGamesResult,
} from '../imports/imports.service';
import { PrismaService } from '../../prisma/prisma.service';

export type CoachReviewMistakeResult = {
  mistake_id: string;
  game_id: string;
  game_url: string;
  chess_com_username: string;
  fen: string;
  phase: string;
  severity: string;
  category: string;
  played_move_uci: string;
  best_move_uci: string;
  eval_drop_cp: number;
  ply_index: number;
  created_at: string;
  wrong_move_explanation: string;
  best_move_explanation: string;
};

@Injectable()
export class CoachReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly importsService: ImportsService,
  ) {}

  async importStudentGames(params: {
    coach_user_id: string;
    actor_role: 'user' | 'coach';
    student_user_id: string;
    chess_com_username: string;
  }): Promise<ReimportGamesResult> {
    await this.assertCoachStudentAccess({
      coach_user_id: params.coach_user_id,
      actor_role: params.actor_role,
      student_user_id: params.student_user_id,
    });

    return this.importsService.reimportIncrementally({
      user_id: params.student_user_id,
      username: params.chess_com_username,
    });
  }

  async listStudentMistakes(params: {
    coach_user_id: string;
    actor_role: 'user' | 'coach';
    student_user_id: string;
    limit: number;
  }): Promise<{
    student_user_id: string;
    mistakes: CoachReviewMistakeResult[];
  }> {
    await this.assertCoachStudentAccess({
      coach_user_id: params.coach_user_id,
      actor_role: params.actor_role,
      student_user_id: params.student_user_id,
    });

    const mistakes = await this.prisma.criticalMistake.findMany({
      where: {
        userId: params.student_user_id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: params.limit,
      select: {
        id: true,
        gameId: true,
        fen: true,
        phase: true,
        severity: true,
        category: true,
        playedMoveUci: true,
        bestMoveUci: true,
        evalDropCp: true,
        plyIndex: true,
        createdAt: true,
        game: {
          select: {
            gameUrl: true,
            chessComUsername: true,
          },
        },
      },
    });

    return {
      student_user_id: params.student_user_id,
      mistakes: mistakes.map((mistake) => ({
        mistake_id: mistake.id,
        game_id: mistake.gameId,
        game_url: mistake.game.gameUrl,
        chess_com_username: mistake.game.chessComUsername,
        fen: mistake.fen,
        phase: mistake.phase,
        severity: mistake.severity,
        category: mistake.category,
        played_move_uci: mistake.playedMoveUci,
        best_move_uci: mistake.bestMoveUci,
        eval_drop_cp: mistake.evalDropCp,
        ply_index: mistake.plyIndex,
        created_at: mistake.createdAt.toISOString(),
        wrong_move_explanation: this.buildWrongMoveExplanation({
          played_move_uci: mistake.playedMoveUci,
          phase: mistake.phase,
          severity: mistake.severity,
          eval_drop_cp: mistake.evalDropCp,
        }),
        best_move_explanation: this.buildBestMoveExplanation({
          best_move_uci: mistake.bestMoveUci,
          phase: mistake.phase,
          severity: mistake.severity,
        }),
      })),
    };
  }

  private async assertCoachStudentAccess(params: {
    coach_user_id: string;
    actor_role: 'user' | 'coach';
    student_user_id: string;
  }) {
    if (params.actor_role !== 'coach') {
      throw new ForbiddenException('Coach role is required.');
    }

    const access = await this.prisma.coachStudentAccess.findFirst({
      where: {
        coachId: params.coach_user_id,
        studentId: params.student_user_id,
      },
      select: {
        id: true,
      },
    });

    if (!access) {
      throw new ForbiddenException(
        'Student context is not authorized for this coach.',
      );
    }
  }

  private buildWrongMoveExplanation(params: {
    played_move_uci: string;
    phase: string;
    severity: string;
    eval_drop_cp: number;
  }) {
    return `Le coup ${params.played_move_uci} en ${params.phase} (${params.severity}) a coûté environ ${params.eval_drop_cp} centipawns et a dégradé la position du joueur.`;
  }

  private buildBestMoveExplanation(params: {
    best_move_uci: string;
    phase: string;
    severity: string;
  }) {
    const phaseTemplate = this.resolvePhaseTemplate(params.phase);
    return `Le coup ${params.best_move_uci} est meilleur car il ${phaseTemplate}. C’est la réponse la plus robuste contre une erreur de type ${params.severity}.`;
  }

  private resolvePhaseTemplate(phase: string) {
    if (phase === 'opening') {
      return 'améliore le développement et sécurise le centre';
    }

    if (phase === 'middlegame') {
      return "augmente l'activité des pièces et l'initiative";
    }

    if (phase === 'endgame') {
      return "améliore l'activité du roi et la coordination des pions";
    }

    return 'améliore la position de manière concrète';
  }
}
