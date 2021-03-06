// utils
import {createReplacer} from './utils';

/**
 * @function stringify
 *
 * @description
 * strinigifer that handles circular values
 *
 * @param {any} value the value to stringify
 * @param {function} [replacer] a custom replacer function for stringifying standard values
 * @param {number} [indent] the number of spaces to indent the output by
 * @param {function} [circularReplacer] a custom replacer function for stringifying circular values
 * @returns {string} the stringified output
 */
export default function stringify(value, replacer, indent, circularReplacer) {
  return JSON.stringify(value, createReplacer(replacer, circularReplacer), indent);
}
