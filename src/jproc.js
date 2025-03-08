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
  if (process.argv[i] === "--stream" || process.argv[i] === "-s") streamMode = true;
  if (process.argv[i] === "--verbose" || process.argv[i] === "-v") verbose = true;
}

if (verbose) {
  console.log(chalk.blue('[VERBOSE]'), 'Steps:', stepsFile, 'Input:', inputFile, 'Output:', outputFile, streamMode ? '(in stream mode)' : '');
  setVerbose(true);
}

// Start timer
const startTime = Date.now();

(async function(){
  if (streamMode) {
    await processJsonStream(inputFile, stepsFile, outputFile);
  } else {
    processJson(inputFile, stepsFile, outputFile);
  }
  
  if (verbose) {
    const endTime = Date.now();
    const elapsedMs = endTime - startTime;
    function formatTime(ms) {
      let totalSeconds = ms / 1000;
      let hours = Math.floor(totalSeconds / 3600);
      let minutes = Math.floor((totalSeconds % 3600) / 60);
      let seconds = totalSeconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
    }
    console.log(chalk.yellow('[TIME]'), 'Elapsed Time:', formatTime(elapsedMs));
  }
})(); 
