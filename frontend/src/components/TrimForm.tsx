"use client";

import { useState, useRef } from "react";
import YouTube, { YouTubeEvent } from "react-youtube";

export default function TrimForm() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // --- FUNÇÕES AUXILIARES (LUGAR CORRETO) ---

  const isValidTimestamp = (time: string): boolean => {
    const timeRegex = /^((\d{1,2}:)?\d{1,2}:)?\d{1,2}(\.\d{1,3})?$/;
    return timeRegex.test(time);
  };

  const timeToSeconds = (time: string): number => {
    const [main, milliseconds = "0"] = time.split(".");
    const parts = main.split(":").map(Number);
    let seconds = 0;
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      seconds = parts[0];
    }
    return seconds + parseFloat(`0.${milliseconds}`);
  };

  const secondsToTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round(
      (totalSeconds - Math.floor(totalSeconds)) * 10
    );
    let timeString = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
    if (hours > 0) {
      timeString = `${String(hours).padStart(2, "0")}:${timeString}`;
    }
    if (milliseconds > 0) {
      return `${timeString}.${milliseconds}`;
    }
    return timeString;
  };

  const getYoutubeVideoId = (url: string): string | null => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // --- FUNÇÕES DE EVENTO (HANDLERS) ---

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    const id = getYoutubeVideoId(newUrl);
    setVideoId(id);
  };

  const handlePlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    const duration = event.target.getDuration();
    setVideoDuration(duration);
  };

  const handleSetTime = (
    timeSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      timeSetter(secondsToTime(currentTime));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // ... (todas as suas validações de tempo continuam aqui, exatamente como antes)
    setError("");
    setTimeError("");
    setDownloadUrl("");

    if (!isValidTimestamp(startTime) || !isValidTimestamp(endTime)) {
      setTimeError("Formato de tempo inválido. Por favor, use mm:ss.s.");
      return;
    }
    if (timeToSeconds(startTime) >= timeToSeconds(endTime)) {
      setTimeError("O tempo de início deve ser menor que o tempo de fim.");
      return;
    }
    if (videoDuration > 0 && timeToSeconds(endTime) > videoDuration) {
      setTimeError(
        `O tempo de fim não pode ser maior que a duração do vídeo (${secondsToTime(
          videoDuration
        )}).`
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/trim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, startTime, endTime }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao iniciar o processo.");
      }

      const { jobId } = await response.json();

      const intervalId = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `http://localhost:3001/api/trim/status/${jobId}`
          );
          if (!statusResponse.ok) {
            clearInterval(intervalId);
            setError("Erro ao verificar o status do processo.");
            setIsLoading(false);
            return;
          }

          const data = await statusResponse.json();

          if (data.status === "completed") {
            clearInterval(intervalId);
            setProgress(100); // Garante que a barra chegue a 100%
            setDownloadUrl(data.result.downloadUrl);
            setIsLoading(false);
          } else if (data.status === "failed") {
            clearInterval(intervalId);
            setError(
              data.reason || "Ocorreu um erro durante o processamento do vídeo."
            );
            setIsLoading(false);
          } else if (data.status === "active") {
            setProgress(data.progress || 0);
          }
        } catch {
          clearInterval(intervalId);
          setError("Erro de rede ao verificar o status.");
          setIsLoading(false);
        }
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro inesperado ao submeter o pedido.");
      }
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setStartTime("");
    setEndTime("");
    setVideoId(null);
    setDownloadUrl("");
    setError("");
    setTimeError("");
    setProgress(0);
  };

  // --- JSX ---
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
            onReady={handlePlayerReady}
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
          <div className="flex gap-2">
            <input
              type="text"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="mm:ss.s"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => handleSetTime(setStartTime)}
              className="px-3 bg-gray-600 hover:bg-gray-500 rounded-md"
              title="Usar tempo atual do vídeo"
            >
              🎯
            </button>
          </div>
        </div>
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Tempo de Fim
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="mm:ss.s"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => handleSetTime(setEndTime)}
              className="px-3 bg-gray-600 hover:bg-gray-500 rounded-md"
              title="Usar tempo atual do vídeo"
            >
              🎯
            </button>
          </div>
        </div>
      </div>

      {timeError && (
        <p className="text-center text-red-400 -mt-2 mb-4">{timeError}</p>
      )}

      {/* Botão de Envio */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            {/* SVG do Spinner */}
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processando...
          </>
        ) : (
          "Cortar Vídeo"
        )}
      </button>

      <div className="mt-6 text-center">
        {isLoading && (
          <div className="w-full max-w-sm mx-auto">
            {/* Barra de Fundo */}
            <div className="w-full bg-gray-600 rounded-full h-2.5">
              {/* Barra de Progresso */}
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-300 mt-2">Progresso: {progress}%</p>
          </div>
        )}
        {error && (
          <p className="text-red-500 bg-red-900/20 p-3 rounded-md">{error}</p>
        )}
        {downloadUrl && (
          <div className="bg-green-900/30 p-4 rounded-lg">
            <p className="text-green-400 mb-4">Seu clipe está pronto!</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href={`http://localhost:3001${downloadUrl}`}
                download
                className="inline-block py-3 px-6 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors"
              >
                Baixar Clipe
              </a>
              {/* BOTÃO DE RESET */}
              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-6 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors"
              >
                Cortar Outro Vídeo
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
