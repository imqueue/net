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
import { getType, ipToInt } from './ip-address.js';
import { toBinaryList, toIntArray, toStringArray } from './binary-list.js';
import { toBigIntLE } from './bigint-buffer.js';

/**
 * A single-family list of networks, stored as sorted binary ranges and searched
 * in O(log n).
 *
 * @remarks
 * One family per list — the record widths differ, so IPv4 and IPv6 cannot share a
 * buffer. Reach for {@link Networks} unless you know the family up front; it holds
 * one of these per family and dispatches on the address it is given.
 *
 * Each network is one record of two addresses, start and end: 8 bytes for IPv4 and
 * 32 for IPv6, so memory is linear in the number of networks and independent of how
 * large each network is. Records are sorted at construction, which is what makes
 * the binary search in {@link NetworkList.includes} valid.
 *
 * Instances are effectively immutable — every field is `readonly` and there is no
 * method that adds or removes a network. Extending a list means constructing a new
 * one.
 *
 * `JSON.stringify` produces the CIDR array via {@link NetworkList.toJSON}, and that
 * array can be passed straight back to the constructor. Passing the raw
 * {@link NetworkList.networks} buffer works too, and is cheaper, but then the family
 * must be supplied explicitly because the bytes do not record it.
 */
export class NetworkList {
    /**
     * The packed records: `[start, end]` address pairs, little-endian, ascending.
     *
     * @remarks
     * Held by reference, not copied, so this is the cheap way to persist or clone a
     * list — hand it back to the constructor with {@link NetworkList."type"}. Do not
     * mutate it; every lookup reads it directly and assumes it is still sorted.
     */
    public readonly networks: Buffer;

    /** The address family every record in this list belongs to. */
    public readonly type: NetworkType;

    /** Size of {@link NetworkList.networks} in bytes. */
    public readonly bytesLength: number;

    /**
     * How many networks the list holds.
     *
     * @remarks
     * Records, not bytes and not input records — computed as
     * `bytesLength / recordSize`. It can be lower than the number of CIDR strings
     * the constructor was given, because records covering the same range are
     * deduplicated.
     */
    public readonly length: number;

    /**
     * Bytes per record: two addresses, so 8 for IPv4 and 32 for IPv6.
     */
    public readonly recordSize: number;

    /**
     * Bytes per address: 4 for IPv4, 16 for IPv6, per {@link sizeOf}.
     */
    public readonly addressSize: number;

    /**
     * Builds a list from CIDR records, or adopts an already-packed buffer.
     *
     * @param networks - CIDR records, each with an explicit `/prefix`; or a buffer
     * previously taken from {@link NetworkList.networks}
     * @param type - the address family. Optional only for the array form, where it
     * is detected from the first record; required for the buffer form, since the
     * bytes do not say.
     *
     * @throws TypeError if a record's address is invalid, if the records disagree
     * on family, or — for the buffer form — if `type` was omitted or the buffer is
     * empty or not a whole number of records.
     *
     * @throws RangeError if a record has no `/prefix`. A bare address is rejected,
     * so a single host is `10.0.0.1/32`.
     *
     * @remarks
     * The array form sorts and deduplicates by range, so the resulting
     * {@link NetworkList.length} may be lower than the number of records you
     * passed. The buffer form trusts the bytes and copies nothing — it keeps a
     * reference, so mutating that buffer afterwards corrupts the list.
     *
     * @example
     * ```typescript
     * const list = new NetworkList(['10.0.0.0/8', '192.168.0.0/16']);
     *
     * // Cheap round trip: keep the bytes, restate the family.
     * const same = new NetworkList(list.networks, list.type);
     * ```
     */
    public constructor(networks: string[] | Buffer, type?: NetworkType) {
        const invalidList = 'Given network list is invalid!';

        if (Array.isArray(networks)) {
            type = getType(networks[0], type);

            this.networks = toBinaryList(networks, type);
        } else if (NetworkList.isValidBuffer(networks, type)) {
            this.networks = networks;
        } else {
            throw new TypeError(invalidList);
        }

        this.type = type as NetworkType;
        this.bytesLength = this.networks.byteLength;
        this.addressSize = sizeOf(type as NetworkType);
        this.recordSize = this.addressSize * 2;
        // Derived from the stored bytes, never from the constructor argument. A
        // Buffer's `length` is its byte count, and an array's is its element
        // count before duplicate ranges are dropped — both overstate how many
        // records exist, and includes() uses this as its binary-search bound, so
        // an overstatement makes it probe past the end and miss real records.
        this.length = this.bytesLength / this.recordSize;
    }

