
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/Home/ViewIndex", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;

