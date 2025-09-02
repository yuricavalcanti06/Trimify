"use client";

import { useState } from "react";
import YouTube from "react-youtube";

export default function TrimForm() {
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [videoId, setVideoId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [timeError, setTimeError] = useState("");

  const isValidTimestamp = (time: string): boolean => {
    const timeRegex = /^(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})$/;
    return timeRegex.test(time);
  };

  const getYoutubeVideoId = (url: string): string | null => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl); // Atualiza o estado da URL
    const id = getYoutubeVideoId(newUrl); // Tenta extrair o ID
    setVideoId(id); // Atualiza o estado do videoId (pode ser o ID ou null)
  };

  // Função que será chamada ao enviar o formulário
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // 1. Limpa todos os estados de resultado/erro da tentativa anterior
    setError("");
    setTimeError("");
    setDownloadUrl("");

    // 2. Valida os dados PRIMEIRO
    if (!isValidTimestamp(startTime) || !isValidTimestamp(endTime)) {
      setTimeError(
        "Formato de tempo inválido. Por favor, use mm:ss ou hh:mm:ss."
      );
      return; // Se inválido, mostra o erro e para. Não entra em modo "loading".
    }

    // 3. APENAS se a validação passar, inicia o estado de carregamento
    setIsLoading(true);

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
      let errorMessage = "Ocorreu um erro inesperado.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      // 4. Garante que o carregamento termina, não importa se deu sucesso ou erro na API
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
          onChange={handleUrlChange}
          placeholder="https://www.youtube.com/watch?v=..."
          required
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {videoId && (
        <div className="my-4">
          <YouTube
            videoId={videoId}
            opts={{
              height: "360",
              width: "100%",
              playerVars: {
                // https://developers.google.com/youtube/player_parameters
                autoplay: 0,
              },
            }}
            className="w-full aspect-video rounded-lg overflow-hidden"
          />
        </div>
      )}

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

      {timeError && (
        <p className="text-center text-red-400 -mt-2 mb-4">{timeError}</p>
      )}

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
