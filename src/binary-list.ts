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
import { Buffer } from 'node:buffer';
import { NetworkType, sizeOf } from './types/index.js';
import { getType } from './ip-address.js';
import { cidrToRangeInt, intRangeToCidr } from './cidr.js';
import { toBigIntLE, toBufferLE } from './bigint-buffer.js';

/**
 * Packs CIDR records into the sorted binary form that lookups binary-search over.
 *
 * @param networks - CIDR records, each needing an explicit `/prefix`
 * @param type - the family, if known; omit to have it detected from the first
 * record
 * @returns A buffer of `[start, end]` address pairs, little-endian, ascending by
 * start address and pairwise disjoint. Two addresses of {@link sizeOf} bytes per
 * record.
 *
 * @throws TypeError if a record's address is invalid or belongs to another family
 * than the first one.
 *
 * @throws RangeError if a record has no `/prefix` — see {@link cidrToRangeInt}.
 *
 * @remarks
 * Three things happen here that the caller can observe. Ranges are sorted by start
 * address, which is the precondition {@link NetworkList} relies on for binary
 * search. Overlapping ranges are then coalesced into a single record spanning both
 * — note that this compares ranges, not text, so `10.0.0.0/8` and `10.0.0.5/8`
 * collapse into one record, and so do a network and a subnet of it, such as
 * `10.0.0.0/8` and `10.1.0.0/16`, which come back as just the supernet. And the
 * family is taken from `networks[0]`, so an empty array reaches {@link getType} as
 * `undefined` and throws.
 *
 * Coalescing is what makes the result searchable, not merely smaller: binary search
 * over ranges is only sound when the ranges are disjoint. Left overlapping, a probe
 * that lands on a subnet nested inside an earlier supernet and finds the target
 * above that subnet's end moves right, and never revisits the supernet sitting at a
 * lower index — so an address the list does cover answers `false`.
 *
 * Only overlap is merged, never mere adjacency: `11.0.0.0/8` and `12.0.0.0/8` abut
 * but stay two records. That is deliberate. The union of two adjacent prefixes need
 * not be a prefix itself, and {@link NetworkList} rejects a buffer holding a range
 * that does not re-expand to one record, so merging adjacency would break the
 * buffer round trip for a space saving that correctness does not need.
 *
 * The result therefore holds at most as many records as it was given, and fewer
 * whenever the input overlaps.
 */
export function toBinaryList(networks: string[], type?: NetworkType): Buffer {
    type = getType(networks[0], type);

    const buffers: Buffer[] = [];
    const ranges = networks.map(network => cidrToRangeInt(network, type));

    ranges.sort((a, b) =>
        // istanbul ignore next
        a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
    ); // ascending sort

    // Coalesce overlaps, which subsumes exact duplicates. Sorted by start, a
    // range overlaps the accumulated one exactly when it begins at or before
    // that one's end; extending by the larger end keeps a nested subnet from
    // shrinking the supernet it sits inside.
    const disjoint: [bigint, bigint][] = [];

    for (const [start, end] of ranges) {
        const last = disjoint[disjoint.length - 1];

        if (last && start <= last[1]) {
            if (end > last[1]) {
                last[1] = end;
            }
        } else {
            disjoint.push([start, end]);
        }
    }

    for (const range of disjoint) {
        for (const address of range) {
            buffers.push(toBufferLE(address, sizeOf(type)));
        }
    }

    return Buffer.concat(buffers);
}

/**
 * Unpacks a binary list back into integer address ranges.
 *
 * @param list - a buffer produced by {@link toBinaryList}
 * @param type - which family the buffer holds; the bytes do not say
 * @returns One `[start, end]` tuple per record, in stored order — which is
 * ascending, since {@link toBinaryList} sorted them.
 *
 * @remarks
 * Reads fixed-width records, so `type` must match what was written: unpacking an
 * IPv4 buffer as IPv6 does not fail, it silently reinterprets four 4-byte
 * addresses as one 16-byte pair. A trailing partial record is read as though the
 * missing bytes were zero rather than rejected.
 */
export function toIntArray(
    list: Buffer,
    type: NetworkType,
): [bigint, bigint][] {
    const addressSize = sizeOf(type);
    const recordSize = addressSize * 2;
    const strList: [bigint, bigint][] = [];

    for (let i = 0; i < list.byteLength; i += recordSize) {
        const start = toBigIntLE(list.slice(i, i + addressSize));
        const end = toBigIntLE(list.slice(i + addressSize, i + recordSize));

        strList.push([start, end]);
    }

    return strList;
}

/**
 * Unpacks a binary list back into CIDR text.
 *
 * @param list - a buffer produced by {@link toBinaryList}
 * @param type - which family the buffer holds
 * @param canonical - for IPv6, render expanded rather than compressed addresses
 * @returns CIDR records covering the same addresses as the buffer.
 *
 * @defaultValue `canonical` defaults to `false`
 *
 * @remarks
 * Not necessarily the records you packed. Each stored range is re-expressed as its
 * minimal cover by {@link intRangeToCidr}, so a range that came from one record
 * comes back as one record, but a range that does not align to a single prefix
 * comes back as several. Round-tripping is therefore lossless in addresses covered
 * and not in record count.
 */
export function toStringArray(
    list: Buffer,
    type: NetworkType,
    canonical: boolean = false,
): string[] {
    const intArray = toIntArray(list, type);
    const cidrArray: string[] = [];

    for (const [start, end] of intArray) {
        cidrArray.push(...intRangeToCidr(start, end, type, canonical));
    }

    return cidrArray;
}
