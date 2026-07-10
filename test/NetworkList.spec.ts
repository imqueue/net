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
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NetworkList, NetworkType, toBufferLE } from '../src/index.js';
import ipv4mask32 from './data/ipv4-32.json' with { type: 'json' };

describe('NetworkList', () => {
    it('should be a class', () => {
        assert.equal(typeof NetworkList, 'function');
    });

    describe('constructor()', () => {
        it('should throw if nothing provided', () => {
            assert.throws(() => new (NetworkList as any)());
        });

        it('should throw if string provided', () => {
            assert.throws(() => new (NetworkList as any)('333334'));
        });

        it('should throw if empty array provided', () => {
            assert.throws(() => new NetworkList([]));
        });

        it('should throw if empty array element provided', () => {
            assert.throws(() => new NetworkList(['']));
        });

        it('should throw if invalid IPv4 provided', () => {
            assert.throws(() => new NetworkList(['1000.1.2.3/32']));
        });

        it('should throw if invalid IPv4 CIDR string provided', () => {
            assert.throws(() => new NetworkList(['10.1/16']));
        });

        it('should throw if invalid IPv6 provided', () => {
            assert.throws(() => new NetworkList([':::1/16']));
            assert.throws(() => new NetworkList(['12345678/64']));
            assert.throws(() => new NetworkList(['2000::7b::1/64']));
        });

        it('should throw if invalid buffer provided', () => {
            assert.throws(
                () => new NetworkList(Buffer.from('123'), NetworkType.IPV4),
            );
        });

        it('should throw if invalid, but proper length buffer provided', () => {
            assert.throws(
                () =>
                    new NetworkList(Buffer.from('12345678'), NetworkType.IPV4),
            );
        });

        it('should throw if no type argument provided within buffer', () => {
            assert.throws(() => new NetworkList(Buffer.from('123')));
        });

        it('should throw if invalid network type provided', () => {
            assert.throws(
                () =>
                    new NetworkList(
                        ['10.35.0.1/16', '13.8.80.0/24'],
                        'ipv9' as any,
                    ),
            );
        });

        it('should throw if wrong type given within CIDR list', () => {
            assert.throws(
                () =>
                    new NetworkList(
                        ['10.35.0.1/16', '13.8.80.0/24'],
                        NetworkType.IPV6,
                    ),
            );

            assert.throws(
                () =>
                    new NetworkList(
                        [
                            '2002::1234:abcd:ffff:c0a8:101/64',
                            '2000::/3',
                            '2001:800::/21',
                        ],
                        NetworkType.IPV4,
                    ),
            );
        });

        it('should not throw if given type valid within CIDR list', () => {
            assert.doesNotThrow(
                () =>
                    new NetworkList(
                        ['10.35.0.1/16', '13.8.80.0/24'],
                        NetworkType.IPV4,
                    ),
            );

            assert.doesNotThrow(
                () =>
                    new NetworkList(
                        [
                            '2002::1234:abcd:ffff:c0a8:101/64',
                            '2000::/3',
                            '2001:800::/21',
                        ],
                        NetworkType.IPV6,
                    ),
            );
        });

        it('should throw if mixed list of IPv4/IPv6 CIDR given', () => {
            assert.throws(
                () =>
                    new NetworkList([
                        '10.35.0.1/16',
                        '13.8.80.0/24',
                        '2000::/3',
                        '2001:800::/21',
                    ]),
            );
        });

        it('should throw if wrong type of IPv4 networks buffer given', () => {
            assert.throws(
                () =>
                    new NetworkList(
                        Buffer.concat([
                            toBufferLE(170065920n, 4),
                            toBufferLE(170131455n, 4),
                            toBufferLE(218648576n, 4),
                            toBufferLE(218648831n, 4),
                        ]),
                        NetworkType.IPV6,
                    ),
            );
        });

        it('should throw if wrong type of IPv6 networks buffer given', () => {
            assert.throws(
                () =>
                    new NetworkList(
                        Buffer.concat([
                            toBufferLE(
                                42535295865117307932921825928971026432n,
                                16,
                            ),
                            toBufferLE(
                                85070591730234615865843651857942052863n,
                                16,
                            ),
                            toBufferLE(
                                42540650421252671973913748003310534656n,
                                16,
                            ),
                            toBufferLE(
                                42540812680529501187277139581320822783n,
                                16,
                            ),
                            toBufferLE(
                                42545680458834463550006270408139997184n,
                                16,
                            ),
                            toBufferLE(
                                42545680458834463568453014481849548799n,
                                16,
                            ),
                        ]),
                        NetworkType.IPV4,
                    ),
            );
        });

        it('should instantiate if proper IPv4 CIDR list provided', () => {
            assert.doesNotThrow(
                () => new NetworkList(['10.35.0.1/16', '13.8.80.0/24']),
            );
        });

        it('should instantiate if proper IPv4 buffer provided', () => {
            assert.doesNotThrow(
                () =>
                    new NetworkList(
                        Buffer.concat([
                            toBufferLE(170065920n, 4),
                            toBufferLE(170131455n, 4),
                            toBufferLE(218648576n, 4),
                            toBufferLE(218648831n, 4),
                        ]),
                        NetworkType.IPV4,
                    ),
            );
        });

        it('should instantiate if proper IPv6 list provided', () => {
            assert.doesNotThrow(
                () =>
                    new NetworkList([
                        '2002::1234:abcd:ffff:c0a8:101/64',
                        '2000::/3',
                        '2001:800::/21',
                    ]),
            );
        });

        it('should instantiate if proper IPv6 buffer provided', () => {
            assert.doesNotThrow(
                () =>
                    new NetworkList(
                        Buffer.concat([
                            toBufferLE(
                                42535295865117307932921825928971026432n,
                                16,
                            ),
                            toBufferLE(
                                85070591730234615865843651857942052863n,
                                16,
                            ),
                            toBufferLE(
                                42540650421252671973913748003310534656n,
                                16,
                            ),
                            toBufferLE(
                                42540812680529501187277139581320822783n,
                                16,
                            ),
                            toBufferLE(
                                42545680458834463550006270408139997184n,
                                16,
                            ),
                            toBufferLE(
                                42545680458834463568453014481849548799n,
                                16,
                            ),
                        ]),
                        NetworkType.IPV6,
                    ),
            );
        });

        it('should avoid duplicate networks', () => {
            const list = new NetworkList([
                '2000:0000:0000:0000:0000:0000:0000:0000/3',
                '2000:0000:0000:0000:0000:0000:0000:0000/3',
                '2001:0800:0000:0000:0000:0000:0000:0000/21',
                '2001:0800:0000:0000:0000:0000:0000:0000/21',
                '2002:0000:0000:1234:0000:0000:0000:0000/64',
                '2002:0000:0000:1234:0000:0000:0000:0000/64',
            ]);

            assert.deepEqual(list.toArray(true), [
                '2000:0000:0000:0000:0000:0000:0000:0000/3',
                '2001:0800:0000:0000:0000:0000:0000:0000/21',
                '2002:0000:0000:1234:0000:0000:0000:0000/64',
            ]);
        });
    });

    describe('includes()', () => {
        it('should return true if given address in network list', () => {
            const list = new NetworkList(ipv4mask32);

            for (const cidr of ipv4mask32) {
                const [ip] = cidr.split('/');

                assert.equal(list.includes(ip), true);
            }

            const list6 = new NetworkList([
                '2002::1234:abcd:ffff:c0a8:101/64',
                '2000::/3',
                '2001:800::/21',
            ]);

            assert.equal(list6.includes('2002::1234:abcd:ffff:c0a8:103'), true);
        });

        it('should return false if given address not in network list', () => {
            const list = new NetworkList(ipv4mask32);

            for (const cidr of ['::1', '128.1.1.1', '3.3.3.3', '8.8.8.8']) {
                const [ip] = cidr.split('/');

                assert.equal(list.includes(ip), false);
            }

            const list6 = new NetworkList([
                '2002::1234:abcd:ffff:c0a8:101/64',
                '2000::/3',
                '2001:800::/21',
            ]);

            assert.equal(
                list6.includes('3002::1234:abcd:ffff:c0a8:103'),
                false,
            );
        });
    });

    describe('toJSON()', () => {
        it('should be JSON-serializable', () => {
            const list = new NetworkList(ipv4mask32);
            const list6 = new NetworkList([
                '2000:0000:0000:0000:0000:0000:0000:0000/3',
                '2001:0800:0000:0000:0000:0000:0000:0000/21',
                '2002:0000:0000:1234:0000:0000:0000:0000/64',
            ]);

            assert.doesNotThrow(() => JSON.stringify(list));
            assert.equal(Array.isArray(list.toJSON()), true);
            assert.equal(list.toJSON()[0], '34.66.25.221/32');

            assert.doesNotThrow(() => JSON.stringify(list6));
            assert.equal(Array.isArray(list6.toJSON()), true);
            assert.equal(list6.toJSON()[0], '2000::/3');
        });
    });

    describe('toIntArray()', () => {
        it('should return proper network ranges', () => {
            const list = new NetworkList(['10.35.0.1/16', '13.8.80.0/24']);

            assert.deepEqual(list.toIntArray(), [
                [170065920n, 170131455n],
                [218648576n, 218648831n],
            ]);
        });
    });

    describe('toArray()', () => {
        it('should return packed form of IPv6 by default', () => {
            const list6 = new NetworkList([
                '2002::1234:abcd:ffff:c0a8:101/64',
                '2000::/3',
                '2001:800::/21',
            ]);

            assert.equal(list6.toArray()[0], '2000::/3');
            assert.equal(list6.toArray()[1], '2001:800::/21');
            assert.equal(list6.toArray()[2], '2002::1234:0:0:0:0/64');
        });

        it('should return canonical form of IPv6 if asked', () => {
            const list6 = new NetworkList([
                '2002::1234:abcd:ffff:c0a8:101/64',
                '2000::/3',
                '2001:800::/21',
            ]);

            assert.equal(
                list6.toArray(true)[0],
                '2000:0000:0000:0000:0000:0000:0000:0000/3',
            );
            assert.equal(
                list6.toArray(true)[1],
                '2001:0800:0000:0000:0000:0000:0000:0000/21',
            );
            assert.equal(
                list6.toArray(true)[2],
                '2002:0000:0000:1234:0000:0000:0000:0000/64',
            );
        });
    });
});
