import { Router } from "express";
import { trimQueue } from "../queues/trimQueue";

const router = Router();

router.post("/", async (req, res) => {
  const { url, startTime, endTime } = req.body;

  if (!url || !startTime || !endTime) {
    return res.status(400).send({
      error: "Parâmetros ausentes: url, startTime e endTime são obrigatórios.",
    });
  }

  try {
    // 1º argumento: um nome para o tipo de job
    // 2º argumento: os dados que o worker precisará para executar a tarefa
    const job = await trimQueue.add("trim-video-job", {
      url,
      startTime,
      endTime,
    });

    console.log(`[API] Job adicionado à fila com o ID: ${job.id}`);

    res.status(202).send({ jobId: job.id });
  } catch (error) {
    console.error("Falha ao adicionar job à fila:", error);
    res.status(500).send({ error: "Erro interno ao processar o pedido." });
  }
});

router.get("/status/:jobId", async (req, res) => {
  const { jobId } = req.params;

  const job = await trimQueue.getJob(jobId);

  if (!job) {
    return res.status(404).send({ status: "not found" });
  }

  const state = await job.getState();

  if (state === "failed") {
    return res.status(200).send({ status: "failed", reason: job.failedReason });
  }

  if (state === "completed") {
    return res
      .status(200)
      .send({ status: "completed", result: job.returnvalue });
  }

  res.status(200).send({ status: state, progress: job.progress });
});

export default router;
