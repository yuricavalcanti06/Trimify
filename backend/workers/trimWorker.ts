import { Worker, ConnectionOptions } from "bullmq";
import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs";
import IORedis from "ioredis";

const execPromise = util.promisify(exec);

const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const worker = new Worker(
  "video-trimming",
  async (job) => {
    const { url, startTime, endTime } = job.data;

    console.log(`[WORKER] Processando job ${job.id} para a URL: ${url}`);

    const videoId = `${Date.now()}`;
    const originalVideoPath = path.join(__dirname, `../temp/${videoId}.mp4`);
    const outputVideoPath = path.join(
      __dirname,
      `../outputs/${videoId}_trimmed.mp4`
    );

    try {
      await job.updateProgress(10);
      console.log(`[WORKER Job ${job.id}] Baixando vídeo...`);

      const cookiesPath = path.join(__dirname, "../youtube.com_cookies.txt");
      const downloadCommand = `yt-dlp --cookies "${cookiesPath}" -f "best[ext=mp4][height<=1080]" -o "${originalVideoPath}" "${url}"`;

      await execPromise(downloadCommand);

      await job.updateProgress(50);
      console.log(
        `[WORKER Job ${job.id}] Cortando vídeo de ${startTime} até ${endTime}`
      );
      const trimCommand = `ffmpeg -i "${originalVideoPath}" -ss ${startTime} -to ${endTime} "${outputVideoPath}"`;
      await execPromise(trimCommand);

      await job.updateProgress(90);
      console.log(`[WORKER Job ${job.id}] Limpando arquivo original...`);
      fs.unlinkSync(originalVideoPath);

      const downloadUrl = `/downloads/${videoId}_trimmed.mp4`;

      await job.updateProgress(100);
      console.log(`[WORKER Job ${job.id}] Processamento concluído!`);

      return { downloadUrl };
    } catch (error) {
      console.error(`[WORKER Job ${job.id}] Falhou!`, error);
      throw error;
    }
  },
  { connection }
);

console.log("🚀 Worker iniciado e ouvindo a fila 'video-trimming'...");

worker.on("completed", (job, result) => {
  console.log(
    `[WORKER] Job ${job.id} concluído com sucesso! Resultado:`,
    result
  );
});

worker.on("failed", (job, err) => {
  console.error(`[WORKER] Job ${job?.id} falhou com o erro: ${err.message}`);
});
