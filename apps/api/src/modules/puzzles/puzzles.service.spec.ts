import { NotFoundException } from '@nestjs/common';
import { PuzzlesService } from './puzzles.service';

describe('PuzzlesService', () => {
  const baseMistake = {
    id: 'mistake-1',
    gameId: 'game-1',
    fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
    phase: 'endgame',
    severity: 'blunder',
    category: 'endgame_blunder',
    playedMoveUci: 'h1h2',
    bestMoveUci: 'h1g1',
    evalDropCp: 540,
    plyIndex: 60,
    createdAt: new Date('2026-02-11T00:00:00.000Z'),
    game: {
      gameUrl: 'https://www.chess.com/game/live/123',
      chessComUsername: 'leo',
      period: '2026-02',
      timeClass: 'rapid',
    },
  };

  it('returns a puzzle projection from the most recent critical mistake', async () => {
    const findMany = jest.fn().mockResolvedValue([baseMistake]);

    const service = new PuzzlesService({
      criticalMistake: {
        findMany,
      },
    } as any);

    await expect(
      service.getNextPuzzle({
        user_id: 'local-user-1',
      }),
    ).resolves.toEqual({
      puzzle_id: 'mistake-1',
      source: 'critical_mistake',
      fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
      side_to_move: 'black',
      objective: 'Trouve le meilleur coup pour les noirs dans cette position.',
      context: {
        game_id: 'game-1',
        game_url: 'https://www.chess.com/game/live/123',
        chess_com_username: 'leo',
        period: '2026-02',
        time_class: 'rapid',
        phase: 'endgame',
        severity: 'blunder',
        category: 'endgame_blunder',
        played_move_uci: 'h1h2',
        best_move_uci: 'h1g1',
        eval_drop_cp: 540,
        ply_index: 60,
        created_at: '2026-02-11T00:00:00.000Z',
      },
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: 'local-user-1',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
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
  });

  it('returns a session of puzzles ordered by most recent mistakes', async () => {
    const findMany = jest.fn().mockResolvedValue([
      baseMistake,
      {
        ...baseMistake,
        id: 'mistake-2',
        bestMoveUci: 'h1h3',
      },
    ]);

    const service = new PuzzlesService({
      criticalMistake: {
        findMany,
      },
    } as any);

    await expect(
      service.getPuzzleSession({
        user_id: 'local-user-1',
        limit: 5,
      }),
    ).resolves.toEqual({
      session_id: 'local-user-1:mistake-1',
      generated_at: expect.any(String),
      total_puzzles: 2,
      puzzles: [
        expect.objectContaining({
          puzzle_id: 'mistake-1',
        }),
        expect.objectContaining({
          puzzle_id: 'mistake-2',
        }),
      ],
    });
  });

  it('returns null when no critical mistake exists for the user', async () => {
    const service = new PuzzlesService({
      criticalMistake: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any);

    await expect(
      service.getNextPuzzle({
        user_id: 'local-user-1',
      }),
    ).resolves.toBeNull();
  });

  it('marks attempt as correct when move matches best move', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'mistake-1',
      bestMoveUci: 'h1g1',
      phase: 'endgame',
      severity: 'blunder',
      evalDropCp: 540,
    });

    const service = new PuzzlesService({
      criticalMistake: {
        findFirst,
      },
    } as any);

    await expect(
      service.evaluateAttempt({
        user_id: 'local-user-1',
        puzzle_id: 'mistake-1',
        attempted_move_uci: 'h1g1',
      }),
    ).resolves.toEqual({
      puzzle_id: 'mistake-1',
      attempted_move_uci: 'h1g1',
      best_move_uci: 'h1g1',
      is_correct: true,
      status: 'correct',
      feedback_title: 'Bien joué',
      feedback_message:
        'Excellent: c’est le meilleur coup dans cette position.',
      wrong_move_explanation:
        'Ton coup h1g1 correspond déjà au meilleur choix de la position.',
      best_move_explanation:
        "Le coup h1g1 est meilleur car il améliore l'activité du roi et la coordination des pions. C’est la ressource la plus solide contre une erreur de type blunder.",
      retry_available: false,
    });

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'mistake-1',
        userId: 'local-user-1',
      },
      select: {
        id: true,
        bestMoveUci: true,
        phase: true,
        severity: true,
        evalDropCp: true,
      },
    });
  });

  it('marks attempt as incorrect and allows retry when move differs', async () => {
    const service = new PuzzlesService({
      criticalMistake: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'mistake-1',
          bestMoveUci: 'h1g1',
          phase: 'endgame',
          severity: 'blunder',
          evalDropCp: 540,
        }),
      },
    } as any);

    await expect(
      service.evaluateAttempt({
        user_id: 'local-user-1',
        puzzle_id: 'mistake-1',
        attempted_move_uci: 'h1h2',
      }),
    ).resolves.toEqual({
      puzzle_id: 'mistake-1',
      attempted_move_uci: 'h1h2',
      best_move_uci: 'h1g1',
      is_correct: false,
      status: 'incorrect',
      feedback_title: 'Presque',
      feedback_message: 'Ce n’est pas le meilleur coup. Essaie encore: h1g1.',
      wrong_move_explanation:
        'Le coup h1h2 en endgame (blunder) laisse passer une idée clé et coûte environ 540 centipawns.',
      best_move_explanation:
        "Le coup h1g1 est meilleur car il améliore l'activité du roi et la coordination des pions. C’est la ressource la plus solide contre une erreur de type blunder.",
      retry_available: true,
    });
  });

  it('throws not found when puzzle does not belong to user', async () => {
    const service = new PuzzlesService({
      criticalMistake: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any);

    await expect(
      service.evaluateAttempt({
        user_id: 'local-user-1',
        puzzle_id: 'mistake-unknown',
        attempted_move_uci: 'h1g1',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
