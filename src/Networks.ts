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
