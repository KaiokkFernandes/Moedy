import { useEffect, useState } from 'react'

/**
 * Fica `true` quando algo está em andamento há mais de `ms`. Serve para avisar que o servidor
 * está acordando: no plano gratuito da hospedagem, o backend dorme depois de um tempo parado e
 * a primeira requisição pode levar perto de um minuto.
 */
export function useDemora(emAndamento: boolean, ms = 4000) {
  const [demorando, setDemorando] = useState(false)

  useEffect(() => {
    if (!emAndamento) return
    const timer = setTimeout(() => setDemorando(true), ms)
    return () => {
      clearTimeout(timer)
      setDemorando(false)
    }
  }, [emAndamento, ms])

  return emAndamento && demorando
}
