import JSONBigInt from './json-bigint.js'

const input = '{"big":9223372036854775807,"small":123}'

const parsed = JSONBigInt.parse(input)
console.assert(parsed.small.toString() === '123', 'string from small int')
console.assert(parsed.big.toString() === '9223372036854775807', 'string from big int')
console.assert(typeof parsed.big === 'bigint', 'instance of BigInt')

const output = JSONBigInt.stringify(parsed)
console.assert(output === input, 'same input')

console.log('all went ok')
