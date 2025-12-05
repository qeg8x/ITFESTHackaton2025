/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import '$std/dotenv/load.ts';

import { start } from '$fresh/server.ts';
import manifest from './fresh.gen.ts';
import config from './fresh.config.ts';
import { startUpdateWorker } from './src/workers/update.worker.ts';
import { logger } from './src/utils/logger.ts';

// Запустить фоновый воркер обновления
logger.info('Starting Digital University server...');
startUpdateWorker();

await start(manifest, config);
