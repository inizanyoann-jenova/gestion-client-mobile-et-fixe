const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerDir: 'worker',
  // Désactive le precaching automatique des fichiers statiques.
  // Le SW s'installe instantanément sans requête réseau upfront,
  // ce qui évite les échecs d'installation sur connexion Android lente.
  // Le cache se construit au fil des visites (runtime caching).
  workboxOptions: {
    exclude: [/.*/],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = withPWA(nextConfig)
