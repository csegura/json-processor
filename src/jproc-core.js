import fs from 'fs';
import JSONStream from 'JSONStream';
import chalk from 'chalk';

let verboseLogging = false;

const logger = {
  step: (msg, ...args) => { if (verboseLogging) console.log(chalk.green('[STEP]'), chalk.cyan(msg), ...args); },
  count: (msg, count) => { if (verboseLogging) console.log(chalk.cyan('[MADE]'), msg, chalk.cyan(count), " changes."); },
  info: (msg, ...args) => { if (verboseLogging) console.log(chalk.blue('[INFO]'), chalk.cyan(msg), ...args); },
  warn: (msg, ...args) => { if (verboseLogging) console.warn(chalk.yellow('[WARN]'), chalk.yellow(msg), ...args); },
  error: (msg, ...args) => { if (verboseLogging) console.error(chalk.red('[ERROR]'), chalk.red(msg), ...args); }
};

// Helper to remove a nested key using dot notation (supports arrays)
function removeNestedKey(obj, keyPath) {
    const keys = keyPath.split('.');
    return removeKey(obj, keys);
  }
  
// Modified: update removeKey to return count of deletions
function removeKey(current, keys) {
    let count = 0; // added for change count
    if (!current) return count;
    if (keys.length === 1) {
      if (Array.isArray(current)) {
        current.forEach(item => {
          if (item && Object.prototype.hasOwnProperty.call(item, keys[0])) {
            delete item[keys[0]];
            count++;
          }
        });
      } else {
        if (Object.prototype.hasOwnProperty.call(current, keys[0])) {
          delete current[keys[0]];
          count++;
        }
      }
      return count;
    }
    
    const key = keys[0];
    const rest = keys.slice(1);
    if (Array.isArray(current)) {
      current.forEach(item => {
          count += removeKey(item, keys);
      });
    } else if (current && Object.prototype.hasOwnProperty.call(current, key)) {
      count += removeKey(current[key], rest);
    }
    return count;
  }
  
  // Helper to get a value at a nested key using dot notation
  function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => acc ? acc[key] : undefined, obj);
  }
  
  // Add helper to get all objects at a given path (supports arrays)
  function getObjectsAtPath(current, parts) {
    if (parts.length === 0) return [current];
    const [key, ...rest] = parts;
    let result = [];
    if (Array.isArray(current)) {
      current.forEach(item => {
        if (item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, key)) {
          result = result.concat(getObjectsAtPath(item[key], rest));
        }
      });
    } else if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, key)) {
      result = result.concat(getObjectsAtPath(current[key], rest));
    }
    return result;
  }
  
  // New helper to flatten targets from a given container path
  function getFlatTargets(root, containerPath) {
    const targets = getObjectsAtPath(root, containerPath);
    let flatTargets = [];
    targets.forEach(t => {
      Array.isArray(t) ? flatTargets.push(...t) : flatTargets.push(t);
    });
    return flatTargets;
  }
  
  // New helper to remove objects from arrays recursively if they match a condition.
  function removeObjectRecursively(current, condition) {
    if (Array.isArray(current)) {
      for (let i = 0; i < current.length; i++) {
        const item = current[i];
        if (getNestedValue(item, condition.path) === condition.value) {
          // Remove this item if condition matches.
          current.splice(i, 1);
          i--; // adjust index after removal
        } else {
          removeObjectRecursively(item, condition);
        }
      }
    } else if (current && typeof current === 'object') {
      Object.keys(current).forEach(key => {
        removeObjectRecursively(current[key], condition);
      });
    }
  }
  
  // New helper to remove objects in arrays based on a condition.
  // Modified: update removeObjectsAtPath to return count of removals
  function removeObjectsAtPath(root, condition) {
    const parts = condition.path.split('.');
    const prop = parts.pop();
    let count = 0;
    const containers = getObjectsAtPath(root, parts);
    containers.forEach(container => {
      if (Array.isArray(container)) {
        for (let i = 0; i < container.length; i++) {
          if (container[i] && container[i][prop] === condition.value) {
            container.splice(i, 1);
            count++;
            i--; // adjust index after removal
          }
        }
      }
    });
    return count;
  }
  
  // New helper to remove objects from arrays if a given property is an empty array.
  // Modified: update removeEmptyArraysAtPath to return count of removals
  function removeEmptyArraysAtPath(root, condition) {
    const parts = condition.path.split('.');
    const prop = parts.pop();
    let count = 0;
    const containers = getObjectsAtPath(root, parts);
    containers.forEach(container => {
      if (Array.isArray(container)) {
        for (let i = 0; i < container.length; i++) {
          const item = container[i];
          if (item && Array.isArray(item[prop]) && item[prop].length === 0) {
            container.splice(i, 1);
            count++;
            i--; // adjust index after removal
          }
        }
      }
    });
    return count;
  }
  
