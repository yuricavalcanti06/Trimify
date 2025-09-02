import express from "express";
import cors from "cors";
import path from "path";
import trimRoutes from "./routes/trim";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// rota de teste de saúde da API
app.get("/api/health", (req, res) => {
  res.send({ status: "API está funcionando!" });
});

// rota principal pra cortar vídeo
app.use("/api/trim", trimRoutes);

// Servindo os arquivos estáticos da pasta 'outputs'
// rota virtual '/downloads' que aponta pra pasta 'outputs'
app.use("/downloads", express.static(path.join(__dirname, "../outputs")));

app.listen(port, () => {
  console.log(`🚀 Servidor back-end rodando em http://localhost:${port}`);
});
