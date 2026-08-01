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
import { isIP, isIPv4, isIPv6 } from 'node:net';
import { IPV6_MAX_STR_LEN, NetworkType } from './types/index.js';

function invalid(ip: string) {
    return `Given network address "${ip}" is invalid!`;
}

/**
 * Determines an address's family, or verifies the one you claim it has.
 *
 * @param ip - the address to inspect
 * @param type - the family you expect; omit to have it detected
 * @returns The family the address belongs to. When `type` was supplied and
 * matches, that same value comes back.
 *
 * @throws TypeError if `ip` is empty, if it contains neither `:` nor `.` so no
 * family can be detected, if `type` is not a {@link NetworkType}, or if `type`
 * disagrees with the address.
 *
 * @remarks
 * Detection is by punctuation only — a `:` means IPv6 and a `.` means IPv4, with
 * `:` winning, which is what classifies the IPv4-mapped form `::ffff:1.2.3.4` as
 * IPv6. It does not check that the address is well formed, so
 * `getType('1.2.3.999')` returns `IPV4` quite happily; use {@link validate} or
 * {@link isValid} for that.
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
        throw new TypeError(`Given network type ${type} is invalid!`);
    } else if (getType(ip) !== type) {
        throw new TypeError(
            `Looks like given type "${
                type
            }" does not match actual type "${getType(ip)}"!`,
        );
    }

    return type;
}

/**
 * Reads a string of `'0'` and `'1'` as an unsigned `bigint`.
 *
 * @param binStr - big-endian binary digits, most significant first
 * @returns The value they encode. An empty string gives `0n`.
 *
 * @remarks
 * Only `'1'` contributes: any other character at a position — including `'0'`,
 * a space or a letter — is treated as a zero bit rather than rejected. So this
 * silently accepts input it cannot represent, and is meant for strings this
 * package produced.
 */
export function binToDec(binStr: string): bigint {
    const lastIndex = binStr.length - 1;
    let total = BigInt(0);

    for (let i = 0; i < binStr.length; i++) {
        if (binStr[lastIndex - i] === '1') {
            total += BigInt(2) ** BigInt(i);
        }
    }

    return total;
}

const RX_IPV6_OCTET_PACK = /^0+/;
const RX_IPV6_PACK = /\b:?(?:0+:?){2,}/;
const RX_IPV6_TUNNELS_CLEAN = /\./g;

/**
 * Compresses an IPv6 address: drops leading zeros from each group and collapses
 * the longest run of zero groups to `::`.
 *
 * @param ip - a full or partly compressed IPv6 address
 * @returns The compressed form, e.g. `2001:0db8:0000:0000:0000:0000:0000:0001`
 * becomes `2001:db8::1`.
 *
 * @remarks
 * The inverse of {@link ipv6Unpack}, and what this package emits when producing
 * IPv6 text. It is a string transformation with no validation, so a malformed
 * input produces malformed output rather than an error.
 */
export function ipv6Pack(ip: string): string {
    return ip
        .split(':')
        .map(part => {
            const clean = part.replace(RX_IPV6_OCTET_PACK, '');

            return clean === '' ? '0' : clean;
        })
        .join(':')
        .replace(RX_IPV6_PACK, '::');
}

/**
 * Expands an IPv6 address to its full eight-group, four-digit form.
 *
 * @param ip - an IPv6 address, compressed or not
 * @returns The 39-character canonical form, e.g. `2001:db8::1` becomes
 * `2001:0db8:0000:0000:0000:0000:0000:0001`.
 *
 * @throws TypeError if the address contains more than one `::`.
 *
 * @remarks
 * The inverse of {@link ipv6Pack}, and the form {@link ipToInt} needs before it
 * can read the groups as bytes. An input already
 * {@link IPV6_MAX_STR_LEN} characters long is returned untouched on the
 * assumption it is already expanded.
 *
 * Dots are rewritten to colons first, so the IPv4-mapped form
 * `::ffff:1.2.3.4` expands without failing — but its trailing octets are treated
 * as hex groups, not as a dotted quad, so the result is not the address a reader
 * would expect. Convert mapped addresses yourself if the exact value matters.
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

    return parts
        .map(part =>
            part.length < 4 ? '0'.repeat(4 - part.length) + part : part,
        )
        .join(':');
}

/**
 * Converts an address to the unsigned `bigint` this package compares with.
 *
 * @param ip - the address to convert
 * @param type - the family, if you already know it; omit to have it detected
 * @returns The address as a single integer — 32 bits of range for IPv4, 128 for
 * IPv6.
 *
 * @throws TypeError if the address is not valid, or if `type` disagrees with it.
 *
 * @remarks
 * The bridge between text and every numeric operation here: ranges, sorting and
 * binary search all work on these values. Because the two families are converted
 * into the same unsigned space and IPv4 occupies only its low 32 bits, values
 * from different families must never be compared — which is why
 * {@link Networks} keeps them apart.
 */
