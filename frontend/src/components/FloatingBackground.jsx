import { useEffect } from "react";

export default function FloatingBackground() {
  useEffect(() => {
    // Create floating elements
    const createFloatingElement = () => {
      const element = document.createElement('div');
      const isCircle = Math.random() > 0.5;
      const size = Math.random() * 60 + 20; // 20-80px

      element.className = `absolute ${isCircle ? 'rounded-full' : 'rounded-lg'} bg-gradient-to-br from-purple-400/20 to-purple-600/20 backdrop-blur-sm border border-purple-300/30 animate-pulse`;
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      element.style.left = Math.random() * 100 + '%';
      element.style.top = Math.random() * 100 + '%';
      element.style.animationDelay = Math.random() * 3 + 's';
      element.style.animationDuration = (Math.random() * 10 + 15) + 's';

      const container = document.querySelector('.floating-bg-container');
      if (container) {
        container.appendChild(element);

        // Remove element after animation
        setTimeout(() => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        }, 25000);
      }
    };

    // Create initial elements
    for (let i = 0; i < 8; i++) {
      setTimeout(createFloatingElement, i * 200);
    }

    // Create new elements periodically
    const interval = setInterval(createFloatingElement, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="floating-bg-container fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Static floating shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-300/30 to-purple-500/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0s' }}></div>
      <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-br from-purple-400/25 to-purple-600/25 rounded-lg blur-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-gradient-to-br from-purple-200/20 to-purple-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-gradient-to-br from-purple-500/35 to-purple-700/35 rounded-lg blur-md animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-1/2 left-1/6 w-28 h-28 bg-gradient-to-br from-purple-300/25 to-purple-500/25 rounded-full blur-xl animate-pulse" style={{ animationDelay: '3s' }}></div>

      {/* Geometric shapes */}
      <div className="absolute top-1/3 left-1/6 w-16 h-16 border-2 border-purple-400/40 backdrop-blur-xl bg-white/10 rotate-45 animate-spin rounded-lg shadow-2xl shadow-purple-500/20" style={{ animationDuration: '20s' }}></div>
      <div className="absolute bottom-1/3 right-1/6 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-purple-500/20 backdrop-blur-xl rounded-full border border-purple-400/40 shadow-lg shadow-purple-500/20" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-2/3 left-2/3 w-14 h-14 border-2 border-purple-300/50 backdrop-blur-lg bg-purple-400/10 rotate-12 animate-pulse rounded-xl shadow-xl shadow-purple-500/15" style={{ animationDelay: '2.5s' }}></div>
    </div>
  );
}