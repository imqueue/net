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
