import React from "react";

interface RouteMapProps {
  route: {
    visits: Array<{
      name: string;
      address: string;
    }>;
  };
}

const RouteMap: React.FC<RouteMapProps> = () => {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg p-4">
      <div className="text-center text-gray-500">
        <p>Map visualization coming soon</p>
      </div>
    </div>
  );
};

export default RouteMap;
