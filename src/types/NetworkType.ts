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
import { IPV4_INT_SIZE, IPV6_INT_SIZE } from './constants';

export enum NetworkType {
    IPV4 = 'ipv4',
    IPV6 = 'ipv6',
}

export const NETWORK_TYPE_ENUM = `'${
    NetworkType.IPV4 }' | '${
    NetworkType.IPV6 }'`
;

export function sizeOf(type: NetworkType): number {
    if (type === NetworkType.IPV6) {
        return IPV6_INT_SIZE;
    }

    return IPV4_INT_SIZE;
}
