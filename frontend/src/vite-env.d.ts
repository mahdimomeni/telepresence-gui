/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare const __APP_VERSION__: string;

interface Window {
  go?: {
    app?: {
      App?: typeof import("../wailsjs/go/app/App");
    };
    [key: string]: unknown;
  };
  runtime?: Record<string, unknown>;
}
