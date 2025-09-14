import { body, param, query, validationResult } from "express-validator";
// Comprehensive validation utility for form inputs

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

export const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

export const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

export const validators = {
  // Email validation
  email: {
    required: (value) => {
      if (!value || String(value).trim().length === 0) {
        return "Please enter your email address";
      }
      return null;
    },
    format: (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value).trim())) {
        return "Please enter a valid email address (e.g., user@example.com)";
      }
      return null;
    },
  },

  // Password validation
  password: {
    required: (value) => {
      if (!value || String(value).trim().length === 0) {
        return "Please enter your password";
      }
      return null;
    },
    minLength: (value, minLength = 8) => {
      if (!value) return null;
      if (String(value).length < minLength) {
        return `Password must be at least ${minLength} characters long`;
      }
      return null;
    },
    strength: (value) => {
      if (!value) return null;
      const hasLowercase = /[a-z]/.test(value);
      const hasUppercase = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      if (!hasLowercase)
        return "Password must contain at least one lowercase letter";
      if (!hasUppercase)
        return "Password must contain at least one uppercase letter";
      if (!hasNumber) return "Password must contain at least one number";
      if (!hasSpecialChar)
        return "Password must contain at least one special character";

      return null;
    },
    match: (password, confirmPassword) => {
      if (password !== confirmPassword) {
        return "Passwords do not match. Please make sure both passwords are identical";
      }
      return null;
    },
  },

  // Name validation
  name: {
    required: (value, fieldName = "Name") => {
      if (!value || String(value).trim().length === 0) {
        return `Please enter your ${fieldName.toLowerCase()}`;
      }
      return null;
    },
    minLength: (value, minLength = 2, fieldName = "Name") => {
      if (!value) return null;
      if (String(value).trim().length < minLength) {
        return `${fieldName} must be at least ${minLength} characters long`;
      }
      return null;
    },
    format: (value, fieldName = "Name") => {
      if (!value) return null;
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      if (!nameRegex.test(String(value).trim())) {
        return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
      }
      return null;
    },
  },

  // Username validation
  username: {
    required: (value) => {
      if (!value || String(value).trim().length === 0) {
        return "Please enter a username";
      }
      return null;
    },
    length: (value, minLength = 3, maxLength = 30) => {
      if (!value) return null;
      if (
        String(value).length < minLength ||
        String(value).length > maxLength
      ) {
        return `Username must be between ${minLength} and ${maxLength} characters long`;
      }
      return null;
    },
    format: (value) => {
      if (!value) return null;
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(String(value))) {
        return "Username can only contain letters, numbers, and underscores";
      }
      return null;
    },
    startsWith: (value) => {
      if (!value) return null;
      if (!/^[a-zA-Z]/.test(String(value))) {
        return "Username must start with a letter";
      }
      return null;
    },
  },

  // Phone validation
  phone: {
    required: (value) => {
      if (!value || String(value).trim().length === 0) {
        return "Please enter your phone number";
      }
      return null;
    },
    format: (value) => {
      if (!value) return null;
      const cleanValue = String(value).replace(/[\s\-()+]/g, "");
      const phoneRegex = /^\d+$/;
      if (!phoneRegex.test(cleanValue)) {
        return "Please enter a valid phone number";
      }
      return null;
    },
    length: (value) => {
      if (!value) return null;
      const cleanValue = String(value).replace(/[\s\-()+]/g, "");
      if (cleanValue.length < 10 || cleanValue.length > 15) {
        return "Phone number must be between 10 and 15 digits";
      }
      return null;
    },
  },
};

export const validateEmailVerification = [
  param('token')
    .notEmpty()
    .withMessage('Verification token is required'),
  
  handleValidationErrors
];

/**
 * Refresh token validation rules
 */
export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  
  handleValidationErrors
];

/**
 * User ID parameter validation
 */
export const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Pagination validation rules
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];


// Validation runner
export const validateField = (value, validationRules = [], formData = {}) => {
  for (const rule of validationRules) {
    if (typeof rule !== "function") {
      console.error("Invalid validation rule:", rule);
      continue;
    }
    const error = rule(value, formData);
    if (error) {
      return error;
    }
  }
  return null;
};

