import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartScreen from '@/components/StartScreen';

// AppShell wraps children in a full-page container — safe to render as-is.
const defaultProps = {
  onStart:       vi.fn(),
  onAddQuestion: vi.fn(),
  onLeaderboard: vi.fn(),
  onMultiplayer: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ inserted: 5 }) });
});

describe('StartScreen — render', () => {
  it('shows the "Empezar el Quiz" button', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByRole('button', { name: /empezar el quiz/i })).toBeInTheDocument();
  });

  it('shows the Ranking global button', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByRole('button', { name: /ranking global/i })).toBeInTheDocument();
  });

  it('shows the Multiplayer button', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByRole('button', { name: /multiplayer/i })).toBeInTheDocument();
  });

  it('shows the name input', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByPlaceholderText(/cómo te llamas/i)).toBeInTheDocument();
  });

  it('shows avatar selection', () => {
    render(<StartScreen {...defaultProps} />);
    const avatarButtons = screen.getAllByRole('radio');
    expect(avatarButtons.length).toBeGreaterThan(0);
  });
});

describe('StartScreen — form validation', () => {
  it('shows an error when submitting without a name', async () => {
    render(<StartScreen {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /empezar el quiz/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nombre/i);
    expect(defaultProps.onStart).not.toHaveBeenCalled();
  });

  it('clears the error when the user starts typing', async () => {
    const user = userEvent.setup();
    render(<StartScreen {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /empezar el quiz/i }));
    await screen.findByRole('alert');

    await user.type(screen.getByPlaceholderText(/cómo te llamas/i), 'A');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onStart with trimmed name on valid submit', async () => {
    const user = userEvent.setup();
    render(<StartScreen {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/cómo te llamas/i), '  Alice  ');
    fireEvent.click(screen.getByRole('button', { name: /empezar el quiz/i }));

    await waitFor(() => {
      expect(defaultProps.onStart).toHaveBeenCalledWith('Alice', expect.any(String));
    });
  });

  it('does not call onMultiplayer when clicking Multiplayer with empty name', async () => {
    render(<StartScreen {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /multiplayer/i }));
    expect(defaultProps.onMultiplayer).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('calls onMultiplayer with the player name when name is filled', async () => {
    const user = userEvent.setup();
    render(<StartScreen {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/cómo te llamas/i), 'Bob');
    fireEvent.click(screen.getByRole('button', { name: /multiplayer/i }));

    await waitFor(() => {
      expect(defaultProps.onMultiplayer).toHaveBeenCalledWith('Bob', expect.any(String));
    });
  });
});

describe('StartScreen — leaderboard & secondary actions', () => {
  it('calls onLeaderboard when clicking the ranking button', () => {
    render(<StartScreen {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /ranking global/i }));
    expect(defaultProps.onLeaderboard).toHaveBeenCalledOnce();
  });

  it('calls onAddQuestion when clicking "Añadir pregunta"', () => {
    render(<StartScreen {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /añadir pregunta/i }));
    expect(defaultProps.onAddQuestion).toHaveBeenCalledOnce();
  });
});

describe('StartScreen — avatar selection', () => {
  it('selecting an avatar marks it as checked', async () => {
    const user = userEvent.setup();
    render(<StartScreen {...defaultProps} />);

    const radios = screen.getAllByRole('radio');
    await user.click(radios[2]);
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
  });

  it('passes the selected avatar to onStart', async () => {
    const user = userEvent.setup();
    render(<StartScreen {...defaultProps} />);

    const radios = screen.getAllByRole('radio');
    const targetAvatar = radios[3].getAttribute('aria-label')?.replace('Avatar ', '') ?? '';

    await user.click(radios[3]);
    await user.type(screen.getByPlaceholderText(/cómo te llamas/i), 'Charlie');
    fireEvent.click(screen.getByRole('button', { name: /empezar el quiz/i }));

    await waitFor(() => {
      expect(defaultProps.onStart).toHaveBeenCalledWith('Charlie', targetAvatar);
    });
  });
});
