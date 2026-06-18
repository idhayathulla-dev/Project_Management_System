import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Projects from '../src/app/projects/page';
import api from '../src/lib/api';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/components/ui/Toast';

// Mock context and routing hooks
jest.mock('../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../src/components/ui/Toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/projects',
}));

jest.mock('../src/lib/api', () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));

describe('Projects List Page Rendering & User Interactions', () => {
  const mockProjects = [
    {
      id: 'project-1',
      projectName: 'Website Build',
      description: 'Create responsive company page',
      status: 'IN_PROGRESS',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T00:00:00.000Z',
      userId: 'user-1',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    },
    {
      id: 'project-2',
      projectName: 'Mobile App API',
      description: 'Write express endpoints for mobile integration',
      status: 'NOT_STARTED',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-15T00:00:00.000Z',
      userId: 'user-1',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 6,
    total: 2,
    totalPages: 2,
  };

  const mockSuccess = jest.fn();
  const mockError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1', fullName: 'Jane Doe', email: 'jane@example.com' },
      loading: false,
    });
    (useToast as jest.Mock).mockReturnValue({
      success: mockSuccess,
      error: mockError,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches and renders projects and handles search and filters', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: { projects: mockProjects },
        pagination: mockPagination,
      },
    });

    render(<Projects />);

    await waitFor(() => {
      expect(screen.getByText('Website Build')).toBeInTheDocument();
    });

    // 1. Test search input change (with debouncing)
    const searchInput = screen.getByPlaceholderText(/Search projects.../i);
    fireEvent.change(searchInput, { target: { value: 'build' } });
    
    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/projects?page=1&limit=6&search=build&sortBy=createdAt&order=desc'
      );
    });

    // 2. Test status filter change
    const selectElements = screen.getAllByRole('combobox');
    const statusDropdown = selectElements[0];
    const sortByDropdown = selectElements[1];

    fireEvent.change(statusDropdown, { target: { value: 'IN_PROGRESS' } });
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/projects?page=1&limit=6&status=IN_PROGRESS&search=build&sortBy=createdAt&order=desc'
      );
    });

    // 3. Test sortBy dropdown change
    fireEvent.change(sortByDropdown, { target: { value: 'projectName' } });
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/projects?page=1&limit=6&status=IN_PROGRESS&search=build&sortBy=projectName&order=desc'
      );
    });

    // 4. Test toggling sort order
    const orderBtn = screen.getByRole('button', { name: /Descending/i });
    fireEvent.click(orderBtn);
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/projects?page=1&limit=6&status=IN_PROGRESS&search=build&sortBy=projectName&order=asc'
      );
    });
  });

  it('handles pagination actions', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: { projects: mockProjects },
        pagination: mockPagination,
      },
    });

    const { container } = render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('Website Build')).toBeInTheDocument();
    });

    // Locate pagination buttons by their Chevron icons inside
    const prevPageBtn = container.querySelector('svg.lucide-chevron-left')?.closest('button');
    const nextPageBtn = container.querySelector('svg.lucide-chevron-right')?.closest('button');

    expect(prevPageBtn).toBeInTheDocument();
    expect(nextPageBtn).toBeInTheDocument();

    expect(prevPageBtn).toBeDisabled();
    expect(nextPageBtn).not.toBeDisabled();

    fireEvent.click(nextPageBtn!);
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/projects?page=2&limit=6&sortBy=createdAt&order=desc'
      );
    });
  });

  it('handles project deletion workflow', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: { projects: mockProjects },
        pagination: mockPagination,
      },
    });
    (api.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('Website Build')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete Project');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/Delete Project\?/i)).toBeInTheDocument();
    
    const confirmBtn = screen.getAllByRole('button', { name: /Delete Project/i }).slice(-1)[0];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/projects/project-1');
      expect(mockSuccess).toHaveBeenCalledWith("Project 'Website Build' deleted successfully.");
    });
  });
});
