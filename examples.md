# JSON Processor Examples

Examples of various actions supported by the JSON Processor.

## Examples

### Create/Update Action (using source)

**Source JSON:**
```json
{
  "existingKey": "value"
}
```

**Action:**
```json
{
  "type": "create",
  "target": "newKey",
  "source": "existingKey"
}
```

**Result:**
```json
{
  "existingKey": "value",
  "newKey": "value"
}
```

### Create/Update Action (using value)

**Source JSON:**
```json
{}
```

**Action:**
```json
{
  "type": "create",
  "target": "newKey",
  "value": "defaultValue"
}
```

**Result:**
```json
{
  "newKey": "defaultValue"
}
```
- `defaultValue` may be an array or an object [], {}

### Update using an expression

**Source JSON:**
```json
{
  "chats": {
    "messages": {
      "emptyArray": []
    }
  }
}
```

**Action:**
```json
{
  "type": "update",
  "target": "chats.messages.emptyArray",
  "expression": "(o,k) => { o['emptyArray'].push('value'); return k; }"
}
```

**Result:**
```json
{
  "chats": {
    "messages": {
      "emptyArray": ["value"]
    }
  }
}
```

### Remove Action

**Source JSON:**
```json
{
  "obsoleteKey": "value",
  "anotherKey": "anotherValue"
}
```

**Action:**
```json
{
  "type": "remove",
  "property": "obsoleteKey"
}
```

**Result:**
```json
{
  "anotherKey": "anotherValue"
}
```

### Transform Action

**Source JSON:**
```json
{
  "numericKey": 5
}
```

**Action:**
```json
{
  "type": "update",
  "target": "numericKey",
  "exp": "(o,k) => return k*2"
}
```

**Result:**
```json
{
  "numericKey": 10
}
```

### Merge Keys

- can by made with update

**Source JSON:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Action:**
```json
{
    "type": "create",
    "target": "fullName",
    "value": "",
}
{
  "type": "update",
  "target": "fullName",
  "exp": "(o,k) => o['firstName'] + ' ' + o['lastName']"
}
{
    "type": "remove",
    "target": ["firstName", "lastName"]
}
```

**Result:**
```json
{
  "fullName": "JohnDoe"
}
```

### Trim Values

**Source JSON:**
```json
{
  "name": " John Doe "
}
```

**Action:**
```json
{
  "type": "update",
  "target": "name",
  "exp": "(o, k) => k.trim()"
}
```

**Result:**
```json
{
  "name": "John Doe"
}
```


Remember, `steps.json` must be a valid JSON array:
```json
[
  { /* action object */ },
  { /* action object */ }
]
```