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
import { IPV4_INT_SIZE, IPV6_INT_SIZE } from './constants.js';

/**
 * Which address family a value belongs to.
 *
 * @remarks
 * Almost everything here is family-specific — address width, mask table, record
 * size — so this is the argument that selects between the two. The values are the
 * strings `'ipv4'` and `'ipv6'`, so they survive `JSON.stringify` and can come
 * straight from configuration.
 *
 * {@link Networks} keeps one {@link NetworkList} per member of this enum rather
 * than mixing families in one list, because their record sizes differ.
 */
export enum NetworkType {
    /** IPv4 — 4-byte addresses, prefixes `/0` to `/32`. */
    IPV4 = 'ipv4',

    /** IPv6 — 16-byte addresses, prefixes `/0` to `/128`. */
    IPV6 = 'ipv6',
}

/**
 * The literal `"'ipv4' | 'ipv6'"`, for embedding a union of the
 * {@link NetworkType} values in an error message.
 *
 * @remarks
 * A string of TypeScript source, not a type — it exists so that a thrown message
 * can list the accepted values without a second place to update when the enum
 * changes.
 */
export const NETWORK_TYPE_ENUM = `'${NetworkType.IPV4}' | '${
    NetworkType.IPV6
}'`;

/**
 * How many bytes one address of the given family occupies.
 *
 * @param type - the address family to size
 * @returns 16 for {@link NetworkType.IPV6}, otherwise 4.
 *
 * @remarks
 * Anything that is not exactly `IPV6` is treated as IPv4, so an unrecognised
 * value silently sizes as IPv4 rather than throwing. Callers that need the input
 * validated should check it themselves.
 */
export function sizeOf(type: NetworkType): number {
    if (type === NetworkType.IPV6) {
        return IPV6_INT_SIZE;
    }

    return IPV4_INT_SIZE;
}
