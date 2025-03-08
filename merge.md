# jproc-merge

The `jproc-merge.js` script is a command-line utility designed to merge multiple JSON files into a single JSON file. Input files can be specified in two ways:

1. Provide a directory containing JSON files.
2. Use the `-f` option to specify a list of JSON files.

An output file must be specified using the `-o` option. Additionally, the optional `--nameit` flag can be provided to include a `_source_` property with the source file name in each JSON object.

## Example Usage

### Using an Input Directory
```sh
node jproc-merge.js <input_directory> -o <output_file> [--nameit]
```
- `<input_directory>`: Directory containing JSON files to merge.
- `<output_file>`: Destination file for the merged JSON.
- `[--nameit]`: (Optional) Include a `_source_` property in each JSON object.

### Using a List of Files
```sh
node jproc-merge.js -f <file1> [file2 ...] -o <output_file> [--nameit]
```
- `<file1> [file2 ...]`: One or more JSON files to merge.
- `<output_file>`: Destination file for the merged JSON.
- `[--nameit]`: (Optional) Include a `_source_` property with the original file name in each JSON object.

## Example Commands

### Merge from a Directory
```sh
node jproc-merge.js ./json-files -o merged.json --nameit
```

### Merge Specific Files
```sh
node jproc-merge.js -f json-files/file1.json json-files/file2.json -o merged.json
```

## JSON Examples

### Example 1: Merging Simple Objects
Given two JSON files:

- file1.json:
```json
{
  "a": 1,
  "b": {
    "c": 2
  }
}
```
- file2.json:
```json
{
  "b": {
    "d": 3
  },
  "e": 4
}
```

**Merged Result:**
```json
{
  "a": 1,
  "b": {
    "c": 2,
    "d": 3
  },
  "e": 4
}
```

### Example 2: Merging Arrays
Given two JSON files:

- fileA.json:
```json
{
  "numbers": [1, 2]
}
```
- fileB.json:
```json
{
  "numbers": [3, 4]
}
```

**Merged Result:**
```json
{
  "numbers": [1, 2, 3, 4]
}
```
