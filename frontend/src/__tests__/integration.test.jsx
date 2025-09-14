import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/Login';
import EventFeedback from '../components/EventFeedback';
import CertificateManagement from '../components/CertificateManagement';

// Mock all external dependencies
let mockLogin, mockNavigate, mockOnFeedbackSubmitted;
let mockAuthContext, mockFeedbackAPI, mockCertificateService, mockSweetAlert;

jest.mock('../contexts/AuthContext', () => {
  mockAuthContext = {
    useAuth: () => ({
      user: { id: 1, email: 'test@example.com', username: 'testuser' },
      login: (mockLogin = mockLogin || jest.fn()),
      isAuthenticated: true,
    }),
  };
  return mockAuthContext;
});

jest.mock('../services/eventService', () => {
  mockFeedbackAPI = {
    submit: jest.fn(),
    uploadAttachment: jest.fn(),
  };
  return {
    feedbackAPI: mockFeedbackAPI,
  };
});

jest.mock('../services/apiServices', () => {
  mockCertificateService = {
    getAttendedEvents: jest.fn(),
    requestCertificate: jest.fn(),
  };
  return {
    certificateService: mockCertificateService,
  };
});

jest.mock('../utils/sweetAlert', () => {
  mockSweetAlert = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showEmailSent: jest.fn(),
  };
  return mockSweetAlert;
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => (mockNavigate = mockNavigate || jest.fn()),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileFocus, whileHover, whileTap, initial, animate, transition, variants, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, whileFocus, whileHover, whileTap, initial, animate, transition, variants, ...props }) => <button {...props}>{children}</button>,
  },
}));

