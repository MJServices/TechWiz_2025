import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] gap-4 animate-fade-in" role="status" aria-live="polite">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin animate-reverse"></div>
      </div>
      <p className="text-neutral-600 text-base font-medium animate-pulse">{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default LoadingSpinner;