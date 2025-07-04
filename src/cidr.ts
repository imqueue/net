/*!
 * I'm Queue Software Project
 * Copyright (C) 2025  imqueue.com <support@imqueue.com>
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
import { NetworkType, sizeOf } from './types';
import { getType, intToIp, ipToInt } from './ip-address';

// 0 - 32, 4-bytes integers, IPv4 masks
// pre-cached masks for better performance during conversions
export const IPV4_MASKS = [
    0x00000000n,
    0x80000000n,
    0xc0000000n,
    0xe0000000n,
    0xf0000000n,
    0xf8000000n,
    0xfc000000n,
    0xfe000000n,
    0xff000000n,
    0xff800000n,
    0xffc00000n,
    0xffe00000n,
    0xfff00000n,
    0xfff80000n,
    0xfffc0000n,
    0xfffe0000n,
    0xffff0000n,
    0xffff8000n,
    0xffffc000n,
    0xffffe000n,
    0xfffff000n,
    0xfffff800n,
    0xfffffc00n,
    0xfffffe00n,
    0xffffff00n,
    0xffffff80n,
    0xffffffc0n,
    0xffffffe0n,
    0xfffffff0n,
    0xfffffff8n,
    0xfffffffcn,
    0xfffffffen,
    0xffffffffn,
];

// 0 - 128, 16 bytes integers, IPv6 masks
// pre-cached masks for better performance during conversions
export const IPV6_MASKS = [
    0x00000000000000000000000000000000n,
    0x80000000000000000000000000000000n,
    0xc0000000000000000000000000000000n,
    0xe0000000000000000000000000000000n,
    0xf0000000000000000000000000000000n,
    0xf8000000000000000000000000000000n,
    0xfc000000000000000000000000000000n,
    0xfe000000000000000000000000000000n,
    0xff000000000000000000000000000000n,
    0xff800000000000000000000000000000n,
    0xffc00000000000000000000000000000n,
    0xffe00000000000000000000000000000n,
    0xfff00000000000000000000000000000n,
    0xfff80000000000000000000000000000n,
    0xfffc0000000000000000000000000000n,
    0xfffe0000000000000000000000000000n,
    0xffff0000000000000000000000000000n,
    0xffff8000000000000000000000000000n,
    0xffffc000000000000000000000000000n,
    0xffffe000000000000000000000000000n,
    0xfffff000000000000000000000000000n,
    0xfffff800000000000000000000000000n,
    0xfffffc00000000000000000000000000n,
    0xfffffe00000000000000000000000000n,
    0xffffff00000000000000000000000000n,
    0xffffff80000000000000000000000000n,
    0xffffffc0000000000000000000000000n,
    0xffffffe0000000000000000000000000n,
    0xfffffff0000000000000000000000000n,
    0xfffffff8000000000000000000000000n,
    0xfffffffc000000000000000000000000n,
    0xfffffffe000000000000000000000000n,
    0xffffffff000000000000000000000000n,
    0xffffffff800000000000000000000000n,
    0xffffffffc00000000000000000000000n,
    0xffffffffe00000000000000000000000n,
    0xfffffffff00000000000000000000000n,
    0xfffffffff80000000000000000000000n,
    0xfffffffffc0000000000000000000000n,
    0xfffffffffe0000000000000000000000n,
    0xffffffffff0000000000000000000000n,
    0xffffffffff8000000000000000000000n,
    0xffffffffffc000000000000000000000n,
    0xffffffffffe000000000000000000000n,
    0xfffffffffff000000000000000000000n,
    0xfffffffffff800000000000000000000n,
    0xfffffffffffc00000000000000000000n,
    0xfffffffffffe00000000000000000000n,
    0xffffffffffff00000000000000000000n,
    0xffffffffffff80000000000000000000n,
    0xffffffffffffc0000000000000000000n,
    0xffffffffffffe0000000000000000000n,
    0xfffffffffffff0000000000000000000n,
    0xfffffffffffff8000000000000000000n,
    0xfffffffffffffc000000000000000000n,
    0xfffffffffffffe000000000000000000n,
    0xffffffffffffff000000000000000000n,
    0xffffffffffffff800000000000000000n,
    0xffffffffffffffc00000000000000000n,
    0xffffffffffffffe00000000000000000n,
    0xfffffffffffffff00000000000000000n,
    0xfffffffffffffff80000000000000000n,
    0xfffffffffffffffc0000000000000000n,
    0xfffffffffffffffe0000000000000000n,
    0xffffffffffffffff0000000000000000n,
    0xffffffffffffffff8000000000000000n,
    0xffffffffffffffffc000000000000000n,
    0xffffffffffffffffe000000000000000n,
    0xfffffffffffffffff000000000000000n,
    0xfffffffffffffffff800000000000000n,
    0xfffffffffffffffffc00000000000000n,
    0xfffffffffffffffffe00000000000000n,
    0xffffffffffffffffff00000000000000n,
    0xffffffffffffffffff80000000000000n,
    0xffffffffffffffffffc0000000000000n,
    0xffffffffffffffffffe0000000000000n,
    0xfffffffffffffffffff0000000000000n,
    0xfffffffffffffffffff8000000000000n,
    0xfffffffffffffffffffc000000000000n,
    0xfffffffffffffffffffe000000000000n,
    0xffffffffffffffffffff000000000000n,
    0xffffffffffffffffffff800000000000n,
    0xffffffffffffffffffffc00000000000n,
    0xffffffffffffffffffffe00000000000n,
    0xfffffffffffffffffffff00000000000n,
    0xfffffffffffffffffffff80000000000n,
    0xfffffffffffffffffffffc0000000000n,
    0xfffffffffffffffffffffe0000000000n,
    0xffffffffffffffffffffff0000000000n,
    0xffffffffffffffffffffff8000000000n,
    0xffffffffffffffffffffffc000000000n,
    0xffffffffffffffffffffffe000000000n,
    0xfffffffffffffffffffffff000000000n,
    0xfffffffffffffffffffffff800000000n,
    0xfffffffffffffffffffffffc00000000n,
    0xfffffffffffffffffffffffe00000000n,
    0xffffffffffffffffffffffff00000000n,
    0xffffffffffffffffffffffff80000000n,
    0xffffffffffffffffffffffffc0000000n,
    0xffffffffffffffffffffffffe0000000n,
    0xfffffffffffffffffffffffff0000000n,
    0xfffffffffffffffffffffffff8000000n,
    0xfffffffffffffffffffffffffc000000n,
    0xfffffffffffffffffffffffffe000000n,
    0xffffffffffffffffffffffffff000000n,
    0xffffffffffffffffffffffffff800000n,
    0xffffffffffffffffffffffffffc00000n,
    0xffffffffffffffffffffffffffe00000n,
    0xfffffffffffffffffffffffffff00000n,
    0xfffffffffffffffffffffffffff80000n,
    0xfffffffffffffffffffffffffffc0000n,
    0xfffffffffffffffffffffffffffe0000n,
    0xffffffffffffffffffffffffffff0000n,
    0xffffffffffffffffffffffffffff8000n,
    0xffffffffffffffffffffffffffffc000n,
    0xffffffffffffffffffffffffffffe000n,
    0xfffffffffffffffffffffffffffff000n,
    0xfffffffffffffffffffffffffffff800n,
    0xfffffffffffffffffffffffffffffc00n,
    0xfffffffffffffffffffffffffffffe00n,
    0xffffffffffffffffffffffffffffff00n,
    0xffffffffffffffffffffffffffffff80n,
    0xffffffffffffffffffffffffffffffc0n,
    0xffffffffffffffffffffffffffffffe0n,
    0xfffffffffffffffffffffffffffffff0n,
    0xfffffffffffffffffffffffffffffff8n,
    0xfffffffffffffffffffffffffffffffcn,
    0xfffffffffffffffffffffffffffffffen,
    0xffffffffffffffffffffffffffffffffn,
];

/**
 * Converts given CIDR network record to range of integer addresses,
 * [min, max] tuple
 *
 * @param {string} cidr
 * @param {NetworkType} [type]
 * @return {[bigint, bigint]}
 */
