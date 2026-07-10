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
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Networks, NetworkType, toBufferLE } from '../src/index.js';
import ipv4mask32 from './data/ipv4-32.json' with { type: 'json' };

describe('Networks', () => {
    it('should be a class', () => {
        assert.equal(typeof Networks, 'function');
    });

    describe('constructor()', () => {
        it('should allow mixed CIDR records', () => {
            assert.doesNotThrow(
                () =>
                    new Networks([
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
                    ]),
            );
        });

        it('should not throw on buffers', () => {
            assert.doesNotThrow(
                () =>
                    new Networks(
                        Buffer.concat([
                            toBufferLE(170065920n, 4),
                            toBufferLE(170131455n, 4),
                            toBufferLE(218648576n, 4),
                            toBufferLE(218648831n, 4),
                        ]),
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
                    ),
            );
        });

        it('should not throw on CIDR list and buffer', () => {
            assert.doesNotThrow(
                () =>
                    new Networks(
                        [
                            '203.0.113.0/24',
                            '224.0.0.0/4',
                            '233.252.0.0/24',
                            '240.0.0.0/4',
                            '255.255.255.255/32',
                            '::/128',
                            '::1/128',
                            '::ffff:0:0/96',
                            '::ffff:0:0:0/96',
                        ],
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
                    ),
            );
        });

        it('should throw if second arg is not buffer', () => {
            assert.throws(
                () =>
                    new Networks(
                        [
                            '203.0.113.0/24',
                            '224.0.0.0/4',
                            '233.252.0.0/24',
                            '240.0.0.0/4',
                            '255.255.255.255/32',
                            '::/128',
                            '::1/128',
                            '::ffff:0:0/96',
                            '::ffff:0:0:0/96',
                        ],
                        [
                            '::/128',
                            '::1/128',
                            '::ffff:0:0/96',
                            '::ffff:0:0:0/96',
                        ] as any,
                    ),
            );
        });
    });

    describe('includes()', () => {
        let list: Networks;

        beforeEach(
            () =>
                (list = new Networks([
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
                ])),
        );
        it('should return true if given address in network list', () => {
            assert.equal(list.includes('fc00::dead:beef'), true);
            assert.equal(list.includes('172.16.1.1'), true);
        });

        it('should return false if given address not in network list', () => {
            assert.equal(list.includes('dead::beef'), false);
            assert.equal(list.includes('173.16.1.1'), false);
        });
    });

    describe('toJSON()', () => {
        it('should be JSON-serializable', () => {
            const list = new Networks(
                ipv4mask32.concat([
                    '2000:0000:0000:0000:0000:0000:0000:0000/3',
                    '2001:0800:0000:0000:0000:0000:0000:0000/21',
                    '2002:0000:0000:1234:0000:0000:0000:0000/64',
                ]),
            );

            assert.doesNotThrow(() => JSON.stringify(list));
            assert.equal(Array.isArray(list.toJSON()), true);
            assert.equal(list.toJSON()[0], '34.66.25.221/32');
            assert.equal(
                list.toJSON()[
                    list[NetworkType.IPV4].length +
                        list[NetworkType.IPV6].length -
                        1
                ],
                '2002::1234:0:0:0:0/64',
            );
        });
    });

    describe('toIntRanges()', () => {
        it('should return proper network ranges', () => {
            const list = new Networks([
                '10.35.0.1/16',
                '13.8.80.0/24',
                '2000::/3',
            ]);

            assert.deepEqual(list.toIntRanges(), {
                [NetworkType.IPV4]: [
                    [170065920n, 170131455n],
                    [218648576n, 218648831n],
                ],
                [NetworkType.IPV6]: [
                    [
                        42535295865117307932921825928971026432n,
                        85070591730234615865843651857942052863n,
                    ],
                ],
            });
        });
    });
});
