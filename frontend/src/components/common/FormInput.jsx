import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';

const FormInput = ({
  id,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  error,
  success,
  required = false,
  disabled = false,
  className = '',
  icon: Icon,
  autoComplete = 'off',
  maxLength,
  minLength,
  pattern,
  helpText,
  showValidationStatus = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  
  useEffect(() => {
    setHasValue(!!value);
  }, [value]);
  
  const handleFocus = () => setIsFocused(true);
  
  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };
  
  const handleChange = (e) => {
    setHasValue(!!e.target.value);
    if (onChange) onChange(e);
  };
  
  return (
    <div className={`mb-4 ${className}`}>
      {/* Label with animation */}
      {label && (
        <motion.label
          htmlFor={id}
          initial={{ y: 0 }}
          animate={{ 
            y: isFocused || hasValue ? -5 : 0,
            color: isFocused 
              ? 'rgb(168, 85, 247)' 
              : error 
                ? 'rgb(239, 68, 68)' 
                : success 
                  ? 'rgb(16, 185, 129)' 
                  : 'rgb(209, 213, 219)'
          }}
          transition={{ duration: 0.2 }}
          className="block text-sm font-medium mb-1"
        >
          {label}
          {required && <span className="text-purple-500 ml-1">*</span>}
        </motion.label>
      )}
      
      {/* Input container with glass morphism */}
      <div className="relative">
        {/* Icon */}
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        {/* Input field */}
        <motion.input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          animate={{ 
            borderColor: isFocused 
              ? 'rgba(168, 85, 247, 0.5)' 
              : error 
                ? 'rgba(239, 68, 68, 0.5)' 
                : success 
                  ? 'rgba(16, 185, 129, 0.5)' 
                  : 'rgba(139, 92, 246, 0.2)'
          }}
          transition={{ duration: 0.2 }}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-purple-900/10 backdrop-blur-lg
            border border-purple-400/20
            text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-purple-500/30
            transition-all duration-300
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500/50 focus:ring-red-500/30' : ''}
            ${success ? 'border-green-500/50 focus:ring-green-500/30' : ''}
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        />
        
        {/* Validation icons */}
        {showValidationStatus && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="text-red-500"
                >
                  <AlertCircle className="w-5 h-5" />
                </motion.div>
              )}
              {success && !error && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="text-green-500"
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Error message with animation */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1"
          >
            <p className="text-red-500 text-xs">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Help text */}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-400">{helpText}</p>
      )}
    </div>
  );
};

FormInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  success: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.elementType,
  autoComplete: PropTypes.string,
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  pattern: PropTypes.string,
  helpText: PropTypes.string,
  showValidationStatus: PropTypes.bool,
};

export default FormInput;