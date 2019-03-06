export const parse = (() => {
	const escapee = {
		'"': '"',
		'\\': '\\',
		'/': '/',
		b: '\b',
		f: '\f',
		n: '\n',
		r: '\r',
		t: '\t',
	}
	let at
	let ch
	let text

	const error = m => {
		throw {
			name: 'SyntaxError',
			message: m,
			at: at,
			text: text,
		}
	}

	const next = c => {
		if (c && c !== ch) {
			error("Expected '" + c + "' instead of '" + ch + "'")
		}

		ch = text.charAt(at)
		at += 1
		return ch
	}

	const number = () => {
		let value
		let string = ''
		if (ch === '-') {
			string = '-'
			next('-')
		}
		while (ch >= '0' && ch <= '9') {
			string += ch
			next()
		}
		if (ch === '.') {
			string += '.'
			while (next() && ch >= '0' && ch <= '9') {
				string += ch
			}
		}
		if (ch === 'e' || ch === 'E') {
			string += ch
			next()
			if (ch === '-' || ch === '+') {
				string += ch
				next()
			}
			while (ch >= '0' && ch <= '9') {
				string += ch
				next()
			}
		}
		value = +string
		if (!isFinite(value)) {
			error('Bad number')
		}

		return Number.isSafeInteger(value) ? value : BigInt(string)
	}

	const string = () => {
		let hex
		let i
		let value = ''
		let uffff

		if (ch !== '"') {
			error('Bad string')
		}

		while (next()) {
			if (ch === '"') {
				next()
				return value
			}

			if (ch !== '\\') {
				value += ch
				continue
			}

			next()
			if (ch === 'u') {
				uffff = 0
				for (i = 0; i < 4; i += 1) {
					hex = parseInt(next(), 16)
					if (!isFinite(hex)) {
						break
					}

					uffff = uffff * 16 + hex
				}
				value += String.fromCharCode(uffff)
			} else if (typeof escapee[ch] === 'string') {
				value += escapee[ch]
			}
			break
		}
	}

	const white = () => {
		while (ch && ch <= ' ') {
			next()
		}
	}

	const word = function() {
		switch (ch) {
			case 't':
				next('t')
				next('r')
				next('u')
				next('e')
				return true
			case 'f':
				next('f')
				next('a')
				next('l')
				next('s')
				next('e')
				return false
			case 'n':
				next('n')
				next('u')
				next('l')
				next('l')
				return null
		}
		error("Unexpected '" + ch + "'")
	}

	const array = () => {
		const arr = []

		if (ch !== '[') {
			error('Bad array')
		}

		next('[')
		white()
		if (ch === ']') {
			next(']')
			return arr
		}

		while (ch) {
			arr.push(value())
			white()
			if (ch === ']') {
				next(']')
				return arr
			}

			next(',')
			white()
		}
	}

	const object = () => {
		const obj = {}
		let key

		if (ch !== '{') {
			error('Bad object')
		}

		next('{')
		white()
		if (ch === '}') {
			next('}')
			return obj
		}

		while (ch) {
			key = string()
			white()
			next(':')
			if (Object.hasOwnProperty.call(obj, key)) {
				error("Duplicate key '" + key + "'")
			}

			obj[key] = value()
			white()
			if (ch === '}') {
				next('}')
				return obj
			}

			next(',')
			white()
		}
	}

	const value = () => {
		white()
		switch (ch) {
			case '{':
				return object()
			case '[':
				return array()
			case '"':
				return string()
			case '-':
				return number()
			default:
				return ch >= '0' && ch <= '9' ? number() : word()
		}
	}

	/**
	 * @param {string} source
	 * @param {function=} reviver
	 */
	const parseFn = (source, reviver = undefined) => {
		let result

		text = source
		at = 0
		ch = ' '
		result = value()
		white()
		if (ch) {
			error('Syntax error')
		}

		return typeof reviver === 'function'
			? (function walk(holder, key) {
					const val = holder[key]
					let k
					let v
					if (val && typeof val === 'object') {
						for (k in val) {
							if (!Object.prototype.hasOwnProperty.call(val, k)) {
								continue
							}

							v = walk(val, k)
							if (v === undefined) {
								delete val[k]
								continue
							}

							val[k] = v
						}
					}
					return reviver.call(holder, key, val)
			  })({ '': result }, '')
			: result
	}

	return parseFn
})()

export const stringify = (() => {
	const rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g

	let gap
	let indent
	let meta
	let rep

	const quote = string => {
		rx_escapable.lastIndex = 0
		return rx_escapable.test(string)
			? '"' +
					string.replace(rx_escapable, a => {
						const c = meta[a]
						return typeof c === 'string'
							? c
							: '\\u' +
									(
										'0000' + a.charCodeAt(0).toString(16)
									).slice(-4)
					}) +
					'"'
			: '"' + string + '"'
	}

	const str = (key, holder) => {
		let i
		let k
		let v
		let length
		let mind = gap
		let partial
		let value = holder[key]

		if (
			value &&
			typeof value === 'object' &&
			typeof value.toJSON === 'function'
		) {
			value = value.toJSON(key)
		}

		if (typeof rep === 'function') {
			value = rep.call(holder, key, value)
		}

		switch (typeof value) {
			case 'string':
				return quote(value)
			case 'bigint':
				return value.toString()
			case 'number':
				return isFinite(value) ? String(value) : 'null'
			case 'boolean':
				return String(value)
			case 'object':
				if (!value) {
					return 'null'
				}

				gap += indent
				partial = []
				if (Array.isArray(value)) {
					length = value.length
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null'
					}
					v =
						partial.length === 0
							? '[]'
							: gap
							? '[\n' +
							  gap +
							  partial.join(',\n' + gap) +
							  '\n' +
							  mind +
							  ']'
							: '[' + partial.join(',') + ']'
					gap = mind
					return v
				}

				if (rep && typeof rep === 'object') {
					length = rep.length
					for (i = 0; i < length; i += 1) {
						if (typeof rep[i] !== 'string') {
							continue
						}

						k = rep[i]
						v = str(k, value)
						if (!v) {
							continue
						}

						partial.push(quote(k) + (gap ? ': ' : ':') + v)
					}
				} else {
					for (k in value) {
						if (!Object.prototype.hasOwnProperty.call(value, k)) {
							continue
						}

						v = str(k, value)
						if (!v) {
							continue
						}

						partial.push(quote(k) + (gap ? ': ' : ':') + v)
					}
				}

				v =
					partial.length === 0
						? '{}'
						: gap
						? '{\n' +
						  gap +
						  partial.join(',\n' + gap) +
						  '\n' +
						  mind +
						  '}'
						: '{' + partial.join(',') + '}'
				gap = mind
				return v
		}
	}

	meta = {
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"': '\\"',
		'\\': '\\\\',
	}

	/**
	 * @param {*} value
	 * @param {function=} replacer
	 * @param {number|string=} space
	 */
	const stringifyFn = (value, replacer = undefined, space = undefined) => {
		let i
		gap = ''
		indent = ''

		if (typeof space === 'number') {
			for (i = 0; i < space; i += 1) {
				indent += ' '
			}
		} else if (typeof space === 'string') {
			indent = space
		}

		rep = replacer
		if (
			replacer &&
			typeof replacer !== 'function' &&
			(typeof replacer !== 'object' ||
				// @ts-ignore
				typeof replacer.length !== 'number')
		) {
			throw new Error('JSON.stringify')
		}

		return str('', { '': value })
	}

	return stringifyFn
})()

export default {
	parse,
	stringify,
}
