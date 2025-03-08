import fs from 'fs';
import path from 'path';
import { mergeJsonFiles } from './jproc-merge-core.js';

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Usage: node jproc-merge.js (-f <file1> [file2 ...] | <input_directory>) -o <output_file> [--nameit]');
    process.exit(1);
}

let inputFiles = [];
let outputFile = '';
let enableNameit = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--nameit') {
        enableNameit = true;
    } else if (args[i] === '-o') {
        outputFile = args[++i];
    } else if (args[i] === '-f') {  // process list of input files
        i++;
        while (i < args.length && !args[i].startsWith('-')) {
            inputFiles.push(args[i]);
            i++;
        }
        i--; // adjust index after inner loop
    } else {
        // if no -f option was provided, treat the argument as input directory
        if (inputFiles.length === 0) {
            const inputDir = args[i];
            inputFiles = fs.readdirSync(inputDir)
                .filter(file => file.endsWith('.json'))
                .map(file => path.join(inputDir, file));
            if (inputFiles.length === 0) {
                console.error('No JSON files found in the directory.');
                process.exit(1);
            }
        }
    }
}

if (!outputFile) {
    console.error('Output file must be specified with -o flag.');
    process.exit(1);
}

try {
    const merged = mergeJsonFiles(inputFiles, enableNameit);
    fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2));
    console.log(`Merged JSON written to ${outputFile}`);
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
