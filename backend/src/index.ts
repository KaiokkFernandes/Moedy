import { createApp } from "./createApp.js";

/**
 * Entrada usada pela Vercel: o app vira uma Vercel Function, e a plataforma cuida da porta,
 * do encerramento e de quantas instâncias rodam. Fora dela (Docker, `yarn dev`), o servidor
 * sobe por server.ts.
 *
 * Por isso o app é criado em createApp.ts e não num arquivo chamado app.ts: a Vercel procura a
 * entrada por nome (app, index, server) e escolheria o app.js compilado, que não exporta o app.
 */
export default createApp();
