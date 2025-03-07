import { processJson, processJsonStream } from './jproc-core.js';
import fs from 'fs';
import chalk from 'chalk';

if (process.argv.length < 5) {
  console.error(chalk.red('[ERROR]'), 'Usage: node cli.js <steps.json> <input.json> <output.json>');
  process.exit(1);
}

const stepsFile = process.argv[2];
const inputFile = process.argv[3];
const outputFile = process.argv[4];

if (process.argv[5] === "stream") {
  processJsonStream(inputFile, stepsFile, outputFile);
} else {
  processJson(inputFile, stepsFile, outputFile);
}
