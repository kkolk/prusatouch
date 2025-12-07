/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRUSALINK_USER?: string
  readonly VITE_PRUSALINK_PASS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
