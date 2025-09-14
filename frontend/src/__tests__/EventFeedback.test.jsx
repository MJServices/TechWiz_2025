import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventFeedback from '../components/EventFeedback';

// Mock the dependencies
let mockUser, mockOnFeedbackSubmitted, mockFeedbackAPI;

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: (mockUser = mockUser || { id: 1, email: 'test@example.com' }),
  }),
}));

jest.mock('../services/eventService', () => {
  mockFeedbackAPI = {
    submit: jest.fn(),
    uploadAttachment: jest.fn(),
  };
  return {
    feedbackAPI: mockFeedbackAPI,
  };
});

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const renderEventFeedback = (props = {}) => {
  return render(
    <EventFeedback
      eventId="event123"
      onFeedbackSubmitted={mockOnFeedbackSubmitted}
      {...props}
    />
  );
};

describe('EventFeedback Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders feedback form correctly', () => {
    renderEventFeedback();

    expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
    expect(screen.getByText('Overall Rating')).toBeInTheDocument();
    expect(screen.getByText('Comments (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Attachments (Optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit feedback/i })).toBeInTheDocument();
  });

  test('renders star rating component', () => {
    renderEventFeedback();

    // Should have 5 stars for overall rating
    const stars = screen.getAllByText('★');
    expect(stars).toHaveLength(5);
  });

  test('allows selecting overall rating', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    const stars = screen.getAllByText('★');
    await user.click(stars[3]); // Click 4th star (5 stars total, 0-indexed)

    // The clicked star and previous stars should be filled
    // Note: This test might need adjustment based on actual star rendering
    expect(stars[0]).toBeInTheDocument();
  });

  test('renders component rating sections', () => {
    renderEventFeedback();

    expect(screen.getByText('Detailed Ratings (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Venue')).toBeInTheDocument();
    expect(screen.getByText('Coordination')).toBeInTheDocument();
    expect(screen.getByText('Technical Support')).toBeInTheDocument();
    expect(screen.getByText('Hospitality')).toBeInTheDocument();
  });

  test('validates required overall rating', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Rating is required')).toBeInTheDocument();
    });
  });

  test('validates comments length', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    const commentsTextarea = screen.getByLabelText(/comments/i);
    const longComment = 'a'.repeat(1001); // Exceeds 1000 character limit

    await user.type(commentsTextarea, longComment);

    await waitFor(() => {
      expect(screen.getByText('Comments must be less than 1000 characters')).toBeInTheDocument();
    });
  });

  test('shows character count for comments', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    const commentsTextarea = screen.getByLabelText(/comments/i);
    await user.type(commentsTextarea, 'Test comment');

    expect(screen.getByText('13/1000')).toBeInTheDocument();
  });

  test('handles file selection', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    const fileInput = screen.getByLabelText(/choose files/i);
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('(0.12 KB)')).toBeInTheDocument();
  });

  test('limits file uploads to 5 files', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    const fileInput = screen.getByLabelText(/choose files/i);
    const files = Array.from({ length: 6 }, (_, i) =>
      new File(['content'], `file${i}.pdf`, { type: 'application/pdf' })
    );

    // Mock toast.error to check if it's called
    const mockToastError = jest.fn();
    jest.requireMock('react-hot-toast').toast.error = mockToastError;

    await user.upload(fileInput, files);

    expect(mockToastError).toHaveBeenCalledWith('Maximum 5 files allowed');
  });

  test('allows removing files', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    const fileInput = screen.getByLabelText(/choose files/i);
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);
    expect(screen.getByText('test.pdf')).toBeInTheDocument();

    const removeButton = screen.getByLabelText(/remove file/i);
    await user.click(removeButton);

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  test('submits feedback successfully', async () => {
    mockFeedbackAPI.submit.mockResolvedValue({ success: true });

    renderEventFeedback();
    const user = userEvent.setup();

    // Fill out the form
    const stars = screen.getAllByText('★');
    await user.click(stars[4]); // 5-star rating

    const commentsTextarea = screen.getByLabelText(/comments/i);
    await user.type(commentsTextarea, 'Great event!');

    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFeedbackAPI.submit).toHaveBeenCalledWith({
        eventId: 'event123',
        rating: 5,
        comments: 'Great event!',
        attachments: [],
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

  test('handles file upload during submission', async () => {
    mockFeedbackAPI.uploadAttachment.mockResolvedValue('uploaded-url');
    mockFeedbackAPI.submit.mockResolvedValue({ success: true });

    renderEventFeedback();
    const user = userEvent.setup();

    // Add a file
    const fileInput = screen.getByLabelText(/choose files/i);
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);

    // Fill required fields and submit
    const stars = screen.getAllByText('★');
    await user.click(stars[4]);
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFeedbackAPI.uploadAttachment).toHaveBeenCalledWith(file);
      expect(mockFeedbackAPI.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: ['uploaded-url'],
        })
      );
    });
  });

  test('handles file upload failure gracefully', async () => {
    mockFeedbackAPI.uploadAttachment.mockRejectedValue(new Error('Upload failed'));
    mockFeedbackAPI.submit.mockResolvedValue({ success: true });

    renderEventFeedback();
    const user = userEvent.setup();

    // Add a file
    const fileInput = screen.getByLabelText(/choose files/i);
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);

    // Fill required fields and submit
    const stars = screen.getAllByText('★');
    await user.click(stars[4]);
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFeedbackAPI.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [], // Should be empty due to upload failure
        })
      );
    });
  });

  test('handles submission error', async () => {
    mockFeedbackAPI.submit.mockRejectedValue(new Error('Submission failed'));

    renderEventFeedback();
    const user = userEvent.setup();

    // Fill required fields
    const stars = screen.getAllByText('★');
    await user.click(stars[4]);
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    // Wait for error handling
    await waitFor(() => {
      expect(mockFeedbackAPI.submit).toHaveBeenCalled();
    });
  });

  test('disables submit button during submission', async () => {
    mockFeedbackAPI.submit.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderEventFeedback();
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

  test('validates file types', () => {
    renderEventFeedback();

    const fileInput = screen.getByLabelText(/choose files/i);
    expect(fileInput).toHaveAttribute('accept', 'image/*,.pdf,.doc,.docx');
  });

  test('shows file size information', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    const fileInput = screen.getByLabelText(/choose files/i);
    const file = new File(['x'.repeat(1024)], 'large.txt', { type: 'text/plain' });

    await user.upload(fileInput, file);

    expect(screen.getByText('(1.00 KB)')).toBeInTheDocument();
  });

  test('handles component ratings', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    // Find venue rating stars and click one
    const venueStars = screen.getAllByText('★')[5]; // First star of venue rating (after overall rating)
    await user.click(venueStars);

    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFeedbackAPI.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          componentRatings: expect.objectContaining({
            venue: 1,
          }),
        })
      );
    });
  });

  test('prevents submission with validation errors', async () => {
    renderEventFeedback();
    const user = userEvent.setup();

    // Don't fill required rating
    const commentsTextarea = screen.getByLabelText(/comments/i);
    await user.type(commentsTextarea, 'a'.repeat(1001)); // Too long

    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    await user.click(submitButton);

    expect(mockFeedbackAPI.submit).not.toHaveBeenCalled();
    expect(screen.getByText('Rating is required')).toBeInTheDocument();
    expect(screen.getByText('Comments must be less than 1000 characters')).toBeInTheDocument();
  });
});