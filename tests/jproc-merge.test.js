import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { mergeJsonFiles } from '../src/jproc-merge-core.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('jproc-merge test', function() {
  const tempDir = __dirname;
  const file1 = path.join(tempDir, 'temp1.json');
  const file2 = path.join(tempDir, 'temp2.json');

  before(() => {
    // Create temporary JSON files for testing
    const json1 = { a: 1, b: { c: 2 } };
    const json2 = { b: { d: 3 }, e: 4 };
    fs.writeFileSync(file1, JSON.stringify(json1));
    fs.writeFileSync(file2, JSON.stringify(json2));
  });

  it('should merge two JSON files correctly', function() {
    const merged = mergeJsonFiles([file1, file2]);
    const expected = { a: 1, b: { c: 2, d: 3 }, e: 4 };
    assert.deepStrictEqual(merged, expected, 'Merged JSON does not match expected result');
  });

  describe('Merge use-case with object containing an array', function() {
    const file3 = path.join(tempDir, 'temp3.json');
    const file4 = path.join(tempDir, 'temp4.json');

    before(() => {
      // Create temporary JSON files with an object containing an array
      const json3 = { arr: [1, 2], x: 10 };
      const json4 = { arr: [3, 4], y: 20 };
      fs.writeFileSync(file3, JSON.stringify(json3));
      fs.writeFileSync(file4, JSON.stringify(json4));
    });

    it('should merge JSON files with arrays concatenated', function() {
      const merged = mergeJsonFiles([file3, file4]);
      const expected = { arr: [1, 2, 3, 4], x: 10, y: 20 };
      assert.deepStrictEqual(merged, expected, 'Merged JSON with array does not match expected result');
    });

    after(() => {
      if (fs.existsSync(file3)) fs.unlinkSync(file3);
      if (fs.existsSync(file4)) fs.unlinkSync(file4);
    });
  });

  describe('merge with --nameit option', function() {
    const fileNameTest1 = path.join(__dirname, 'temp-nameit1.json');
    const fileNameTest2 = path.join(__dirname, 'temp-nameit2.json');

    before(() => {
      // Create temporary JSON files for testing '--nameit'
      const json1 = { a: { x: 1 } };
      const json2 = { b: { y: 2 } };
      fs.writeFileSync(fileNameTest1, JSON.stringify(json1));
      fs.writeFileSync(fileNameTest2, JSON.stringify(json2));
    });

    it('should add _source_ property with the correct file name', function() {
      const merged = mergeJsonFiles([fileNameTest1, fileNameTest2], true);
      const base1 = path.basename(fileNameTest1);
      const base2 = path.basename(fileNameTest2);
      // Verify that each object contains the _source_ property correctly set
      assert.strictEqual(merged.a._source_, base1, 'Missing or incorrect _source_ in "a" object');
      assert.strictEqual(merged.b._source_, base2, 'Missing or incorrect _source_ in "b" object');
    });

    after(() => {
      if (fs.existsSync(fileNameTest1)) fs.unlinkSync(fileNameTest1);
      if (fs.existsSync(fileNameTest2)) fs.unlinkSync(fileNameTest2);
    });
  });

  after(() => {
    // Cleanup temporary files
    if (fs.existsSync(file1)) fs.unlinkSync(file1);
    if (fs.existsSync(file2)) fs.unlinkSync(file2);
  });
});