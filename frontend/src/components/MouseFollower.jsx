import { useEffect, useState } from "react";

export default function MouseFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Main cursor follower */}
      <div
        className={`fixed w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full pointer-events-none z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Outer ring */}
      <div
        className={`fixed w-12 h-12 border-2 border-purple-400/50 rounded-full pointer-events-none z-40 transition-all duration-500 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}
        style={{
          left: mousePosition.x - 24,
          top: mousePosition.y - 24,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Trail effect */}
      <div
        className={`fixed w-2 h-2 bg-purple-300/30 rounded-full pointer-events-none z-30 transition-opacity duration-1000 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: mousePosition.x - 4,
          top: mousePosition.y - 4,
          transform: 'translate(-50%, -50%)',
          animationDelay: '0.1s',
        }}
      />
    </>
  );
}