export function ipToInt(ip: string, type?: NetworkType): bigint {
    validate(ip);
    type = getType(ip, type);

    // IPv4
    if (type === NetworkType.IPV4) {
        const parts = ip.split('.');
        let total: number = 0;

        for (let i = 0; i < parts.length; i++) {
            total += parseInt(parts[i]) * Math.pow(256, parts.length - i - 1);
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
 * Renders an integer address back to text.
 *
 * @param intIp - the address as produced by {@link ipToInt}
 * @param type - which family to render it as; the integer alone does not say
 * @param canonical - for IPv6, emit the full expanded form instead of the
 * compressed one. Ignored for IPv4, which has only one form.
 * @returns Dotted-quad for IPv4, colon-hex for IPv6.
 *
 * @defaultValue `canonical` defaults to `false`, i.e. compressed IPv6
 *
 * @remarks
 * The inverse of {@link ipToInt}, but `type` is not optional here and cannot be
 * inferred: the same integer is a valid address in both families, so passing the
 * wrong one yields a plausible, wrong address rather than an error.
 *
 * There is no range check either. A value wider than the family renders from
 * whatever bits fall in each group's position, so an IPv6-sized integer rendered
 * as IPv4 silently produces nonsense.
 */
export function intToIp(
    intIp: bigint,
    type: NetworkType,
    canonical: boolean = false,
): string {
    if (type === NetworkType.IPV6) {
        return (canonical ? ipv6Unpack : ipv6Pack)(
            (intIp >> BigInt(112)).toString(16) +
                ':' +
                ((intIp >> BigInt(96)) & BigInt(0xffff)).toString(16) +
                ':' +
                ((intIp >> BigInt(80)) & BigInt(0xffff)).toString(16) +
                ':' +
                ((intIp >> BigInt(64)) & BigInt(0xffff)).toString(16) +
                ':' +
                ((intIp >> BigInt(48)) & BigInt(0xffff)).toString(16) +
                ':' +
                ((intIp >> BigInt(32)) & BigInt(0xffff)).toString(16) +
                ':' +
                ((intIp >> BigInt(16)) & BigInt(0xffff)).toString(16) +
                ':' +
                (intIp & BigInt(0xffff)).toString(16),
        );
    } else {
        return (
            (intIp >> BigInt(24)) +
            '.' +
            ((intIp >> BigInt(16)) & BigInt(0xff)) +
            '.' +
            ((intIp >> BigInt(8)) & BigInt(0xff)) +
            '.' +
            (intIp & BigInt(0xff))
        );
    }
}

// istanbul ignore next
/**
 * Whether a string is a valid IPv4 or IPv6 address.
 *
 * @param ip - the string to test
 * @returns `true` for a valid address of either family.
 *
 * @remarks
 * Node's own `net.isIP`, so it accepts a bare address only — `''`, `'unknown'`
 * and `'10.0.0.0/8'` are all `false`, because a prefix length makes it a CIDR
 * record rather than an address. Use this to screen untrusted input before
 * {@link Networks}, whose constructor throws on anything it cannot parse.
 */
export function isValid(ip: string): boolean {
    return isIP(ip) !== 0;
}

// istanbul ignore next
/**
 * Whether a string is a valid IPv4 address.
 *
 * @param ip - the string to test
 * @returns `true` only for IPv4; a valid IPv6 address gives `false`.
 *
 * @remarks
 * Node's `net.isIPv4`. Note that the IPv4-mapped form `::ffff:1.2.3.4` is IPv6 as
 * far as this is concerned.
 */
export function isValid4(ip: string): boolean {
    return isIPv4(ip);
}

// istanbul ignore next
/**
 * Whether a string is a valid IPv6 address.
 *
 * @param ip - the string to test
 * @returns `true` only for IPv6; a valid IPv4 address gives `false`.
 *
 * @remarks
 * Node's `net.isIPv6`, so the IPv4-mapped form `::ffff:1.2.3.4` counts as IPv6.
 */
export function isValid6(ip: string): boolean {
    return isIPv6(ip);
}

// istanbul ignore next
/**
 * Asserts that a string is a valid address of either family.
 *
 * @param ip - the string to check
 * @returns Nothing. It either passes or throws.
 *
 * @throws TypeError `'Given network address "<ip>" is invalid!'`
 *
 * @remarks
 * The throwing counterpart of {@link isValid}, used internally before conversion.
 * Prefer {@link isValid} when a bad address is an expected input rather than a
 * programming error.
 */
export function validate(ip: string) {
    if (!isValid(ip)) {
        throw new TypeError(invalid(ip));
    }
}

// istanbul ignore next
/**
 * Asserts that a string is a valid IPv4 address.
 *
 * @param ip - the string to check
 * @returns Nothing. It either passes or throws.
 *
 * @throws TypeError `'Given network address "<ip>" is invalid!'` — including for a
 * valid IPv6 address.
 */
export function validate4(ip: string) {
    if (!isValid4(ip)) {
        throw new TypeError(invalid(ip));
    }
}

// istanbul ignore next
/**
 * Asserts that a string is a valid IPv6 address.
 *
 * @param ip - the string to check
 * @returns Nothing. It either passes or throws.
 *
 * @throws TypeError `'Given network address "<ip>" is invalid!'` — including for a
 * valid IPv4 address.
 */
export function validate6(ip: string) {
    if (!isValid6(ip)) {
        throw new TypeError(invalid(ip));
    }
}
