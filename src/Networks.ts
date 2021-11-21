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
import { NetworkList } from './NetworkList';
import { getType } from './ip-address';
import { NetworkType } from './types';

export interface NetworksIntRanges {
    [NetworkType.IPV4]: [bigint, bigint][];
    [NetworkType.IPV6]: [bigint, bigint][];
}

/**
 * Class networks
 * Is a meta-class on top of NetworkList allowing to manipulate of mixed
 * IPv4/IPv6 networks
 */
export class Networks {
    public readonly [NetworkType.IPV4]: NetworkList;
    public readonly [NetworkType.IPV6]: NetworkList;

    /**
     * Constructor.
     * It accepts as first argument an array of networks CIDR string records or
     * IPv4 binary buffer of network lists.
     * Second argument is optional
     *
     * @param {string[] | Buffer} networks - CIDR list of networks or IPv4
     *                                       list buffer
     * @param {Buffer} [networks6] - buffer of IPv6 networks (optional)
     */
    public constructor(networks: string[] | Buffer, networks6?: Buffer) {
        if (networks6) {
            if (Buffer.isBuffer(networks6)) {
                this[NetworkType.IPV6] = new NetworkList(
                    networks6,
                    NetworkType.IPV6,
                );
            } else {
                throw new TypeError(`Buffer is expected!`);
            }
        }

        if (Buffer.isBuffer(networks)) {
            this[NetworkType.IPV4] = new NetworkList(
                networks,
                NetworkType.IPV4,
            );
        } else {
            const v4: string[] = [];
            const v6: string[] = [];

            for (const network of networks) {
                switch (getType(network)) {
                    case NetworkType.IPV4: {
                        v4.push(network);
                        break;
                    }
                    case NetworkType.IPV6: {
                        v6.push(network);
                        break;
                    }
                }
            }

            if (v4.length) {
                this[NetworkType.IPV4] = new NetworkList(v4, NetworkType.IPV4);
            }

            if (v6.length) {
                const net = new NetworkList(v6, NetworkType.IPV6);

                if (this[NetworkType.IPV6]) {
                    const cidrList = this[NetworkType.IPV6].toArray().concat(
                        net.toArray(),
                    );
                    this[NetworkType.IPV6] = new NetworkList(
                        cidrList,
                        NetworkType.IPV6,
                    );
                } else {
                    this[NetworkType.IPV6] = net;
                }
            }
        }
    }

    /**
     * Checks if given ip address is in the list of known networks
     *
     * @param {string} ip
     * @return {boolean}
     */
    public includes(ip: string): boolean {
        switch (getType(ip)) {
            case NetworkType.IPV4:
                return (!!this[NetworkType.IPV4] &&
                    this[NetworkType.IPV4].includes(ip)
                );
            case NetworkType.IPV6:
                return (!!this[NetworkType.IPV6] &&
                    this[NetworkType.IPV6].includes(ip)
                );
        }
    }

    /**
     * Returns known networks big integer ranges definitions
     *
     * @return {NetworksIntRanges}
     */
    public toIntRanges(): NetworksIntRanges {
        return {
            [NetworkType.IPV4]: this[NetworkType.IPV4]
                ? this[NetworkType.IPV4].toIntArray()
                : [],
            [NetworkType.IPV6]: this[NetworkType.IPV6]
                ? this[NetworkType.IPV6].toIntArray()
                : [],
        };
    }

    /**
     * Returns known networks as list of CIDR records
     *
     * @param {boolean} canonical
     * @return {string[]}
     */
    public toArray(canonical: boolean = false): string[] {
        const v4arr = this[NetworkType.IPV4]
            ? this[NetworkType.IPV4].toArray(canonical)
            : [];
        const v6arr = this[NetworkType.IPV6]
            ? this[NetworkType.IPV6].toArray(canonical)
            : [];

        return v4arr.concat(v6arr);
    }

    /**
     * Converts this object to JSON-serializable value
     *
     * @return {string[]}
     */
    public toJSON() {
        return this.toArray();
    }
}
