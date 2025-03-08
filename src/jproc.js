import { processJson, processJsonStream, setVerbose } from './jproc-core.js';
import fs from 'fs';
import chalk from 'chalk';

if (process.argv.length < 5) {
  console.error(chalk.red('[ERROR]'), 'Usage: node jproc.js <steps.json> <input.json> <output.json> [stream] [--verbose|-v]');
  process.exit(1);
}

const stepsFile = process.argv[2];
const inputFile = process.argv[3];
const outputFile = process.argv[4];

let streamMode = false;
let verbose = false;
for (let i = 5; i < process.argv.length; i++) {
  if (process.argv[i] === "stream") streamMode = true;
  if (process.argv[i] === "--verbose" || process.argv[i] === "-v") verbose = true;
}

if (verbose) {
  console.log(chalk.blue('[VERBOSE]'), 'Steps:', stepsFile, 'Input:', inputFile, 'Output:', outputFile, streamMode ? '(in stream mode)' : '');
  setVerbose(true);
}

if (streamMode) {
  processJsonStream(inputFile, stepsFile, outputFile);
} else {
  processJson(inputFile, stepsFile, outputFile);
}
