import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface DeleteButtonProps {
  onDelete: () => void;
  className?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              absolute right-0 top-1/2 -translate-y-1/2
              p-2 rounded-l-lg bg-gradient-to-l
              from-red-900/90 to-red-800/90
              text-red-100 opacity-0 group-hover:opacity-100
              transition-all duration-300 hover:from-red-800/90 hover:to-red-700/90
              ${className}
            `}
          >
            <Trash2 className={`h-5 w-5 transition-transform duration-300 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
            sideOffset={5}
          >
            Delete this day
            <Tooltip.Arrow className="fill-dark-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default DeleteButton;