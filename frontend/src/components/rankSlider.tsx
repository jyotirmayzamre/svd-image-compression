import { useSvdStore } from "../state/context";

export default function RankSlider() {
  const { rank, setRank, height, width } = useSvdStore();
  const maxRank = Math.min(width, height);

  return (
    <div className="flex flex-col w-full max-w-[840px]">
      <input
        type="range"
        min={1}
        max={maxRank}
        value={rank}
        onChange={(e) => setRank(Number(e.target.value))}
        className={`
          w-full h-3 rounded-lg
          bg-gray-300
          appearance-none
          cursor-pointer
          transition-all duration-200
        `}
        style={{
          accentColor: "#3b82f6", 
        }}
      />
    </div>
  );
}