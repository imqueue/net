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
import { NetworkType, sizeOf } from './types/index.js';
import { getType, intToIp, ipToInt } from './ip-address.js';

/**
 * The 33 IPv4 network masks, indexed by prefix length — `IPV4_MASKS[24]` is the
 * mask for a `/24`.
 *
 * @remarks
 * Precomputed rather than shifted per call, because a conversion does this on
 * every record in a list. Index 0 is `0n` (a `/0`, matching everything) and index
 * 32 is all ones (a single host), so the array is 33 entries and indexing it with
 * a prefix length needs no adjustment.
 *
 * Exported as a plain array, so it is mutable — treat it as read-only. Reach for
 * {@link masksOf} instead when the family is only known at run time.
 */
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

/**
 * The 129 IPv6 network masks, indexed by prefix length — `IPV6_MASKS[64]` is the
 * mask for a `/64`.
 *
 * @remarks
 * The IPv6 counterpart of {@link IPV4_MASKS}: index 0 is `0n` and index 128 is all
 * ones, giving 129 entries. Same caveat — a mutable exported array that should be
 * treated as read-only.
 */
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
 * Expands a CIDR record into the first and last address it covers, as integers.
 *
 * @param cidr - a network in `address/prefix` form, e.g. `10.0.0.0/8`
 * @param type - the family, if known; omit to have it detected from `cidr`
 * @returns A `[first, last]` tuple. Both ends are inclusive, so a `/32` returns
 * the same value twice.
 *
 * @throws TypeError if the address part is invalid or disagrees with `type`.
 *
 * @throws RangeError if there is no `/prefix`. A bare `10.0.0.1` makes the prefix
 * `undefined`, which reaches `BigInt(NaN)` — so the failure surfaces as
 * `Cannot convert NaN to a BigInt` rather than as a message about the record.
 * This is why every network given to {@link Networks} needs an explicit prefix
 * length, `/32` and `/128` included.
 *
 * @remarks
 * Host bits in the address are cleared rather than rejected, so `10.0.0.5/8` is
 * accepted and yields the same range as `10.0.0.0/8`. The prefix itself is not
 * bounds-checked: a value above the family width produces a negative shift and
 * throws from `BigInt`, and a negative one produces a nonsensical range.
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
 * Expands a CIDR record into the first and last address it covers, as text.
 *
 * @param cidr - a network in `address/prefix` form
 * @param type - the family, if known; omit to have it detected
 * @param canonical - for IPv6, render the expanded form instead of the compressed
 * one
 * @returns A `[first, last]` tuple of addresses, both ends inclusive.
 *
 * @defaultValue `canonical` defaults to `false`
 *
 * @throws TypeError or RangeError exactly as {@link cidrToRangeInt} does — this is
 * that function with {@link intToIp} applied to each end.
 *
 * @example
 * ```typescript
 * cidrToRange('10.0.0.0/8');        // ['10.0.0.0', '10.255.255.255']
 * cidrToRange('2001:db8::/32');     // ['2001:db8::', '2001:db8:ffff:...:ffff']
 * ```
 */
export function cidrToRange(
    cidr: string,
    type?: NetworkType,
    canonical: boolean = false,
): [string, string] {
    type = getType(cidr, type);

    const [start, end] = cidrToRangeInt(cidr, type).map(ip =>
        intToIp(ip, type as NetworkType, canonical),
    );

    return [start, end];
}

/**
 * The mask table for a family, indexable by prefix length.
 *
 * @param type - the address family
 * @returns {@link IPV6_MASKS} for IPv6, otherwise {@link IPV4_MASKS}.
 *
 * @remarks
 * Returns the shared array itself, not a copy, so mutating the result corrupts
 * every later conversion. Like {@link sizeOf}, anything that is not exactly
 * `IPV6` is treated as IPv4 rather than rejected.
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
 * Covers an integer address range with the fewest CIDR records that fit it
 * exactly.
 *
 * @param start - first address in the range, inclusive
 * @param end - last address in the range, inclusive
 * @param type - which family the two integers belong to
 * @param canonical - for IPv6, render expanded rather than compressed addresses
 * @returns The records covering exactly `[start, end]` — no more and no less.
 *
 * @defaultValue `canonical` defaults to `false`
 *
 * @remarks
 * The inverse of {@link cidrToRangeInt}, and not a one-to-one one: an arbitrary
 * range rarely aligns to a single prefix, so this splits it into the minimal set
 * that does. A range already on a prefix boundary comes back as one record.
 *
 * `type` is required here and cannot be inferred, for the same reason as in
 * {@link intToIp} — the integers alone do not say which family they are. The
 * range is not validated, so an `end` below `start` yields an empty list rather
 * than an error.
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

    while (end >= start) {
        let maxSize = typeSize;

        while (maxSize > 0) {
            const mask = typeMasks[maxSize - 1];
            const maskedBase = start & mask;

            if (maskedBase != start) {
                break;
            }

            maxSize--;
        }

        const x = log2(end - start + one);
        const maxDiff = typeSize - Math.floor(x);

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
 * Covers an address range with the fewest CIDR records that fit it exactly.
 *
 * @param start - first address in the range, inclusive
 * @param end - last address in the range, inclusive
 * @param type - the family, if known; omit to have it detected from `start`
 * @param canonical - for IPv6, render expanded rather than compressed addresses
 * @returns The records covering exactly `[start, end]`.
 *
 * @defaultValue `canonical` defaults to `false`
 *
 * @throws TypeError if either address is invalid, or if `type` disagrees with
 * `start`. Note that only `start` is checked against `type`, so a mismatched
 * `end` is converted as whatever family `start` established.
 *
 * @remarks
 * {@link intRangeToCidr} with both ends converted by {@link ipToInt} first — the
 * same minimal-cover behaviour, taking text instead of integers.
 *
 * @example
 * ```typescript
 * rangeToCidr('10.0.0.0', '10.0.0.255');  // ['10.0.0.0/24']
 * rangeToCidr('10.0.0.1', '10.0.0.2');    // ['10.0.0.1/32', '10.0.0.2/32']
 * ```
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
