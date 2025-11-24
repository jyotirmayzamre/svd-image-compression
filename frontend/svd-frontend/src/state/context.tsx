import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface Svd {
    width: number;
    height: number;
    U: number[][];
    S: number[];
    Vt: number[][];
}


interface ContextType {
    R: Svd | null;
    setR: (r: Svd) => void;

    G: Svd | null;
    setG: (g: Svd) => void;

    B: Svd | null;
    setB: (b: Svd) => void;

    width: number;
    setWidth: (w: number) => void;

    height: number;
    setHeight: (h: number) => void;

    rank: number;
    setRank: (r: number) => void;

    resetAll: () => void;
}

const SvdContext = createContext<ContextType | undefined>(undefined);

export const SvdProvider = ({ children }: { children: ReactNode }) => {
  const [R, setR] = useState<Svd | null>(null);
  const [G, setG] = useState<Svd | null>(null);
  const [B, setB] = useState<Svd | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [rank, setRank] = useState<number>(1);

  const resetAll = () => {
    setR(null); setG(null); setB(null); setRank(1);
  }


  return (
    <SvdContext.Provider
    value={{R, setR, G, setG, B, setB, width, setWidth, height, setHeight, rank, setRank, resetAll}}
    >
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