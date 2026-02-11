import { PuzzlesController } from './puzzles.controller';

describe('PuzzlesController', () => {
  it('returns next puzzle payload from latest critical mistake', async () => {
    const getNextPuzzle = jest.fn().mockResolvedValue({
      puzzle_id: 'mistake-1',
      source: 'critical_mistake',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      side_to_move: 'white',
      objective: 'Trouve le meilleur coup pour les blancs dans cette position.',
      context: {
        game_id: 'game-1',
        game_url: 'https://www.chess.com/game/live/123',
        chess_com_username: 'leo',
        period: '2026-02',
        time_class: 'blitz',
        phase: 'opening',
        severity: 'mistake',
        category: 'opening_mistake',
        played_move_uci: 'g1f3',
        best_move_uci: 'd2d4',
        eval_drop_cp: 220,
        ply_index: 5,
        created_at: '2026-02-11T00:00:00.000Z',
      },
    });

    const controller = new PuzzlesController({
      getNextPuzzle,
    } as any);

    await expect(
      controller.getNextPuzzle({
        local_user_id: 'local-user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      }),
    ).resolves.toEqual({
      data: {
        puzzle_id: 'mistake-1',
        source: 'critical_mistake',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        side_to_move: 'white',
        objective:
          'Trouve le meilleur coup pour les blancs dans cette position.',
        context: {
          game_id: 'game-1',
          game_url: 'https://www.chess.com/game/live/123',
          chess_com_username: 'leo',
          period: '2026-02',
          time_class: 'blitz',
          phase: 'opening',
          severity: 'mistake',
          category: 'opening_mistake',
          played_move_uci: 'g1f3',
          best_move_uci: 'd2d4',
          eval_drop_cp: 220,
          ply_index: 5,
          created_at: '2026-02-11T00:00:00.000Z',
        },
      },
    });

    expect(getNextPuzzle).toHaveBeenCalledWith({
      user_id: 'local-user-1',
    });
  });

  it('returns null data when no puzzle is available yet', async () => {
    const controller = new PuzzlesController({
      getNextPuzzle: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(
      controller.getNextPuzzle({
        local_user_id: 'local-user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      }),
    ).resolves.toEqual({
      data: null,
    });
  });
});
