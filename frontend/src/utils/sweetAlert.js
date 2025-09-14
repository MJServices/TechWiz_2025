import Swal from 'sweetalert2';

// Custom SweetAlert configurations
const defaultConfig = {
  customClass: {
    popup: 'swal2-popup-custom',
    title: 'swal2-title-custom',
    content: 'swal2-content-custom',
    confirmButton: 'swal2-confirm-custom',
    cancelButton: 'swal2-cancel-custom'
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeInUp animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown animate__faster'
  }
};

// Success alert
export const showSuccess = (title, text, options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'success',
    title,
    text,
    confirmButtonText: 'Great!',
    confirmButtonColor: '#667eea',
    timer: options.timer || 3000,
    timerProgressBar: true,
    showConfirmButton: !options.timer,
    ...options
  });
};

// Error alert
export const showError = (title, text, options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Try Again',
    confirmButtonColor: '#ef4444',
    ...options
  });
};

// Warning alert
export const showWarning = (title, text, options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'Understood',
    confirmButtonColor: '#f59e0b',
    ...options
  });
};

// Info alert
export const showInfo = (title, text, options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title,
    text,
    confirmButtonText: 'Got it',
    confirmButtonColor: '#667eea',
    ...options
  });
};

// Confirmation dialog
export const showConfirmation = (title, text, options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#667eea',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
    ...options
  });
};

// Loading alert
export const showLoading = (title = 'Processing...', text = 'Please wait') => {
  return Swal.fire({
    ...defaultConfig,
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Toast notification
export const showToast = (icon, title, options = {}) => {
  return Swal.fire({
    icon,
    title,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: options.timer || 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
    customClass: {
      popup: 'swal2-toast-custom'
    },
    ...options
  });
};

// Welcome message
export const showWelcome = (userName) => {
  return showToast('success', `Welcome back, ${userName}!`, {
    timer: 2500
  });
};

// Registration success
export const showRegistrationSuccess = () => {
  return showSuccess(
    'Registration Successful!',
    'Please check your email to verify your account.',
    {
      confirmButtonText: 'Continue',
      allowOutsideClick: false
    }
  );
};

// Email verification success
export const showEmailVerified = () => {
  return showSuccess(
    'Email Verified!',
    'Your email has been successfully verified. You can now login to your account.',
    {
      confirmButtonText: 'Continue to Login',
      allowOutsideClick: false
    }
  );
};

// Email sent confirmation
export const showEmailSent = () => {
  return showSuccess(
    'Email Sent!',
    'Verification email has been sent successfully. Please check your inbox.',
    {
      confirmButtonText: 'Got it',
      timer: 3000,
      timerProgressBar: true
    }
  );
};

// Aliases for backward compatibility
export const showSuccessAlert = showSuccess;
export const showErrorAlert = showError;
export const showConfirmAlert = showConfirmation;
export const showAlert = showInfo;

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirmation,
  showLoading,
  showToast,
  showWelcome,
  showRegistrationSuccess,
  showEmailVerified,
  showEmailSent,
  // Aliases
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
  showAlert
};