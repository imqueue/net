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
 * start address. Two addresses of {@link sizeOf} bytes per record.
 *
 * @throws TypeError if a record's address is invalid or belongs to another family
 * than the first one.
 *
 * @throws RangeError if a record has no `/prefix` — see {@link cidrToRangeInt}.
 *
 * @remarks
 * Three things happen here that the caller can observe. Ranges are deduplicated,
 * so two records covering the same range yield one entry — note that this compares
 * ranges, not text, so `10.0.0.0/8` and `10.0.0.5/8` count as duplicates. They are
 * then sorted, which is the precondition {@link NetworkList} relies on for binary
 * search. And the family is taken from `networks[0]`, so an empty array reaches
 * {@link getType} as `undefined` and throws.
 *
 * Overlapping ranges are kept as they are rather than merged, so a list can hold
 * a network and a subnet of it. That costs a little space but never affects the
 * answer.
 */
export function toBinaryList(networks: string[], type?: NetworkType): Buffer {
    type = getType(networks[0], type);

    const buffers: Buffer[] = [];
    const ranges = networks
        .map(network => cidrToRangeInt(network, type))
        .filter(
            (range, i, self) =>
                self.findIndex(
                    ([start, end]) => start === range[0] && end === range[1],
                ) === i,
        );

    ranges.sort((a, b) =>
        // istanbul ignore next
        a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
    ); // ascending sort

    for (const range of ranges) {
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
