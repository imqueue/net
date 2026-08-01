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
import { NetworkList } from './NetworkList.js';
import { getType } from './ip-address.js';
import { NetworkType } from './types/index.js';

/**
 * Integer address ranges grouped by family, as returned by
 * {@link Networks.toIntRanges}.
 */
export interface NetworksIntRanges {
    /** IPv4 ranges, ascending by start address. Empty if the set has no IPv4. */
    [NetworkType.IPV4]: [bigint, bigint][];

    /** IPv6 ranges, ascending by start address. Empty if the set has no IPv6. */
    [NetworkType.IPV6]: [bigint, bigint][];
}

/**
 * A CIDR membership set covering both address families — the entry point for most
 * callers.
 *
 * @remarks
 * Give it a mixed list of CIDR records and it sorts them into one
 * {@link NetworkList} per family, then dispatches each lookup to the list matching
 * the address it is asked about. That indirection exists because the two families
 * cannot share a buffer: an IPv6 record is 32 bytes against IPv4's 8.
 *
 * Lookups are O(log n) within a family. Instances are immutable, so extending a set
 * means constructing a new one.
 *
 * A family with no networks is left unset rather than empty, and
 * {@link Networks.includes} answers `false` for it — so a v4-only set safely
 * answers questions about IPv6 addresses.
 *
 * @example
 * ```typescript
 * const allowed = new Networks(['10.0.0.0/8', '2001:db8::/32']);
 *
 * allowed.includes('10.1.2.3');     // true
 * allowed.includes('2001:db8::1');  // true
 * allowed.includes('8.8.8.8');      // false
 * ```
 */
export class Networks {
    /**
     * The IPv4 networks, as a {@link NetworkList} — reachable as `.ipv4`.
     *
     * @remarks
     * Left unset when the set has no IPv4 networks, despite the non-null assertion
     * in its declaration, so check it before use. {@link Networks.includes} already
     * does. Its {@link NetworkList.networks} buffer is what the constructor's first
     * argument accepts back.
     */
    public readonly [NetworkType.IPV4]!: NetworkList;

    /**
     * The IPv6 networks, as a {@link NetworkList} — reachable as `.ipv6`.
     *
     * @remarks
     * Unset when the set has no IPv6 networks, exactly as with
     * {@link Networks.ipv4}. Its buffer goes back in through the constructor's
     * `networks6` argument.
     */
    public readonly [NetworkType.IPV6]!: NetworkList;

    /**
     * Builds a set from CIDR records of either family, or from previously packed
     * buffers.
     *
     * @param networks - a mixed array of CIDR records, each with an explicit
     * `/prefix`; or a packed IPv4 buffer, in which case IPv6 must come via
     * `networks6`
     * @param networks6 - a packed IPv6 buffer. Usable alongside either form of
     * `networks`.
     *
     * @throws TypeError if `networks6` is given but is not a Buffer, if any CIDR
     * record's address is invalid, or if a buffer is empty or not a whole number of
     * records.
     *
     * @throws RangeError if a CIDR record has no `/prefix` — a bare address is
     * rejected, so a single host is `10.0.0.1/32` or `2001:db8::1/128`.
     *
     * @remarks
     * The array form is the usual one, and it does the sorting for you: records are
     * split by family, so the order you list them in does not matter. The buffer
     * form is for restoring a set you packed earlier and reads `networks` as IPv4
     * only — an IPv6 buffer passed as the first argument would be misread, so it
     * belongs in `networks6`.
     *
     * An empty array yields a set with neither family populated, which answers
     * `false` to everything rather than throwing.
     *
     * @example
     * ```typescript
     * // From records, mixed families in any order
     * const a = new Networks(['2001:db8::/32', '10.0.0.0/8']);
     *
     * // Restored from packed buffers
     * const b = new Networks(a.ipv4.networks, a.ipv6.networks);
     * ```
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
                    const cidrList = this[NetworkType.IPV6]
                        .toArray()
                        .concat(net.toArray());
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
     * Whether an address falls inside any network in this set.
     *
     * @param ip - a bare address of either family, with no `/prefix`
     * @returns `true` if some network contains it.
     *
     * @throws TypeError if `ip` is not a valid address. An empty string throws
     * rather than returning `false`, so screen untrusted input with
     * {@link isValid} first — this is the call `@imqueue/http-protect` guards for
     * that reason.
     *
     * @remarks
     * Dispatches on the address's own family and asks only that list, so an IPv6
     * lookup costs nothing on a v4-only set. A family this set has no networks for
     * answers `false`.
     */
    public includes(ip: string): boolean {
        switch (getType(ip)) {
            case NetworkType.IPV4:
                return (
                    !!this[NetworkType.IPV4] &&
                    this[NetworkType.IPV4].includes(ip)
                );
            case NetworkType.IPV6:
                return (
                    !!this[NetworkType.IPV6] &&
                    this[NetworkType.IPV6].includes(ip)
                );
        }
    }

    /**
     * Every stored range as integer pairs, grouped by family.
     *
     * @returns An object with an `ipv4` and an `ipv6` array; a family with no
     * networks gives an empty array rather than being absent.
     *
     * @remarks
     * Decodes both buffers on every call, so treat it as an export path rather than
     * something to use per lookup.
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
     * Every stored network as CIDR records, IPv4 first.
     *
     * @param canonical - for IPv6, render the expanded form rather than the
     * compressed one
     * @returns One flat array covering both families, IPv4 records followed by IPv6.
     *
     * @defaultValue `canonical` defaults to `false`
     *
     * @remarks
     * The result is a valid constructor argument, which makes this the readable way
     * to round-trip a set. Not necessarily the records you built it from, though:
     * each range is re-expressed as its minimal cover, so duplicates are gone and a
     * range spanning several prefixes returns as several records. Addresses covered
     * are identical either way.
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
     * The CIDR array, so `JSON.stringify` on this object yields the network set.
     *
     * @returns The same value as {@link Networks.toArray} with no arguments.
     *
     * @remarks
     * The output can go straight back into the constructor, so
     * `JSON.parse`/`new Networks` round-trips. Note that this flattens both families
     * into one array — which is fine, because the constructor sorts them out again
     * by inspecting each record.
     */
    public toJSON() {
        return this.toArray();
    }
}
