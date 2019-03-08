/**
 * @param {string} text
 */
export function parseJSON(text) {
	if (typeof text !== 'string') {
		return null
	}
	return JSON.parse(text.replace(/([^\"]+\"\:\s*)(\d{16,})(\,\s*\"[^\"]+|}$)/g, '$1"$2n"$3'), reviver)
}

export function stringifyJSON(value) {
	return JSON.stringify(value, replacer)
		.replace(/([^\"]+\"\:\s*)(?:\")(\d{16,})(?:n\")(\,\s*\"[^\"]+|}$)/g, '$1$2$3')
}

function reviver(_, v) {
	return typeof v === 'string' && /^\d{16,}n$/.test(v) ? BigInt(v.slice(0, -1)) : v
}

function replacer(_, v) {
	return typeof v === 'bigint' ? v.toString() + 'n' : v
}

export default {
	parse: parseJSON,
	stringify: stringifyJSON,
}
