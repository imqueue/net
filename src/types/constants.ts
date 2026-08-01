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
/**
 * Longest an IPv6 address can be as text: 39 characters, from eight groups of
 * four hex digits plus seven colons.
 *
 * @remarks
 * A bound for buffer sizing and validation, not a formatting rule — a compressed
 * address such as `::1` is far shorter, and this package's own output is
 * compressed. It does not cover the IPv4-mapped form
 * (`::ffff:255.255.255.255`, 45 characters), a scope-zone suffix, or a `/prefix`.
 */
export const IPV6_MAX_STR_LEN = 39;

/**
 * Longest an IPv4 address can be as text: 15 characters, from four three-digit
 * octets plus three dots.
 *
 * @remarks
 * Excludes any `/prefix`, so a CIDR record needs up to 18. Note the lower-case
 * `v`, which is inconsistent with the other constants here but is the published
 * name.
 */
export const IPv4_MAX_STR_LEN = 15;

/**
 * Bytes in a binary IPv4 address: 4.
 *
 * @remarks
 * The unit every IPv4 buffer in this package is measured in — see
 * {@link sizeOf}, which selects between this and {@link IPV6_INT_SIZE} by
 * {@link NetworkType}.
 */
export const IPV4_INT_SIZE = 4;

/**
 * Bytes in a binary IPv6 address: 16.
 *
 * @remarks
 * The IPv6 counterpart of {@link IPV4_INT_SIZE}. Because a network record stores
 * a start and an end address, an IPv6 record occupies 32 bytes against IPv4's 8 —
 * which is why {@link NetworkList} keeps the two families in separate buffers
 * rather than one mixed list.
 */
export const IPV6_INT_SIZE = 16;
