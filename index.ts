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
 * Fast CIDR membership testing for IPv4 and IPv6, using sorted binary ranges
 * rather than per-network comparison.
 *
 * Build a {@link Networks} from a list of CIDR records and ask it whether an
 * address is in any of them — that is the whole API for most callers, and it is
 * what `@imqueue/http-protect` uses for its allow-list. {@link NetworkList} is the
 * single-family layer underneath, and the {@link cidrToRange} and
 * {@link ipToInt} helpers are exported for building something else on the same
 * primitives.
 *
 * @remarks
 * Each network is stored as a start/end address pair in a `Buffer`, sorted, and
 * matched by binary search, so lookup is logarithmic in the number of networks
 * instead of linear. Addresses are compared as `bigint`, which is what makes one
 * code path cover both a 4-byte and a 16-byte address.
 *
 * The two families never share a buffer, because an IPv6 record is 32 bytes
 * against IPv4's 8 — {@link Networks} holds one {@link NetworkList} per
 * {@link NetworkType} and dispatches on the address it is given.
 *
 * Every CIDR record needs an explicit prefix length. A bare address is rejected,
 * so a single host is `203.0.113.7/32` or `2001:db8::1/128`; passing
 * `203.0.113.7` throws while parsing. Anything that is not a valid record throws
 * rather than being skipped, so one bad entry fails the whole list — validate
 * with {@link isValid} first if the input is untrusted.
 *
 * @example
 * ```typescript
 * import { Networks } from '@imqueue/net';
 *
 * const allowed = new Networks(['10.0.0.0/8', '192.168.0.0/16', '2001:db8::/32']);
 *
 * allowed.includes('10.1.2.3');     // true
 * allowed.includes('8.8.8.8');      // false
 * allowed.includes('2001:db8::1');  // true
 * ```
 *
 * @example
 * ```typescript
 * import { isValid, Networks } from '@imqueue/net';
 *
 * // Untrusted input: check before constructing, because a bad record throws.
 * const records = input.filter(r => isValid(r.split('/')[0]));
 * const networks = new Networks(records);
 * ```
 *
 * @packageDocumentation
 */

export * from './src/index.js';
