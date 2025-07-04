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
import { getType, ipToInt } from './ip-address';
import { toBinaryList, toIntArray, toStringArray } from './binary-list';
import { toBigIntLE } from 'bigint-buffer';

/**
 * Class NetworkList
 *
 * Implements fast and reliable binary network lists, supporting both
 * IPv4 & IPv6 protocols.
 *
 * Network list data stored in a binary format and this class provides
 * binary search lookup functionality through the networks data, making required
 * network address lookups very quick. Complexity by time is O(log n) in a worst
 * case.
 *
 * Binary format guarantee small memory usage. For IPv4 network lists it
 * will use 8 bytes per network, for IPv6 it will use 32 bytes per network to
 * store. Memory consuming is linear correspondingly to the number of networks
 * stored in the list.
 *
 * It does not allow to mix different types of networks, so if you need
 * mixed list you may need to utilize 2 separate lists for IPv4 & Ipv6 networks.
 * In general such split is a good solution as long as particular address
 * lookup occurs only within a certain network type during runtime.
 *
 * Objects of this type also supports JSON serialization, if it is needed for
 * some reason.
 */
export class NetworkList {
    public readonly networks: Buffer;
    public readonly type: NetworkType;
    public readonly bytesLength: number;
    public readonly length: number;
    public readonly recordSize: number;
    public readonly addressSize: number;

    /**
     * Constructor.
     * Instantiates NetworkList object.
     *
     * @param {string[] | Buffer} networks
     * @param {NetworkType} type
     */
    public constructor(
        networks: string[] | Buffer,
        type?: NetworkType,
    ) {
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
        this.length = networks.length;
        this.addressSize = sizeOf(type as NetworkType);
        this.recordSize = this.addressSize * 2;
    }

    /**
     * Checks if a given network address is a part of this network list.
     *
     * @param {string} ip
     * @return {boolean}
     */
    public includes(ip: string) {
        const type = getType(ip);

        if (type !== this.type) {
            return false;
        }

        const intIp = ipToInt(ip, type);

        // binary search
        let start = 0;
        let end = this.length;

        while (start <= end) {
            let mid = Math.floor((start + end) / 2);
            const offset = mid * this.recordSize;
            const record = this.networks.slice(
                offset,
                offset + this.recordSize,
            );
            const startIp = toBigIntLE(record.slice(
                0,
                this.addressSize,
            ));
            const endIp = toBigIntLE(record.slice(
                this.addressSize,
                this.recordSize,
            ));

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
        return !!type && Buffer.isBuffer(buf) && buf.byteLength > 0 &&
            toIntArray(buf, type).length === toStringArray(buf, type).length
        ;
    }

    /**
     * Converts this network list representation to an array of integer
     * ranges of network addresses.
     *
     * @return {[bigint, bigint][]}
     */
    public toIntArray() {
        return toIntArray(this.networks, this.type as NetworkType);
    }

    /**
     * Converts this network list representation to an array of CIDR records.
     * If canonical passed as true - will present IPv6 addresses in full
     * canonical unpacked form.
     *
     * @param {boolean} [canonical]
     * @return {string[]}
     */
    public toArray(canonical: boolean = false) {
        return toStringArray(
            this.networks,
            this.type as NetworkType,
            canonical,
        );
    }

    /**
     * Implements JSON serializable value representing this network list.
     * Actually it refers to this.toArray() implementation.
     *
     * @return {string[]}
     */
    public toJSON() {
        return this.toArray();
    }
}
