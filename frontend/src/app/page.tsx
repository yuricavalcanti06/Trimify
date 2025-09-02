import TrimForm from "@/components/TrimForm";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold mb-2">Trimify</h1>
        <p className="text-xl text-gray-400">
          Corte e baixe seus trechos favoritos de vídeos do YouTube.
        </p>
      </div>

      {/* Renderiza o componente do formulário */}
      <TrimForm />
    </main>
  );
}
