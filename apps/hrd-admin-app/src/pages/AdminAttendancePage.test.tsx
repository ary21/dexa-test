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
        meta: { total: 1, lastPage: 1 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminAttendancePage />
      </QueryClientProvider>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  it('filters attendances by employee name', async () => {
    (api.get as any).mockResolvedValue({ data: { data: [], meta: {} } });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminAttendancePage />
      </QueryClientProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search employee name/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendances', expect.objectContaining({
        params: expect.objectContaining({ employeeName: 'Jane' }),
      }));
    }, { timeout: 1000 });
  });
});