    /**
     * Whether an address falls inside any network in this list.
     *
     * @param ip - a bare address, with no `/prefix`
     * @returns `true` if some network contains it.
     *
     * @throws TypeError if `ip` is not a valid address — an empty string included.
     * Screen untrusted input with {@link isValid} first.
     *
     * @remarks
     * Binary search over the sorted records, so O(log n) in the number of networks.
     * An address of the other family returns `false` rather than throwing, which is
     * what lets {@link Networks} ask both of its lists without checking first.
     *
     * Ranges are inclusive at both ends, so a `/32` matches exactly its one address.
     */
    public includes(ip: string) {
        const type = getType(ip);

        if (type !== this.type) {
            return false;
        }

        const intIp = ipToInt(ip, type);

        // binary search over record indices, so the last one is length - 1
        let start = 0;
        let end = this.length - 1;

        while (start <= end) {
            let mid = Math.floor((start + end) / 2);
            const offset = mid * this.recordSize;
            const record = this.networks.slice(
                offset,
                offset + this.recordSize,
            );
            const startIp = toBigIntLE(record.slice(0, this.addressSize));
            const endIp = toBigIntLE(
                record.slice(this.addressSize, this.recordSize),
            );

            if (startIp <= intIp && endIp >= intIp) {
                return true;
            }

            if (intIp < startIp) {
                end = mid - 1;
            } else {
                start = mid + 1;
            }
        }

        return false;
    }

    private static isValidBuffer(buf: any, type?: NetworkType): boolean {
        return (
            !!type &&
            Buffer.isBuffer(buf) &&
            buf.byteLength > 0 &&
            toIntArray(buf, type).length === toStringArray(buf, type).length
        );
    }

    /**
     * The stored ranges as integer pairs.
     *
     * @returns One `[start, end]` tuple per record, ascending by start address.
     *
     * @remarks
     * Decodes the whole buffer on every call rather than caching, so it is a
     * debugging and export aid, not something to call per lookup.
     */
    public toIntArray() {
        return toIntArray(this.networks, this.type as NetworkType);
    }

    /**
     * The stored networks as CIDR records.
     *
     * @param canonical - for IPv6, render the expanded form rather than the
     * compressed one
     * @returns CIDR records covering exactly the same addresses as this list.
     *
     * @defaultValue `canonical` defaults to `false`
     *
     * @remarks
     * Not necessarily the records you constructed with. Each stored range is
     * re-expressed as its minimal cover, so duplicates are gone and a range that
     * does not align to one prefix comes back as several records. The addresses
     * covered are identical; the record list need not be.
     */
    public toArray(canonical: boolean = false) {
        return toStringArray(
            this.networks,
            this.type as NetworkType,
            canonical,
        );
    }

    /**
     * The CIDR array, so `JSON.stringify` on this object yields the network list.
     *
     * @returns The same value as {@link NetworkList.toArray} with no arguments,
     * i.e. compressed IPv6.
     *
     * @remarks
     * The result can be handed straight back to the constructor, which makes
     * `JSON.parse`/`new NetworkList` a working round trip — lossless in addresses
     * covered, though not necessarily in record count.
     */
    public toJSON() {
        return this.toArray();
    }
}
