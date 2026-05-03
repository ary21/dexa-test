import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmployeeListPage from './EmployeeListPage';
import api from '../lib/api';
import { BrowserRouter } from 'react-router-dom';

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

describe('EmployeeListPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('renders employee list', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        data: [
          { id: '1', name: 'Admin', email: 'admin@company.com', position: 'HR', phone: '123' },
        ],
        meta: { total: 1, lastPage: 1 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <EmployeeListPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('admin@company.com')).toBeInTheDocument();
  });

  it('filters employees by search', async () => {
    (api.get as any).mockResolvedValue({ data: { data: [], meta: {} } });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <EmployeeListPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/employees', expect.objectContaining({
        params: expect.objectContaining({ search: 'John' }),
      }));
    }, { timeout: 1000 });
  });
});
