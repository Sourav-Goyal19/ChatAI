import { create } from "zustand";

type QueryStoryType = {
  query: string | null;
  setQuery: (qry: string) => void;
  clearQuery: () => void;
};

export const useQueryStore = create<QueryStoryType>((set) => ({
  query: null,
  setQuery: (qry) => set({ query: qry }),
  clearQuery: () => set({ query: null }),
}));