export function cidrToRangeInt(
    cidr: string,
    type?: NetworkType,
): [bigint, bigint] {
    type = getType(cidr, type);

    const [start, mask] = cidr.split('/');
    const netMask = BigInt((type == NetworkType.IPV4 ? 32 : 128) - +mask);
    const minusOne = BigInt(-1);
    const startInt = ipToInt(start) & (minusOne << netMask);
    const endInt = BigInt(2) ** netMask + startInt + minusOne;

    return [startInt, endInt];
}

/**
 * Converts given CIDR network notation to range of addresses,
 * [min, max] tuple.
 *
 * @param {string} cidr
 * @param {NetworkType} [type]
 * @param {boolean} [canonical]
 * @return {[string, string]}
 */
export function cidrToRange(
    cidr: string,
    type?: NetworkType,
    canonical: boolean = false,
): [string, string] {
    type = getType(cidr, type);

    const [start, end] = cidrToRangeInt(cidr, type)
        .map(ip => intToIp(ip, type as NetworkType, canonical))
    ;

    return [start, end];
}

/**
 * Returns array of masks ascending order for a given network type.
 *
 * @param {NetworkType} type
 * @return {bigint[]}
 */
export function masksOf(type: NetworkType): bigint[] {
    if (type === NetworkType.IPV6) {
        return IPV6_MASKS;
    }

    return IPV4_MASKS;
}

