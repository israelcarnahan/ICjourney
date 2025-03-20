import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  className?: string;
}

const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({ onDelete, children, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const deleteThreshold = -100;

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX - offsetX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX - offsetX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const newOffset = Math.min(0, currentX - startX);
    setOffsetX(newOffset);

    if (newOffset < deleteThreshold) {
      setShowDeleteConfirm(true);
    } else {
      setShowDeleteConfirm(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newOffset = Math.min(0, e.clientX - startX);
    setOffsetX(newOffset);

    if (newOffset < deleteThreshold) {
      setShowDeleteConfirm(true);
    } else {
      setShowDeleteConfirm(false);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (offsetX < deleteThreshold) {
      onDelete();
    } else {
      // Spring back animation
      setOffsetX(0);
    }
    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, offsetX]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Delete confirmation backdrop */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-red-900/90 to-red-800/90 transition-opacity duration-200 flex items-center justify-end pr-8 ${
          showDeleteConfirm ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 text-red-100">
          <Trash2 className="h-5 w-5" />
          <span className="font-medium">Release to Delete</span>
        </div>
      </div>

      {/* Swipeable content */}
      <div
        ref={elementRef}
        className={`relative transition-transform duration-200 ${isDragging ? '' : 'duration-300 ease-out'}`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {children}

        {/* Delete indicator */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center transition-opacity duration-200 ${
            offsetX < 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <X className="h-6 w-6 text-red-400" />
        </div>
      </div>
    </div>
  );
};

export default SwipeToDelete;