// Mock TwoFactorModal
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

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow Integration', () => {
    test('successful login navigates to dashboard', async () => {
      mockLogin.mockResolvedValue({
        success: true,
        user: { emailVerified: true },
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    test('login with 2FA requirement shows modal and completes flow', async () => {
      mockLogin.mockResolvedValue({
        requiresTwoFactor: true,
        user: { id: 1, email: 'test@example.com' },
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('two-factor-modal')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Complete 2FA');
      await user.click(completeButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    test('login error displays appropriate message', async () => {
      const errorMessage = 'Invalid credentials';
      mockLogin.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('EventFeedback Integration', () => {
    test('complete feedback submission with file upload', async () => {
      mockFeedbackAPI.uploadAttachment.mockResolvedValue('uploaded-file-url');
      mockFeedbackAPI.submit.mockResolvedValue({ success: true });

      render(<EventFeedback eventId="event123" onFeedbackSubmitted={mockOnFeedbackSubmitted} />);

      const user = userEvent.setup();

      // Fill rating
      const stars = screen.getAllByText('★');
      await user.click(stars[4]); // 5-star rating

      // Add comments
      const commentsTextarea = screen.getByLabelText(/comments/i);
      await user.type(commentsTextarea, 'Excellent event!');

      // Upload file
      const fileInput = screen.getByLabelText(/choose files/i);
      const file = new File(['test content'], 'feedback.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFeedbackAPI.uploadAttachment).toHaveBeenCalledWith(file);
        expect(mockFeedbackAPI.submit).toHaveBeenCalledWith({
          eventId: 'event123',
          rating: 5,
          comments: 'Excellent event!',
          attachments: ['uploaded-file-url'],
          componentRatings: {
            venue: 0,
            coordination: 0,
            technical: 0,
            hospitality: 0,
          },
        });
        expect(mockOnFeedbackSubmitted).toHaveBeenCalled();
      });
    });

    test('feedback submission handles file upload failure', async () => {
      mockFeedbackAPI.uploadAttachment.mockRejectedValue(new Error('Upload failed'));
      mockFeedbackAPI.submit.mockResolvedValue({ success: true });

      render(<EventFeedback eventId="event123" onFeedbackSubmitted={mockOnFeedbackSubmitted} />);

      const user = userEvent.setup();

      // Fill required fields
      const stars = screen.getAllByText('★');
      await user.click(stars[3]); // 4-star rating

      // Upload file
      const fileInput = screen.getByLabelText(/choose files/i);
      const file = new File(['test'], 'failed.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFeedbackAPI.submit).toHaveBeenCalledWith(
          expect.objectContaining({
            attachments: [], // Should be empty due to upload failure
            rating: 4,
          })
        );
      });
    });
  });

  describe('CertificateManagement Integration', () => {
    test('complete certificate request flow', async () => {
      const mockEvents = [
        {
          _id: 'event1',
          title: 'Tech Conference 2024',
          date: '2024-01-15T00:00:00.000Z',
        },
      ];

      mockCertificateService.getAttendedEvents.mockResolvedValue({
        events: mockEvents,
      });
      mockCertificateService.requestCertificate.mockResolvedValue({ success: true });

      render(<CertificateManagement />);

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Tech Conference 2024 - 1/15/2024')).toBeInTheDocument();
      });

      // Select event
      const eventSelect = screen.getByRole('combobox');
      await user.selectOptions(eventSelect, 'event1');

      // Submit request
      const submitButton = screen.getByRole('button', { name: /request certificate/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCertificateService.requestCertificate).toHaveBeenCalledWith('event1');
        expect(mockSweetAlert.showSuccess).toHaveBeenCalledWith('Certificate request submitted successfully!');
      });
    });

    test('certificate request with API error', async () => {
      const mockEvents = [
        {
          _id: 'event1',
          title: 'Tech Conference 2024',
          date: '2024-01-15T00:00:00.000Z',
        },
      ];

      mockCertificateService.getAttendedEvents.mockResolvedValue({
        events: mockEvents,
      });
      mockCertificateService.requestCertificate.mockRejectedValue(
        new Error('Certificate request failed')
      );

      render(<CertificateManagement />);

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Tech Conference 2024 - 1/15/2024')).toBeInTheDocument();
      });

      // Select event and submit
      const eventSelect = screen.getByRole('combobox');
      await user.selectOptions(eventSelect, 'event1');
      const submitButton = screen.getByRole('button', { name: /request certificate/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSweetAlert.showError).toHaveBeenCalledWith('Certificate request failed');
      });
    });
  });

  describe('Cross-component Integration', () => {
    test('navigation flow between components', async () => {
      // This test would verify that navigation between components works correctly
      // For now, we'll test that navigation functions are called appropriately

      mockLogin.mockResolvedValue({
        success: true,
        user: { emailVerified: true },
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    test('error handling across components', async () => {
      // Test that errors are handled consistently across components
      mockLogin.mockRejectedValue({
        response: { data: { message: 'Network error' } },
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation Integration', () => {
    test('login form validation prevents invalid submissions', async () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Try to submit empty form
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
        expect(screen.getByText('Please enter your password')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('feedback form validation works correctly', async () => {
      render(<EventFeedback eventId="event123" onFeedbackSubmitted={mockOnFeedbackSubmitted} />);

      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /submit feedback/i });

      // Try to submit without rating
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Rating is required')).toBeInTheDocument();
      });

      expect(mockFeedbackAPI.submit).not.toHaveBeenCalled();
    });

    test('certificate form validation prevents invalid submissions', async () => {
      mockCertificateService.getAttendedEvents.mockResolvedValue({
        events: [
          {
            _id: 'event1',
            title: 'Tech Conference 2024',
            date: '2024-01-15T00:00:00.000Z',
          },
        ],
      });

      render(<CertificateManagement />);

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Tech Conference 2024 - 1/15/2024')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /request certificate/i });

      // Try to submit without selecting event
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select an event')).toBeInTheDocument();
      });

      expect(mockCertificateService.requestCertificate).not.toHaveBeenCalled();
    });
  });

  describe('Loading States Integration', () => {
    test('login shows loading state during submission', async () => {
      mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent('Signing In...');
      });
    });

    test('feedback form shows loading during submission', async () => {
      mockFeedbackAPI.submit.mockImplementation(() => new Promise(() => {}));

      render(<EventFeedback eventId="event123" onFeedbackSubmitted={mockOnFeedbackSubmitted} />);

      const user = userEvent.setup();

      // Fill required fields
      const stars = screen.getAllByText('★');
      await user.click(stars[4]);
      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent('Submitting...');
      });
    });

    test('certificate form shows loading during submission', async () => {
      const mockEvents = [
        {
          _id: 'event1',
          title: 'Tech Conference 2024',
          date: '2024-01-15T00:00:00.000Z',
        },
      ];

      mockCertificateService.getAttendedEvents.mockResolvedValue({
        events: mockEvents,
      });
      mockCertificateService.requestCertificate.mockImplementation(() => new Promise(() => {}));

      render(<CertificateManagement />);

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Tech Conference 2024 - 1/15/2024')).toBeInTheDocument();
      });

      const eventSelect = screen.getByRole('combobox');
      await user.selectOptions(eventSelect, 'event1');
      const submitButton = screen.getByRole('button', { name: /request certificate/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent('Submitting...');
      });
    });
  });
});