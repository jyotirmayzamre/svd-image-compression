import { createContext, useContext, useState, useMemo } from "react";
import type { ReactNode } from "react";


interface ContextType {
    width: number;
    setWidth: React.Dispatch<React.SetStateAction<number>>

    height: number;
    setHeight: React.Dispatch<React.SetStateAction<number>>

    rank: number;
    setRank: React.Dispatch<React.SetStateAction<number>>

    dataReady: boolean;
    setDataReady: React.Dispatch<React.SetStateAction<boolean>>


}

const SvdContext = createContext<ContextType | undefined>(undefined);


export const SvdProvider = ({ children }: { children: ReactNode }) => {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [rank, setRank] = useState<number>(0);
  const [dataReady, setDataReady] = useState<boolean>(false);

 
  const value = useMemo(() => ({
    width, setWidth, height, setHeight, rank, setRank, dataReady, setDataReady
  }), [height, rank, width, dataReady]);


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