import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './LoginPage';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock API
vi.mock('../lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from '../lib/api';

const renderLogin = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── AC US-01: Form has email + password fields ───────────────
  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  // ── AC US-01: Password show/hide toggle ─────────────────────
  it('has a show/hide toggle on the password field', async () => {
    renderLogin();
    const pwField = screen.getByLabelText('Password');
    expect(pwField).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: /show|hide/i });
    await userEvent.click(toggle);
    expect(pwField).toHaveAttribute('type', 'text');
  });

  // ── AC US-01: Email format validation ───────────────────────
  it('shows validation error for invalid email format', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'pass123');
    fireEvent.submit(screen.getByRole('form'));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  // ── AC US-01: Error message on 401 ──────────────────────────
  it('shows "Invalid email or password" error on 401 response', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid email or password' } },
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'user@company.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  // ── AC US-01: Redirect to /profile on success ───────────────
  it('redirects to /profile on successful login', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { accessToken: 'test-token', user: { id: '1', role: 'EMPLOYEE' } },
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'user@company.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correctpass');
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });
});
