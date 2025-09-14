import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/Login';

// Mock the dependencies
const mockLogin = jest.fn();
const mockResendVerification = jest.fn();
const mockNavigate = jest.fn();
const mockSearchParams = jest.fn();

const mockUseAuth = jest.fn(() => ({
  login: mockLogin,
  resendVerification: mockResendVerification,
  isLoggingIn: false,
  isResendingVerification: false,
}));

const mockUseSearchParams = jest.fn(() => [new URLSearchParams(), mockSearchParams]);

jest.mock('../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: mockUseSearchParams,
}));

jest.mock('../utils/sweetAlert', () => ({
  showEmailSent: jest.fn(),
  showError: jest.fn(),
}));

jest.mock('../components/TwoFactorModal', () => {
  return function MockTwoFactorModal({ isOpen, onClose, user, onSuccess }) {
    return isOpen ? (
      <div data-testid="two-factor-modal">
        <button onClick={() => onSuccess({ user: { emailVerified: true } })}>
          Complete 2FA
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileFocus, whileHover, whileTap, initial, animate, transition, variants, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, whileFocus, whileHover, whileTap, initial, animate, transition, variants, ...props }) => <button {...props}>{children}</button>,
  },
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form correctly', () => {
    renderLogin();

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your EventSphere account')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderLogin();
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
      expect(screen.getByText('Please enter your password')).toBeInTheDocument();
    });
  });

  test('shows validation error for invalid email format', async () => {
    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument();
    });
  });

  test('shows validation error for short password', async () => {
    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  test('submits form successfully and navigates', async () => {
    mockLogin.mockResolvedValue({
      success: true,
      user: { emailVerified: true },
    });

    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  test('handles 2FA requirement', async () => {
    mockLogin.mockResolvedValue({
      requiresTwoFactor: true,
      user: { id: 1, email: 'test@example.com' },
    });

    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('two-factor-modal')).toBeInTheDocument();
    });

    // Complete 2FA
    const completeButton = screen.getByText('Complete 2FA');
    await user.click(completeButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  test('handles unverified email redirect', async () => {
    mockLogin.mockResolvedValue({
      success: true,
      user: { emailVerified: false },
    });

    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/email-verification-pending');
    });
  });

  test('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('shows resend verification option for EMAIL_NOT_VERIFIED error', async () => {
    mockLogin.mockRejectedValue({
      response: {
        data: {
          message: 'Email not verified',
          error: 'EMAIL_NOT_VERIFIED',
        },
      },
    });

    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Resend Verification Email')).toBeInTheDocument();
    });
  });

  test('toggles password visibility', async () => {
    renderLogin();
    const user = userEvent.setup();

    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('navigates to return URL after successful login', async () => {
    // Mock search params with return URL
    const mockSearchParamsInstance = new URLSearchParams('returnTo=/events');
    mockUseSearchParams.mockReturnValue([
      mockSearchParamsInstance,
      mockSearchParams,
    ]);

    mockLogin.mockResolvedValue({
      success: true,
      user: { emailVerified: true },
    });

    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/events', { replace: true });
    });
  });

  test('disables form during login', async () => {
    // Mock loading state
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      resendVerification: mockResendVerification,
      isLoggingIn: true,
      isResendingVerification: false,
    });

    renderLogin();

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByRole('textbox', { name: /password/i });
    const submitButton = screen.getByRole('button', { name: /signing in/i });

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});