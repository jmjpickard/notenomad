/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["onnxruntime-web"],
  reactStrictMode: true,
  typescript: {
    // Type checking happens separately during the lint step
    ignoreBuildErrors: false,
  },
  // Add this section to optimize output size
  output: "standalone",
  experimental: {
    // Add proper serverComponentsExternalPackages to exclude large dependencies from server bundle
    serverComponentsExternalPackages: [
      "onnxruntime-node",
      "@huggingface/transformers",
    ],
    // Optimize server build
    serverMinification: true,
    // Pack related packages together
    optimizePackageImports: ["onnxruntime-web"],
  },
  webpack: (config, { isServer }) => {
    // Disable node-specific modules
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };

    // Add a rule to handle WASM files from ONNX runtime
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Explicitly mark dependencies that should be treated as client-side only
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      os: false,
      module: false,
    };

    // Prevent ONNX runtime from being included in server-side bundles
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "onnxruntime-web",
        "onnxruntime-node",
      ];
    }

    // Add specific rule for ONNX WebAssembly file
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default config;
