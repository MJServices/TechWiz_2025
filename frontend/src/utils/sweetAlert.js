import Swal from 'sweetalert2';

// Custom SweetAlert styling with glass morphism
const customStyling = {
  background: 'rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(10px)',
  color: '#f1f5f9',
  borderRadius: '1rem',
  border: '1px solid rgba(139, 92, 246, 0.3)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

// Default configuration with glass morphism styling
const defaultConfig = {
  background: customStyling.background,
  color: customStyling.color,
  backdrop: `rgba(0, 0, 0, 0.4)`,
  customClass: {
    popup: 'animated-popup',
    title: 'text-gradient',
    confirmButton: 'btn-gradient',
    cancelButton: 'btn-outline',
  },
  showClass: {
    popup: 'animate__animated animate__fadeInUp animate__faster',
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown animate__faster',
  },
};

// Success alert with animation
export const showSuccess = (title, text = '', options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'success',
    title: title,
    text: text,
    timer: options.timer || 3000,
    timerProgressBar: true,
    showConfirmButton: !options.timer,
    confirmButtonText: options.confirmButtonText || 'Great!',
    customClass: {
      ...defaultConfig.customClass,
      title: 'text-gradient',
      timerProgressBar: 'progress-gradient',
    },
    didOpen: (toast) => {
      if (options.timer) {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    },
    ...options,
  });
};

// Error alert with animation
export const showError = (title, text = '', options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title: title,
    text: text,
    confirmButtonText: options.confirmButtonText || 'Try Again',
    customClass: {
      ...defaultConfig.customClass,
      title: 'text-gradient-error',
    },
    ...options,
  });
};

// Warning alert with animation
export const showWarning = (title, text = '', options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title: title,
    text: text,
    confirmButtonText: options.confirmButtonText || 'Understood',
    customClass: {
      ...defaultConfig.customClass,
      title: 'text-gradient-warning',
    },
    ...options,
  });
};

// Info alert with animation
export const showInfo = (title, text = '', options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title: title,
    text: text,
    confirmButtonText: options.confirmButtonText || 'Got it',
    customClass: {
      ...defaultConfig.customClass,
      title: 'text-gradient-info',
    },
    ...options,
  });
};

// Confirmation dialog with animation
export const showConfirmation = (title, text = '', options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'question',
    title: title,
    text: text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Yes, proceed',
    cancelButtonText: options.cancelButtonText || 'Cancel',
    reverseButtons: options.reverseButtons !== undefined ? options.reverseButtons : true,
    ...options,
  });
};

// Welcome message with animation
export const showWelcome = (name) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'success',
    title: `Welcome back, ${name}!`,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass: {
      ...defaultConfig.customClass,
      title: 'text-gradient',
      timerProgressBar: 'progress-gradient',
    },
  });
};

// Form validation error with animation
export const showValidationError = (errors) => {
  const errorList = Object.entries(errors)
    .map(([field, message]) => `<li>${message}</li>`)
    .join('');

  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title: 'Validation Error',
    html: `<ul class="text-left">${errorList}</ul>`,
    customClass: {
      ...defaultConfig.customClass,
      title: 'text-gradient-error',
      htmlContainer: 'validation-error-container',
    },
  });
};

// Toast notification with animation
export const showToast = (title, icon = 'success', options = {}) => {
  const position = options.position || 'top-end';
  const timer = options.timer || 3000;
  
  const Toast = Swal.mixin({
    toast: true,
    position: position,
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true,
    background: customStyling.background,
    color: customStyling.color,
    customClass: {
      popup: 'animated-toast',
      title: icon === 'success' ? 'text-gradient' : 
             icon === 'error' ? 'text-gradient-error' : 
             icon === 'warning' ? 'text-gradient-warning' : 
             icon === 'info' ? 'text-gradient-info' : 'text-white',
      timerProgressBar: 'progress-gradient',
    },
    showClass: {
      popup: 'animate__animated animate__fadeInRight animate__faster',
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutRight animate__faster',
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon: icon,
    title: title,
    ...options,
  });
};

// Loading indicator with animation
export const showLoading = (title = 'Loading...', text = 'Please wait', options = {}) => {
  return Swal.fire({
    ...defaultConfig,
    title: title,
    text: text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
    ...options,
  });
};

// Registration success
export const showRegistrationSuccess = (options = {}) => {
  return showSuccess(
    'Registration Successful!',
    'Please check your email to verify your account.',
    {
      confirmButtonText: 'Continue',
      allowOutsideClick: false,
      ...options,
    }
  );
};

// Email verification success
export const showEmailVerified = (options = {}) => {
  return showSuccess(
    'Email Verified!',
    'Your email has been successfully verified. You can now login to your account.',
    {
      confirmButtonText: 'Continue to Login',
      allowOutsideClick: false,
      ...options,
    }
  );
};

// Email sent confirmation
export const showEmailSent = (options = {}) => {
  return showSuccess(
    'Email Sent!',
    'Verification email has been sent successfully. Please check your inbox.',
    {
      confirmButtonText: 'Got it',
      timer: 3000,
      timerProgressBar: true,
      ...options,
    }
  );
};

// Close any open SweetAlert
export const closeAlert = () => {
  Swal.close();
};

// Add CSS for SweetAlert custom styling
export const addSweetAlertStyles = () => {
  if (document.getElementById('sweet-alert-custom-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'sweet-alert-custom-styles';
  style.textContent = `
    .animated-popup {
      border-radius: 1rem !important;
      border: 1px solid rgba(139, 92, 246, 0.3) !important;
      backdrop-filter: blur(10px) !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
    }
    
    .animated-toast {
      border-radius: 0.75rem !important;
      border: 1px solid rgba(139, 92, 246, 0.3) !important;
      backdrop-filter: blur(10px) !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    }
    
    .text-gradient {
      background: linear-gradient(to right, #a855f7, #d946ef);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .text-gradient-error {
      background: linear-gradient(to right, #ef4444, #f87171);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .text-gradient-warning {
      background: linear-gradient(to right, #f59e0b, #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .text-gradient-info {
      background: linear-gradient(to right, #3b82f6, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .btn-gradient {
      background: linear-gradient(to right, #a855f7, #d946ef) !important;
      border: none !important;
      border-radius: 0.5rem !important;
      color: white !important;
      font-weight: 500 !important;
      transition: all 0.3s ease !important;
    }
    
    .btn-gradient:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.3) !important;
    }
    
    .btn-outline {
      background: transparent !important;
      border: 1px solid rgba(139, 92, 246, 0.5) !important;
      border-radius: 0.5rem !important;
      color: #a855f7 !important;
      font-weight: 500 !important;
      transition: all 0.3s ease !important;
    }
    
    .btn-outline:hover {
      background: rgba(139, 92, 246, 0.1) !important;
    }
    
    .progress-gradient {
      background: linear-gradient(to right, #a855f7, #d946ef) !important;
    }
    
    .validation-error-container ul {
      text-align: left;
      margin: 0;
      padding-left: 1.5rem;
    }
    
    .validation-error-container li {
      margin-bottom: 0.5rem;
    }
  `;
  document.head.appendChild(style);
};

// Initialize SweetAlert styles
addSweetAlertStyles();

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
  showValidationError,
  showRegistrationSuccess,
  showEmailVerified,
  showEmailSent,
  closeAlert,
  // Aliases
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
  showAlert
};