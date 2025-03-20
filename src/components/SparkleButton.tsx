import React, { useState, useEffect } from 'react';

interface SparkleButtonProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const SparkleButton: React.FC<SparkleButtonProps> = ({ onClick, className = '', children }) => {
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    if (isClicked) {
      const timer = setTimeout(() => {
        setIsClicked(false);
        setSparkles([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isClicked]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create multiple sparkles
    const newSparkles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 50,
      y: y + (Math.random() - 0.5) * 50
    }));

    setSparkles(newSparkles);
    setIsClicked(true);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute bg-white rounded-full pointer-events-none animate-sparkle"
          style={{ 
            left: `${sparkle.x}px`,
            top: `${sparkle.y}px`, 
            width: "4px",
            height: "4px",
            animation: "sparkle 1s forwards",
            opacity: isClicked ? 1 : 0
          }}
        />
      ))}
    </button>
  );
};

export default SparkleButton;