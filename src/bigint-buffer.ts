/*
 * Safe local replacements for bigint-buffer utilities: toBigIntLE and toBufferLE
 * Implemented to avoid dependency on vulnerable bigint-buffer package.
 */

import { Buffer } from 'node:buffer';

/**
 * Reads a little-endian byte sequence as an unsigned `bigint`.
 *
 * @param buf - the bytes to read, least significant first
 * @returns The value they encode. An empty input gives `0n`.
 *
 * @remarks
 * Always unsigned — there is no sign bit and no length limit, so a 16-byte IPv6
 * address reads as a plain positive integer. That is what lets one comparison
 * path serve both families.
 *
 * Little-endian is the convention this package writes with
 * ({@link toBufferLE}), so the pair round-trips. Reading a big-endian buffer with
 * it returns a byte-reversed value rather than an error.
 */
export function toBigIntLE(buf: Buffer | Uint8Array): bigint {
    const bytes = buf instanceof Buffer ? buf : Buffer.from(buf);
    let result = 0n;

    for (let i = 0; i < bytes.length; i++) {
        result |= BigInt(bytes[i]) << (BigInt(i) * 8n);
    }

    return result;
}

/**
 * Writes an unsigned `bigint` as a little-endian buffer of an exact size.
 *
 * @param value - a non-negative value to encode
 * @param size - bytes in the resulting buffer; the result is always this long
 * @returns A new buffer of exactly `size` bytes, zero-padded at the high end.
 *
 * @throws RangeError if `size` is not a positive integer, if `value` is negative,
 * or if `value` needs more than `size` bytes. The size check happens after the
 * bytes are written, so it catches overflow rather than silently truncating.
 *
 * @remarks
 * The inverse of {@link toBigIntLE}. Fixed width is the point: a network record
 * holds two addresses at a known offset, so every address must occupy
 * {@link sizeOf} bytes whatever its magnitude.
 */
export function toBufferLE(value: bigint, size: number): Buffer {
    if (!Number.isInteger(size) || size <= 0) {
        throw new RangeError('size must be a positive integer');
    }
    if (value < 0n) {
        throw new RangeError('value must be a non-negative bigint');
    }

    const buf = Buffer.alloc(size);
    let v = value;

    for (let i = 0; i < size; i++) {
        buf[i] = Number(v & 0xffn);
        v >>= 8n;
    }

    if (v !== 0n) {
        throw new RangeError('value does not fit into the specified size');
    }

    return buf;
}
