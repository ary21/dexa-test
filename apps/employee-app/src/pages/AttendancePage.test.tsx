import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AttendancePage from './AttendancePage';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AttendancePage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('shows check-in button if not checked in', async () => {
    (api.get as any).mockResolvedValue({ data: [] }); // No attendances today

    render(
      <QueryClientProvider client={queryClient}>
        <AttendancePage />
      </QueryClientProvider>
    );

    expect(await screen.findByRole('button', { name: /check in/i })).toBeInTheDocument();
  });

  it('shows check-out button if checked in but not out', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: [{ checkIn: new Date().toISOString(), checkOut: null }] },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AttendancePage />
      </QueryClientProvider>
    );

    expect(await screen.findByRole('button', { name: /check out/i })).toBeInTheDocument();
  });

  it('shows completed state if both checked in and out', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        data: [{ checkIn: new Date().toISOString(), checkOut: new Date().toISOString() }],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AttendancePage />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Attendance complete for today/i)).toBeInTheDocument();
  });

  it('handles check in successfully', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    (api.post as any).mockResolvedValue({});

    render(
      <QueryClientProvider client={queryClient}>
        <AttendancePage />
      </QueryClientProvider>
    );

    const checkInBtn = await screen.findByRole('button', { name: /check in/i });
    fireEvent.click(checkInBtn);

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/attendances/check-in');
    });
  });
});
