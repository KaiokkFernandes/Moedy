import { useContext } from 'react'
import { TourContext } from '@/contexts/TourContext'

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour deve ser usado dentro de <TourProvider>')
  }
  return context
}
