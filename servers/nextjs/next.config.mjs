import path from "path";
import { fileURLToPath } from "url";

const nextConfigDirectory = path.dirname(fileURLToPath(import.meta.url));

const presentonHttpHostPort =
  process.env.PRESENTON_HTTP_HOST_PORT ||
  process.env.PRESENTON_HOST_HTTP_PORT ||
  process.env.PRESENTON_PUBLIC_PORT ||
  "8010";

const domToPptxTracingIncludes = [
  "./scripts/dom-to-pptx-exporter.mjs",
  "./vendor/landppt-dom-to-pptx/**/*",
  "./node_modules/dom-to-pptx/**/*",
  "./node_modules/jszip/**/*",
  "./node_modules/puppeteer/**/*",
  "./node_modules/puppeteer-core/**/*",
  "./node_modules/@puppeteer/**/*",
  "./node_modules/ansi-regex/**/*",
  "./node_modules/ansi-styles/**/*",
  "./node_modules/chromium-bidi/**/*",
  "./node_modules/cliui/**/*",
  "./node_modules/color-convert/**/*",
  "./node_modules/color-name/**/*",
  "./node_modules/devtools-protocol/**/*",
  "./node_modules/emoji-regex/**/*",
  "./node_modules/escalade/**/*",
  "./node_modules/get-caller-file/**/*",
  "./node_modules/get-east-asian-width/**/*",
  "./node_modules/is-fullwidth-code-point/**/*",
  "./node_modules/lilconfig/**/*",
  "./node_modules/mitt/**/*",
  "./node_modules/modern-tar/**/*",
  "./node_modules/string-width/**/*",
  "./node_modules/strip-ansi/**/*",
  "./node_modules/typed-query-selector/**/*",
  "./node_modules/webdriver-bidi-protocol/**/*",
  "./node_modules/wrap-ansi/**/*",
  "./node_modules/ws/**/*",
  "./node_modules/y18n/**/*",
  "./node_modules/yargs/**/*",
  "./node_modules/yargs-parser/**/*",
];

const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  distDir: ".next-build",
  output: "standalone",
  outputFileTracingRoot: nextConfigDirectory,
  turbopack: {
    root: nextConfigDirectory,
  },
  ...(process.env.NODE_ENV !== "production"
    ? {
        allowedDevOrigins: [
          "http://127.0.0.1:40001",
          "http://localhost:40001",
          "127.0.0.1",
          "localhost",
        ],
      }
    : {}),
  outputFileTracingIncludes: {
    "/api/export-presentation/dom-to-pptx": domToPptxTracingIncludes,
  },

  // Rewrites for development - proxy app data and API requests to FastAPI.
  async rewrites() {
    return [
      {
        source: '/app_data/:path*',
        destination: `http://localhost:${presentonHttpHostPort}/app_data/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `http://localhost:${presentonHttpHostPort}/static/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `http://localhost:${presentonHttpHostPort}/api/v1/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-7c765f3726084c52bcd5d180d51f1255.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pptgen-public.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "pptgen-public.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "img.icons8.com",
      },
      {
        protocol: "https",
        hostname: "present-for-me.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "yefhrkuqbjcblofdcpnr.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
    ],
  },
  
};

export default nextConfig;
