import { useSvdStore } from "../state/context";

export default function RankSlider() {
  const { rank, R, setRank, height } = useSvdStore();
  const maxRank = height;

  return (
    <div className="flex flex-col w-full max-w-[840px]">
      <input
        type="range"
        min={1}
        max={maxRank}
        value={rank}
        disabled={!R}
        onChange={(e) => setRank(Number(e.target.value))}
        className={`
          w-full h-3 rounded-lg
          bg-gray-300
          appearance-none
          cursor-pointer
          transition-all duration-200
          ${!R ? "opacity-50 pointer-events-none" : ""}
        `}
        style={{
          accentColor: "#3b82f6", // blue thumb color
        }}
      />
    </div>
  );
}
