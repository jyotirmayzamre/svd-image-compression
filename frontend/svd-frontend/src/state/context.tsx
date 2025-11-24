import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface Matrix {
    rows: number;
    cols: number;
    data: number[][];
}

export interface SvdResult {
    U: number[][];
    S: number[][];
    Vt: number[][];
}

export interface ChannelState {
  matrix: Matrix | null;
  setMatrix: (m: Matrix | null) => void;

  svd: SvdResult | null;
  setSvd: (s: SvdResult | null) => void;

  isLoading: boolean;
  setIsLoading: (b: boolean) => void;

  error: string | null;
  setError: (e: string | null) => void;
}

interface SvdContextType {
    R: ChannelState;
    G: ChannelState;
    B: ChannelState;

    resetAll: () => void;
}


const SvdContext = createContext<SvdContextType | undefined>(undefined);

export const SvdProvider = ({ children }: { children: ReactNode }) => {
  const [Rmatrix, setRMatrix] = useState<Matrix | null>(null);
  const [RSVD, setRSVD] = useState<SvdResult | null>(null);
  const [RLoading, setRLoading] = useState(false);
  const [RError, setRError] = useState<string | null>(null);

  const [Gmatrix, setGMatrix] = useState<Matrix | null>(null);
  const [GSVD, setGSVD] = useState<SvdResult | null>(null);
  const [GLoading, setGLoading] = useState(false);
  const [GError, setGError] = useState<string | null>(null);

  const [Bmatrix, setBMatrix] = useState<Matrix | null>(null);
  const [BSVD, setBSVD] = useState<SvdResult | null>(null);
  const [BLoading, setBLoading] = useState(false);
  const [BError, setBError] = useState<string | null>(null);

  const resetAll = () => {
    setRMatrix(null); setRSVD(null); setRLoading(false); setRError(null);
    setGMatrix(null); setGSVD(null); setGLoading(false); setGError(null);
    setBMatrix(null); setBSVD(null); setBLoading(false); setBError(null);
  };

  return (
    <SvdContext.Provider
      value={{
        R: {
          matrix: Rmatrix,
          setMatrix: setRMatrix,
          svd: RSVD,
          setSvd: setRSVD,
          isLoading: RLoading,
          setIsLoading: setRLoading,
          error: RError,
          setError: setRError,
        },
        G: {
          matrix: Gmatrix,
          setMatrix: setGMatrix,
          svd: GSVD,
          setSvd: setGSVD,
          isLoading: GLoading,
          setIsLoading: setGLoading,
          error: GError,
          setError: setGError,
        },
        B: {
          matrix: Bmatrix,
          setMatrix: setBMatrix,
          svd: BSVD,
          setSvd: setBSVD,
          isLoading: BLoading,
          setIsLoading: setBLoading,
          error: BError,
          setError: setBError,
        },
        resetAll,
      }}
    >
      {children}
    </SvdContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSvdStore = () => {
  const ctx = useContext(SvdContext);
  if (!ctx) throw new Error("useSvdStore must be used inside SvdProvider");
  return ctx;
};