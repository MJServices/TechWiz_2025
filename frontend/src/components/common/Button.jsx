import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  animateOnHover = true,
  ...props
}) => {
  // Variant styles
  const variantClasses = {
    primary: `
      bg-gradient-to-br from-purple-600 to-purple-800
      hover:from-purple-500 hover:to-purple-700
      border border-purple-400/20
      text-white
      shadow-lg shadow-purple-500/20
    `,
    secondary: `
      bg-gradient-to-br from-slate-700/80 to-slate-900/80
      hover:from-slate-600/80 hover:to-slate-800/80
      border border-purple-400/20
      text-white
      shadow-md shadow-slate-900/10
    `,
    outline: `
      bg-transparent
      border border-purple-400/50
      text-purple-400
      hover:bg-purple-500/10
    `,
    ghost: `
      bg-transparent
      text-white
      hover:bg-white/5
      border-none
    `,
    danger: `
      bg-gradient-to-br from-red-600 to-red-800
      hover:from-red-500 hover:to-red-700
      border border-red-400/20
      text-white
      shadow-lg shadow-red-500/20
    `,
    success: `
      bg-gradient-to-br from-green-600 to-green-800
      hover:from-green-500 hover:to-green-700
      border border-green-400/20
      text-white
      shadow-lg shadow-green-500/20
    `,
    glass: `
      bg-white/10
      backdrop-blur-lg
      border border-white/20
      text-white
      hover:bg-white/15
      shadow-lg shadow-purple-500/10
    `,
  };

  // Size styles
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  // Hover animation variants
  const hoverAnimation = animateOnHover ? {
    whileHover: { y: -2, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
    whileTap: { y: 0 },
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  } : {};

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative
        rounded-xl
        font-medium
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...hoverAnimation}
      {...props}
    >
      <div className="flex items-center justify-center">
        {loading && (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        )}
        
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className={`w-5 h-5 ${children ? 'mr-2' : ''}`} />
        )}
        
        {children}
        
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className={`w-5 h-5 ${children ? 'ml-2' : ''}`} />
        )}
      </div>
      
      {/* Glass overlay effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </motion.button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'glass']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  icon: PropTypes.elementType,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
  animateOnHover: PropTypes.bool,
};

export default Button;