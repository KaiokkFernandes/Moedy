# Arquivos de exemplo para importação

Extratos fictícios para testar a importação (página **Importar** ou `POST /api/import/preview`).

| Arquivo | Formato | O que exercita |
| ------- | ------- | -------------- |
| `extrato-conta-corrente.ofx` | OFX (SGML), windows-1252 | Conta corrente, acentos em latin1, data com fuso, valor com vírgula, `&amp;`, dois lançamentos iguais no mesmo dia e um lançamento de valor zero (vira erro) |
| `fatura-cartao.ofx` | OFX (XML), UTF-8 | Cartão de crédito, descrição em `<NAME>`, um estorno (receita) e um `FITID` repetido |
| `extrato-exemplo.csv` | CSV com `;`, windows-1252 | Datas dd/mm/aaaa, valores como `1.234,56`, texto entre aspas com `;`, linhas repetidas, linha de saldo sem valor e uma data inválida (viram erro) |
| `extrato-entrada-saida.csv` | CSV com `,`, UTF-8 | Datas aaaa-mm-dd, colunas separadas de entrada e saída, valores como `1,250.00` |

Os dois arquivos de conta corrente (`.ofx` e `extrato-exemplo.csv`) têm os mesmos lançamentos, mas não são
reconhecidos como duplicados entre si: o OFX identifica cada lançamento pelo `FITID` do banco, e o CSV, por um
hash de data + valor + descrição.
