import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NextPuzzleResult = {
  puzzle_id: string;
  source: 'critical_mistake';
  fen: string;
  side_to_move: 'white' | 'black';
  objective: string;
  context: {
    game_id: string;
    game_url: string;
    chess_com_username: string;
    period: string;
    time_class: string | null;
    phase: string;
    severity: string;
    category: string;
    played_move_uci: string;
    best_move_uci: string;
    eval_drop_cp: number;
    ply_index: number;
    created_at: string;
  };
};

@Injectable()
export class PuzzlesService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextPuzzle(params: {
    user_id: string;
  }): Promise<NextPuzzleResult | null> {
    const latestMistake = await this.prisma.criticalMistake.findFirst({
      where: {
        userId: params.user_id,
      },
      orderBy: {
        createdAt: 'desc',
      },
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
            period: true,
            timeClass: true,
          },
        },
      },
    });

    if (!latestMistake) {
      return null;
    }

    const sideToMove = this.resolveSideToMove(latestMistake.fen);
    const sideLabel = sideToMove === 'white' ? 'blancs' : 'noirs';

    return {
      puzzle_id: latestMistake.id,
      source: 'critical_mistake',
      fen: latestMistake.fen,
      side_to_move: sideToMove,
      objective: `Trouve le meilleur coup pour les ${sideLabel} dans cette position.`,
      context: {
        game_id: latestMistake.gameId,
        game_url: latestMistake.game.gameUrl,
        chess_com_username: latestMistake.game.chessComUsername,
        period: latestMistake.game.period,
        time_class: latestMistake.game.timeClass,
        phase: latestMistake.phase,
        severity: latestMistake.severity,
        category: latestMistake.category,
        played_move_uci: latestMistake.playedMoveUci,
        best_move_uci: latestMistake.bestMoveUci,
        eval_drop_cp: latestMistake.evalDropCp,
        ply_index: latestMistake.plyIndex,
        created_at: latestMistake.createdAt.toISOString(),
      },
    };
  }

  private resolveSideToMove(fen: string): 'white' | 'black' {
    const parts = fen.split(' ');
    const activeColor = parts[1];
    return activeColor === 'b' ? 'black' : 'white';
  }
}