// Modified: update handleRemove to count and log changes
function handleRemove(data, step) {
  let count = 0;
  if (Array.isArray(step.target)) {
    step.target.forEach(targ => {
      logger.step("Removing key:", targ);
      count += removeNestedKey(data, targ);
    });
  } else if (step.equals !== undefined) {
    logger.info("Removing objects where", step.target, "equals", step.equals);
    count += removeObjectsAtPath(data, { path: step.target, value: step.equals });
  } else {
    logger.info("Removing key:", step.target);
    count += removeNestedKey(data, step.target);
  }
  logger.count(`Step 'remove' made`, count );
}

// Modified: update handleCreate to count and log changes
function handleCreate(data, step) {
  logger.step("Creating key:", step.target);
  const newKeysFull = step.target.split('.');
  const containerPath = newKeysFull.slice(0, -1);
  const newProp = newKeysFull[newKeysFull.length - 1];
  const flatTargets = getFlatTargets(data, containerPath);
  let count = 0;
  
  if (step.hasOwnProperty('source')) {
    logger.info("Using source field for value:", step.source);
    flatTargets.forEach(obj => {
      let val = (typeof step.source === "string" && step.source.trim() !== "")
        ? getNestedValue(obj, step.source)
        : step.source;
      obj[newProp] = val;
      count++;
    });
  } else if (step.hasOwnProperty('value')) {
    logger.info("Using constant value for key:", step.value);
    flatTargets.forEach(obj => {
      let constant = step.value;
      if (typeof constant === "object" && constant !== null) {
        constant = JSON.parse(JSON.stringify(constant)); // deep clone
      }
      obj[newProp] = constant;
      count++;
    });
  } else {
    logger.warn("Warning: create action for", step.target, "has neither source nor value");
  }
  logger.count(`Step 'create' made`, count);
}

// Modified: update handleRemoveEmpty to log change count
function handleRemoveEmpty(data, step) {
  logger.step("Removing elements if", step.target, "is an empty array");
  const count = removeEmptyArraysAtPath(data, { path: step.target });
  logger.count(`Step 'removeEmpty' made`, count);
}

// Modified: update handleRename to count and log changes
function handleRename(data, step) {
  logger.step("Renaming key:", step.target, "to:", step.newName);
  const targetFull = step.target.split('.');
  const containerPath = targetFull.slice(0, -1);
  const oldKey = targetFull[targetFull.length - 1];
  const newKey = step.newName;
  const flatTargets = getFlatTargets(data, containerPath);
  let count = 0;
  flatTargets.forEach(obj => {
    if (obj.hasOwnProperty(oldKey)) {
      obj[newKey] = obj[oldKey];
      delete obj[oldKey];
      count++;
    }
  });
  logger.count(`Step 'rename' made`, count);
}

