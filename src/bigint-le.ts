/*!
 * I'm Queue Software Project
 * Copyright (C) 2026  imqueue.com <support@imqueue.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * If you want to use this code in a closed source (commercial) project, you can
 * purchase a proprietary commercial license. Please contact us at
 * <support@imqueue.com> to get commercial licensing options.
 */

/**
 * Native replacement for the bigint-buffer package (an abandoned addon
 * whose prebuilt bindings no longer load on modern Node versions):
 * little-endian conversions between bigints and buffers.
 */

/**
 * Serializes a non-negative bigint into a little-endian buffer of the
 * given byte width
 *
 * @param {bigint} value - value to serialize
 * @param {number} width - resulting buffer size in bytes
 * @return {Buffer}
 */
export function toBufferLE(value: bigint, width: number): Buffer {
    const hex = value.toString(16).padStart(width * 2, '0');

    return Buffer.from(hex, 'hex').reverse();
}

/**
 * Reads a little-endian buffer as a non-negative bigint
 *
 * @param {Buffer} buffer - buffer to read
 * @return {bigint}
 */
export function toBigIntLE(buffer: Buffer): bigint {
    // copy before reversing: callers pass views into shared list buffers
    const hex = Buffer.from(buffer).reverse().toString('hex');

    return hex.length ? BigInt(`0x${hex}`) : 0n;
}
