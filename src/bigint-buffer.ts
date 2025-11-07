/*
 * Safe local replacements for bigint-buffer utilities: toBigIntLE and toBufferLE
 * Implemented to avoid dependency on vulnerable bigint-buffer package.
 */

/**
 * Converts a little-endian buffer to a bigint value.
 *
 * @param {Buffer | Uint8Array} buf
 * @return {bigint}
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
 * Converts a bigint value to a little-endian buffer of a given size.
 * Throws if the value does not fit into the requested size or is negative.
 *
 * @param {bigint} value
 * @param {number} size - number of bytes in the resulting buffer
 * @return {Buffer}
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
