export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#faf6ef' }}>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#2a1f14]">404</h1>
        <p className="text-xl text-[#7a6650] mt-4">Página não encontrada</p>
        <a
          href="/dashboard"
          className="inline-block mt-6 px-6 py-3 rounded-xl font-semibold transition-all"
          style={{ background: '#c45c2a', color: '#faf6ef' }}
        >
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  )
}
