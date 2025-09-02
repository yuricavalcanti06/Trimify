"use client";

import { useState } from "react";

export default function TrimForm() {
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");

  // Função que será chamada ao enviar o formulário
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setError("");
    setDownloadUrl("");

    try {
      const response = await fetch("http://localhost:3001/api/trim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, startTime, endTime }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Algo deu errado.");
      }

      setDownloadUrl(data.downloadUrl);
    } catch (err) {
      // O 'err' agora é do tipo 'unknown' por padrão
      let errorMessage = "Ocorreu um erro inesperado.";

      // 2. Verifica se o erro é um objeto do tipo Error
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      // 3. Define a mensagem de erro de forma segura
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl bg-gray-800 p-8 rounded-lg shadow-lg space-y-6"
    >
      {/* Input da URL */}
      <div>
        <label
          htmlFor="url"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          URL do Vídeo do YouTube
        </label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          required
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Inputs de Tempo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Tempo de Início
          </label>
          <input
            type="text"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="00:00"
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Tempo de Fim
          </label>
          <input
            type="text"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="00:00"
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Botão de Envio */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        Cortar Vídeo
      </button>

      <div className="mt-6 text-center">
        {isLoading && (
          <p className="text-blue-400">
            Processando... Isso pode levar alguns segundos.
          </p>
        )}
        {error && (
          <p className="text-red-500 bg-red-900/20 p-3 rounded-md">{error}</p>
        )}
        {downloadUrl && (
          <div className="bg-green-900/30 p-4 rounded-lg">
            <p className="text-green-400 mb-4">Seu clipe está pronto!</p>
            <a
              href={`http://localhost:3001${downloadUrl}`}
              download
              className="inline-block py-3 px-6 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors"
            >
              Baixar Clipe
            </a>
          </div>
        )}
      </div>
    </form>
  );
}
