/**
 * Returns a copy of the given object without keys that have an undefined value,
 * so those keys pass check() with Match.Maybe patterns
 * @param {object} obj - the object to clean
 * @returns {object} the cleaned object
 */
export const withoutUndefined = function(obj) {
	return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
};

/**
 * Escapes all special regex characters in a string so it can be
 * used safely inside a RegExp for lookups
 * @param {string} str - the string to escape
 * @returns {string} the escaped string
 */
export const escapeRegex = function(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
