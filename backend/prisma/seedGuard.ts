// O seed cria um usuário com senha conhecida e redefine essa senha a cada execução: é só para
// desenvolvimento. Este módulo é o primeiro import do seed, então roda antes de todo o resto
// (em módulos ES, os imports são executados na ordem, antes do código do arquivo).
if (process.env.NODE_ENV === "production") {
  console.error("O seed não roda com NODE_ENV=production: ele cria um usuário de teste com senha conhecida.");
  process.exit(1);
}
