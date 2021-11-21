<h1 align="center">
    @imqueue/net
    <a href="https://twitter.com/intent/tweet?text=Fast%20and%20reliable%20binary%20networks%20checker%20for%20node&url=https://github.com/imqueue/net&via=github&hashtags=typescript,javascript,nodejs,postgres,developers">
        <img src="https://img.shields.io/twitter/url/http/shields.io.svg?style=social" alt="Tweet">
    </a>
</h1>
<div align="center">
    <a href="https://travis-ci.com/imqueue/net">
        <img src="https://travis-ci.com/imqueue/net.svg?branch=master" alt="Build Status">
    </a>
    <a href="https://rawgit.com/imqueue/net/master/LICENSE">
        <img src="https://img.shields.io/badge/license-ISC-blue.svg" alt="Coverage Status">
    </a>
</div>
<hr>
<p align="center">
    <strong>
        Fast and reliable binary networks checker for node with IPv4 & IPv6 full
        support
    </strong>
</p>
<hr>

## What Is This?

This library provides a clean way to create binary network lists with binary 
search over them to lookup for an addresses present in that lists.

It provides lookup in O(log n) time with very small memory footprint to store
network lists.

## Install

As easy as:

~~~bash
npm i --save @imqueue/net
~~~ 

## Usage & API

There are 2 basic objects to deal with `NetworkList` and `Networks` which allow
doing lookups over the network lists. As long as you need to deal with a single
network type (IPv4 or IPv6) it is recommended to use `NetworkList` type.
Otherwise, if you need work with mixed networks at once - use `Networks` type 
instead. See examples below:

~~~typescript
import { Networks, NetworkList } from '@imqueue/net';

// ---------------------------------
// Workinf with IPv4 networks
// ----------------------------------

const ipv4reserved = new NetworkList([
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
]);

const addressOne = '192.168.1.34';
const addressTwo = '193.168.1.34';

// perform checks
console.log(addressOne, 'is reserved:', ipv4reserved.includes(addressOne)); // true
console.log(addressTwo, 'is reserved:', ipv4reserved.includes(addressTwo)); // false

// network list can be converted to CIDR array
console.log(ipv4reserved.toArray());

// network list can be converted to list of network ranges [min, max][]
console.log(ipv4reserved.toIntArray());

// network list is JSON-serializable
console.log(JSON.stringify(ipv4reserved));

// audit properties:
console.log(ipv4reserved);

// ---------------------------------
// IPv6 networks
// ---------------------------------

const ipv6reserved = new NetworkList([
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
]);

const ipv6One = 'fc00::42';
const ipv6Two = 'dead::beef';

// perform checks
console.log(ipv6One, 'is reserved:', ipv6reserved.includes(ipv6One)); // true
console.log(ipv6Two, 'is reserved:', ipv6reserved.includes(ipv6Two)); // false

// network list can be converted to CIDR array
console.log(ipv6reserved.toArray());

// network list can be converted to list of network ranges [min, max][]
console.log(ipv6reserved.toIntArray());

// network list is JSON-serializable
console.log(JSON.stringify(ipv6reserved));

// audit properties:
console.log(ipv6reserved);

// ---------------------------------
// Working with mixed (IPv4/IPv6) networks
// ---------------------------------

const allReserved = new Networks([
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
]);

console.log(allReserved.includes('fc00::dead:beef')); // true
console.log(allReserved.includes('dead::beef')); // false
console.log(allReserved.includes('193.1.1.1')); // false
console.log(allReserved.includes('172.16.1.1')); // true

// network list can be converted to CIDR array
console.log(allReserved.toArray());

// network list can be converted to list of network ranges [min, max][]
console.log(allReserved.toIntRanges());

// network list is JSON-serializable
console.log(JSON.stringify(allReserved));

// audit properties:
console.log(allReserved);
~~~

## Contributing

Any contributions are greatly appreciated. Feel free to fork, propose PRs, open
issues, do whatever you think may be helpful to this project. PRs which passes
all tests and do not brake tslint rules are first-class candidates to be
accepted!

## License

[ISC](https://github.com/imqueue/net/blob/master/LICENSE)

Happy Coding!
