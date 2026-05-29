const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerDir: 'worker',
  // Désactive le precaching : le SW s'installe sans télécharger 60+ fichiers upfront,
  // ce qui évite les échecs d'installation sur connexion Android lente/intermittente.
  exclude: [/.*/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = withPWA(nextConfig)
