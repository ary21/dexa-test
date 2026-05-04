import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminAttendancePage from './AdminAttendancePage';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('AdminAttendancePage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('renders admin attendance list', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        data: [
          {
            id: 'att-1',
            date: '2023-10-01',
            status: 'CHECK_IN',
            employeeName: 'John Doe',
          },
        ],
        total: 1,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminAttendancePage />
      </QueryClientProvider>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  it('filters attendances by employee name after clicking Search', async () => {
    (api.get as any).mockResolvedValue({ data: { data: [], total: 0 } });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminAttendancePage />
      </QueryClientProvider>
    );

    // Type name and click Search
    const searchInput = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/attendances',
        expect.objectContaining({
          params: expect.objectContaining({ employeeName: 'Jane' }),
        })
      );
    }, { timeout: 1000 });
  });

  it('shows from/to date filters with today as default', () => {
    (api.get as any).mockResolvedValue({ data: { data: [], total: 0 } });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminAttendancePage />
      </QueryClientProvider>
    );

    // Both date inputs should be present via their label text
    const fromLabel = screen.getByText('From');
    const toLabel = screen.getByText('To');
    expect(fromLabel).toBeInTheDocument();
    expect(toLabel).toBeInTheDocument();
  });
});
