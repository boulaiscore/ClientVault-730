import { ensureDevSeed } from "./lib/dev-seed.mjs";

try {
  await ensureDevSeed({ verbose: true });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
