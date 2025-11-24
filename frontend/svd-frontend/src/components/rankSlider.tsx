import { useSvdStore } from "../state/context";

export default function RankSlider() {
    const { rank, setRank, R } = useSvdStore();

    const maxRank = R.svd ? R.svd.S.length : 50; // fallback until SVD loaded

    return (
        <div style={{ marginTop: "20px" }}>
            <label>Rank: {rank}</label>
            <input
                type="range"
                min={1}
                max={maxRank}
                value={rank}
                disabled={!R.svd}
                onChange={(e) => setRank(Number(e.target.value))}
            />
        </div>
    );
}
