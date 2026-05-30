#!/usr/bin/env node

import { main } from '../src/cli.js';

main(process.argv.slice(2)).catch((error) => {
  const message = error?.message || String(error);
  console.error(process.env.DEBUG ? (error?.stack || message) : message);
  process.exitCode = 1;
});
