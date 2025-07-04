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
import { Networks, NetworkType } from '../../src';
import { toBufferLE } from 'bigint-buffer';
import ipv4mask32 from '../data/ipv4-32.json';

describe('Networks', () => {
    it('should be a class', () => {
        expect(typeof Networks).equals('function');
    });

    describe('constructor()', () => {
        it('should allow mixed CIDR records', () => {
            expect(() => new Networks([
                '0.0.0.0/8',
                '10.0.0.0/8',
                '100.64.0.0/10',
                '127.0.0.0/8',
                '169.254.0.0/16',
                '172.16.0.0/12',
                '192.0.0.0/24',
                '192.88.99.0/24',
                '192.168.0.0/16',
                '198.18.0.0/15',
                '198.51.100.0/24',
                '203.0.113.0/24',
                '224.0.0.0/4',
                '233.252.0.0/24',
                '240.0.0.0/4',
                '255.255.255.255/32',
                '::/128',
                '::1/128',
                '::ffff:0:0/96',
                '::ffff:0:0:0/96',
                '64:ff9b::/96',
                '64:ff9b:1::/48',
                '100::/64',
                '2001:0000::/32',
                '2001:20::/28',
                '2001:db8::/32',
                '2002::/16',
                'fc00::/7',
                'fe80::/10',
                'ff00::/8',
            ])).to.not.throw(Error);
        });

        it('should not throw on buffers', () => {
            expect(() => new Networks(Buffer.concat([
                toBufferLE(170065920n, 4),
                toBufferLE(170131455n, 4),
                toBufferLE(218648576n, 4),
                toBufferLE(218648831n, 4)
            ]), Buffer.concat([
                toBufferLE(42535295865117307932921825928971026432n, 16),
                toBufferLE(85070591730234615865843651857942052863n, 16),
                toBufferLE(42540650421252671973913748003310534656n, 16),
                toBufferLE(42540812680529501187277139581320822783n, 16),
                toBufferLE(42545680458834463550006270408139997184n, 16),
                toBufferLE(42545680458834463568453014481849548799n, 16),
            ]))).to.not.throw(Error);
        });

        it('should not throw on CIDR list and buffer', () => {
            expect(() => new Networks([
                '203.0.113.0/24',
                '224.0.0.0/4',
                '233.252.0.0/24',
                '240.0.0.0/4',
                '255.255.255.255/32',
                '::/128',
                '::1/128',
                '::ffff:0:0/96',
                '::ffff:0:0:0/96',
            ], Buffer.concat([
                toBufferLE(42535295865117307932921825928971026432n, 16),
                toBufferLE(85070591730234615865843651857942052863n, 16),
                toBufferLE(42540650421252671973913748003310534656n, 16),
                toBufferLE(42540812680529501187277139581320822783n, 16),
                toBufferLE(42545680458834463550006270408139997184n, 16),
                toBufferLE(42545680458834463568453014481849548799n, 16),
            ]))).to.not.throw(Error);
        });

        it('should throw if second arg is not buffer', () => {
            expect(() => new Networks([
                '203.0.113.0/24',
                '224.0.0.0/4',
                '233.252.0.0/24',
                '240.0.0.0/4',
                '255.255.255.255/32',
                '::/128',
                '::1/128',
                '::ffff:0:0/96',
                '::ffff:0:0:0/96',
            ], [
                '::/128',
                '::1/128',
                '::ffff:0:0/96',
                '::ffff:0:0:0/96',
            ] as any)).to.throw(Error);
        });
    });

    describe('includes()', () => {
        let list: Networks;

        beforeEach(() => list = new Networks([
            '0.0.0.0/8',
            '10.0.0.0/8',
            '100.64.0.0/10',
            '127.0.0.0/8',
            '169.254.0.0/16',
            '172.16.0.0/12',
            '192.0.0.0/24',
            '192.88.99.0/24',
            '192.168.0.0/16',
            '198.18.0.0/15',
            '198.51.100.0/24',
            '203.0.113.0/24',
            '224.0.0.0/4',
            '233.252.0.0/24',
            '240.0.0.0/4',
            '255.255.255.255/32',
            '::/128',
            '::1/128',
            '::ffff:0:0/96',
            '::ffff:0:0:0/96',
            '64:ff9b::/96',
            '64:ff9b:1::/48',
            '100::/64',
            '2001:0000::/32',
            '2001:20::/28',
            '2001:db8::/32',
            '2002::/16',
            'fc00::/7',
            'fe80::/10',
            'ff00::/8',
        ]));
        it('should return true if given address in network list', () => {
            expect(list.includes('fc00::dead:beef')).to.be.true;
            expect(list.includes('172.16.1.1')).to.be.true;
        });

        it('should return false if given address not in network list', () => {
            expect(list.includes('dead::beef')).to.be.false;
            expect(list.includes('173.16.1.1')).to.be.false;
        });
    });

    describe('toJSON()', () => {
        it('should be JSON-serializable', () => {
            const list = new Networks(ipv4mask32.concat([
                '2000:0000:0000:0000:0000:0000:0000:0000/3',
                '2001:0800:0000:0000:0000:0000:0000:0000/21',
                '2002:0000:0000:1234:0000:0000:0000:0000/64',
            ]));

            expect(() => JSON.stringify(list)).not.to.throw(Error);
            expect(Array.isArray(list.toJSON())).to.be.true;
            expect(list.toJSON()[0]).equals('34.66.25.221/32');
            expect(list.toJSON()[
                list[NetworkType.IPV4].length + list[NetworkType.IPV6].length -1
            ]).equals('2002::1234:0:0:0:0/64');
        });
    });

    describe('toIntRanges()', () => {
        it('should return proper network ranges', () => {
            const list = new Networks([
                '10.35.0.1/16',
                '13.8.80.0/24',
                '2000::/3',
            ]);

            expect(list.toIntRanges()).deep.equals({
                [NetworkType.IPV4]: [
                    [170065920n, 170131455n],
                    [218648576n, 218648831n],
                ],
                [NetworkType.IPV6]: [[
                    42535295865117307932921825928971026432n,
                    85070591730234615865843651857942052863n,
                ]],
            });
        });
    });
});
