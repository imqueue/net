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
import ipRegex from 'ip-regex';
import { IPV6_MAX_STR_LEN, NetworkType } from './types';

function invalid(ip: string) {
    return `Given network address "${ ip }" is invalid!`;
}

/**
 * Ensures type is set for given address
 *
 * @param {string} ip
 * @param {NetworkType} [type]
 * @return {NetworkType}
 */
export function getType(ip: string, type?: NetworkType): NetworkType {
    if (!ip) {
        throw new TypeError(invalid(ip));
    }

    if (typeof type === 'undefined') {
        if (~ip.indexOf(':')) {
            type = NetworkType.IPV6;
        } else if (~ip.indexOf('.')) {
            type = NetworkType.IPV4;
        } else {
            throw new TypeError(invalid(ip));
        }
    } else if (!Object.values(NetworkType).includes(type)) {
        throw new TypeError(`Given network type ${ type } is invalid!`);
    } else if (getType(ip) !== type) {
        throw new TypeError(`Looks like given type "${
            type }" does not match actual type "${
            getType(ip)
        }"!`);
    }

    return type;
}

/**
 * Converts binary integer representation string to big integer
 *
 * @param {string} binStr
 * @return {bigint}
 */
export function binToDec(binStr: string): bigint {
    const lastIndex = binStr.length - 1;
    let total = BigInt(0);

    for (let i = 0; i < binStr.length; i++) {
        if (binStr[lastIndex - i] === '1') {
            total += (BigInt(2) ** BigInt(i));
        }
    }

    return total;
}

const RX_IPV6_OCTET_PACK = /^0+/;
const RX_IPV6_PACK = /\b:?(?:0+:?){2,}/;
const RX_IPV6_TUNNELS_CLEAN = /\./g;

/**
 * Packs and returns most possible compact IPv6 address representation
 *
 * @param {string} ip
 * @return {string}
 */
export function ipv6Pack(ip: string): string {
    return ip.split(':')
        .map(part => {
            let clean = part.replace(RX_IPV6_OCTET_PACK, '');

            clean === '' && (clean = '0');

            return clean;
        })
        .join(':')
        .replace(RX_IPV6_PACK, '::')
    ;
}

/**
 * Returns full canonical representation of IPv6 address
 *
 * @param {string} ip
 * @return {string}
 */
export function ipv6Unpack(ip: string): string {
    if (ip.length === IPV6_MAX_STR_LEN) {
        return ip;
    }

    // make sure tunneling ip format will not cause a problem
    ip = ip.replace(RX_IPV6_TUNNELS_CLEAN, ':');

    const chunks = ip.split('::');
    let parts: string[] = [];

    if (chunks.length === 2) {
        const startParts = chunks[0].split(':');
        const endParts = chunks[1].split(':');

        parts = parts.concat(startParts);

        for (let i = 0; i < 8 - startParts.length - endParts.length; i++) {
            parts.push('0000');
        }

        parts = parts.concat(chunks[1] === '' ? ['0000'] : endParts);
    } else if (chunks.length === 1) {
        parts = ip.split(':');
    } else {
        throw new TypeError(invalid(ip));
    }

    return parts.map(part =>
        part.length < 4 ? '0'.repeat(4 - part.length) + part : part,
    ).join(':');
}

/**
 * Converts given address to big integer representation
 *
 * @param {string} ip
 * @param {NetworkType} [type]
 * @return {bigint}
 */
export function ipToInt(ip: string, type?: NetworkType): bigint {
    validate(ip);
    type = getType(ip, type);

    // IPv4
    if (type === NetworkType.IPV4) {
        const parts = ip.split('.');
        let total: number = 0;

        for (let i = 0; i < parts.length; i++) {
            total += parseInt(parts[i]) *
                Math.pow(256, (parts.length - i - 1))
            ;
        }

        return BigInt(total);
    }

    // IPv6
    const octets = ipv6Unpack(ip).split(':');
    const parts: string[] = [];

    for (let i = 0; i < octets.length; i++) {
        let bin = parseInt(octets[i], 16).toString(2);

        if (bin.length < 16) {
            bin = '0'.repeat(16 - bin.length) + bin;
        }

        parts.push(bin);
    }

    return binToDec(parts.join(''));
}

/**
 * Converts big integer address representation to it's string canonical form
 *
 * @param {bigint} intIp
 * @param {NetworkType} type
 * @param {boolean} [canonical]
 * @return {string}
 */
export function intToIp(
    intIp: bigint,
    type: NetworkType,
    canonical: boolean = false,
): string {
    if (type === NetworkType.IPV6) {
        return (canonical ? ipv6Unpack : ipv6Pack)(
            (intIp >> BigInt(112)).toString(16) + ':' +
            (intIp >> BigInt(96) & BigInt(0xFFFF)).toString(16) + ':' +
            (intIp >> BigInt(80) & BigInt(0xFFFF)).toString(16) + ':' +
            (intIp >> BigInt(64) & BigInt(0xFFFF)).toString(16) + ':' +
            (intIp >> BigInt(48) & BigInt(0xFFFF)).toString(16) + ':' +
            (intIp >> BigInt(32) & BigInt(0xFFFF)).toString(16) + ':' +
            (intIp >> BigInt(16) & BigInt(0xFFFF)).toString(16) + ':' +
            (intIp & BigInt(0xFFFF)).toString(16),
        );
    } else {
        return (intIp >> BigInt(24)) + '.' +
            (intIp >> BigInt(16) & BigInt(0xFF)) + '.' +
            (intIp >> BigInt(8) & BigInt(0xFF)) + '.' +
            (intIp & BigInt(0xFF))
        ;
    }
}

// istanbul ignore next
/**
 * Returns true if given IP valid network address (IPv4 or IPv6), false -
 * otherwise
 *
 * @param {string} ip
 * @return {boolean}
 */
export function isValid(ip: string): boolean {
    return ipRegex({ exact: true }).test(ip);
}

// istanbul ignore next
/**
 * Returns true if given IP is a valid IPv4 network address, false - otherwise
 *
 * @param {string} ip
 * @return {boolean}
 */
export function isValid4(ip: string): boolean {
    return ipRegex.v4({ exact: true }).test(ip);
}

// istanbul ignore next
/**
 * Returns true if given IP is a valid IPv6 network address, false - otherwise
 *
 * @param {string} ip
 * @return {boolean}
 */
export function isValid6(ip: string): boolean {
    return ipRegex.v6({ exact: true }).test(ip);
}

// istanbul ignore next
/**
 * If given address is not valid address (v4 or v6) - throws an error
 *
 * @param {string} ip
 */
export function validate(ip: string) {
    if (!isValid(ip)) {
        throw new TypeError(invalid(ip));
    }
}

// istanbul ignore next
/**
 * If given address is not valid IPv4 address - throws an error
 *
 * @param {string} ip
 */
export function validate4(ip: string) {
    if (!isValid4(ip)) {
        throw new TypeError(invalid(ip));
    }
}

// istanbul ignore next
/**
 * If given address is not valid IPv6 address - throws an error
 *
 * @param {string} ip
 */
export function validate6(ip: string) {
    if (!isValid6(ip)) {
        throw new TypeError(invalid(ip));
    }
}