// Full form validation
export const validateForm = (formData, validationSchema) => {
  const errors = {};
  let isValid = true;
  console.log("Validating form data:", formData);
  for (const [fieldName, rules] of Object.entries(validationSchema)) {
    const fieldValue = formData[fieldName];
    const error = validateField(fieldValue, rules, formData);

    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Validation Schemas
export const validationSchemas = {
  registration: {
    fullname: [
      (value) => validators.name.required(value, "Full name"),
      (value) => validators.name.minLength(value, 2, "Full name"),
      (value) => validators.name.format(value, "Full name"),
    ],
    department: [
      (value) => validators.name.required(value, "Department name"),
      (value) => validators.name.minLength(value, 2, "Department name"),
      (value) => validators.name.format(value, "Department name"),
    ],
    username: [
      (value) => validators.username.required(value),
      (value) => validators.username.length(value),
      (value) => validators.username.format(value),
      (value) => validators.username.startsWith(value),
    ],
    email: [
      (value) => validators.email.required(value),
      (value) => validators.email.format(value),
    ],
    enrollmentNo: [
      (value) => {
        if (!value) return null;
        const cleanValue = String(value).replace(/\s/g, "");
        if (!/^\d+$/.test(cleanValue)) {
          return "Enrollment number must contain only digits";
        }
        if (cleanValue.length < 9 || cleanValue.length > 12) {
          return "Enrollment number must be between 9 and 12 digits";
        }
        return null;
      },
    ],
    password: [
      (value) => validators.password.required(value),
      (value) => validators.password.minLength(value, 8),
      (value) => validators.password.strength(value),
    ],
    confirmPassword: [
      (value, formData) => validators.password.match(formData.password, value),
    ],
    role: [
      () => null, // always valid, defaults to "participant"
    ],
  },

  login: {
    email: [
      (value) => validators.email.required(value),
      (value) => validators.email.format(value),
    ],
    password: [
      (value) => validators.password.required(value),
      (value) => validators.password.minLength(value, 8),
    ],
  },

  eventCreation: {
    title: [
      (value) => {
        if (!value || String(value).trim().length === 0) {
          return "Event title is required";
        }
        if (String(value).trim().length < 3) {
          return "Event title must be at least 3 characters long";
        }
        if (String(value).trim().length > 100) {
          return "Event title must be less than 100 characters";
        }
        return null;
      },
    ],
    description: [
      (value) => {
        if (!value || String(value).trim().length === 0) {
          return "Event description is required";
        }
        if (String(value).trim().length < 10) {
          return "Event description must be at least 10 characters long";
        }
        if (String(value).trim().length > 1000) {
          return "Event description must be less than 1000 characters";
        }
        return null;
      },
    ],
    category: [
      (value) => {
        if (!value || String(value).trim().length === 0) {
          return "Please select an event category";
        }
        const validCategories = ['technical', 'cultural', 'sports', 'workshop', 'seminar', 'competition', 'other'];
        if (!validCategories.includes(value)) {
          return "Please select a valid event category";
        }
        return null;
      },
    ],
    venue: [
      (value) => {
        if (!value || String(value).trim().length === 0) {
          return "Event venue is required";
        }
        if (String(value).trim().length < 3) {
          return "Venue name must be at least 3 characters long";
        }
        if (String(value).trim().length > 100) {
          return "Venue name must be less than 100 characters";
        }
        return null;
      },
    ],
    date: [
      (value) => {
        if (!value) {
          return "Event date is required";
        }
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          return "Event date cannot be in the past";
        }

        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        if (selectedDate > oneYearFromNow) {
          return "Event date cannot be more than one year in the future";
        }
        return null;
      },
    ],
    time: [
      (value) => {
        if (!value) {
          return "Event time is required";
        }
        return null;
      },
    ],
    maxSeats: [
      (value) => {
        if (value !== "" && value !== null && value !== undefined) {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return "Maximum seats must be a valid number";
          }
          if (numValue < 1) {
            return "Maximum seats must be at least 1";
          }
          if (numValue > 10000) {
            return "Maximum seats cannot exceed 10,000";
          }
        }
        return null;
      },
    ],
    bannerImage: [
      (value) => {
        if (value && String(value).trim().length > 0) {
          try {
            new URL(value);
          } catch {
            return "Please enter a valid URL for the banner image";
          }
        }
        return null;
      },
    ],
    rulebook: [
      (value) => {
        if (value && String(value).trim().length > 0) {
          try {
            new URL(value);
          } catch {
            return "Please enter a valid URL for the rulebook";
          }
        }
        return null;
      },
    ],
  },
};
