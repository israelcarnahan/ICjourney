import React from "react";
import { usePubData } from "../context/PubDataContext";

const ScheduleOverview: React.FC = () => {
  const { schedule } = usePubData();

  return (
    <div>
      <div className="text-xs text-eggplant-300 mt-1">
        {schedule.length} {schedule.length === 1 ? "day" : "days"} planned
      </div>
    </div>
  );
};

export default ScheduleOverview;
