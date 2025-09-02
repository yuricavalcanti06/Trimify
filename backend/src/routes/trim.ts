// src/routes/trim.ts
import { Router } from "express";
import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs";

// Transforma a função exec baseada em callback para uma baseada em Promise (async/await)
const execPromise = util.promisify(exec);

const router = Router();

router.post("/", async (req, res) => {
  const { url, startTime, endTime } = req.body;

  // 1. Validação básica da entrada
  if (!url || !startTime || !endTime) {
    return res.status(400).send({
      error: "Parâmetros ausentes: url, startTime e endTime são obrigatórios.",
    });
  }

  try {
    const videoId = `${Date.now()}`;
    const originalVideoPath = path.join(__dirname, `../../temp/${videoId}.mp4`);
    const outputVideoPath = path.join(
      __dirname,
      `../../outputs/${videoId}_trimmed.mp4`
    );

    console.log(`[INICIANDO] Baixando vídeo: ${url}`);

    // 2. Comando para baixar o vídeo com yt-dlp
    const downloadCommand = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${originalVideoPath}" "${url}"`;
    await execPromise(downloadCommand);

    console.log(`[CONCLUÍDO] Vídeo baixado em: ${originalVideoPath}`);
    console.log(`[INICIANDO] Cortando vídeo de ${startTime} até ${endTime}`);

    // 3. Comando para cortar o vídeo com ffmpeg
    // -c copy faz o corte sem re-encodar o vídeo, o que é MUITO mais rápido.
    const trimCommand = `ffmpeg -i "${originalVideoPath}" -ss ${startTime} -to ${endTime} "${outputVideoPath}"`;
    await execPromise(trimCommand);

    console.log(`[CONCLUÍDO] Vídeo cortado em: ${outputVideoPath}`);

    // 4. Limpeza: apaga o vídeo original que foi baixado
    fs.unlinkSync(originalVideoPath);
    console.log(`[LIMPEZA] Arquivo original deletado: ${originalVideoPath}`);

    // 5. Resposta com o link para download
    const downloadUrl = `/downloads/${videoId}_trimmed.mp4`;
    res.status(200).send({ downloadUrl });
  } catch (error) {
    console.error("Ocorreu um erro no processamento do vídeo:", error);
    res.status(500).send({
      error:
        "Falha ao processar o vídeo. Verifique a URL e os tempos fornecidos.",
    });
  }
});

export default router;
