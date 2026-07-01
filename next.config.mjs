/** @type {import('next').NextConfig} */
const nextConfig = {
  // Autorise l'accès au serveur de développement depuis d'autres appareils
  // du même réseau wifi (ex: ton téléphone via l'IP locale de ton PC, celle
  // affichée à côté de "Network:" quand tu lances `npm run dev`).
  // Depuis Next.js 16, ces requêtes sont bloquées par défaut par sécurité.
  // Sans impact en production (Vercel) — utile seulement pour `npm run dev`.
  //
  // Si ton IP locale change (redémarrage du wifi, autre réseau...), ajoute
  // la nouvelle ici. Elle s'affiche dans le terminal après "Network:".
  allowedDevOrigins: ["192.168.0.19"],
};

export default nextConfig;