function log2(n: bigint) {
    const one = BigInt(1);
    const two = BigInt(2);
    let count = 0;

    for (; n > one; count++) {
        n = n / two;
    }

    return count;
}

/**
 * Converts given network range represented by integer start, end addresses
 * to minimal list of CIDR network notations required to represent the range.
 *
 * @param {bigint} start
 * @param {bigint} end
 * @param {NetworkType} type
 * @param {boolean} [canonical]
 * @return {string[]}
 */
export function intRangeToCidr(
    start: bigint,
    end: bigint,
    type: NetworkType,
    canonical: boolean = false,
): string[] {
    const typeSize = sizeOf(type) * 8;
    const bigTypeSize = BigInt(typeSize);
    const typeMasks = masksOf(type);
    const pairs: string[] = [];
    const one = BigInt(1);
    const two = BigInt(2);

    while (end >= start ) {
        let maxSize = typeSize;

        while (maxSize > 0) {
            const mask = typeMasks[maxSize - 1];
            const maskedBase = start & mask;

            if (maskedBase != start) {
                break;
            }

            maxSize--;
        }

        const x = log2( end - start + one);
        const maxDiff = (typeSize - Math.floor( x ) );

        if (maxSize < maxDiff) {
            maxSize = maxDiff;
        }

        const ip = intToIp(start, type, canonical);

        pairs.push(ip + '/' + maxSize);

        start += two ** (bigTypeSize - BigInt(maxSize));
    }

    return pairs;
}

/**
 * Converts given network range represented start, end addresses
 * to minimal list of CIDR network notations required to represent the range.
 *
 * @param {string} start
 * @param {string} end
 * @param {NetworkType} type
 * @param {boolean} [canonical]
 * @return {string[]}
 */
export function rangeToCidr(
    start: string,
    end: string,
    type?: NetworkType,
    canonical: boolean = false,
): string[] {
    type = getType(start, type);

    return intRangeToCidr(
        ipToInt(start, type),
        ipToInt(end, type),
        type,
        canonical,
    );
}

