import React, { useState, useEffect } from 'react';

interface SparkleWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const SparkleWrapper: React.FC<SparkleWrapperProps> = ({ children, className = '' }) => {
  const [sparkles, setSparkles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  const createSparkle = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSparkles = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const velocity = 2 + Math.random() * 2;
      const size = 4 + Math.random() * 4;
      
      return {
        id: Date.now() + i,
        style: {
          position: "absolute",
          left: `${x}px`,
          top: `${y}px`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: `hsl(${Math.random() * 360}, 100%, 75%)`,
          borderRadius: "50%",
          transform: `translate(${Math.cos(angle) * velocity * 20}px, ${Math.sin(angle) * velocity * 20}px)`,
          opacity: 0,
          transition: "all 0.6s ease-out",
          boxShadow: "0 0 8px currentColor",
          pointerEvents: "none" as const
        }
      };
    });

    setSparkles(prev => [...prev, ...newSparkles]);

    // Trigger animation in the next frame
    requestAnimationFrame(() => {
      setSparkles(prev => 
        prev.map(sparkle => ({
          ...sparkle,
          style: { ...sparkle.style, transform: "translate(0, 0)", opacity: 1 }
        }))
      );
    });

    // Clean up sparkles
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id < Date.now()));
    }, 600);
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onClick={createSparkle}
    >
      {children}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          style={sparkle.style}
        />
      ))}
    </div>
  );
};

export default SparkleWrapper;