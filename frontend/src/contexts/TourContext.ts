import { createContext } from 'react'

export interface TourContextValue {
  /** true enquanto o tour guiado está aberto. */
  ativo: boolean
  iniciarTour: () => void
}

export const TourContext = createContext<TourContextValue | null>(null)
