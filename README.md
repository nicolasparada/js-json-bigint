# JSON BigInt

JavaScript library that allows encoding JSON with BigInt support.

JavaScript doesn't work with numbers too big. If you are working with 64-bit integers in your server, this library got you covered.

No dependencies. 443 bytes.

## Example

```js
import JSONBigInt from 'https://unpkg.com/@nicolasparada/json-bigint@0.4.0/json-bigint.js'

const input = '{"big":9223372036854775807,"small":123}'
console.log('input:', input)

const r1 = JSON.parse(input)
console.group('built-in JSON')
console.log('parsed:', r1)
console.log('stringified:', JSON.stringify(r1))
console.groupEnd()

const r2 = JSONBigInt.parse(input)
console.group('JSONBigInt')
console.log('parsed:', r2)
console.log('stringified:', JSONBigInt.stringify(r2))
console.groupEnd()
```

```
input: {"big":9223372036854775807,"small":123}

built-in JSON
    parsed: { big: 9223372036854776000, small: 123 }
    stringified: {"big":9223372036854776000,"small":123}

JSONBigInt
    parsed: { big: 9223372036854775807n, small: 123 }
    stringified: {"big":9223372036854775807,"small":123}
```