// Modified: update handleUpdate to count and log changes
function handleUpdate(data, step) {
  logger.step("Updating key:", step.target);
  const targetFull = step.target.split('.');
  const containerPath = targetFull.slice(0, -1);
  const keyToUpdate = targetFull[targetFull.length - 1];
  const flatTargets = getFlatTargets(data, containerPath);
  let count = 0;
  
  if (step.hasOwnProperty('exp')) {
    logger.info("Using expression for update:", step.exp);
    let expFunc;
    try {
      expFunc = eval("(" + step.exp + ")");
      if (typeof expFunc !== "function") {
        logger.error("Provided expression is not a function");
      } else {
        flatTargets.forEach(obj => {
          obj[keyToUpdate] = expFunc(obj, obj[keyToUpdate]);
          count++;
        });
      }
    } catch (e) {
      logger.error("Error evaluating expression:", e);
    }
  } else if (step.hasOwnProperty('source')) {
    logger.info("Using source field for update:", step.source);
    flatTargets.forEach(obj => {
      if (obj.hasOwnProperty(keyToUpdate)) {
        let val = (typeof step.source === "string" && step.source.trim() !== "")
          ? getNestedValue(obj, step.source)
          : step.source;
        obj[keyToUpdate] = val;
        count++;
      }
    });
  } else if (step.hasOwnProperty('value')) {
    logger.info("Using constant value for update:", step.value);
    flatTargets.forEach(obj => {
      if (obj.hasOwnProperty(keyToUpdate)) {
        obj[keyToUpdate] = step.value;
        count++;
      }
    });
  } else {
    logger.warn("Warning: update action for", step.target, "has neither source, value, nor expression");
  }
  logger.count(`Step 'update' made `, count);
}

// Updated function to apply a processing step using dedicated action functions
function applyStep(data, step) {
  logger.info("Processing step:", step.type);
  switch(step.type) {
    case "remove":
      handleRemove(data, step);
      break;
    case "create":
      handleCreate(data, step);
      break;
    case "removeEmpty":
      handleRemoveEmpty(data, step);
      break;
    case "rename":
      handleRename(data, step);
      break;
    case "update":
      handleUpdate(data, step);
      break;
    default:
      logger.info("Unknown step type:", step.type);
  }
}

// New centralized error handling function for processing steps
function runStep(data, step) {
  try {
    applyStep(data, step);
  } catch (error) {
    logger.error(`Error processing step ${step.type}:`, error);
  }
}

// New function for validating steps configuration
function validateStepsConfig(stepsConfig) {
  if (!stepsConfig || typeof stepsConfig !== "object") {
    logger.error("Invalid steps configuration: Not an object");
    return false;
  }
  if (!Array.isArray(stepsConfig.steps)) {
    logger.error("Invalid steps configuration: 'steps' property missing or not an array");
    return false;
  }
  const validTypes = ["remove", "create", "removeEmpty", "rename", "update"];
  let isValid = true;
  stepsConfig.steps.forEach((step, index) => {
    if (!step.type || !validTypes.includes(step.type)) {
      logger.error(`Invalid step at index ${index}: Unknown or missing type '${step.type}'`);
      isValid = false;
    }
  });
  return isValid;
}

// Main JSON processing function
function processJson(inputFile, stepsFile, outputFile) {
  const stepsConfig = JSON.parse(fs.readFileSync(stepsFile, 'utf8'));
  if (!validateStepsConfig(stepsConfig)) {
    logger.error("Steps configuration validation failed.");
    process.exit(1);
  }
  const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  stepsConfig.steps.forEach(step => runStep(jsonData, step));
  fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2), 'utf8');
  logger.info('Processed JSON saved to', outputFile);
}

// New function to process JSON using a stream
function processJsonStream(inputFile, stepsFile, outputFile) {
  const stepsConfig = JSON.parse(fs.readFileSync(stepsFile, 'utf8'));
  if (!validateStepsConfig(stepsConfig)) {
    logger.error("Steps configuration validation failed.");
    process.exit(1);
  }
  const inputStream = fs.createReadStream(inputFile, 'utf8');
  // Changed parser pattern to parse the entire JSON object
  const parser = JSONStream.parse();
  const outputStream = fs.createWriteStream(outputFile, 'utf8');
  inputStream.pipe(parser);
  parser.on('data', data => {
    stepsConfig.steps.forEach(step => runStep(data, step));
    outputStream.write(JSON.stringify(data, null, 2) + "\n");
  });
  parser.on('end', () => logger.info("Processed JSON saved to", outputFile));
}

function setVerbose(val) {
  verboseLogging = Boolean(val);
}

export { processJson, processJsonStream, setVerbose };
