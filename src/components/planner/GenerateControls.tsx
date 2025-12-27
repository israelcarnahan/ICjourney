import React from "react";
import VehicleSelector from "../VehicleSelector";

interface GenerateControlsProps {
  onGenerate: () => void | Promise<void>;
}

const GenerateControls: React.FC<GenerateControlsProps> = ({ onGenerate }) => {
  return (
    <div>
      <VehicleSelector />
      <div className="mt-4 flex justify-end">
        <button
          onClick={onGenerate}
          className="px-3 py-1 text-xs rounded-md bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:shadow-neon-purple transition-all"
        >
          Generate Schedule
        </button>
      </div>
    </div>
  );
};

export default GenerateControls;

