import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from './ProfilePage';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

global.fetch = vi.fn();

describe('ProfilePage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('renders profile data correctly', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        id: '1', name: 'John Doe', email: 'john@example.com',
        position: 'Engineer', phone: '08123456789', photoUrl: 'http://photo.jpg',
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('08123456789')).toBeInTheDocument();
  });

  it('shows error when photo is too large', async () => {
    (api.get as any).mockResolvedValue({
      data: { id: '1', name: 'John', position: 'A', phone: '1', photoUrl: null },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    );

    await screen.findByText('John');

    // Simulate file upload
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalledWith('File size must be under 2MB');
  });

  it('uploads photo successfully', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/employees/me') {
        return Promise.resolve({ data: { id: '1', name: 'John', position: 'A', phone: '1', photoUrl: null } });
      }
      if (url === '/employees/me/upload-url') {
        return Promise.resolve({ data: { uploadUrl: 'http://upload-url', fileUrl: 'http://file-url' } });
      }
      return Promise.resolve({ data: {} });
    });

    (api.patch as any).mockResolvedValue({});
    (global.fetch as any).mockResolvedValue({});

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    );

    await screen.findByText('John');

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/employees/me/upload-url', expect.any(Object));
      expect(global.fetch).toHaveBeenCalledWith('http://upload-url', expect.any(Object));
      expect(api.patch).toHaveBeenCalledWith('/employees/me/photo', { photoUrl: 'http://file-url' });
    });
  });
});
