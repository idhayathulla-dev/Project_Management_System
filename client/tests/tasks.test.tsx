import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Tasks from '../src/app/tasks/page';
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
  usePathname: () => '/tasks',
}));

jest.mock('../src/lib/api', () => ({
  get: jest.fn(),
  delete: jest.fn(),
  put: jest.fn(),
}));

describe('Tasks List Page Rendering & User Interactions', () => {
  const mockTasks = [
    {
      id: 'task-1',
      taskName: 'Implement JWT Hashing',
      description: 'Setup token cryptography',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: '2026-06-25T00:00:00.000Z',
      projectId: 'project-1',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
      project: {
        projectName: 'Security Audit',
      },
    },
    {
      id: 'task-2',
      taskName: 'Create UI Sidebar Layout',
      description: 'Setup navigation elements',
      priority: 'LOW',
      status: 'COMPLETED',
      dueDate: '2026-06-30T00:00:00.000Z',
      projectId: 'project-2',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
      project: {
        projectName: 'Main Dashboard',
      },
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 10,
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

  it('fetches and renders tasks and handles search, status, and priority filters', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: { tasks: mockTasks },
        pagination: mockPagination,
      },
    });

    render(<Tasks />);

    await waitFor(() => {
      expect(screen.getByText('Implement JWT Hashing')).toBeInTheDocument();
    });

    // 1. Search input change (debounced)
    const searchInput = screen.getByPlaceholderText(/Search tasks by title.../i);
    fireEvent.change(searchInput, { target: { value: 'jwt' } });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/tasks?page=1&limit=10&search=jwt&sortBy=createdAt&order=desc'
      );
    });

    // 2. Select filter elements
    const selectElements = screen.getAllByRole('combobox');
    const statusDropdown = selectElements[0];
    const priorityDropdown = selectElements[1];
    const sortByDropdown = selectElements[2];

    // Status filter
    fireEvent.change(statusDropdown, { target: { value: 'COMPLETED' } });
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/tasks?page=1&limit=10&status=COMPLETED&search=jwt&sortBy=createdAt&order=desc'
      );
    });

    // Priority filter
    fireEvent.change(priorityDropdown, { target: { value: 'HIGH' } });
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/tasks?page=1&limit=10&status=COMPLETED&priority=HIGH&search=jwt&sortBy=createdAt&order=desc'
      );
    });

    // Sort By (changing from default 'createdAt' to 'dueDate')
    fireEvent.change(sortByDropdown, { target: { value: 'dueDate' } });
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/tasks?page=1&limit=10&status=COMPLETED&priority=HIGH&search=jwt&sortBy=dueDate&order=desc'
      );
    });

    // Toggling sort order
    const orderBtn = screen.getByRole('button', { name: /Descending/i });
    fireEvent.click(orderBtn);
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/tasks?page=1&limit=10&status=COMPLETED&priority=HIGH&search=jwt&sortBy=dueDate&order=asc'
      );
    });
  });

  it('handles pagination actions', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: { tasks: mockTasks },
        pagination: mockPagination,
      },
    });

    const { container } = render(<Tasks />);
    await waitFor(() => {
      expect(screen.getByText('Implement JWT Hashing')).toBeInTheDocument();
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
        '/api/tasks?page=2&limit=10&sortBy=createdAt&order=desc'
      );
    });
  });

  it('handles task deletion workflow', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: { tasks: mockTasks },
        pagination: mockPagination,
      },
    });
    (api.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(<Tasks />);
    await waitFor(() => {
      expect(screen.getByText('Implement JWT Hashing')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete Task');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/Delete Task\?/i)).toBeInTheDocument();
    
    const confirmBtn = screen.getAllByRole('button', { name: /Delete Task/i }).slice(-1)[0];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/tasks/task-1');
      expect(mockSuccess).toHaveBeenCalledWith("Task 'Implement JWT Hashing' deleted successfully.");
    });
  });
});
