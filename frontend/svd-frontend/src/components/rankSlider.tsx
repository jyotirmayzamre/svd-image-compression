import { useState, useEffect, useRef } from "react";
import { useSvdStore } from "../state/context";

export default function RankSlider() {
  const { rank, R, setRank, height } = useSvdStore();
  const [displayRank, setDisplayRank] = useState(rank);
  const maxRank = height;
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayRank(rank);
  }, [rank]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRank = Number(e.target.value);
    setDisplayRank(newRank);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setRank(newRank);
    }, 100) as unknown as number;
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col w-full max-w-[840px]">
      <input
        type="range"
        min={1}
        max={maxRank}
        value={displayRank}
        disabled={!R}
        onChange={handleSliderChange}
        className={`
          w-full h-3 rounded-lg
          bg-gray-300
          appearance-none
          cursor-pointer
          transition-all duration-200
          ${!R ? "opacity-50 pointer-events-none" : ""}
        `}
        style={{
          accentColor: "#3b82f6", 
        }}
      />
    </div>
  );
}