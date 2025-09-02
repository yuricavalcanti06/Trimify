// frontend/src/app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-5xl font-bold mb-4">Trimify</h1>
        <p className="text-xl text-gray-400">
          Corte e baixe seus trechos favoritos de vídeos do YouTube.
        </p>
      </div>
    </main>
  );
}
