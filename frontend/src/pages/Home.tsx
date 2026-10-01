import { useQuery } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/lib/api'

export function Home() {
  const { isPending, isSuccess } = useQuery({
    queryKey: ['health'],
    queryFn: async () => (await api.get<{ status: string }>('/health')).data,
    retry: false,
    refetchInterval: 10_000,
  })

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Wallet className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Finanças Pessoais</h1>
        <p className="mt-1 text-sm text-slate-500">Estrutura inicial do projeto</p>

        <p
          className={clsx(
            'mt-6 rounded-lg px-4 py-2 text-sm font-medium',
            isPending && 'bg-slate-100 text-slate-500',
            isSuccess && 'bg-emerald-50 text-emerald-700',
            !isPending && !isSuccess && 'bg-red-50 text-red-700',
          )}
        >
          {isPending ? 'Verificando backend…' : isSuccess ? 'Backend conectado ✅' : 'Backend offline ❌'}
        </p>
      </div>
    </main>
  )
}
