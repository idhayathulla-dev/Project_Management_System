import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../src/app/register/page';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/components/ui/Toast';

// Mock context and router hooks
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
  usePathname: () => '/register',
}));

describe('Register Page Rendering & Form Validation', () => {
  const mockRegister = jest.fn();
  const mockSuccess = jest.fn();
  const mockError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      register: mockRegister,
    });
    (useToast as jest.Mock).mockReturnValue({
      success: mockSuccess,
      error: mockError,
    });
  });

  it('renders register layout inputs and buttons', () => {
    render(<Register />);
    
    expect(screen.getByRole('heading', { name: /Create an Account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('validates too-short name and password length limits', async () => {
    render(<Register />);
    
    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(nameInput, { target: { value: 'A' } }); // too short
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passInput, { target: { value: '123' } }); // too short
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Full Name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('handles successful registration and shows success toast', async () => {
    mockRegister.mockResolvedValueOnce({ id: 'user-2' });
    render(<Register />);
    
    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Jane Doe', 'jane@example.com', 'Password123!');
      expect(mockSuccess).toHaveBeenCalledWith('Account registered successfully! Welcome.');
    });
  });

  it('handles failed registration and shows error toast', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email is already taken'));
    render(<Register />);
    
    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Jane Doe', 'jane@example.com', 'Password123!');
      expect(mockError).toHaveBeenCalledWith('Email is already taken');
    });
  });
});
