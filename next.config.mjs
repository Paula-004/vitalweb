/**
 * Hosts autorizados para <Image />. Se derivan de la configuración en lugar de fijarse
 * a mano: el dominio del backoffice/CDN cambia entre entornos.
 * Hosts extra (CDN de imágenes) se agregan con NEXT_PUBLIC_IMAGE_HOSTS separados por coma.
 */
function imageHosts() {
  const patterns = [{ protocol: 'https', hostname: 'images.unsplash.com' }];
  const seen = new Set(['images.unsplash.com']);

  const add = (protocol, hostname) => {
    if (!hostname || seen.has(hostname)) return;
    seen.add(hostname);
    patterns.push({ protocol, hostname });
  };

  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_API_URL);
      add(url.protocol.replace(':', ''), url.hostname);
    } catch {
      // Una URL mal formada no debe frenar el build; sólo no se autoriza ese host.
    }
  }

  for (const entry of (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '').split(',')) {
    const hostname = entry.trim();
    if (hostname) add(hostname.startsWith('localhost') ? 'http' : 'https', hostname);
  }

  return patterns;
}

const isMobileBuild = process.env.VITALWEB_TARGET === 'mobile';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isMobileBuild
    ? { output: 'export', trailingSlash: true }
    : {
        async rewrites() {
          return [
            {
              source: '/api/backend/:path*',
              destination: 'https://vitalfood-backend.onrender.com/:path*',
            },
          ];
        },
      }),
  images: { remotePatterns: imageHosts(), ...(isMobileBuild ? { unoptimized: true } : {}) },
};
export default nextConfig;
