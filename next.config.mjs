/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "better-sqlite3",
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize libsql native modules
      config.externals = config.externals || [];
      config.externals.push({
        "@libsql/client": "commonjs @libsql/client",
        "@prisma/adapter-libsql": "commonjs @prisma/adapter-libsql",
        libsql: "commonjs libsql",
        "better-sqlite3": "commonjs better-sqlite3",
      });
    }
    return config;
  },
};

export default nextConfig;
