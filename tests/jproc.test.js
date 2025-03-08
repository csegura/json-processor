import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processJson, processJsonStream } from '../src/jproc-core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanupFiles(files) {
  files.forEach(file => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
}

describe('jproc', function() {
  const inputFile = path.join(__dirname, 'input_test.json');
  const stepsFile = path.join(__dirname, 'steps_test.json');
  const outputFile = path.join(__dirname, 'output_test.json');
  
  beforeEach(function() {
    cleanupFiles([inputFile, stepsFile, outputFile]);
  });
  
  afterEach(function() {
    cleanupFiles([inputFile, stepsFile, outputFile]);
  });
  
  describe('Synchronous processing', function() {
    it('should remove keys, create keys and remove objects as expected', function() {
      const inputJson = {
        chats: [{
          webUrl: "http://example.com",
          tenantId: "tenant",
          messages: [{
            replyToId: "1",
            etag: "etag",
            from: {
              user: { id: "user123", displayName: "Alice" },
              application: "app"
            },
            messageType: "unknownFutureValue"
          }, {
            from: {
              user: { id: "user456", displayName: "Bob" },
              application: "app"
            },
            messageType: "regular"
          }]
        }]
      };
      
      // Updated steps using the new action schema:
      const stepsJson = {
        steps: [
          {
            type: "remove",
            target: ["chats.webUrl", "chats.tenantId"]
          },
          {
            type: "remove",
            target: "chats.messages.messageType",
            equals: "unknownFutureValue"
          },
          {
            type: "create",
            target: "chats.messages.fromId",
            source: "from.user.id"
          },
          {
            type: "create",
            target: "chats.messages.fromDisplayName",
            source: "from.user.displayName"
          },
          {
            type: "remove",
            target: "chats.messages.from"
          }
        ]
      };

      fs.writeFileSync(inputFile, JSON.stringify(inputJson, null, 2), 'utf8');
      fs.writeFileSync(stepsFile, JSON.stringify(stepsJson, null, 2), 'utf8');

      processJson(inputFile, stepsFile, outputFile);
      
      const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      // Verify keys removed.
      assert.strictEqual(outputData.chats[0].webUrl, undefined);
      assert.strictEqual(outputData.chats[0].tenantId, undefined);
      // Verify that the message with unknownFutureValue was removed.
      assert.strictEqual(outputData.chats[0].messages.length, 1);
      // Verify new keys are created.
      const msg = outputData.chats[0].messages[0];
      assert.strictEqual(msg.fromId, "user456");
      assert.strictEqual(msg.fromDisplayName, "Bob");
      // Verify removal of original "from" property.
      assert.strictEqual(msg.from, undefined);
    });
    
    it('should remove elements with empty arrays', function() {
      const inputJson = {
        chats: [{
          messages: [{
            from: { user: { id: "user1", displayName: "Test" } },
            reactions: []
          }, {
            from: { user: { id: "user2", displayName: "Test2" } },
            reactions: ["like"]
          }]
        }]
      };
      
      // Updated steps to use type "removeEmpty" with target property.
      const stepsJson = {
        steps: [
          {
            type: "removeEmpty",
            target: "chats.messages.reactions"
          }
        ]
      };

      fs.writeFileSync(inputFile, JSON.stringify(inputJson, null, 2), 'utf8');
      fs.writeFileSync(stepsFile, JSON.stringify(stepsJson, null, 2), 'utf8');

      processJson(inputFile, stepsFile, outputFile);
      
      const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      // One message with empty reactions should be removed.
      assert.strictEqual(outputData.chats[0].messages.length, 1);
      // The remaining message should have a non-empty reactions array.
      assert.ok(outputData.chats[0].messages[0].reactions.length > 0);
    });
    
    describe('Additional actions', function() {
      it('should update keys with constant value', function() {
        const inputJson = {
          users: [
            { name: "Alice", active: false },
            { name: "Bob", active: false }
          ]
        };
        const stepsJson = {
          steps: [
            {
              type: "update",
              target: "users.active",
              value: true
            }
          ]
        };
        fs.writeFileSync(inputFile, JSON.stringify(inputJson, null, 2), 'utf8');
        fs.writeFileSync(stepsFile, JSON.stringify(stepsJson, null, 2), 'utf8');
        
        processJson(inputFile, stepsFile, outputFile);
        
        const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        outputData.users.forEach(user => {
          assert.strictEqual(user.active, true);
        });
      });
      
      it('should update keys with source field', function() {
        const inputJson = {
          users: [
            { name: "Alice", status: "active", active: false },
            { name: "Bob", status: "active", active: false }
          ]
        };
        const stepsJson = {
          steps: [
            {
              type: "update",
              target: "users.active",
              source: "status"
            }
          ]
        };
        fs.writeFileSync(inputFile, JSON.stringify(inputJson, null, 2), 'utf8');
        fs.writeFileSync(stepsFile, JSON.stringify(stepsJson, null, 2), 'utf8');
        
        processJson(inputFile, stepsFile, outputFile);
        
        const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        outputData.users.forEach(user => {
          assert.strictEqual(user.active, "active");
        });
      });
      
      it('should rename a key correctly', function() {
        const inputJson = {
          data: {
            oldKey: "value",
            unchanged: "same"
          }
        };
        // Updated newName: use "newKey" instead of "data.newKey"
        const stepsJson = {
          steps: [
            {
              type: "rename",
              target: "data.oldKey",
              newName: "newKey"
            }
          ]
        };
        fs.writeFileSync(inputFile, JSON.stringify(inputJson, null, 2), 'utf8');
        fs.writeFileSync(stepsFile, JSON.stringify(stepsJson, null, 2), 'utf8');
        
        processJson(inputFile, stepsFile, outputFile);
        
        const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        assert.strictEqual(outputData.data.newKey, "value");
        assert.strictEqual(outputData.data.oldKey, undefined);
        assert.strictEqual(outputData.data.unchanged, "same");
      });
      
      it('should update keys with expression', function() {
        const inputJson = {
          users: [
            { name: "Alice", test: "$Alice" },
            { name: "Bob", test: "$Bob" }
          ]
        };
        const stepsJson = {
          steps: [
            {
              type: "update",
              target: "users.testValue",
              exp: "(o, k) => o.test.substring(1)"
            }
          ]
        };
        fs.writeFileSync(inputFile, JSON.stringify(inputJson, null, 2), 'utf8');
        fs.writeFileSync(stepsFile, JSON.stringify(stepsJson, null, 2), 'utf8');
        
        processJson(inputFile, stepsFile, outputFile);
        const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        outputData.users.forEach(user => {
          assert.strictEqual(user.testValue, user.test.substring(1));
        });
      });
    });
  });
  
  describe('Stream processing', function() {
    it('should process JSON via stream in the same way as sync processing', function(done) {
      // Use same input/steps for testing, then wait for the stream end.
      const inputJson = {
        items: [{
          val: "a",
          flag: false
        }, {
          val: "b",
          flag: false
        }]
      };
      const stepsJson = {
        steps: [
          {
            type: "update",
            target: "items.flag",
            value: true
          },
          {
            type: "create",
            target: "items.newVal",
            source: "val"
          }
        ]
      };
      fs.writeFileSync(inputFile, JSON.stringify(inputJson, null, 2), 'utf8');
      fs.writeFileSync(stepsFile, JSON.stringify(stepsJson, null, 2), 'utf8');
      
      processJsonStream(inputFile, stepsFile, outputFile);
      
      // Allow some time for stream processing (using parser 'end' event is easier, but processJsonStream does not return a promise)
      setTimeout(() => {
        const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        outputData.items.forEach(item => {
          assert.strictEqual(item.flag, true);
          assert.strictEqual(item.newVal, item.val);
        });
        done();
      }, 500);
    });
  });
});
