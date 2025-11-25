import { useSvdStore } from "../state/context";

export default function RankSlider() {
    const { rank, R, setRank, height} = useSvdStore();

    const maxRank = height 

    return (
        <div style={{ marginTop: "20px" }}>
            <label>Rank: {rank}</label>
            <input
                type="range"
                min={1}
                max={maxRank}
                value={rank}
                disabled={!R}
                onChange={(e) => setRank(Number(e.target.value))}
            />
        </div>
    );
}
