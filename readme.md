# JSON Processor

This tool allows you to process JSON files ultra **FAST** using a series of transformation steps defined in a steps file.

## Overview

This project includes a command-line interface that accepts a JSON transformation configuration file (`steps.json`), an input JSON file (`input.json`), and produces an output JSON file (`output.json`). It also supports processing via streams for efficient handling of large files.

## Bonus 

I added another little tool to merge JSON files (jproc-merge)[merge.md]

## Installation

1. Install Node.js (v12 or higher is recommended).
2. Clone the repository.
3. Install dependencies:
   ```
   npm install
   ```

## Usage

Run the JSON Processor from the command line with the following syntax:
```sh
node src/jproc.js <steps.json> <input.json> <output.json> [--stream]  [--verbose]
```

- `<steps.json>`: A JSON file specifying transformation steps.
- `<input.json>`: The source JSON file to process.
- `<output.json>`: The destination file for the processed output.
- `[stream]`: (Optional) Pass "stream" as the fifth argument to use stream
 processing.
- `[verbose]`: (Optional) Verbose output

### Examples

**Standard Processing:**
```sh
node src/jproc.js steps.json data/input.json data/output.json
```

**Stream Processing:**
```sh
node src/jproc.js steps.json data/input.json data/output.json --stream
```

## Detailed Actions

This project supports two main processing actions:

1. Standard Processing  
   - Description: Loads the entire JSON file into memory, applies the transformation steps, and writes the output. This mode is suitable for small to moderately sized files.  
   - Command:  
     ```sh
     node src/jproc.js steps.json input.json output.json
     ```

2. Stream Processing  
   - Description: Processes the JSON file as a stream, handling data in chunks which is ideal for large files to reduce memory usage.  
   - Command:  
     ```sh
     node src/jproc.js steps.json input.json output.json --stream
     ```

## Steps File Actions

The steps.json file defines a series of transformation actions to be applied to the input JSON. It should be a valid JSON array where each element is an action object.

### Syntax

Each action object must include:
- "type": A string indicating the action. Supported types:
  - "create": Creates a new property. Depending on your needs, you can supply either:
      - "source": Specifies the key from which the new property's value should be copied.
      - "value": Provides a static value for the new property.
  - "remove": Removes an existing property.
  - "update": Updates a property's value. Optionally, an "exp" property can be provided containing a JavaScript expression to compute the new value dynamically.

### Examples

See more examples: [examples.md](examples.md)

**Sample steps.json**

**Create/Update Action (using source):**
```json
{
  "type": "create",
  "property": "newKey",
  "source": "existingKey"
}
```

**Create/Update Action (using value):**
```json
{
  "type": "create",
  "property": "newKey",
  "value": "defaultValue"
}
```
- defaultValue may be an array or an object

**Update using an expression**

```json
{
    "type": "update",
    "target": "chats.messages.emptyArray",
    "exp": "(o,k) => { o['emptyArray'].push('value'); return k; }"  
}
```

- where (o,k) is current object and key, you have to return the new value
- "(o,k) => o[k].substring(1)"


**Remove Action:**
```json
{
  "type": "remove",
  "property": "obsoleteKey"
}
```

**Transform Action:**
```json
{
  "type": "transform",
  "property": "numericKey",
  "function": "double"
}
```

Remember, steps.json must be a valid JSON array:
```json
[
  { /* action object */ },
  { /* action object */ }
]
```

## 

## Project Structure

- **src/jproc.js**: Main command-line interface.
- **src/jproc-core.js**: Contains the core JSON processing logic.
- **readme.md**: This documentation file.

## Contributing

Feel free to submit issues or pull requests. Provide clear descriptions and examples for better review.

## License

This project is licensed under the MIT License.
