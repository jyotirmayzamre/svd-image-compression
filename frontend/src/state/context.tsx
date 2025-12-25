import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";

export interface Svd {
    U: SharedArrayBuffer;
    S: SharedArrayBuffer;
    Vt: SharedArrayBuffer;
}


interface ContextType {
    R: Svd | null;
    setR: React.Dispatch<React.SetStateAction<Svd | null>>

    G: Svd | null;
    setG: React.Dispatch<React.SetStateAction<Svd | null>>

    B: Svd | null;
    setB: React.Dispatch<React.SetStateAction<Svd | null>>

    width: number;
    setWidth: React.Dispatch<React.SetStateAction<number>>

    height: number;
    setHeight: React.Dispatch<React.SetStateAction<number>>

    rank: number;
    setRank: React.Dispatch<React.SetStateAction<number>>

    resetAll: () => void;
}

const SvdContext = createContext<ContextType | undefined>(undefined);


//Context provider that stores SVDs, height, width, and singular values as state
export const SvdProvider = ({ children }: { children: ReactNode }) => {
  const [R, setR] = useState<Svd | null>(null);
  const [G, setG] = useState<Svd | null>(null);
  const [B, setB] = useState<Svd | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [rank, setRank] = useState<number>(0);

  const resetAll = useCallback(() => {
    setR(null); setG(null); setB(null); setRank(1);
  }, []);

  const value = useMemo(() => ({
    R, setR, G, setG, B, setB, width, setWidth, height, setHeight, rank, setRank, resetAll
  }), [R, G, B, setR, setG, setB, height, rank, resetAll, width]);


  return (
    <SvdContext.Provider value={value}>
      {children}
    </SvdContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSvdStore = () => {
  const ctx = useContext(SvdContext);
  if (!ctx) throw new Error("useSvdStore must be used inside SvdProvider");
  return ctx;
};