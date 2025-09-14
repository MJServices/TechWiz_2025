import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const ParticlesBackground = ({
  count = 50,
  color = '#a855f7',
  size = { min: 1, max: 3 },
  speed = { min: 0.1, max: 0.5 },
  opacity = { min: 0.1, max: 0.5 },
  className = '',
  interactive = true,
  connectParticles = true,
  maxConnections = 3,
  connectionOpacity = 0.2,
  connectionWidth = 1,
  connectionColor = '#a855f7',
}) => {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });
  const animationRef = useRef(null);
  
  // Initialize canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const { offsetWidth, offsetHeight } = canvasRef.current.parentElement;
        setDimensions({
          width: offsetWidth,
          height: offsetHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Create particles when dimensions change
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    
    const newParticles = Array.from({ length: count }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      size: size.min + Math.random() * (size.max - size.min),
      speedX: (Math.random() - 0.5) * (speed.max - speed.min) * 2,
      speedY: (Math.random() - 0.5) * (speed.max - speed.min) * 2,
      opacity: opacity.min + Math.random() * (opacity.max - opacity.min),
    }));
    
    setParticles(newParticles);
  }, [dimensions, count, size.min, size.max, speed.min, speed.max, opacity.min, opacity.max]);
  
  // Handle mouse movement for interactive particles
  useEffect(() => {
    if (!interactive) return;
    
    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    
    const handleMouseLeave = () => {
      setMousePosition({ x: null, y: null });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactive]);
  
  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || particles.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Update and draw particles
      const updatedParticles = particles.map(particle => {
        // Update position
        let { x, y, speedX, speedY, size, opacity } = particle;
        
        x += speedX;
        y += speedY;
        
        // Bounce off edges
        if (x < 0 || x > dimensions.width) speedX *= -1;
        if (y < 0 || y > dimensions.height) speedY *= -1;
        
        // Keep particles within bounds
        x = Math.max(0, Math.min(x, dimensions.width));
        y = Math.max(0, Math.min(y, dimensions.height));
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
        
        // Interactive effect - move particles toward mouse
        if (interactive && mousePosition.x !== null && mousePosition.y !== null) {
          const dx = mousePosition.x - x;
          const dy = mousePosition.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = 0.1 * (1 - distance / 100);
            speedX += (dx / distance) * force;
            speedY += (dy / distance) * force;
            
            // Limit speed
            const maxSpeed = 2;
            const currentSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
            if (currentSpeed > maxSpeed) {
              speedX = (speedX / currentSpeed) * maxSpeed;
              speedY = (speedY / currentSpeed) * maxSpeed;
            }
          }
        }
        
        return { ...particle, x, y, speedX, speedY };
      });
      
      // Draw connections between particles
      if (connectParticles) {
        for (let i = 0; i < updatedParticles.length; i++) {
          const connections = [];
          
          for (let j = i + 1; j < updatedParticles.length; j++) {
            const dx = updatedParticles[i].x - updatedParticles[j].x;
            const dy = updatedParticles[i].y - updatedParticles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
              connections.push({
                particle: updatedParticles[j],
                distance,
              });
            }
          }
          
          // Sort by distance and limit connections
          connections
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxConnections)
            .forEach(({ particle, distance }) => {
              const opacity = connectionOpacity * (1 - distance / 150);
              ctx.beginPath();
              ctx.moveTo(updatedParticles[i].x, updatedParticles[i].y);
              ctx.lineTo(particle.x, particle.y);
              ctx.strokeStyle = `${connectionColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
              ctx.lineWidth = connectionWidth;
              ctx.stroke();
            });
        }
      }
      
      setParticles(updatedParticles);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    particles, 
    dimensions, 
    color, 
    interactive, 
    mousePosition, 
    connectParticles, 
    maxConnections, 
    connectionOpacity, 
    connectionWidth, 
    connectionColor
  ]);
  
  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className={`absolute inset-0 z-0 pointer-events-none ${className}`}
    />
  );
};

ParticlesBackground.propTypes = {
  count: PropTypes.number,
  color: PropTypes.string,
  size: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
  }),
  speed: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
  }),
  opacity: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
  }),
  className: PropTypes.string,
  interactive: PropTypes.bool,
  connectParticles: PropTypes.bool,
  maxConnections: PropTypes.number,
  connectionOpacity: PropTypes.number,
  connectionWidth: PropTypes.number,
  connectionColor: PropTypes.string,
};

export default ParticlesBackground;