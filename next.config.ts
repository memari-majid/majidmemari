/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // An explicit document URL keeps the portable course's relative links
    // correct without changing trailing-slash behavior elsewhere on the site.
    return [
      { source: "/prototypes/:path*", destination: "/projects/:path*", permanent: true },
      {
        source: "/teaching/ai-solutions",
        destination: "/teaching/ai-solutions/index.html",
        permanent: true,
      },
      {
        source: "/teaching/ai-solutions/labs",
        destination: "/teaching/ai-solutions/labs/index.html",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
