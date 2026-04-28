import * as FileSystem from "expo-file-system/legacy";

/**
 * Map of supported file extensions to a friendly language label.
 * Anything in this map will be read as plain UTF-8 text and inlined
 * into the message sent to the model. Binary formats (.pdf, .docx,
 * .zip, .tar, images, video, etc.) are intentionally excluded — the
 * extractor only handles formats whose raw bytes already are text.
 */
export const SUPPORTED_EXTENSIONS: Record<string, string> = {
  // plain text / docs
  txt: "text",
  text: "text",
  md: "markdown",
  markdown: "markdown",
  rst: "rst",
  log: "log",

  // data
  json: "json",
  csv: "csv",
  tsv: "tsv",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  ini: "ini",
  conf: "conf",
  env: "dotenv",

  // web
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  vue: "vue",
  svelte: "svelte",

  // js / ts
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",

  // python / ruby / php
  py: "python",
  pyw: "python",
  rb: "ruby",
  php: "php",

  // jvm
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  scala: "scala",
  groovy: "groovy",

  // systems
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  rs: "rust",
  go: "go",
  swift: "swift",
  m: "objective-c",
  mm: "objective-c",

  // shell / scripts
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "fish",
  ps1: "powershell",
  bat: "batch",
  cmd: "batch",

  // db / query
  sql: "sql",
  graphql: "graphql",
  gql: "graphql",
  prisma: "prisma",

  // misc code
  r: "r",
  lua: "lua",
  pl: "perl",
  dart: "dart",
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hs: "haskell",
  clj: "clojure",
  jl: "julia",
  zig: "zig",
  nim: "nim",

  // build / config
  dockerfile: "dockerfile",
  makefile: "makefile",
  cmake: "cmake",
  gradle: "gradle",
  lock: "text",
  gitignore: "text",
};

export const MAX_FILE_BYTES = 100 * 1024; // 100 KB cap

export interface ExtractedFile {
  name: string;
  size: number;
  language: string;
  content: string;
  tokenEstimate: number;
  lineCount: number;
}

export interface PickedFileMeta {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string | null;
}

export type ExtractError =
  | { kind: "unsupported"; ext: string }
  | { kind: "too_large"; size: number }
  | { kind: "binary" }
  | { kind: "read_failed"; message: string };

export function getExtension(name: string): string {
  const lower = name.toLowerCase();
  // special-case dotfiles / well-known names
  if (lower === "dockerfile") return "dockerfile";
  if (lower === "makefile") return "makefile";
  if (lower === ".gitignore") return "gitignore";
  const dot = lower.lastIndexOf(".");
  if (dot === -1) return "";
  return lower.slice(dot + 1);
}

export function isSupportedExtension(ext: string): boolean {
  return ext in SUPPORTED_EXTENSIONS;
}

export function estimateTokens(text: string): number {
  // Rough heuristic: ~4 chars per token (works for English & code).
  return Math.max(1, Math.ceil(text.length / 4));
}

function looksBinary(text: string): boolean {
  // Detect NUL bytes or a high ratio of non-printable chars.
  const sample = text.slice(0, 4096);
  if (sample.includes("\u0000")) return true;
  let bad = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 9 || code === 10 || code === 13) continue; // tab, lf, cr
    if (code < 32 || code === 127) bad++;
  }
  return sample.length > 0 && bad / sample.length > 0.1;
}

export async function extractFile(
  file: PickedFileMeta,
): Promise<{ ok: true; file: ExtractedFile } | { ok: false; error: ExtractError }> {
  const ext = getExtension(file.name);
  if (!isSupportedExtension(ext)) {
    return { ok: false, error: { kind: "unsupported", ext: ext || "?" } };
  }
  if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
    return { ok: false, error: { kind: "too_large", size: file.size } };
  }
  let content: string;
  try {
    content = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: "read_failed",
        message: err instanceof Error ? err.message : "Could not read file",
      },
    };
  }
  if (looksBinary(content)) {
    return { ok: false, error: { kind: "binary" } };
  }
  if (content.length > MAX_FILE_BYTES * 2) {
    // safety net — file size header lied about size
    content = content.slice(0, MAX_FILE_BYTES * 2);
  }
  const language = SUPPORTED_EXTENSIONS[ext] ?? "text";
  return {
    ok: true,
    file: {
      name: file.name,
      size: file.size ?? content.length,
      language,
      content,
      tokenEstimate: estimateTokens(content),
      lineCount: content.split("\n").length,
    },
  };
}

export function describeError(error: ExtractError): string {
  switch (error.kind) {
    case "unsupported":
      return `".${error.ext}" files aren't supported. Try .txt, .md, .json, .csv, code or config files.`;
    case "too_large":
      return `That file is too large (${Math.round(error.size / 1024)} KB). Max ${Math.round(MAX_FILE_BYTES / 1024)} KB.`;
    case "binary":
      return "That file looks like binary (PDF, DOCX, image, etc.). Only text-based files are supported.";
    case "read_failed":
      return `Couldn't read the file: ${error.message}`;
  }
}

export function buildAttachmentBlock(file: ExtractedFile): string {
  return `[Attached file: ${file.name}]\n\`\`\`${file.language}\n${file.content}\n\`\`\``;
}
