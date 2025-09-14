import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

// Mock the dependencies
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'student',
  emailVerified: true,
  profile: {
    firstname: 'John',
    lastname: 'Doe',
  },
  createdAt: new Date().toISOString(),
};

const mockNavigate = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock ErrorBoundary
jest.mock('../components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }) {
    return <div>{children}</div>;
  };
});

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders dashboard with user information', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Welcome to EventSphere!')).toBeInTheDocument();
      expect(screen.getByText(`Hello, ${mockUser.profile.firstname}!`)).toBeInTheDocument();
    });

    // Check user profile information
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  test('displays current time and date', () => {
    const mockDate = new Date('2024-01-15T10:30:00');
    jest.setSystemTime(mockDate);

    renderDashboard();

    expect(screen.getByText('10:30:00')).toBeInTheDocument();
    expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
  });

  test('renders quick action buttons', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Browse Events')).toBeInTheDocument();
      expect(screen.getByText('Event Gallery')).toBeInTheDocument();
      expect(screen.getByText('My Certificates')).toBeInTheDocument();
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });
  });

  test('navigates to events page when Browse Events is clicked', async () => {
    renderDashboard();
    const user = userEvent.setup();

    await waitFor(() => {
      const browseEventsButton = screen.getByText('Browse Events');
      user.click(browseEventsButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/events');
    });
  });

  test('navigates to gallery when Event Gallery is clicked', async () => {
    renderDashboard();
    const user = userEvent.setup();

    await waitFor(() => {
      const galleryButton = screen.getByText('Event Gallery');
      user.click(galleryButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/gallery');
    });
  });

  test('navigates to edit profile when Account Settings is clicked', async () => {
    renderDashboard();
    const user = userEvent.setup();

    await waitFor(() => {
      const settingsButton = screen.getByText('Account Settings');
      user.click(settingsButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/edit-profile');
    });
  });

  test('displays stats cards with correct information', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Your Stats')).toBeInTheDocument();
      expect(screen.getByText('Registered Events')).toBeInTheDocument();
      expect(screen.getByText('Events Attended')).toBeInTheDocument();
      expect(screen.getByText('Certificates Earned')).toBeInTheDocument();
      expect(screen.getByText('Saved Events')).toBeInTheDocument();
    });
  });

  test('displays recent activity section', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Profile Created')).toBeInTheDocument();
      expect(screen.getByText('Email Verification')).toBeInTheDocument();
    });
  });

  test('shows verified account status for verified email', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Verified Account')).toBeInTheDocument();
    });
  });

  test('shows pending verification for unverified email', async () => {
    const unverifiedUser = { ...mockUser, emailVerified: false };

    // Re-mock the auth context for this test
    const mockUseAuth = jest.fn(() => ({
      user: unverifiedUser,
      isAuthenticated: true,
    }));

    jest.doMock('../contexts/AuthContext', () => ({
      useAuth: mockUseAuth,
    }));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    });
  });

  test('displays call to action section', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Ready to Explore Events?')).toBeInTheDocument();
      expect(screen.getAllByText('Browse Events')).toHaveLength(2); // One in quick actions, one in CTA
      expect(screen.getByText('Event Gallery')).toBeInTheDocument();
    });
  });

  test('handles organizer role correctly', async () => {
    const organizerUser = { ...mockUser, role: 'organizer' };

    // Re-mock the auth context for this test
    const mockUseAuth = jest.fn(() => ({
      user: organizerUser,
      isAuthenticated: true,
    }));

    jest.doMock('../contexts/AuthContext', () => ({
      useAuth: mockUseAuth,
    }));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Organized Events')).toBeInTheDocument();
    });
  });

  test('shows loading state when not authenticated', () => {
    // Re-mock the auth context for this test
    const mockUseAuth = jest.fn(() => ({
      user: null,
      isAuthenticated: false,
    }));

    jest.doMock('../contexts/AuthContext', () => ({
      useAuth: mockUseAuth,
    }));

    renderDashboard();

    expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
  });

  test('displays correct role information', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  test('formats time correctly', () => {
    const mockDate = new Date('2024-01-15T14:30:45');
    jest.setSystemTime(mockDate);

    renderDashboard();

    expect(screen.getByText('02:30:45 PM')).toBeInTheDocument();
  });

  test('formats date correctly', () => {
    const mockDate = new Date('2024-01-15T10:30:00');
    jest.setSystemTime(mockDate);

    renderDashboard();

    expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
  });

  test('updates time every second', () => {
    const mockDate = new Date('2024-01-15T10:30:00');
    jest.setSystemTime(mockDate);

    renderDashboard();

    // Fast-forward 1 second
    jest.advanceTimersByTime(1000);

    expect(screen.getByText('10:30:01 AM')).toBeInTheDocument();
  });

  test('handles missing user profile data gracefully', async () => {
    const userWithoutProfile = {
      ...mockUser,
      profile: null,
      firstName: null,
      lastName: null,
    };

    // Re-mock the auth context for this test
    const mockUseAuth = jest.fn(() => ({
      user: userWithoutProfile,
      isAuthenticated: true,
    }));

    jest.doMock('../contexts/AuthContext', () => ({
      useAuth: mockUseAuth,
    }));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Hello, User!')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  test('displays member since date correctly', async () => {
    const userWithCreationDate = {
      ...mockUser,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Re-mock the auth context for this test
    const mockUseAuth = jest.fn(() => ({
      user: userWithCreationDate,
      isAuthenticated: true,
    }));

    jest.doMock('../contexts/AuthContext', () => ({
      useAuth: mockUseAuth,
    }));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    });
  });
});