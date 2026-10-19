import path from "node:path";
import multer from "multer";
import { AppError } from "./errorHandler.js";

// 4 MB: a Vercel recusa requisições acima de 4,5 MB, e o envio do arquivo tem um pouco de sobra
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".ofx", ".csv"];

/** Upload do extrato: um arquivo .ofx ou .csv de até 4 MB, mantido só em memória. */
export const uploadStatement = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase())) {
      callback(null, true);
    } else {
      callback(new AppError("Formato não suportado: envie um arquivo .ofx ou .csv", 400));
    }
  },
}).single("arquivo");
