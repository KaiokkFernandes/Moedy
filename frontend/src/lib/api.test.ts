import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

// localStorage em memória (no Node ele não existe ou depende de flags)
const armazenado = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (chave: string) => armazenado.get(chave) ?? null,
    setItem: (chave: string, valor: string) => void armazenado.set(chave, valor),
    removeItem: (chave: string) => void armazenado.delete(chave),
  },
})
const { api, getErrorMessage, getFieldErrors, setUnauthorizedHandler, tokenStorage } = await import('./api.ts')

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
const erroHttp = (status: number, data: unknown) =>
  new AxiosError('falhou', 'ERR_BAD_RESPONSE', config, {}, { status, data, statusText: '', headers: {}, config } as AxiosResponse)

describe('mensagens de erro da API', () => {
  it('usa a mensagem em português que a API mandou', () => {
    assert.equal(getErrorMessage(erroHttp(409, { error: 'Email já cadastrado' })), 'Email já cadastrado')
  })

  it('sem resposta do servidor: avisa que não conectou', () => {
    assert.equal(getErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK', config)), 'Não foi possível conectar ao servidor.')
  })

  it('erro da hospedagem em outro formato (função da Vercel caiu) não vira objeto na tela', () => {
    const mensagem = getErrorMessage(erroHttp(500, { error: { code: '500', message: 'A server error has occurred' } }))
    assert.equal(typeof mensagem, 'string')
    assert.equal(mensagem, 'O servidor está com problemas no momento. Tente novamente em instantes.')
  })

  it('resposta 4xx sem mensagem útil, ou erro que não é da API: texto padrão', () => {
    assert.equal(getErrorMessage(erroHttp(400, { error: '   ' }), 'Padrão'), 'Padrão')
    assert.equal(getErrorMessage(erroHttp(404, '<html>'), 'Padrão'), 'Padrão')
    assert.equal(getErrorMessage(new Error('qualquer'), 'Padrão'), 'Padrão')
  })

  it('erros por campo da validação', () => {
    const erro = erroHttp(400, { error: 'Dados inválidos', issues: [{ campo: 'email', mensagem: 'Email inválido' }, { campo: 'senha', mensagem: 'Informe a senha' }] })
    assert.deepEqual(getFieldErrors(erro), { email: 'Email inválido', senha: 'Informe a senha' })
    assert.deepEqual(getFieldErrors(new Error('x')), {})
  })
})

describe('sessão nas requisições', () => {
  let sessaoEncerrada = 0
  beforeEach(() => {
    armazenado.clear()
    sessaoEncerrada = 0
    setUnauthorizedHandler(() => sessaoEncerrada++)
  })

  /** Responde todas as requisições com o status dado, guardando o cabeçalho de autenticação enviado. */
  function servidor(status: number) {
    const enviados: (string | undefined)[] = []
    const adapter: AxiosAdapter = async (cfg) => {
      enviados.push(cfg.headers.Authorization as string | undefined)
      const resposta = { status, data: {}, statusText: '', headers: {}, config: cfg } as AxiosResponse
      if (status >= 400) throw new AxiosError('falhou', 'ERR_BAD_REQUEST', cfg, {}, resposta)
      return resposta
    }
    return { adapter, enviados }
  }

  it('envia o token salvo como Bearer', async () => {
    tokenStorage.set('abc')
    const { adapter, enviados } = servidor(200)
    await api.get('/accounts', { adapter })
    assert.deepEqual(enviados, ['Bearer abc'])
  })

  it('401 numa requisição autenticada encerra a sessão', async () => {
    tokenStorage.set('expirado')
    await assert.rejects(api.get('/accounts', { adapter: servidor(401).adapter }))
    assert.equal(tokenStorage.get(), null)
    assert.equal(sessaoEncerrada, 1)
  })

  it('401 no login (sem token) só mostra o erro, sem encerrar sessão', async () => {
    await assert.rejects(api.post('/auth/login', {}, { adapter: servidor(401).adapter }))
    assert.equal(sessaoEncerrada, 0)
  })

  it('outros erros não mexem na sessão', async () => {
    tokenStorage.set('valido')
    await assert.rejects(api.get('/accounts', { adapter: servidor(500).adapter }))
    assert.equal(tokenStorage.get(), 'valido')
    assert.equal(sessaoEncerrada, 0)
  })
})
