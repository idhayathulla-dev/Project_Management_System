import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../src/app/dashboard/page';
import api from '../src/lib/api';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/components/ui/Toast';

// Mock Recharts ResponsiveContainer to avoid size calculation errors in JSDOM
jest.mock('recharts', () => {
  const original = jest.requireActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  };
});

// Mock hooks and auth context
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
  usePathname: () => '/dashboard',
}));

// Mock the API layer
jest.mock('../src/lib/api', () => ({
  get: jest.fn(),
}));

describe('Dashboard Page Rendering', () => {
  const mockStats = {
    totalProjects: 15,
    totalTasks: 50,
    completedTasks: 35,
    pendingTasks: 15,
    projectsInProgress: 5,
    completedProjects: 8,
    notStartedProjects: 2,
    highPriorityTasks: 10,
    overdueTasks: 3,
  };

  const mockProjectStatus = {
    notStarted: 2,
    inProgress: 5,
    completed: 8,
  };

  const mockTaskStatus = {
    pending: 15,
    inProgress: 15,
    completed: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1', fullName: 'Jane Doe', email: 'jane@example.com' },
      loading: false,
    });
    (useToast as jest.Mock).mockReturnValue({
      success: jest.fn(),
      error: jest.fn(),
    });
  });

  it('renders all metrics cards with correct values from API', async () => {
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/api/stats') return Promise.resolve({ data: { success: true, data: mockStats } });
      if (url === '/api/stats/project-status') return Promise.resolve({ data: mockProjectStatus });
      if (url === '/api/stats/task-status') return Promise.resolve({ data: mockTaskStatus });
      return Promise.reject(new Error('Invalid Route'));
    });

    render(<Dashboard />);

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument(); // totalProjects
      expect(screen.getByText('50')).toBeInTheDocument(); // totalTasks
      expect(screen.getByText('35')).toBeInTheDocument(); // completedTasks
      expect(screen.getByText('8')).toBeInTheDocument();  // completedProjects
      expect(screen.getByText('3')).toBeInTheDocument();  // overdueTasks
    });

    // Check titles of metrics
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
  });
});
