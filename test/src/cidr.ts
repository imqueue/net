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
import { expect } from 'chai';
import { cidrToRange, NetworkType, rangeToCidr } from '../../src';

describe('cidr', () => {
    describe('cidrToRange()', () => {
        it('should convert given IPv4 CIDR record to [min, max] range', () => {
            expect(cidrToRange('192.168.1.15/24')).deep.equals([
                '192.168.1.0',
                '192.168.1.255',
            ]);
        });

        it('should convert given IPv6 CIDR record to [min, max] range', () => {
            expect(cidrToRange('2002::1234:abcd:ffff:c0a8:101/64'))
            .deep.equals([
                '2002::1234:0:0:0:0',
                '2002::1234:ffff:ffff:ffff:ffff',
            ]);
        });

        it('should always convert to [min, max] range tuple', () => {
            expect(cidrToRange('193.178.146.17/32')).deep.equals([
                '193.178.146.17',
                '193.178.146.17',
            ]);

            expect(cidrToRange('2002::1234:abcd:ffff:c0a8:101/128'))
            .deep.equals([
                '2002::1234:abcd:ffff:c0a8:101',
                '2002::1234:abcd:ffff:c0a8:101',
            ]);
        });

        it('should return canonical form if asked', () => {
            expect(cidrToRange(
                '2002::1234:abcd:ffff:c0a8:101/64',
                NetworkType.IPV6,
                true,
            )).deep.equals([
                '2002:0000:0000:1234:0000:0000:0000:0000',
                '2002:0000:0000:1234:ffff:ffff:ffff:ffff',
            ]);
        });
    });

    describe('rangeToCidr()', () => {
        it('should convert given IPv4 (start, end) range to CIDR', () => {
            expect(rangeToCidr(
                '192.168.1.0',
                '192.168.1.255',
            )).deep.equals(['192.168.1.0/24']);
        });

        it('should convert given IPv6 (start, end) range to CIDR', () => {
            expect(rangeToCidr(
                '2002:0000:0000:1234:0000:0000:0000:0000',
                '2002:0000:0000:1234:ffff:ffff:ffff:ffff',
            )).deep.equals(['2002::1234:0:0:0:0/64']);
        });

        it('should support IPv6 canonical form', () => {
            expect(rangeToCidr(
                '2002::1234:0:0:0:0',
                '2002::1234:ffff:ffff:ffff:ffff',
                NetworkType.IPV6,
                true,
            )).deep.equals(['2002:0000:0000:1234:0000:0000:0000:0000/64']);
        });
    });
});
