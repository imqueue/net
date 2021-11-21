/*!
 * Copyright (c) 2018, imqueue.com <support@imqueue.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */
import { NetworkType, sizeOf } from './types';
import { getType } from './ip-address';
import { cidrToRangeInt, intRangeToCidr } from './cidr';
import { toBigIntLE, toBufferLE } from 'bigint-buffer';

/**
 * Converts given array of CIDR networks to binary format, where all networks
 * represented by min/max integer addresses sorted in ascending order.
 *
 * @param {string[]} networks
 * @param {NetworkType} [type]
 * @return {Buffer}
 */
export function toBinaryList(networks: string[], type?: NetworkType): Buffer {
    type = getType(networks[0], type);

    const buffers: Buffer[] = [];
    const ranges = networks.map(network => cidrToRangeInt(network, type))
    .filter((range, i, self) =>
        self.findIndex(([start, end]) =>
            start === range[0] && end === range[1],
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
 * Converts given binary network list to an array of integer min/max addresses
 * tuples.
 *
 * @param {Buffer} list
 * @param {NetworkType} type
 * @return {[bigint, bigint][]}
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
 * Converts given binary list to an array of CIDR string records.
 *
 * @param {Buffer} list
 * @param {NetworkType} type
 * @param {boolean} canonical
 * @return {string[]}
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
