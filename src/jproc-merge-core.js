import fs from 'fs';
import path from 'path';  // added

function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (Array.isArray(source[key])) { // added array handling
                if (Array.isArray(target[key])) {
                    target[key] = target[key].concat(source[key]);
                } else {
                    target[key] = source[key];
                }
            } else if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return mergeDeep(target, ...sources);
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

// added helper function
function addSourceKey(data, sourceFile) {
    if (Array.isArray(data)) {
        data.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                addSourceKey(item, sourceFile);
            }
        });
    } else if (typeof data === 'object' && data !== null) {
        data['_source_'] = sourceFile;
        for (const key in data) {
            if (typeof data[key] === 'object' && data[key] !== null) {
                addSourceKey(data[key], sourceFile);
            }
        }
    }
}

function mergeJsonFiles(filePaths, enableNameit = false) {  // updated signature
    let merged = {};
    filePaths.forEach(filePath => {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (enableNameit) {
            const sourceFile = path.basename(filePath);
            addSourceKey(jsonData, sourceFile);
        }
        merged = mergeDeep(merged, jsonData);
    });
    return merged;
}

export { mergeJsonFiles };
