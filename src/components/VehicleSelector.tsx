import React from "react";
import { Car, Anchor, Plane, Train, Bus, Bike, Truck } from "lucide-react";
import {
  usePubData,
  VehicleType,
  VehicleColor,
} from "../context/PubDataContext";
import {
  BootIcon,
  TopHatIcon,
  ThimbleIcon,
  WheelbarrowIcon,
} from "./icons/MonopolyIcons";

// Custom icon for fairy
const FairyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l1.5 5h5l-4 3 1.5 5-4-3-4 3 1.5-5-4-3h5z" />
    <path d="M12 16v6" />
    <path d="M8 14l-4 4" />
    <path d="M16 14l4 4" />
  </svg>
);

// Custom icon for horse
const HorseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 16v4h4v-4" />
    <path d="M4 20h16" />
    <path d="M16 16v4h4v-4" />
    <path d="M10 12c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    <path d="M7 12c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const vehicleIcons = {
  car: Car,
  truck: Truck,
  bike: Bike,
  bus: Bus,
  train: Train,
  plane: Plane,
  boat: Anchor,
  fairy: FairyIcon,
} as const;

const vehicleNames = {
  car: "Car",
  truck: "Truck",
  bike: "Bike",
  bus: "Bus",
  train: "Train",
  plane: "Plane",
  boat: "Boat",
  fairy: "Fairy",
} as const;

const colors: VehicleColor[] = [
  "purple",
  "blue",
  "pink",
  "green",
  "orange",
  "yellow",
];

const colorNames = {
  purple: "Purple",
  blue: "Blue",
  pink: "Pink",
  green: "Green",
  orange: "Orange",
  yellow: "Yellow",
} as const;

const colorClasses: Record<VehicleColor, string> = {
  purple: "text-neon-purple hover:bg-neon-purple/20",
  blue: "text-neon-blue hover:bg-neon-blue/20",
  pink: "text-neon-pink hover:bg-neon-pink/20",
  green: "text-emerald-400 hover:bg-emerald-400/20",
  orange: "text-orange-400 hover:bg-orange-400/20",
  yellow: "text-yellow-400 hover:bg-yellow-400/20",
};

const VehicleSelector: React.FC = () => {
  const {
    selectedVehicle,
    selectedVehicleColor,
    setSelectedVehicle,
    setSelectedVehicleColor,
  } = usePubData();

  return (
    <div className="space-y-2" role="group" aria-label="Vehicle customization">
      <div className="flex items-center gap-4">
        <label
          htmlFor="color-select"
          className="text-sm text-eggplant-200 whitespace-nowrap"
        >
          First, select your preferred color:
        </label>
        <select
          id="color-select"
          value={selectedVehicleColor}
          onChange={(e) =>
            setSelectedVehicleColor(e.target.value as VehicleColor)
          }
          className="w-32 p-1.5 rounded-lg bg-eggplant-800 text-eggplant-100 border border-eggplant-700 focus:ring-2 focus:ring-neon-purple focus:border-transparent text-sm"
          aria-label="Select vehicle color"
        >
          <option value="">Select...</option>
          {colors.map((color) => (
            <option key={color} value={color} className={colorClasses[color]}>
              {colorNames[color]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p
          id="vehicle-selection-label"
          className="text-sm text-eggplant-200 mb-2"
        >
          Now, choose your vehicle:
        </p>
        <div
          className="grid grid-cols-4 gap-1.5"
          role="radiogroup"
          aria-labelledby="vehicle-selection-label"
        >
          {(Object.keys(vehicleIcons) as Array<keyof typeof vehicleIcons>).map(
            (vehicle) => {
              const Icon = vehicleIcons[vehicle];
              return (
                <button
                  key={vehicle}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                    selectedVehicle === vehicle
                      ? `ring-2 ring-offset-1 ring-offset-eggplant-900 ${colorClasses[selectedVehicleColor]}`
                      : "text-eggplant-400 hover:text-eggplant-200"
                  }`}
                  role="radio"
                  aria-checked={selectedVehicle === vehicle}
                  aria-label={`Select ${vehicleNames[vehicle]}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-[10px] font-medium mt-1">
                    {vehicleNames[vehicle]}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleSelector;
