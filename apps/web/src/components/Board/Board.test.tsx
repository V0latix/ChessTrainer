import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Board } from './Board';

describe('Board', () => {
  it('plays a move via keyboard only', async () => {
    const user = userEvent.setup();
    const onMovePlayed = vi.fn();

    render(
      <Board
        initialFen="8/8/8/8/8/8/8/K6k b - - 0 1"
        onMovePlayed={onMovePlayed}
      />,
    );

    const from = screen.getByRole('button', { name: /Case h1, pièce roi noir/i });
    const to = screen.getByRole('button', { name: /Case h2/i });

    from.focus();
    await user.keyboard('{Enter}');
    to.focus();
    await user.keyboard('{Enter}');

    expect(onMovePlayed).toHaveBeenCalledWith('h1h2');
  });

  it('exposes selected square state for assistive technologies', async () => {
    const user = userEvent.setup();

    render(<Board initialFen="8/8/8/8/8/8/8/K6k b - - 0 1" />);

    const from = screen.getByRole('button', { name: /Case h1, pièce roi noir/i });

    expect(from).toHaveAttribute('aria-pressed', 'false');

    await user.click(from);

    expect(from).toHaveAttribute('aria-pressed', 'true');
  });
});
