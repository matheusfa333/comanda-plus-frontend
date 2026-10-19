/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O navegador chama /api no próprio domínio da Vercel e a Vercel encaminha para o backend.
  // Assim redes que bloqueiam o domínio do backend (ex.: filtros de DNS dinâmico) não afetam o login.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || 'https://comandaplus.duckdns.org'
    return [{ source: '/api/:path*', destination: `${target}/api/:path*` }]
  },
}

module.exports = nextConfig
