import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SummaryPage from './SummaryPage';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('SummaryPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('renders table with check-in and check-out pairs', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        data: [
          {
            date: '2023-10-01',
            checkIn: '2023-10-01T08:00:00Z',
            checkOut: '2023-10-01T17:00:00Z',
          },
        ],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SummaryPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText('2023-10-01')).toBeInTheDocument();
  });

  it('shows empty state when no records', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    render(
      <QueryClientProvider client={queryClient}>
        <SummaryPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/No attendance records found/i)).toBeInTheDocument();
  });

  it('handles filtering date range', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SummaryPage />
      </QueryClientProvider>
    );

    const fromInput = container.querySelectorAll('input[type="date"]')[0] as HTMLInputElement;
    fireEvent.change(fromInput, { target: { value: '2023-10-01' } });

    const filterBtn = screen.getByText('Search');
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendances/me', expect.objectContaining({
        params: expect.objectContaining({ from: '2023-10-01' }),
      }));
    });
  });
});
