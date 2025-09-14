import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CertificateManagement from '../components/CertificateManagement';

// Mock the dependencies
let mockUser, mockCertificateService, mockShowSuccess, mockShowError;

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: (mockUser = mockUser || {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      fullName: 'John Doe',
      profile: {
        contactNumber: '+1234567890',
      },
    }),
    isAuthenticated: true,
  }),
}));

jest.mock('../services/apiServices', () => {
  mockCertificateService = {
    getAttendedEvents: jest.fn(),
    requestCertificate: jest.fn(),
  };
  return {
    certificateService: mockCertificateService,
  };
});

jest.mock('../utils/sweetAlert', () => ({
  showSuccess: (mockShowSuccess = mockShowSuccess || jest.fn()),
  showError: (mockShowError = mockShowError || jest.fn()),
}));

const renderCertificateManagement = () => {
  return render(<CertificateManagement />);
};

describe('CertificateManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders certificate request form', () => {
    mockCertificateService.getAttendedEvents.mockResolvedValue({
      events: [],
    });

    renderCertificateManagement();

    expect(screen.getByText('Request Certificate')).toBeInTheDocument();
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByText('Select Event Attended')).toBeInTheDocument();
  });

  test('displays user information correctly', async () => {
    mockCertificateService.getAttendedEvents.mockResolvedValue({
      events: [],
    });

    renderCertificateManagement();

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    });
  });

  test('loads attended events on mount', async () => {
    const mockEvents = [
      {
        _id: 'event1',
        title: 'Tech Conference 2024',
        date: '2024-01-15T00:00:00.000Z',
      },
      {
        _id: 'event2',
        title: 'Workshop on React',
        date: '2024-02-20T00:00:00.000Z',
      },
    ];

    mockCertificateService.getAttendedEvents.mockResolvedValue({
      events: mockEvents,
    });

    renderCertificateManagement();

    await waitFor(() => {
      expect(mockCertificateService.getAttendedEvents).toHaveBeenCalled();
      expect(screen.getByText('Tech Conference 2024 - 1/15/2024')).toBeInTheDocument();
      expect(screen.getByText('Workshop on React - 2/20/2024')).toBeInTheDocument();
    });
  });

  test('shows loading state while fetching events', () => {
    mockCertificateService.getAttendedEvents.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderCertificateManagement();

    expect(screen.getByText('Loading events...')).toBeInTheDocument();
  });

  test('shows message when no events attended', async () => {
    mockCertificateService.getAttendedEvents.mockResolvedValue({
      events: [],
    });

    renderCertificateManagement();

    await waitFor(() => {
      expect(screen.getByText('No attended events found. You must attend an event to request a certificate.')).toBeInTheDocument();
    });
  });

  test('validates event selection', async () => {
    mockCertificateService.getAttendedEvents.mockResolvedValue({
      events: [
        {
          _id: 'event1',
          title: 'Tech Conference 2024',
          date: '2024-01-15T00:00:00.000Z',
        },
      ],
    });

    renderCertificateManagement();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Tech Conference 2024 - 1/15/2024')).toBeInTheDocument();
    });

    // Try to submit without selecting an event
    const submitButton = screen.getByRole('button', { name: /request certificate/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select an event')).toBeInTheDocument();
    });
  });

  test('submits certificate request successfully', async () => {
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

    renderCertificateManagement();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Tech Conference 2024 - 1/15/2024')).toBeInTheDocument();
    });

    // Select event
    const eventSelect = screen.getByRole('combobox');
    await user.selectOptions(eventSelect, 'event1');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /request certificate/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCertificateService.requestCertificate).toHaveBeenCalledWith('event1');
      expect(mockShowSuccess).toHaveBeenCalledWith('Certificate request submitted successfully!');
    });
  });

  test('handles submission error', async () => {
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
      new Error('Request failed')
    );

    renderCertificateManagement();
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
      expect(mockShowError).toHaveBeenCalledWith('Request failed');
    });
  });

  test('shows loading state during submission', async () => {
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
    mockCertificateService.requestCertificate.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderCertificateManagement();
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
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  test('resets form after successful submission', async () => {
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

    renderCertificateManagement();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Tech Conference 2024 - 1/15/2024')).toBeInTheDocument();
    });

    // Select event
    const eventSelect = screen.getByRole('combobox');
    await user.selectOptions(eventSelect, 'event1');

    // Verify selection
    expect(eventSelect).toHaveValue('event1');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /request certificate/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(eventSelect).toHaveValue(''); // Should be reset
    });
  });

  test('disables submit button when no events available', async () => {
    mockCertificateService.getAttendedEvents.mockResolvedValue({
      events: [],
    });

    renderCertificateManagement();

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /request certificate/i });
      expect(submitButton).toBeDisabled();
    });
  });

  test('disables submit button while loading events', () => {
    mockCertificateService.getAttendedEvents.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderCertificateManagement();

    const submitButton = screen.getByRole('button', { name: /request certificate/i });
    expect(submitButton).toBeDisabled();
  });

  test('handles API error when fetching events', async () => {
    mockCertificateService.getAttendedEvents.mockRejectedValue(
      new Error('Failed to fetch events')
    );

    renderCertificateManagement();

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Failed to load attended events');
    });
  });

  test('shows login prompt when not authenticated', () => {
    jest.requireMock('../contexts/AuthContext').useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    renderCertificateManagement();

    expect(screen.getByText('Please log in to request certificates.')).toBeInTheDocument();
  });

  test('handles missing user profile data gracefully', async () => {
    const userWithoutProfile = {
      ...mockUser,
      fullName: null,
      profile: null,
    };

    jest.requireMock('../contexts/AuthContext').useAuth.mockReturnValue({
      user: userWithoutProfile,
      isAuthenticated: true,
    });

    mockCertificateService.getAttendedEvents.mockResolvedValue({
      events: [],
    });

    renderCertificateManagement();

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Empty values for missing data
    });
  });

  test('debounces validation on event selection', async () => {
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

    renderCertificateManagement();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Tech Conference 2024 - 1/15/2024')).toBeInTheDocument();
    });

    const eventSelect = screen.getByRole('combobox');

    // Rapid selection changes
    await user.selectOptions(eventSelect, 'event1');
    await user.selectOptions(eventSelect, ''); // Clear selection

    // Wait for debounce
    await waitFor(() => {
      expect(screen.getByText('Please select an event')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  test('displays helpful text and descriptions', async () => {
    mockCertificateService.getAttendedEvents.mockResolvedValue({
      events: [
        {
          _id: 'event1',
          title: 'Tech Conference 2024',
          date: '2024-01-15T00:00:00.000Z',
        },
      ],
    });

    renderCertificateManagement();

    await waitFor(() => {
      expect(screen.getByText('This information will appear on your certificate')).toBeInTheDocument();
      expect(screen.getByText('Used for certificate delivery')).toBeInTheDocument();
      expect(screen.getByText('Only events you have attended are shown')).toBeInTheDocument();
      expect(screen.getByText('Certificate requests are processed within 24-48 hours')).toBeInTheDocument();
    });
  });
});