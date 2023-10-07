/*!
 * The buffer module from node.js, for the browser.
 *
 * Modified from https://github.com/feross/buffer to be used standalone on browser based apps.
 *
 * Author: Kartik Visweswaran, Krajee.com
 */
'use strict';

var KrajeeBase64, KrajeeIeee754, customInspectSymbol, INSPECT_MAX_BYTES = 50, K_MAX_LENGTH = 0x7fffffff;
KrajeeBase64 = {
    fromByteArray: function (uint8) {
        var tmp, len = uint8.length, extraBytes = len % 3, // if we have 1 byte left, pad 2 bytes
            parts = [], maxChunkLength = 16383; // must be multiple of 3

        // go through the array every three bytes, we'll deal with trailing stuff later
        for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }

        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            tmp = uint8[len - 1];
            parts.push(lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3F] + '==');
        } else if (extraBytes === 2) {
            tmp = (uint8[len - 2] << 8) + uint8[len - 1];
            parts.push(lookup[tmp >> 10] + lookup[(tmp >> 4) & 0x3F] + lookup[(tmp << 2) & 0x3F] + '=');
        }

        return parts.join('');
    },
    toByteArray: function (b64) {
        var tmp, lens = getLens(b64), validLen = lens[0], placeHoldersLen = lens[1],
            arr = new Arr(_byteLength(b64, validLen, placeHoldersLen)), curByte = 0, i,
            // if there are placeholders, only get up to the last complete 4 chars
            len = placeHoldersLen > 0 ? validLen - 4 : validLen;
        for (i = 0; i < len; i += 4) {
            tmp =
                (revLookup[b64.charCodeAt(i)] << 18) |
                (revLookup[b64.charCodeAt(i + 1)] << 12) |
                (revLookup[b64.charCodeAt(i + 2)] << 6) |
                revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }

        if (placeHoldersLen === 2) {
            tmp =
                (revLookup[b64.charCodeAt(i)] << 2) |
                (revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }

        if (placeHoldersLen === 1) {
            tmp =
                (revLookup[b64.charCodeAt(i)] << 10) |
                (revLookup[b64.charCodeAt(i + 1)] << 4) |
                (revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }

        return arr;
    }
};
KrajeeIeee754 = {
    read: function (buffer, offset, isLE, mLen, nBytes) {
        var e, m, eLen = (nBytes * 8) - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, nBits = -7,
            i = isLE ? (nBytes - 1) : 0, d = isLE ? -1 : 1, s = buffer[offset + i];

        i += d;
        e = s & ((1 << (-nBits)) - 1);
        s >>= (-nBits);
        nBits += eLen;
        for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {
        }

        m = e & ((1 << (-nBits)) - 1);
        e >>= (-nBits);
        nBits += mLen;
        for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {
        }

        if (e === 0) {
            e = 1 - eBias;
        } else if (e === eMax) {
            return m ? NaN : ((s ? -1 : 1) * Infinity);
        } else {
            m = m + Math.pow(2, mLen);
            e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    },
    write: function (buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c, eLen = (nBytes * 8) - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1,
            rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0), i = isLE ? 0 : (nBytes - 1),
            d = isLE ? 1 : -1, s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

        value = Math.abs(value);

        if (isNaN(value) || value === Infinity) {
            m = isNaN(value) ? 1 : 0;
            e = eMax;
        } else {
            e = Math.floor(Math.log(value) / Math.LN2);
            if (value * (c = Math.pow(2, -e)) < 1) {
                e--;
                c *= 2;
            }
            if (e + eBias >= 1) {
                value += rt / c;
            } else {
                value += rt * Math.pow(2, 1 - eBias);
            }
            if (value * c >= 2) {
                e++;
                c /= 2;
            }

            if (e + eBias >= eMax) {
                m = 0;
                e = eMax;
            } else if (e + eBias >= 1) {
                m = ((value * c) - 1) * Math.pow(2, mLen);
                e = e + eBias;
            } else {
                m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                e = 0;
            }
        }

        for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {
        }

        e = (e << mLen) | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {
        }

        buffer[offset + i - d] |= s * 128;
    }
};
customInspectSymbol =
    (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
        ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
        : null;

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
    console.error(
        'This browser lacks typed array (Uint8Array) support which is required by ' +
        '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
    );
}

function typedArraySupport() {
    // Can typed array instances can be augmented?
    try {
        const arr = new Uint8Array(1);
        const proto = {
            foo: function () {
                return 42;
            }
        };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
    } catch (e) {
        return false;
    }
}

Object.defineProperty(Buffer.prototype, 'parent', {
    enumerable: true,
    get: function () {
        if (!Buffer.isBuffer(this)) return undefined;
        return this.buffer;
    }
});

Object.defineProperty(Buffer.prototype, 'offset', {
    enumerable: true,
    get: function () {
        if (!Buffer.isBuffer(this)) return undefined;
        return this.byteOffset;
    }
});

function createBuffer(length) {
    if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
    }
    // Return an augmented `Uint8Array` instance
    const buf = new Uint8Array(length);
    Object.setPrototypeOf(buf, Buffer.prototype);
    return buf;
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer(arg, encodingOrOffset, length) {
    // Common case.
    if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
            throw new TypeError(
                'The "string" argument must be of type string. Received type number'
            );
        }
        return allocUnsafe(arg);
    }
    return from(arg, encodingOrOffset, length);
}

Buffer.poolSize = 8192; // not used by this implementation

function from(value, encodingOrOffset, length) {
    if (typeof value === 'string') {
        return fromString(value, encodingOrOffset);
    }

    if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
    }

    if (value == null) {
        throw new TypeError(
            'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
            'or Array-like Object. Received type ' + (typeof value)
        );
    }

    if (isInstance(value, ArrayBuffer) ||
        (value && isInstance(value.buffer, ArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
    }

    if (typeof SharedArrayBuffer !== 'undefined' &&
        (isInstance(value, SharedArrayBuffer) ||
            (value && isInstance(value.buffer, SharedArrayBuffer)))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
    }

    if (typeof value === 'number') {
        throw new TypeError(
            'The "value" argument must not be of type number. Received type number'
        );
    }

    const valueOf = value.valueOf && value.valueOf();
    if (valueOf != null && valueOf !== value) {
        return Buffer.from(valueOf, encodingOrOffset, length);
    }

    const b = fromObject(value);
    if (b) return b;

    if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
        typeof value[Symbol.toPrimitive] === 'function') {
        return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
    }

    throw new TypeError(
        'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
        'or Array-like Object. Received type ' + (typeof value)
    );
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
    return from(value, encodingOrOffset, length);
};

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
Object.setPrototypeOf(Buffer, Uint8Array);

function assertSize(size) {
    if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be of type number');
    } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
    }
}

function alloc(size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
        return createBuffer(size);
    }
    if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpreted as a start offset.
        return typeof encoding === 'string'
            ? createBuffer(size).fill(fill, encoding)
            : createBuffer(size).fill(fill);
    }
    return createBuffer(size);
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
    return alloc(size, fill, encoding);
};

function allocUnsafe(size) {
    assertSize(size);
    return createBuffer(size < 0 ? 0 : checked(size) | 0);
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
    return allocUnsafe(size);
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(size);
};

function fromString(string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8';
    }

    if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding);
    }

    const length = byteLength(string, encoding) | 0;
    let buf = createBuffer(length);

    const actual = buf.write(string, encoding);

    if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        buf = buf.slice(0, actual);
    }

    return buf;
}

function fromArrayLike(array) {
    const length = array.length < 0 ? 0 : checked(array.length) | 0;
    const buf = createBuffer(length);
    for (let i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255;
    }
    return buf;
}

function fromArrayView(arrayView) {
    if (isInstance(arrayView, Uint8Array)) {
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
    }
    return fromArrayLike(arrayView);
}

function fromArrayBuffer(array, byteOffset, length) {
    if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
    }

    if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
    }

    let buf;
    if (byteOffset === undefined && length === undefined) {
        buf = new Uint8Array(array);
    } else if (length === undefined) {
        buf = new Uint8Array(array, byteOffset);
    } else {
        buf = new Uint8Array(array, byteOffset, length);
    }

    // Return an augmented `Uint8Array` instance
    Object.setPrototypeOf(buf, Buffer.prototype);

    return buf;
}

function fromObject(obj) {
    if (Buffer.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf = createBuffer(len);

        if (buf.length === 0) {
            return buf;
        }

        obj.copy(buf, 0, 0, len);
        return buf;
    }

    if (obj.length !== undefined) {
        if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
            return createBuffer(0);
        }
        return fromArrayLike(obj);
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
    }
}

function checked(length) {
    // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= K_MAX_LENGTH) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
            'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
    }
    return length | 0;
}

function SlowBuffer(length) {
    if (+length != length) { // eslint-disable-line eqeqeq
        length = 0;
    }
    return Buffer.alloc(+length);
}

Buffer.isBuffer = function isBuffer(b) {
    return b != null && b._isBuffer === true &&
        b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
};

Buffer.compare = function compare(a, b) {
    if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
    if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        throw new TypeError(
            'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
    }

    if (a === b) return 0;

    let x = a.length;
    let y = b.length;

    for (let i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
        }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
};

Buffer.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
            return true;
        default:
            return false;
    }
};

Buffer.concat = function concat(list, length) {
    if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
    }

    if (list.length === 0) {
        return Buffer.alloc(0);
    }

    let i;
    if (length === undefined) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
            length += list[i].length;
        }
    }

    const buffer = Buffer.allocUnsafe(length);
    let pos = 0;
    for (i = 0; i < list.length; ++i) {
        let buf = list[i];
        if (isInstance(buf, Uint8Array)) {
            if (pos + buf.length > buffer.length) {
                if (!Buffer.isBuffer(buf)) {
                    buf = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
                }
                buf.copy(buffer, pos);
            } else {
                Uint8Array.prototype.set.call(
                    buffer,
                    buf,
                    pos
                );
            }
        } else if (!Buffer.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
            buf.copy(buffer, pos);
        }
        pos += buf.length;
    }
    return buffer;
};

function byteLength(string, encoding) {
    if (Buffer.isBuffer(string)) {
        return string.length;
    }
    if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
    }
    if (typeof string !== 'string') {
        throw new TypeError(
            'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
            'Received type ' + typeof string
        );
    }

    const len = string.length;
    const mustMatch = (arguments.length > 2 && arguments[2] === true);
    if (!mustMatch && len === 0) return 0;

    // Use a for loop to avoid recursion
    let loweredCase = false;
    for (; ;) {
        switch (encoding) {
            case 'ascii':
            case 'latin1':
            case 'binary':
                return len;
            case 'utf8':
            case 'utf-8':
                return utf8ToBytes(string).length;
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
                return len * 2;
            case 'hex':
                return len >>> 1;
            case 'base64':
                return base64ToBytes(string).length;
            default:
                if (loweredCase) {
                    return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
                }
                encoding = ('' + encoding).toLowerCase();
                loweredCase = true;
        }
    }
}

Buffer.byteLength = byteLength;

function slowToString(encoding, start, end) {
    let loweredCase = false;

    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.

    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
        start = 0;
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
        return '';
    }

    if (end === undefined || end > this.length) {
        end = this.length;
    }

    if (end <= 0) {
        return '';
    }

    // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
        return '';
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
        switch (encoding) {
            case 'hex':
                return hexSlice(this, start, end);

            case 'utf8':
            case 'utf-8':
                return utf8Slice(this, start, end);

            case 'ascii':
                return asciiSlice(this, start, end);

            case 'latin1':
            case 'binary':
                return latin1Slice(this, start, end);

            case 'base64':
                return base64Slice(this, start, end);

            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
                return utf16leSlice(this, start, end);

            default:
                if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
                encoding = (encoding + '').toLowerCase();
                loweredCase = true;
        }
    }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true;

function swap(b, n, m) {
    const i = b[n];
    b[n] = b[m];
    b[m] = i;
}

Buffer.prototype.swap16 = function swap16() {
    const len = this.length;
    if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits');
    }
    for (let i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
    }
    return this;
};

Buffer.prototype.swap32 = function swap32() {
    const len = this.length;
    if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits');
    }
    for (let i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
    }
    return this;
};

Buffer.prototype.swap64 = function swap64() {
    const len = this.length;
    if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits');
    }
    for (let i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
    }
    return this;
};

Buffer.prototype.toString = function toString() {
    const length = this.length;
    if (length === 0) return '';
    if (arguments.length === 0) return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
};

Buffer.prototype.toLocaleString = Buffer.prototype.toString;

Buffer.prototype.equals = function equals(b) {
    if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
    if (this === b) return true;
    return Buffer.compare(this, b) === 0;
};

Buffer.prototype.inspect = function inspect() {
    let str = '';
    const max = INSPECT_MAX_BYTES;
    str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
    if (this.length > max) str += ' ... ';
    return '<Buffer ' + str + '>';
};
if (customInspectSymbol) {
    Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
}

Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (isInstance(target, Uint8Array)) {
        target = Buffer.from(target, target.offset, target.byteLength);
    }
    if (!Buffer.isBuffer(target)) {
        throw new TypeError(
            'The "target" argument must be one of type Buffer or Uint8Array. ' +
            'Received type ' + (typeof target)
        );
    }

    if (start === undefined) {
        start = 0;
    }
    if (end === undefined) {
        end = target ? target.length : 0;
    }
    if (thisStart === undefined) {
        thisStart = 0;
    }
    if (thisEnd === undefined) {
        thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index');
    }

    if (thisStart >= thisEnd && start >= end) {
        return 0;
    }
    if (thisStart >= thisEnd) {
        return -1;
    }
    if (start >= end) {
        return 1;
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;

    if (this === target) return 0;

    let x = thisEnd - thisStart;
    let y = end - start;
    const len = Math.min(x, y);

    const thisCopy = this.slice(thisStart, thisEnd);
    const targetCopy = target.slice(start, end);

    for (let i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
        }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
};

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1;

    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
        encoding = byteOffset;
        byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000;
    }
    byteOffset = +byteOffset; // Coerce to Number.
    if (numberIsNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : (buffer.length - 1);
    }

    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
    }

    // Normalize val
    if (typeof val === 'string') {
        val = Buffer.from(val, encoding);
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (Buffer.isBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
            return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
    } else if (typeof val === 'number') {
        val = val & 0xFF; // Search for a byte value [0-255]
        if (typeof Uint8Array.prototype.indexOf === 'function') {
            if (dir) {
                return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
            } else {
                return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
            }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
    }

    throw new TypeError('val must be string, number or Buffer');
}

function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    let indexSize = 1;
    let arrLength = arr.length;
    let valLength = val.length;

    if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase();
        if (encoding === 'ucs2' || encoding === 'ucs-2' ||
            encoding === 'utf16le' || encoding === 'utf-16le') {
            if (arr.length < 2 || val.length < 2) {
                return -1;
            }
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
        }
    }

    function read(buf, i) {
        if (indexSize === 1) {
            return buf[i];
        } else {
            return buf.readUInt16BE(i * indexSize);
        }
    }

    let i;
    if (dir) {
        let foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
            if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                if (foundIndex === -1) foundIndex = i;
                if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
            } else {
                if (foundIndex !== -1) i -= i - foundIndex;
                foundIndex = -1;
            }
        }
    } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
            let found = true;
            for (let j = 0; j < valLength; j++) {
                if (read(arr, i + j) !== read(val, j)) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }
    }

    return -1;
}

Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
};

Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};

Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};

function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    const remaining = buf.length - offset;
    if (!length) {
        length = remaining;
    } else {
        length = Number(length);
        if (length > remaining) {
            length = remaining;
        }
    }

    const strLen = string.length;

    if (length > strLen / 2) {
        length = strLen / 2;
    }
    let i;
    for (i = 0; i < length; ++i) {
        const parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf[offset + i] = parsed;
    }
    return i;
}

function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}

function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
}

function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
}

function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}

Buffer.prototype.write = function write(string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
        encoding = 'utf8';
        length = this.length;
        offset = 0;
        // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
        encoding = offset;
        length = this.length;
        offset = 0;
        // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
            length = length >>> 0;
            if (encoding === undefined) encoding = 'utf8';
        } else {
            encoding = length;
            length = undefined;
        }
    } else {
        throw new Error(
            'Buffer.write(string, encoding, offset[, length]) is no longer supported'
        );
    }

    const remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds');
    }

    if (!encoding) encoding = 'utf8';

    let loweredCase = false;
    for (; ;) {
        switch (encoding) {
            case 'hex':
                return hexWrite(this, string, offset, length);

            case 'utf8':
            case 'utf-8':
                return utf8Write(this, string, offset, length);

            case 'ascii':
            case 'latin1':
            case 'binary':
                return asciiWrite(this, string, offset, length);

            case 'base64':
                // Warning: maxLength not taken into account in base64Write
                return base64Write(this, string, offset, length);

            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
                return ucs2Write(this, string, offset, length);

            default:
                if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
                encoding = ('' + encoding).toLowerCase();
                loweredCase = true;
        }
    }
};

Buffer.prototype.toJSON = function toJSON() {
    return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
    };
};

function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
        return KrajeeBase64.fromByteArray(buf);
    } else {
        return KrajeeBase64.fromByteArray(buf.slice(start, end));
    }
}

function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    const res = [];

    let i = start;
    while (i < end) {
        const firstByte = buf[i];
        let codePoint = null;
        let bytesPerSequence = (firstByte > 0xEF)
            ? 4
            : (firstByte > 0xDF)
                ? 3
                : (firstByte > 0xBF)
                    ? 2
                    : 1;

        if (i + bytesPerSequence <= end) {
            let secondByte, thirdByte, fourthByte, tempCodePoint;

            switch (bytesPerSequence) {
                case 1:
                    if (firstByte < 0x80) {
                        codePoint = firstByte;
                    }
                    break;
                case 2:
                    secondByte = buf[i + 1];
                    if ((secondByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                        if (tempCodePoint > 0x7F) {
                            codePoint = tempCodePoint;
                        }
                    }
                    break;
                case 3:
                    secondByte = buf[i + 1];
                    thirdByte = buf[i + 2];
                    if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                        if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                            codePoint = tempCodePoint;
                        }
                    }
                    break;
                case 4:
                    secondByte = buf[i + 1];
                    thirdByte = buf[i + 2];
                    fourthByte = buf[i + 3];
                    if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
                        if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                            codePoint = tempCodePoint;
                        }
                    }
            }
        }

        if (codePoint === null) {
            // we did not generate a valid codePoint so insert a
            // replacement char (U+FFFD) and advance only 1 byte
            codePoint = 0xFFFD;
            bytesPerSequence = 1;
        } else if (codePoint > 0xFFFF) {
            // encode to utf16 (surrogate pair dance)
            codePoint -= 0x10000;
            res.push(codePoint >>> 10 & 0x3FF | 0xD800);
            codePoint = 0xDC00 | codePoint & 0x3FF;
        }

        res.push(codePoint);
        i += bytesPerSequence;
    }

    return decodeCodePointsArray(res);
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray(codePoints) {
    const len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    let res = '';
    let i = 0;
    while (i < len) {
        res += String.fromCharCode.apply(
            String,
            codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
    }
    return res;
}

function asciiSlice(buf, start, end) {
    let ret = '';
    end = Math.min(buf.length, end);

    for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7F);
    }
    return ret;
}

function latin1Slice(buf, start, end) {
    let ret = '';
    end = Math.min(buf.length, end);

    for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
    }
    return ret;
}

function hexSlice(buf, start, end) {
    const len = buf.length;

    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;

    let out = '';
    for (let i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf[i]];
    }
    return out;
}

function utf16leSlice(buf, start, end) {
    const bytes = buf.slice(start, end);
    let res = '';
    // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
    for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256));
    }
    return res;
}

Buffer.prototype.slice = function slice(start, end) {
    const len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
        start += len;
        if (start < 0) start = 0;
    } else if (start > len) {
        start = len;
    }

    if (end < 0) {
        end += len;
        if (end < 0) end = 0;
    } else if (end > len) {
        end = len;
    }

    if (end < start) end = start;

    const newBuf = this.subarray(start, end);
    // Return an augmented `Uint8Array` instance
    Object.setPrototypeOf(newBuf, Buffer.prototype);

    return newBuf;
};

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset(offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint');
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
}

Buffer.prototype.readUintLE =
    Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) checkOffset(offset, byteLength, this.length);

        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength && (mul *= 0x100)) {
            val += this[offset + i] * mul;
        }

        return val;
    };

Buffer.prototype.readUintBE =
    Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) {
            checkOffset(offset, byteLength, this.length);
        }

        let val = this[offset + --byteLength];
        let mul = 1;
        while (byteLength > 0 && (mul *= 0x100)) {
            val += this[offset + --byteLength] * mul;
        }

        return val;
    };

Buffer.prototype.readUint8 =
    Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        return this[offset];
    };

Buffer.prototype.readUint16LE =
    Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] | (this[offset + 1] << 8);
    };

Buffer.prototype.readUint16BE =
    Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return (this[offset] << 8) | this[offset + 1];
    };

Buffer.prototype.readUint32LE =
    Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);

        return ((this[offset]) |
                (this[offset + 1] << 8) |
                (this[offset + 2] << 16)) +
            (this[offset + 3] * 0x1000000);
    };

Buffer.prototype.readUint32BE =
    Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);

        return (this[offset] * 0x1000000) +
            ((this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                this[offset + 3]);
    };

Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, 'offset');
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
    }

    const lo = first +
        this[++offset] * 2 ** 8 +
        this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 24;

    const hi = this[++offset] +
        this[++offset] * 2 ** 8 +
        this[++offset] * 2 ** 16 +
        last * 2 ** 24;

    return BigInt(lo) + (BigInt(hi) << BigInt(32));
});

Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, 'offset');
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
    }

    const hi = first * 2 ** 24 +
        this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 8 +
        this[++offset];

    const lo = this[++offset] * 2 ** 24 +
        this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 8 +
        last;

    return (BigInt(hi) << BigInt(32)) + BigInt(lo);
});

Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    let val = this[offset];
    let mul = 1;
    let i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val;
};

Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    let i = byteLength;
    let mul = 1;
    let val = this[offset + --i];
    while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val;
};

Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return (this[offset]);
    return ((0xff - this[offset] + 1) * -1);
};

Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    const val = this[offset] | (this[offset + 1] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    const val = this[offset + 1] | (this[offset] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24);
};

Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        (this[offset + 3]);
};

Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, 'offset');
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
    }

    const val = this[offset + 4] +
        this[offset + 5] * 2 ** 8 +
        this[offset + 6] * 2 ** 16 +
        (last << 24); // Overflow

    return (BigInt(val) << BigInt(32)) +
        BigInt(first +
            this[++offset] * 2 ** 8 +
            this[++offset] * 2 ** 16 +
            this[++offset] * 2 ** 24);
});

Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, 'offset');
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
    }

    const val = (first << 24) + // Overflow
        this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 8 +
        this[++offset];

    return (BigInt(val) << BigInt(32)) +
        BigInt(this[++offset] * 2 ** 24 +
            this[++offset] * 2 ** 16 +
            this[++offset] * 2 ** 8 +
            last);
});

Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return KrajeeIeee754.read(this, offset, true, 23, 4);
};

Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return KrajeeIeee754.read(this, offset, false, 23, 4);
};

Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 8, this.length);
    return KrajeeIeee754.read(this, offset, true, 52, 8);
};

Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 8, this.length);
    return KrajeeIeee754.read(this, offset, false, 52, 8);
};

function checkInt(buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
}

Buffer.prototype.writeUintLE =
    Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) {
            const maxBytes = Math.pow(2, 8 * byteLength) - 1;
            checkInt(this, value, offset, byteLength, maxBytes, 0);
        }

        let mul = 1;
        let i = 0;
        this[offset] = value & 0xFF;
        while (++i < byteLength && (mul *= 0x100)) {
            this[offset + i] = (value / mul) & 0xFF;
        }

        return offset + byteLength;
    };

Buffer.prototype.writeUintBE =
    Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) {
            const maxBytes = Math.pow(2, 8 * byteLength) - 1;
            checkInt(this, value, offset, byteLength, maxBytes, 0);
        }

        let i = byteLength - 1;
        let mul = 1;
        this[offset + i] = value & 0xFF;
        while (--i >= 0 && (mul *= 0x100)) {
            this[offset + i] = (value / mul) & 0xFF;
        }

        return offset + byteLength;
    };

Buffer.prototype.writeUint8 =
    Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
        this[offset] = (value & 0xff);
        return offset + 1;
    };

Buffer.prototype.writeUint16LE =
    Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        return offset + 2;
    };

Buffer.prototype.writeUint16BE =
    Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
        return offset + 2;
    };

Buffer.prototype.writeUint32LE =
    Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
        this[offset + 3] = (value >>> 24);
        this[offset + 2] = (value >>> 16);
        this[offset + 1] = (value >>> 8);
        this[offset] = (value & 0xff);
        return offset + 4;
    };

Buffer.prototype.writeUint32BE =
    Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
        return offset + 4;
    };

function wrtBigUInt64LE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);

    let lo = Number(value & BigInt(0xffffffff));
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    return offset;
}

function wrtBigUInt64BE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);

    let lo = Number(value & BigInt(0xffffffff));
    buf[offset + 7] = lo;
    lo = lo >> 8;
    buf[offset + 6] = lo;
    lo = lo >> 8;
    buf[offset + 5] = lo;
    lo = lo >> 8;
    buf[offset + 4] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
    buf[offset + 3] = hi;
    hi = hi >> 8;
    buf[offset + 2] = hi;
    hi = hi >> 8;
    buf[offset + 1] = hi;
    hi = hi >> 8;
    buf[offset] = hi;
    return offset + 8;
}

Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'));
});

Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'));
});

Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        const limit = Math.pow(2, (8 * byteLength) - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    let i = 0;
    let mul = 1;
    let sub = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1;
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
};

Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        const limit = Math.pow(2, (8 * byteLength) - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    let i = byteLength - 1;
    let mul = 1;
    let sub = 0;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1;
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
};

Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = (value & 0xff);
    return offset + 1;
};

Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
    return offset + 2;
};

Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
    return offset + 2;
};

Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
    this[offset + 2] = (value >>> 16);
    this[offset + 3] = (value >>> 24);
    return offset + 4;
};

Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
    return offset + 4;
};

Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'));
});

Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'));
});

function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
    if (offset < 0) throw new RangeError('Index out of range');
}

function writeFloat(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
    }
    KrajeeIeee754.write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
}

Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
};

Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
};

function writeDouble(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
    }
    KrajeeIeee754.write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
};

Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy(target, targetStart, start, end) {
    if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;

    // Copy 0 bytes; we're done
    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0;

    // Fatal error conditions
    if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds');
    }
    if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
    if (end < 0) throw new RangeError('sourceEnd out of bounds');

    // Are we oob?
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
    }

    const len = end - start;

    if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
        // Use built-in when available, missing from IE11
        this.copyWithin(targetStart, start, end);
    } else {
        Uint8Array.prototype.set.call(
            target,
            this.subarray(start, end),
            targetStart
        );
    }

    return len;
};

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill(val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
        if (typeof start === 'string') {
            encoding = start;
            start = 0;
            end = this.length;
        } else if (typeof end === 'string') {
            encoding = end;
            end = this.length;
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
            throw new TypeError('encoding must be a string');
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
            throw new TypeError('Unknown encoding: ' + encoding);
        }
        if (val.length === 1) {
            const code = val.charCodeAt(0);
            if ((encoding === 'utf8' && code < 128) ||
                encoding === 'latin1') {
                // Fast path: If `val` fits into a single byte, use that numeric value.
                val = code;
            }
        }
    } else if (typeof val === 'number') {
        val = val & 255;
    } else if (typeof val === 'boolean') {
        val = Number(val);
    }

    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index');
    }

    if (end <= start) {
        return this;
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;

    if (!val) val = 0;

    let i;
    if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
            this[i] = val;
        }
    } else {
        const bytes = Buffer.isBuffer(val)
            ? val
            : Buffer.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
            throw new TypeError('The value "' + val +
                '" is invalid for argument "value"');
        }
        for (i = 0; i < end - start; ++i) {
            this[i + start] = bytes[i % len];
        }
    }

    return this;
};

// CUSTOM ERRORS
// =============

// Simplified versions from Node, changed for Buffer-only usage
const errors = {};

function E(sym, getMessage, Base) {
    errors[sym] = class NodeError extends Base {
        constructor() {
            super();

            Object.defineProperty(this, 'message', {
                value: getMessage.apply(this, arguments),
                writable: true,
                configurable: true
            });

            // Add the error code to the name to include it in the stack trace.
            this.name = `${this.name} [${sym}]`;
            // Access the stack to generate the error message including the error code
            // from the name.
            this.stack; // eslint-disable-line no-unused-expressions
            // Reset the name to the actual name.
            delete this.name;
        }

        get code() {
            return sym;
        }

        set code(value) {
            Object.defineProperty(this, 'code', {
                configurable: true,
                enumerable: true,
                value,
                writable: true
            });
        }

        toString() {
            return `${this.name} [${sym}]: ${this.message}`;
        }
    };
}

E('ERR_BUFFER_OUT_OF_BOUNDS',
    function (name) {
        if (name) {
            return `${name} is outside of buffer bounds`;
        }

        return 'Attempt to access memory outside buffer bounds';
    }, RangeError);
E('ERR_INVALID_ARG_TYPE',
    function (name, actual) {
        return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
    }, TypeError);
E('ERR_OUT_OF_RANGE',
    function (str, range, input) {
        let msg = `The value of "${str}" is out of range.`;
        let received = input;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
        } else if (typeof input === 'bigint') {
            received = String(input);
            if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
                received = addNumericalSeparator(received);
            }
            received += 'n';
        }
        msg += ` It must be ${range}. Received ${received}`;
        return msg;
    }, RangeError);

function addNumericalSeparator(val) {
    let res = '';
    let i = val.length;
    const start = val[0] === '-' ? 1 : 0;
    for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
    }
    return `${val.slice(0, i)}${res}`;
}

// CHECK FUNCTIONS
// ===============

function checkBounds(buf, offset, byteLength) {
    validateNumber(offset, 'offset');
    if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
        boundsError(offset, buf.length - (byteLength + 1));
    }
}

function checkIntBI(value, min, max, buf, offset, byteLength) {
    if (value > max || value < min) {
        const n = typeof min === 'bigint' ? 'n' : '';
        let range;
        if (byteLength > 3) {
            if (min === 0 || min === BigInt(0)) {
                range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`;
            } else {
                range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
                    `${(byteLength + 1) * 8 - 1}${n}`;
            }
        } else {
            range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new errors.ERR_OUT_OF_RANGE('value', range, value);
    }
    checkBounds(buf, offset, byteLength);
}

function validateNumber(value, name) {
    if (typeof value !== 'number') {
        throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value);
    }
}

function boundsError(value, length, type) {
    if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value);
    }

    if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
    }

    throw new errors.ERR_OUT_OF_RANGE(type || 'offset',
        `>= ${type ? 1 : 0} and <= ${length}`,
        value);
}

// HELPER FUNCTIONS
// ================

const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

function base64clean(str) {
    // Node takes equal signs as end of the Base64 encoding
    str = str.split('=')[0];
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = str.trim().replace(INVALID_BASE64_RE, '');
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return '';
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
        str = str + '=';
    }
    return str;
}

function utf8ToBytes(string, units) {
    units = units || Infinity;
    let codePoint;
    const length = string.length;
    let leadSurrogate = null;
    const bytes = [];

    for (let i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
            // last char was a lead
            if (!leadSurrogate) {
                // no lead yet
                if (codePoint > 0xDBFF) {
                    // unexpected trail
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                    continue;
                } else if (i + 1 === length) {
                    // unpaired lead
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                    continue;
                }

                // valid lead
                leadSurrogate = codePoint;

                continue;
            }

            // 2 leads in a row
            if (codePoint < 0xDC00) {
                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                leadSurrogate = codePoint;
                continue;
            }

            // valid surrogate pair
            codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
        } else if (leadSurrogate) {
            // valid bmp char, but last char was a lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        }

        leadSurrogate = null;

        // encode utf8
        if (codePoint < 0x80) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
        } else if (codePoint < 0x800) {
            if ((units -= 2) < 0) break;
            bytes.push(
                codePoint >> 0x6 | 0xC0,
                codePoint & 0x3F | 0x80
            );
        } else if (codePoint < 0x10000) {
            if ((units -= 3) < 0) break;
            bytes.push(
                codePoint >> 0xC | 0xE0,
                codePoint >> 0x6 & 0x3F | 0x80,
                codePoint & 0x3F | 0x80
            );
        } else if (codePoint < 0x110000) {
            if ((units -= 4) < 0) break;
            bytes.push(
                codePoint >> 0x12 | 0xF0,
                codePoint >> 0xC & 0x3F | 0x80,
                codePoint >> 0x6 & 0x3F | 0x80,
                codePoint & 0x3F | 0x80
            );
        } else {
            throw new Error('Invalid code point');
        }
    }

    return bytes;
}

function asciiToBytes(str) {
    const byteArray = [];
    for (let i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF);
    }
    return byteArray;
}

function utf16leToBytes(str, units) {
    let c, hi, lo;
    const byteArray = [];
    for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;

        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
    }

    return byteArray;
}

function base64ToBytes(str) {
    return KrajeeBase64.toByteArray(base64clean(str));
}

function blitBuffer(src, dst, offset, length) {
    let i;
    for (i = 0; i < length; ++i) {
        if ((i + offset >= dst.length) || (i >= src.length)) break;
        dst[i + offset] = src[i];
    }
    return i;
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance(obj, type) {
    return obj instanceof type ||
        (obj != null && obj.constructor != null && obj.constructor.name != null &&
            obj.constructor.name === type.name);
}

function numberIsNaN(obj) {
    // For IE11 support
    return obj !== obj; // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
const hexSliceLookupTable = (function () {
    const alphabet = '0123456789abcdef';
    const table = new Array(256);
    for (let i = 0; i < 16; ++i) {
        const i16 = i * 16;
        for (let j = 0; j < 16; ++j) {
            table[i16 + j] = alphabet[i] + alphabet[j];
        }
    }
    return table;
})();

// Return not function with Error if BigInt not supported
function defineBigIntMethod(fn) {
    return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn;
}

function BufferBigIntNotDefined() {
    throw new Error('BigInt not supported');
}

/*!
 * Library to detect file mime type of a Uint8Array.
 *
 * Modified from https://github.com/sindresorhus/file-type to be used standalone on browser based apps.
 *
 * This library requires Node "buffer" module as a pre-requisite. The "buffer" module is made available in this repo
 * for standalone use via the `buffer.js` script which needs to be loaded before this file on the page.
 *
 * Author: Kartik Visweswaran, Krajee.com
 */
var KrajeeFileTypeConfig = {
    minimumBytes: 4100, // A fair amount of file-types are detectable within this range,
    defaultMessages: 'End-Of-Stream',
    tarHeaderChecksumMatches: function (buffer, offset = 0) {
        var readSum = Number.parseInt(buffer.toString('utf8', 148, 154).replace(/\0.*$/, '').trim(), 8); // Read sum in header
        if (Number.isNaN(readSum)) {
            return false;
        }

        var sum = 8 * 0x20; // Initialize signed bit sum

        for (let i = offset; i < offset + 148; i++) {
            sum += buffer[i];
        }

        for (let i = offset + 156; i < offset + 512; i++) {
            sum += buffer[i];
        }

        return readSum === sum;
    },
    uint32SyncSafeToken: {
        get: function (buffer, offset) {
            return (buffer[offset + 3] & 0x7F) | ((buffer[offset + 2]) << 7) | ((buffer[offset + 1]) << 14) | ((buffer[offset]) << 21);
        },
        len: 4,
    },
    dv: function (array) {
        return new DataView(array.buffer, array.byteOffset);
    },
    Token: {
        /**
         * 8-bit unsigned integer
         */
        UINT8: {
            len: 1,
            get: function (array, offset) {
                return KrajeeFileTypeConfig.dv(array).getUint8(offset);
            },
            put: function (array, offset, value) {
                KrajeeFileTypeConfig.dv(array).setUint8(offset, value);
                return offset + 1;
            }
        },
        /**
         * 16-bit unsigned integer, Little Endian byte order
         */
        UINT16_LE: {
            len: 2,
            get: function (array, offset) {
                return KrajeeFileTypeConfig.dv(array).getUint16(offset, true);
            },
            put: function (array, offset, value) {
                KrajeeFileTypeConfig.dv(array).setUint16(offset, value, true);
                return offset + 2;
            }
        },
        /**
         * 16-bit unsigned integer, Big Endian byte order
         */
        UINT16_BE: {
            len: 2,
            get: function (array, offset) {
                return KrajeeFileTypeConfig.dv(array).getUint16(offset);
            },
            put: function (array, offset, value) {
                KrajeeFileTypeConfig.dv(array).setUint16(offset, value);
                return offset + 2;
            }
        },
        /**
         * 32-bit unsigned integer, Big Endian byte order
         */
        INT32_BE: {
            len: 4,
            get: function (array, offset) {
                return KrajeeFileTypeConfig.dv(array).getInt32(offset);
            },
            put: function (array, offset, value) {
                KrajeeFileTypeConfig.dv(array).setInt32(offset, value);
                return offset + 4;
            }
        },
        /**
         * 32-bit unsigned integer, Little Endian byte order
         */
        UINT32_LE: {
            len: 4,
            get: function (array, offset) {
                return KrajeeFileTypeConfig.dv(array).getUint32(offset, true);
            },
            put: function (array, offset, value) {
                KrajeeFileTypeConfig.dv(array).setUint32(offset, value, true);
                return offset + 4;
            }
        },
        /**
         * 32-bit unsigned integer, Big Endian byte order
         */
        UINT32_BE: {
            len: 4,
            get: function (array, offset) {
                return KrajeeFileTypeConfig.dv(array).getUint32(offset);
            },
            put: function (array, offset, value) {
                KrajeeFileTypeConfig.dv(array).setUint32(offset, value);
                return offset + 4;
            }
        },

        /**
         * 64-bit unsigned integer, Little Endian byte order
         */
        UINT64_LE: {
            len: 8,
            get: function (array, offset) {
                return KrajeeFileTypeConfig.dv(array).getBigUint64(offset, true);
            },
            put: function (array, offset, value) {
                KrajeeFileTypeConfig.dv(array).setBigUint64(offset, value, true);
                return offset + 8;
            }
        },
        /**
         * 64-bit unsigned integer, Big Endian byte order
         */
        UINT64_BE: {
            len: 8,
            get: function (array, offset) {
                return KrajeeFileTypeConfig.dv(array).getBigUint64(offset);
            },
            put: function (array, offset, value) {
                KrajeeFileTypeConfig.dv(array).setBigUint64(offset, value);
                return offset + 8;
            }
        }
    }
};

class EndOfStreamError extends Error {
    constructor() {
        super(KrajeeFileTypeConfig.defaultMessages);
    }
}

class StringType {
    constructor(len, encoding) {
        this.len = len;
        this.encoding = encoding;
    }

    get(uint8Array, offset) {
        return Buffer.from(uint8Array).toString(this.encoding, offset, offset + this.len);
    }
}


async function fileTypeFromTokenizer(tokenizer) {
    try {
        return new FileTypeParser().parse(tokenizer);
    } catch (error) {
        if (!(error instanceof EndOfStreamError)) {
            throw error;
        }
    }
}

class BufferTokenizer {
    /**
     * Construct BufferTokenizer
     * @param uint8Array - Uint8Array to tokenize
     * @param fileInfo - Pass additional file information to the tokenizer
     */
    constructor(uint8Array, fileInfo) {
        /**
         * Tokenizer-stream position
         */
        this.position = 0;
        this.numBuffer = new Uint8Array(8);
        this.fileInfo = fileInfo ? fileInfo : {};
        this.uint8Array = uint8Array;
        this.fileInfo.size = this.fileInfo.size ? this.fileInfo.size : uint8Array.length;
    }

    /**
     * Read a token from the tokenizer-stream
     * @param token - The token to read
     * @param position - If provided, the desired position in the tokenizer-stream
     * @returns Promise with token data
     */
    async readToken(token, position = this.position) {
        const uint8Array = Buffer.alloc(token.len);
        const len = await this.readBuffer(uint8Array, {position});
        if (len < token.len)
            throw new EndOfStreamError();
        return token.get(uint8Array, 0);
    }

    /**
     * Peek a token from the tokenizer-stream.
     * @param token - Token to peek from the tokenizer-stream.
     * @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
     * @returns Promise with token data
     */
    async peekToken(token, position = this.position) {
        const uint8Array = Buffer.alloc(token.len);
        const len = await this.peekBuffer(uint8Array, {position});
        if (len < token.len)
            throw new EndOfStreamError();
        return token.get(uint8Array, 0);
    }

    /**
     * Read buffer from tokenizer
     * @param uint8Array - Uint8Array to tokenize
     * @param options - Read behaviour options
     * @returns {Promise<number>}
     */
    async readBuffer(uint8Array, options) {
        if (options && options.position) {
            if (options.position < this.position) {
                throw new Error('`options.position` must be equal or greater than `tokenizer.position`');
            }
            this.position = options.position;
        }
        const bytesRead = await this.peekBuffer(uint8Array, options);
        this.position += bytesRead;
        return bytesRead;
    }

    /**
     * Peek (read ahead) buffer from tokenizer
     * @param uint8Array
     * @param options - Read behaviour options
     * @returns {Promise<number>}
     */
    async peekBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        const bytes2read = Math.min(this.uint8Array.length - normOptions.position, normOptions.length);
        if ((!normOptions.mayBeLess) && bytes2read < normOptions.length) {
            throw new EndOfStreamError();
        } else {
            uint8Array.set(this.uint8Array.subarray(normOptions.position, normOptions.position + bytes2read), normOptions.offset);
            return bytes2read;
        }
    }

    /**
     * Read a numeric token from the stream
     * @param token - Numeric token
     * @returns Promise with number
     */
    async readNumber(token) {
        const len = await this.readBuffer(this.numBuffer, {length: token.len});
        if (len < token.len)
            throw new EndOfStreamError();
        return token.get(this.numBuffer, 0);
    }

    /**
     * Read a numeric token from the stream
     * @param token - Numeric token
     * @returns Promise with number
     */
    async peekNumber(token) {
        const len = await this.peekBuffer(this.numBuffer, {length: token.len});
        if (len < token.len)
            throw new EndOfStreamError();
        return token.get(this.numBuffer, 0);
    }

    async close() {
        // empty
    }

    /**
     *  Ignore number of bytes, advances the pointer in under tokenizer-stream.
     * @param length - Number of bytes to ignore
     * @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
     */
    async ignore(length) {
        if (this.fileInfo.size !== undefined) {
            const bytesLeft = this.fileInfo.size - this.position;
            if (length > bytesLeft) {
                this.position += bytesLeft;
                return bytesLeft;
            }
        }
        this.position += length;
        return length;
    }

    normalizeOptions(uint8Array, options) {
        if (options && options.position !== undefined && options.position < this.position) {
            throw new Error('`options.position` must be equal or greater than `tokenizer.position`');
        }
        if (options) {
            return {
                mayBeLess: options.mayBeLess === true,
                offset: options.offset ? options.offset : 0,
                length: options.length ? options.length : (uint8Array.length - (options.offset ? options.offset : 0)),
                position: options.position ? options.position : this.position
            };
        }
        return {
            mayBeLess: false,
            offset: 0,
            length: uint8Array.length,
            position: this.position
        };
    }
}

class FileTypeParser {
    _check(buffer, headers, options) {
        options = {
            offset: 0,
            ...options,
        };

        for (const [index, header] of headers.entries()) {
            // If a bitmask is set
            if (options.mask) {
                // If header doesn't equal `buf` with bits masked off
                if (header !== (options.mask[index] & buffer[index + options.offset])) {
                    return false;
                }
            } else if (header !== buffer[index + options.offset]) {
                return false;
            }
        }

        return true;
    }

    check(header, options) {
        return this._check(this.buffer, header, options);
    }

    stringToBytes(string) {
        return [...string].map(character => character.charCodeAt(0));
    }

    checkString(header, options) {
        return this.check(this.stringToBytes(header), options);
    }

    async parse(input) {
        if (!(input instanceof Uint8Array || input instanceof ArrayBuffer || input instanceof BufferTokenizer)) {
            throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`Buffer\` or \`ArrayBuffer\`, got \`${typeof input}\``);
        }
        let tokenizer = input;
        if (!(tokenizer instanceof BufferTokenizer)) {
            const buffer = input instanceof Uint8Array ? input : new Uint8Array(input);
            if (!(buffer && buffer.length > 1)) {
                return;
            }
            tokenizer = new BufferTokenizer(buffer);
        }

        try {
            return this.parseTokenizer(tokenizer);
        } catch (error) {
            if (!(error instanceof EndOfStreamError)) {
                throw error;
            }
        }
    }

    async parseTokenizer(tokenizer) {
        const Token = KrajeeFileTypeConfig.Token;

        this.buffer = Buffer.alloc(KrajeeFileTypeConfig.minimumBytes);
        // Keep reading until EOF if the file size is unknown.
        if (tokenizer.fileInfo.size === undefined) {
            tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER;
        }

        this.tokenizer = tokenizer;

        await tokenizer.peekBuffer(this.buffer, {length: 12, mayBeLess: true});

        // -- 2-byte signatures --

        if (this.check([0x42, 0x4D])) {
            return {
                ext: 'bmp',
                mime: 'image/bmp',
            };
        }

        if (this.check([0x0B, 0x77])) {
            return {
                ext: 'ac3',
                mime: 'audio/vnd.dolby.dd-raw',
            };
        }

        if (this.check([0x78, 0x01])) {
            return {
                ext: 'dmg',
                mime: 'application/x-apple-diskimage',
            };
        }

        if (this.check([0x4D, 0x5A])) {
            return {
                ext: 'exe',
                mime: 'application/x-msdownload',
            };
        }

        if (this.check([0x25, 0x21])) {
            await tokenizer.peekBuffer(this.buffer, {length: 24, mayBeLess: true});

            if (
                this.checkString('PS-Adobe-', {offset: 2})
                && this.checkString(' EPSF-', {offset: 14})
            ) {
                return {
                    ext: 'eps',
                    mime: 'application/eps',
                };
            }

            return {
                ext: 'ps',
                mime: 'application/postscript',
            };
        }

        if (this.check([0x1F, 0xA0]) || this.check([0x1F, 0x9D])) {
            return {
                ext: 'Z',
                mime: 'application/x-compress',
            };
        }

        // -- 3-byte signatures --
        if (this.check([0x47, 0x49, 0x46])) {
            return {
                ext: 'gif',
                mime: 'image/gif',
            };
        }

        if (this.check([0xFF, 0xD8, 0xFF])) {
            return {
                ext: 'jpg',
                mime: 'image/jpeg',
            };
        }

        if (this.check([0x49, 0x49, 0xBC])) {
            return {
                ext: 'jxr',
                mime: 'image/vnd.ms-photo',
            };
        }

        if (this.check([0x1F, 0x8B, 0x8])) {
            return {
                ext: 'gz',
                mime: 'application/gzip',
            };
        }

        if (this.check([0x42, 0x5A, 0x68])) {
            return {
                ext: 'bz2',
                mime: 'application/x-bzip2',
            };
        }

        if (this.checkString('ID3')) {
            await tokenizer.ignore(6); // Skip ID3 header until the header size
            const id3HeaderLength = await tokenizer.readToken(KrajeeFileTypeConfig.uint32SyncSafeToken);
            if (tokenizer.position + id3HeaderLength > tokenizer.fileInfo.size) {
                // Guess file type based on ID3 header for backward compatibility
                return {
                    ext: 'mp3',
                    mime: 'audio/mpeg',
                };
            }

            await tokenizer.ignore(id3HeaderLength);
            console.log("KV SAYS", typeof tokenizer, tokenizer);
            return fileTypeFromTokenizer(tokenizer); // Skip ID3 header, recursion
        }

        // Musepack, SV7
        if (this.checkString('MP+')) {
            return {
                ext: 'mpc',
                mime: 'audio/x-musepack',
            };
        }

        if (
            (this.buffer[0] === 0x43 || this.buffer[0] === 0x46)
            && this.check([0x57, 0x53], {offset: 1})
        ) {
            return {
                ext: 'swf',
                mime: 'application/x-shockwave-flash',
            };
        }

        // -- 4-byte signatures --

        if (this.checkString('FLIF')) {
            return {
                ext: 'flif',
                mime: 'image/flif',
            };
        }

        if (this.checkString('8BPS')) {
            return {
                ext: 'psd',
                mime: 'image/vnd.adobe.photoshop',
            };
        }

        if (this.checkString('WEBP', {offset: 8})) {
            return {
                ext: 'webp',
                mime: 'image/webp',
            };
        }

        // Musepack, SV8
        if (this.checkString('MPCK')) {
            return {
                ext: 'mpc',
                mime: 'audio/x-musepack',
            };
        }

        if (this.checkString('FORM')) {
            return {
                ext: 'aif',
                mime: 'audio/aiff',
            };
        }

        if (this.checkString('icns', {offset: 0})) {
            return {
                ext: 'icns',
                mime: 'image/icns',
            };
        }

        // Zip-based file formats
        // Need to be before the `zip` check
        if (this.check([0x50, 0x4B, 0x3, 0x4])) { // Local file header signature
            try {
                while (tokenizer.position + 30 < tokenizer.fileInfo.size) {
                    await tokenizer.readBuffer(this.buffer, {length: 30});

                    // https://en.wikipedia.org/wiki/Zip_(file_format)#File_headers
                    const zipHeader = {
                        compressedSize: this.buffer.readUInt32LE(18),
                        uncompressedSize: this.buffer.readUInt32LE(22),
                        filenameLength: this.buffer.readUInt16LE(26),
                        extraFieldLength: this.buffer.readUInt16LE(28),
                    };

                    zipHeader.filename = await tokenizer.readToken(new StringType(zipHeader.filenameLength, 'utf-8'));
                    await tokenizer.ignore(zipHeader.extraFieldLength);

                    // Assumes signed `.xpi` from addons.mozilla.org
                    if (zipHeader.filename === 'META-INF/mozilla.rsa') {
                        return {
                            ext: 'xpi',
                            mime: 'application/x-xpinstall',
                        };
                    }

                    if (zipHeader.filename.endsWith('.rels') || zipHeader.filename.endsWith('.xml')) {
                        const type = zipHeader.filename.split('/')[0];
                        switch (type) {
                            case '_rels':
                                break;
                            case 'word':
                                return {
                                    ext: 'docx',
                                    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                };
                            case 'ppt':
                                return {
                                    ext: 'pptx',
                                    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                };
                            case 'xl':
                                return {
                                    ext: 'xlsx',
                                    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                };
                            default:
                                break;
                        }
                    }

                    if (zipHeader.filename.startsWith('xl/')) {
                        return {
                            ext: 'xlsx',
                            mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        };
                    }

                    if (zipHeader.filename.startsWith('3D/') && zipHeader.filename.endsWith('.model')) {
                        return {
                            ext: '3mf',
                            mime: 'model/3mf',
                        };
                    }

                    // The docx, xlsx and pptx file types extend the Office Open XML file format:
                    // https://en.wikipedia.org/wiki/Office_Open_XML_file_formats
                    // We look for:
                    // - one entry named '[Content_Types].xml' or '_rels/.rels',
                    // - one entry indicating specific type of file.
                    // MS Office, OpenOffice and LibreOffice may put the parts in different order, so the check should not rely on it.
                    if (zipHeader.filename === 'mimetype' && zipHeader.compressedSize === zipHeader.uncompressedSize) {
                        const mimeType = (await tokenizer.readToken(new StringType(zipHeader.compressedSize, 'utf-8'))).trim();

                        switch (mimeType) {
                            case 'application/epub+zip':
                                return {
                                    ext: 'epub',
                                    mime: 'application/epub+zip',
                                };
                            case 'application/vnd.oasis.opendocument.text':
                                return {
                                    ext: 'odt',
                                    mime: 'application/vnd.oasis.opendocument.text',
                                };
                            case 'application/vnd.oasis.opendocument.spreadsheet':
                                return {
                                    ext: 'ods',
                                    mime: 'application/vnd.oasis.opendocument.spreadsheet',
                                };
                            case 'application/vnd.oasis.opendocument.presentation':
                                return {
                                    ext: 'odp',
                                    mime: 'application/vnd.oasis.opendocument.presentation',
                                };
                            default:
                        }
                    }

                    // Try to find next header manually when current one is corrupted
                    if (zipHeader.compressedSize === 0) {
                        let nextHeaderIndex = -1;

                        while (nextHeaderIndex < 0 && (tokenizer.position < tokenizer.fileInfo.size)) {
                            await tokenizer.peekBuffer(this.buffer, {mayBeLess: true});

                            nextHeaderIndex = this.buffer.indexOf('504B0304', 0, 'hex');
                            // Move position to the next header if found, skip the whole buffer otherwise
                            await tokenizer.ignore(nextHeaderIndex >= 0 ? nextHeaderIndex : this.buffer.length);
                        }
                    } else {
                        await tokenizer.ignore(zipHeader.compressedSize);
                    }
                }
            } catch (error) {
                if (!(error instanceof EndOfStreamError)) {
                    throw error;
                }
            }

            return {
                ext: 'zip',
                mime: 'application/zip',
            };
        }

        if (this.checkString('OggS')) {
            // This is an OGG container
            await tokenizer.ignore(28);
            const type = Buffer.alloc(8);
            await tokenizer.readBuffer(type);

            // Needs to be before `ogg` check
            if (this._check(type, [0x4F, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64])) {
                return {
                    ext: 'opus',
                    mime: 'audio/opus',
                };
            }

            // If ' theora' in header.
            if (this._check(type, [0x80, 0x74, 0x68, 0x65, 0x6F, 0x72, 0x61])) {
                return {
                    ext: 'ogv',
                    mime: 'video/ogg',
                };
            }

            // If '\x01video' in header.
            if (this._check(type, [0x01, 0x76, 0x69, 0x64, 0x65, 0x6F, 0x00])) {
                return {
                    ext: 'ogm',
                    mime: 'video/ogg',
                };
            }

            // If ' FLAC' in header  https://xiph.org/flac/faq.html
            if (this._check(type, [0x7F, 0x46, 0x4C, 0x41, 0x43])) {
                return {
                    ext: 'oga',
                    mime: 'audio/ogg',
                };
            }

            // 'Speex  ' in header https://en.wikipedia.org/wiki/Speex
            if (this._check(type, [0x53, 0x70, 0x65, 0x65, 0x78, 0x20, 0x20])) {
                return {
                    ext: 'spx',
                    mime: 'audio/ogg',
                };
            }

            // If '\x01vorbis' in header
            if (this._check(type, [0x01, 0x76, 0x6F, 0x72, 0x62, 0x69, 0x73])) {
                return {
                    ext: 'ogg',
                    mime: 'audio/ogg',
                };
            }

            // Default OGG container https://www.iana.org/assignments/media-types/application/ogg
            return {
                ext: 'ogx',
                mime: 'application/ogg',
            };
        }

        if (
            this.check([0x50, 0x4B])
            && (this.buffer[2] === 0x3 || this.buffer[2] === 0x5 || this.buffer[2] === 0x7)
            && (this.buffer[3] === 0x4 || this.buffer[3] === 0x6 || this.buffer[3] === 0x8)
        ) {
            return {
                ext: 'zip',
                mime: 'application/zip',
            };
        }

        //

        // File Type Box (https://en.wikipedia.org/wiki/ISO_base_media_file_format)
        // It's not required to be first, but it's recommended to be. Almost all ISO base media files start with `ftyp` box.
        // `ftyp` box must contain a brand major identifier, which must consist of ISO 8859-1 printable characters.
        // Here we check for 8859-1 printable characters (for simplicity, it's a mask which also catches one non-printable character).
        if (
            this.checkString('ftyp', {offset: 4})
            && (this.buffer[8] & 0x60) !== 0x00 // Brand major, first character ASCII?
        ) {
            // They all can have MIME `video/mp4` except `application/mp4` special-case which is hard to detect.
            // For some cases, we're specific, everything else falls to `video/mp4` with `mp4` extension.
            const brandMajor = this.buffer.toString('binary', 8, 12).replace('\0', ' ').trim();
            switch (brandMajor) {
                case 'avif':
                case 'avis':
                    return {ext: 'avif', mime: 'image/avif'};
                case 'mif1':
                    return {ext: 'heic', mime: 'image/heif'};
                case 'msf1':
                    return {ext: 'heic', mime: 'image/heif-sequence'};
                case 'heic':
                case 'heix':
                    return {ext: 'heic', mime: 'image/heic'};
                case 'hevc':
                case 'hevx':
                    return {ext: 'heic', mime: 'image/heic-sequence'};
                case 'qt':
                    return {ext: 'mov', mime: 'video/quicktime'};
                case 'M4V':
                case 'M4VH':
                case 'M4VP':
                    return {ext: 'm4v', mime: 'video/x-m4v'};
                case 'M4P':
                    return {ext: 'm4p', mime: 'video/mp4'};
                case 'M4B':
                    return {ext: 'm4b', mime: 'audio/mp4'};
                case 'M4A':
                    return {ext: 'm4a', mime: 'audio/x-m4a'};
                case 'F4V':
                    return {ext: 'f4v', mime: 'video/mp4'};
                case 'F4P':
                    return {ext: 'f4p', mime: 'video/mp4'};
                case 'F4A':
                    return {ext: 'f4a', mime: 'audio/mp4'};
                case 'F4B':
                    return {ext: 'f4b', mime: 'audio/mp4'};
                case 'crx':
                    return {ext: 'cr3', mime: 'image/x-canon-cr3'};
                default:
                    if (brandMajor.startsWith('3g')) {
                        if (brandMajor.startsWith('3g2')) {
                            return {ext: '3g2', mime: 'video/3gpp2'};
                        }

                        return {ext: '3gp', mime: 'video/3gpp'};
                    }

                    return {ext: 'mp4', mime: 'video/mp4'};
            }
        }

        if (this.checkString('MThd')) {
            return {
                ext: 'mid',
                mime: 'audio/midi',
            };
        }

        if (
            this.checkString('wOFF')
            && (
                this.check([0x00, 0x01, 0x00, 0x00], {offset: 4})
                || this.checkString('OTTO', {offset: 4})
            )
        ) {
            return {
                ext: 'woff',
                mime: 'font/woff',
            };
        }

        if (this.checkString('wOF2') && (this.check([0x00, 0x01, 0x00, 0x00], {offset: 4}) || this.checkString('OTTO', {offset: 4}))) {
            return {
                ext: 'woff2',
                mime: 'font/woff2',
            };
        }

        if (this.check([0xD4, 0xC3, 0xB2, 0xA1]) || this.check([0xA1, 0xB2, 0xC3, 0xD4])) {
            return {
                ext: 'pcap',
                mime: 'application/vnd.tcpdump.pcap',
            };
        }

        // Sony DSD Stream File (DSF)
        if (this.checkString('DSD ')) {
            return {
                ext: 'dsf',
                mime: 'audio/x-dsf', // Non-standard
            };
        }

        if (this.checkString('LZIP')) {
            return {
                ext: 'lz',
                mime: 'application/x-lzip',
            };
        }

        if (this.checkString('fLaC')) {
            return {
                ext: 'flac',
                mime: 'audio/x-flac',
            };
        }

        if (this.check([0x42, 0x50, 0x47, 0xFB])) {
            return {
                ext: 'bpg',
                mime: 'image/bpg',
            };
        }

        if (this.checkString('wvpk')) {
            return {
                ext: 'wv',
                mime: 'audio/wavpack',
            };
        }

        if (this.checkString('%PDF')) {
            await tokenizer.ignore(1350);
            const maxBufferSize = 10 * 1024 * 1024;
            const buffer = Buffer.alloc(Math.min(maxBufferSize, tokenizer.fileInfo.size));
            await tokenizer.readBuffer(buffer, {mayBeLess: true});

            // Check if this is an Adobe Illustrator file
            if (buffer.includes(Buffer.from('AIPrivateData'))) {
                return {
                    ext: 'ai',
                    mime: 'application/postscript',
                };
            }

            // Assume this is just a normal PDF
            return {
                ext: 'pdf',
                mime: 'application/pdf',
            };
        }

        if (this.check([0x00, 0x61, 0x73, 0x6D])) {
            return {
                ext: 'wasm',
                mime: 'application/wasm',
            };
        }

        // TIFF, little-endian type
        if (this.check([0x49, 0x49])) {
            const fileType = await this.readTiffHeader(false);
            if (fileType) {
                return fileType;
            }
        }

        // TIFF, big-endian type
        if (this.check([0x4D, 0x4D])) {
            const fileType = await this.readTiffHeader(true);
            if (fileType) {
                return fileType;
            }
        }

        if (this.checkString('MAC ')) {
            return {
                ext: 'ape',
                mime: 'audio/ape',
            };
        }

        // https://github.com/threatstack/libmagic/blob/master/magic/Magdir/matroska
        if (this.check([0x1A, 0x45, 0xDF, 0xA3])) { // Root element: EBML
            async function readField() {
                const msb = await tokenizer.peekNumber(Token.UINT8);
                let mask = 0x80;
                let ic = 0; // 0 = A, 1 = B, 2 = C, 3
                // = D

                while ((msb & mask) === 0) {
                    ++ic;
                    mask >>= 1;
                }

                const id = Buffer.alloc(ic + 1);
                await tokenizer.readBuffer(id);
                return id;
            }

            async function readElement() {
                const id = await readField();
                const lengthField = await readField();
                lengthField[0] ^= 0x80 >> (lengthField.length - 1);
                const nrLength = Math.min(6, lengthField.length); // JavaScript can max read 6 bytes integer
                return {
                    id: id.readUIntBE(0, id.length),
                    len: lengthField.readUIntBE(lengthField.length - nrLength, nrLength),
                };
            }

            async function readChildren(level, children) {
                while (children > 0) {
                    const element = await readElement();
                    if (element.id === 0x42_82) {
                        const rawValue = await tokenizer.readToken(new StringType(element.len, 'utf-8'));
                        return rawValue.replace(/\00.*$/g, ''); // Return DocType
                    }

                    await tokenizer.ignore(element.len); // ignore payload
                    --children;
                }
            }

            const re = await readElement();
            const docType = await readChildren(1, re.len);

            switch (docType) {
                case 'webm':
                    return {
                        ext: 'webm',
                        mime: 'video/webm',
                    };

                case 'matroska':
                    return {
                        ext: 'mkv',
                        mime: 'video/x-matroska',
                    };

                default:
                    return;
            }
        }

        // RIFF file format which might be AVI, WAV, QCP, etc
        if (this.check([0x52, 0x49, 0x46, 0x46])) {
            if (this.check([0x41, 0x56, 0x49], {offset: 8})) {
                return {
                    ext: 'avi',
                    mime: 'video/vnd.avi',
                };
            }

            if (this.check([0x57, 0x41, 0x56, 0x45], {offset: 8})) {
                return {
                    ext: 'wav',
                    mime: 'audio/vnd.wave',
                };
            }

            // QLCM, QCP file
            if (this.check([0x51, 0x4C, 0x43, 0x4D], {offset: 8})) {
                return {
                    ext: 'qcp',
                    mime: 'audio/qcelp',
                };
            }
        }

        if (this.checkString('SQLi')) {
            return {
                ext: 'sqlite',
                mime: 'application/x-sqlite3',
            };
        }

        if (this.check([0x4E, 0x45, 0x53, 0x1A])) {
            return {
                ext: 'nes',
                mime: 'application/x-nintendo-nes-rom',
            };
        }

        if (this.checkString('Cr24')) {
            return {
                ext: 'crx',
                mime: 'application/x-google-chrome-extension',
            };
        }

        if (
            this.checkString('MSCF')
            || this.checkString('ISc(')
        ) {
            return {
                ext: 'cab',
                mime: 'application/vnd.ms-cab-compressed',
            };
        }

        if (this.check([0xED, 0xAB, 0xEE, 0xDB])) {
            return {
                ext: 'rpm',
                mime: 'application/x-rpm',
            };
        }

        if (this.check([0xC5, 0xD0, 0xD3, 0xC6])) {
            return {
                ext: 'eps',
                mime: 'application/eps',
            };
        }

        if (this.check([0x28, 0xB5, 0x2F, 0xFD])) {
            return {
                ext: 'zst',
                mime: 'application/zstd',
            };
        }

        if (this.check([0x7F, 0x45, 0x4C, 0x46])) {
            return {
                ext: 'elf',
                mime: 'application/x-elf',
            };
        }

        // -- 5-byte signatures --

        if (this.check([0x4F, 0x54, 0x54, 0x4F, 0x00])) {
            return {
                ext: 'otf',
                mime: 'font/otf',
            };
        }

        if (this.checkString('#!AMR')) {
            return {
                ext: 'amr',
                mime: 'audio/amr',
            };
        }

        if (this.checkString('{\\rtf')) {
            return {
                ext: 'rtf',
                mime: 'application/rtf',
            };
        }

        if (this.check([0x46, 0x4C, 0x56, 0x01])) {
            return {
                ext: 'flv',
                mime: 'video/x-flv',
            };
        }

        if (this.checkString('IMPM')) {
            return {
                ext: 'it',
                mime: 'audio/x-it',
            };
        }

        if (
            this.checkString('-lh0-', {offset: 2})
            || this.checkString('-lh1-', {offset: 2})
            || this.checkString('-lh2-', {offset: 2})
            || this.checkString('-lh3-', {offset: 2})
            || this.checkString('-lh4-', {offset: 2})
            || this.checkString('-lh5-', {offset: 2})
            || this.checkString('-lh6-', {offset: 2})
            || this.checkString('-lh7-', {offset: 2})
            || this.checkString('-lzs-', {offset: 2})
            || this.checkString('-lz4-', {offset: 2})
            || this.checkString('-lz5-', {offset: 2})
            || this.checkString('-lhd-', {offset: 2})
        ) {
            return {
                ext: 'lzh',
                mime: 'application/x-lzh-compressed',
            };
        }

        // MPEG program stream (PS or MPEG-PS)
        if (this.check([0x00, 0x00, 0x01, 0xBA])) {
            //  MPEG-PS, MPEG-1 Part 1
            if (this.check([0x21], {offset: 4, mask: [0xF1]})) {
                return {
                    ext: 'mpg', // May also be .ps, .mpeg
                    mime: 'video/MP1S',
                };
            }

            // MPEG-PS, MPEG-2 Part 1
            if (this.check([0x44], {offset: 4, mask: [0xC4]})) {
                return {
                    ext: 'mpg', // May also be .mpg, .m2p, .vob or .sub
                    mime: 'video/MP2P',
                };
            }
        }

        if (this.checkString('ITSF')) {
            return {
                ext: 'chm',
                mime: 'application/vnd.ms-htmlhelp',
            };
        }

        // -- 6-byte signatures --

        if (this.check([0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00])) {
            return {
                ext: 'xz',
                mime: 'application/x-xz',
            };
        }

        if (this.checkString('<?xml ')) {
            return {
                ext: 'xml',
                mime: 'application/xml',
            };
        }

        if (this.check([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])) {
            return {
                ext: '7z',
                mime: 'application/x-7z-compressed',
            };
        }

        if (
            this.check([0x52, 0x61, 0x72, 0x21, 0x1A, 0x7])
            && (this.buffer[6] === 0x0 || this.buffer[6] === 0x1)
        ) {
            return {
                ext: 'rar',
                mime: 'application/x-rar-compressed',
            };
        }

        if (this.checkString('solid ')) {
            return {
                ext: 'stl',
                mime: 'model/stl',
            };
        }

        // -- 7-byte signatures --

        if (this.checkString('BLENDER')) {
            return {
                ext: 'blend',
                mime: 'application/x-blender',
            };
        }

        if (this.checkString('!<arch>')) {
            await tokenizer.ignore(8);
            const string = await tokenizer.readToken(new StringType(13, 'ascii'));
            if (string === 'debian-binary') {
                return {
                    ext: 'deb',
                    mime: 'application/x-deb',
                };
            }

            return {
                ext: 'ar',
                mime: 'application/x-unix-archive',
            };
        }

        // -- 8-byte signatures --

        if (this.check([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
            // APNG format (https://wiki.mozilla.org/APNG_Specification)
            // 1. Find the first IDAT (image data) chunk (49 44 41 54)
            // 2. Check if there is an "acTL" chunk before the IDAT one (61 63 54 4C)

            // Offset calculated as follows:
            // - 8 bytes: PNG signature
            // - 4 (length) + 4 (chunk type) + 13 (chunk data) + 4 (CRC): IHDR chunk

            await tokenizer.ignore(8); // ignore PNG signature

            async function readChunkHeader() {
                return {
                    length: await tokenizer.readToken(Token.INT32_BE),
                    type: await tokenizer.readToken(new StringType(4, 'binary')),
                };
            }

            do {
                const chunk = await readChunkHeader();
                if (chunk.length < 0) {
                    return; // Invalid chunk length
                }

                switch (chunk.type) {
                    case 'IDAT':
                        return {
                            ext: 'png',
                            mime: 'image/png',
                        };
                    case 'acTL':
                        return {
                            ext: 'apng',
                            mime: 'image/apng',
                        };
                    default:
                        await tokenizer.ignore(chunk.length + 4); // Ignore chunk-data + CRC
                }
            } while (tokenizer.position + 8 < tokenizer.fileInfo.size);

            return {
                ext: 'png',
                mime: 'image/png',
            };
        }

        if (this.check([0x41, 0x52, 0x52, 0x4F, 0x57, 0x31, 0x00, 0x00])) {
            return {
                ext: 'arrow',
                mime: 'application/x-apache-arrow',
            };
        }

        if (this.check([0x67, 0x6C, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00])) {
            return {
                ext: 'glb',
                mime: 'model/gltf-binary',
            };
        }

        // `mov` format variants
        if (
            this.check([0x66, 0x72, 0x65, 0x65], {offset: 4}) // `free`
            || this.check([0x6D, 0x64, 0x61, 0x74], {offset: 4}) // `mdat` MJPEG
            || this.check([0x6D, 0x6F, 0x6F, 0x76], {offset: 4}) // `moov`
            || this.check([0x77, 0x69, 0x64, 0x65], {offset: 4}) // `wide`
        ) {
            return {
                ext: 'mov',
                mime: 'video/quicktime',
            };
        }

        if (this.check([0xEF, 0xBB, 0xBF]) && this.checkString('<?xml', {offset: 3})) { // UTF-8-BOM
            return {
                ext: 'xml',
                mime: 'application/xml',
            };
        }

        // -- 9-byte signatures --

        if (this.check([0x49, 0x49, 0x52, 0x4F, 0x08, 0x00, 0x00, 0x00, 0x18])) {
            return {
                ext: 'orf',
                mime: 'image/x-olympus-orf',
            };
        }

        if (this.checkString('gimp xcf ')) {
            return {
                ext: 'xcf',
                mime: 'image/x-xcf',
            };
        }

        // -- 12-byte signatures --

        if (this.check([0x49, 0x49, 0x55, 0x00, 0x18, 0x00, 0x00, 0x00, 0x88, 0xE7, 0x74, 0xD8])) {
            return {
                ext: 'rw2',
                mime: 'image/x-panasonic-rw2',
            };
        }

        // ASF_Header_Object first 80 bytes
        if (this.check([0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11, 0xA6, 0xD9])) {
            async function readHeader() {
                const guid = Buffer.alloc(16);
                await tokenizer.readBuffer(guid);
                return {
                    id: guid,
                    size: Number(await tokenizer.readToken(Token.UINT64_LE)),
                };
            }

            await tokenizer.ignore(30);
            // Search for header should be in first 1KB of file.
            while (tokenizer.position + 24 < tokenizer.fileInfo.size) {
                const header = await readHeader();
                let payload = header.size - 24;
                if (this._check(header.id, [0x91, 0x07, 0xDC, 0xB7, 0xB7, 0xA9, 0xCF, 0x11, 0x8E, 0xE6, 0x00, 0xC0, 0x0C, 0x20, 0x53, 0x65])) {
                    // Sync on Stream-Properties-Object (B7DC0791-A9B7-11CF-8EE6-00C00C205365)
                    const typeId = Buffer.alloc(16);
                    payload -= await tokenizer.readBuffer(typeId);

                    if (this._check(typeId, [0x40, 0x9E, 0x69, 0xF8, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B])) {
                        // Found audio:
                        return {
                            ext: 'asf',
                            mime: 'audio/x-ms-asf',
                        };
                    }

                    if (this._check(typeId, [0xC0, 0xEF, 0x19, 0xBC, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B])) {
                        // Found video:
                        return {
                            ext: 'asf',
                            mime: 'video/x-ms-asf',
                        };
                    }

                    break;
                }

                await tokenizer.ignore(payload);
            }

            // Default to ASF generic extension
            return {
                ext: 'asf',
                mime: 'application/vnd.ms-asf',
            };
        }

        if (this.check([0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A])) {
            return {
                ext: 'ktx',
                mime: 'image/ktx',
            };
        }

        if ((this.check([0x7E, 0x10, 0x04]) || this.check([0x7E, 0x18, 0x04])) && this.check([0x30, 0x4D, 0x49, 0x45], {offset: 4})) {
            return {
                ext: 'mie',
                mime: 'application/x-mie',
            };
        }

        if (this.check([0x27, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], {offset: 2})) {
            return {
                ext: 'shp',
                mime: 'application/x-esri-shape',
            };
        }

        if (this.check([0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20, 0x0D, 0x0A, 0x87, 0x0A])) {
            // JPEG-2000 family

            await tokenizer.ignore(20);
            const type = await tokenizer.readToken(new StringType(4, 'ascii'));
            switch (type) {
                case 'jp2 ':
                    return {
                        ext: 'jp2',
                        mime: 'image/jp2',
                    };
                case 'jpx ':
                    return {
                        ext: 'jpx',
                        mime: 'image/jpx',
                    };
                case 'jpm ':
                    return {
                        ext: 'jpm',
                        mime: 'image/jpm',
                    };
                case 'mjp2':
                    return {
                        ext: 'mj2',
                        mime: 'image/mj2',
                    };
                default:
                    return;
            }
        }

        if (
            this.check([0xFF, 0x0A])
            || this.check([0x00, 0x00, 0x00, 0x0C, 0x4A, 0x58, 0x4C, 0x20, 0x0D, 0x0A, 0x87, 0x0A])
        ) {
            return {
                ext: 'jxl',
                mime: 'image/jxl',
            };
        }

        if (
            this.check([0xFE, 0xFF, 0, 60, 0, 63, 0, 120, 0, 109, 0, 108]) // UTF-16-BOM-LE
            || this.check([0xFF, 0xFE, 60, 0, 63, 0, 120, 0, 109, 0, 108, 0]) // UTF-16-BOM-LE
        ) {
            return {
                ext: 'xml',
                mime: 'application/xml',
            };
        }

        // -- Unsafe signatures --

        if (
            this.check([0x0, 0x0, 0x1, 0xBA])
            || this.check([0x0, 0x0, 0x1, 0xB3])
        ) {
            return {
                ext: 'mpg',
                mime: 'video/mpeg',
            };
        }

        if (this.check([0x00, 0x01, 0x00, 0x00, 0x00])) {
            return {
                ext: 'ttf',
                mime: 'font/ttf',
            };
        }

        if (this.check([0x00, 0x00, 0x01, 0x00])) {
            return {
                ext: 'ico',
                mime: 'image/x-icon',
            };
        }

        if (this.check([0x00, 0x00, 0x02, 0x00])) {
            return {
                ext: 'cur',
                mime: 'image/x-icon',
            };
        }

        if (this.check([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])) {
            // Detected Microsoft Compound File Binary File (MS-CFB) Format.
            return {
                ext: 'cfb',
                mime: 'application/x-cfb',
            };
        }

        // Increase sample size from 12 to 256.
        await tokenizer.peekBuffer(this.buffer, {length: Math.min(256, tokenizer.fileInfo.size), mayBeLess: true});

        // -- 15-byte signatures --

        if (this.checkString('BEGIN:')) {
            if (this.checkString('VCARD', {offset: 6})) {
                return {
                    ext: 'vcf',
                    mime: 'text/vcard',
                };
            }

            if (this.checkString('VCALENDAR', {offset: 6})) {
                return {
                    ext: 'ics',
                    mime: 'text/calendar',
                };
            }
        }

        // `raf` is here just to keep all the raw image detectors together.
        if (this.checkString('FUJIFILMCCD-RAW')) {
            return {
                ext: 'raf',
                mime: 'image/x-fujifilm-raf',
            };
        }

        if (this.checkString('Extended Module:')) {
            return {
                ext: 'xm',
                mime: 'audio/x-xm',
            };
        }

        if (this.checkString('Creative Voice File')) {
            return {
                ext: 'voc',
                mime: 'audio/x-voc',
            };
        }

        if (this.check([0x04, 0x00, 0x00, 0x00]) && this.buffer.length >= 16) { // Rough & quick check Pickle/ASAR
            const jsonSize = this.buffer.readUInt32LE(12);
            if (jsonSize > 12 && this.buffer.length >= jsonSize + 16) {
                try {
                    const header = this.buffer.slice(16, jsonSize + 16).toString();
                    const json = JSON.parse(header);
                    // Check if Pickle is ASAR
                    if (json.files) { // Final check, assuring Pickle/ASAR format
                        return {
                            ext: 'asar',
                            mime: 'application/x-asar',
                        };
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        }

        if (this.check([0x06, 0x0E, 0x2B, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0D, 0x01, 0x02, 0x01, 0x01, 0x02])) {
            return {
                ext: 'mxf',
                mime: 'application/mxf',
            };
        }

        if (this.checkString('SCRM', {offset: 44})) {
            return {
                ext: 's3m',
                mime: 'audio/x-s3m',
            };
        }

        // Raw MPEG-2 transport stream (188-byte packets)
        if (this.check([0x47]) && this.check([0x47], {offset: 188})) {
            return {
                ext: 'mts',
                mime: 'video/mp2t',
            };
        }

        // Blu-ray Disc Audio-Video (BDAV) MPEG-2 transport stream has 4-byte TP_extra_header before each 188-byte packet
        if (this.check([0x47], {offset: 4}) && this.check([0x47], {offset: 196})) {
            return {
                ext: 'mts',
                mime: 'video/mp2t',
            };
        }

        if (this.check([0x42, 0x4F, 0x4F, 0x4B, 0x4D, 0x4F, 0x42, 0x49], {offset: 60})) {
            return {
                ext: 'mobi',
                mime: 'application/x-mobipocket-ebook',
            };
        }

        if (this.check([0x44, 0x49, 0x43, 0x4D], {offset: 128})) {
            return {
                ext: 'dcm',
                mime: 'application/dicom',
            };
        }

        if (this.check([0x4C, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46])) {
            return {
                ext: 'lnk',
                mime: 'application/x.ms.shortcut', // Invented by us
            };
        }

        if (this.check([0x62, 0x6F, 0x6F, 0x6B, 0x00, 0x00, 0x00, 0x00, 0x6D, 0x61, 0x72, 0x6B, 0x00, 0x00, 0x00, 0x00])) {
            return {
                ext: 'alias',
                mime: 'application/x.apple.alias', // Invented by us
            };
        }

        if (
            this.check([0x4C, 0x50], {offset: 34})
            && (
                this.check([0x00, 0x00, 0x01], {offset: 8})
                || this.check([0x01, 0x00, 0x02], {offset: 8})
                || this.check([0x02, 0x00, 0x02], {offset: 8})
            )
        ) {
            return {
                ext: 'eot',
                mime: 'application/vnd.ms-fontobject',
            };
        }

        if (this.check([0x06, 0x06, 0xED, 0xF5, 0xD8, 0x1D, 0x46, 0xE5, 0xBD, 0x31, 0xEF, 0xE7, 0xFE, 0x74, 0xB7, 0x1D])) {
            return {
                ext: 'indd',
                mime: 'application/x-indesign',
            };
        }

        // Increase sample size from 256 to 512
        await tokenizer.peekBuffer(this.buffer, {length: Math.min(512, tokenizer.fileInfo.size), mayBeLess: true});

        // Requires a buffer size of 512 bytes
        if (KrajeeFileTypeConfig.tarHeaderChecksumMatches(this.buffer)) {
            return {
                ext: 'tar',
                mime: 'application/x-tar',
            };
        }

        if (this.check([0xFF, 0xFE, 0xFF, 0x0E, 0x53, 0x00, 0x6B, 0x00, 0x65, 0x00, 0x74, 0x00, 0x63, 0x00, 0x68, 0x00, 0x55, 0x00, 0x70, 0x00, 0x20, 0x00, 0x4D, 0x00, 0x6F, 0x00, 0x64, 0x00, 0x65, 0x00, 0x6C, 0x00])) {
            return {
                ext: 'skp',
                mime: 'application/vnd.sketchup.skp',
            };
        }

        if (this.checkString('-----BEGIN PGP MESSAGE-----')) {
            return {
                ext: 'pgp',
                mime: 'application/pgp-encrypted',
            };
        }

        // Check MPEG 1 or 2 Layer 3 header, or 'layer 0' for ADTS (MPEG sync-word 0xFFE)
        if (this.buffer.length >= 2 && this.check([0xFF, 0xE0], {offset: 0, mask: [0xFF, 0xE0]})) {
            if (this.check([0x10], {offset: 1, mask: [0x16]})) {
                // Check for (ADTS) MPEG-2
                if (this.check([0x08], {offset: 1, mask: [0x08]})) {
                    return {
                        ext: 'aac',
                        mime: 'audio/aac',
                    };
                }

                // Must be (ADTS) MPEG-4
                return {
                    ext: 'aac',
                    mime: 'audio/aac',
                };
            }

            // MPEG 1 or 2 Layer 3 header
            // Check for MPEG layer 3
            if (this.check([0x02], {offset: 1, mask: [0x06]})) {
                return {
                    ext: 'mp3',
                    mime: 'audio/mpeg',
                };
            }

            // Check for MPEG layer 2
            if (this.check([0x04], {offset: 1, mask: [0x06]})) {
                return {
                    ext: 'mp2',
                    mime: 'audio/mpeg',
                };
            }

            // Check for MPEG layer 1
            if (this.check([0x06], {offset: 1, mask: [0x06]})) {
                return {
                    ext: 'mp1',
                    mime: 'audio/mpeg',
                };
            }
        }
        return {};
    }

    async readTiffTag(bigEndian) {
        const Token = KrajeeFileTypeConfig.Token;
        const tagId = await this.tokenizer.readToken(bigEndian ? Token.UINT16_BE : Token.UINT16_LE);
        this.tokenizer.ignore(10);
        switch (tagId) {
            case 50_341:
                return {
                    ext: 'arw',
                    mime: 'image/x-sony-arw',
                };
            case 50_706:
                return {
                    ext: 'dng',
                    mime: 'image/x-adobe-dng',
                };
            default:
        }
    }

    async readTiffIFD(bigEndian) {
        const Token = KrajeeFileTypeConfig.Token;
        const numberOfTags = await this.tokenizer.readToken(bigEndian ? Token.UINT16_BE : Token.UINT16_LE);
        for (let n = 0; n < numberOfTags; ++n) {
            const fileType = await this.readTiffTag(bigEndian);
            if (fileType) {
                return fileType;
            }
        }
    }

    async readTiffHeader(bigEndian) {
        const Token = KrajeeFileTypeConfig.Token;
        const version = (bigEndian ? Token.UINT16_BE : Token.UINT16_LE).get(this.buffer, 2);
        const ifdOffset = (bigEndian ? Token.UINT32_BE : Token.UINT32_LE).get(this.buffer, 4);

        if (version === 42) {
            // TIFF file header
            if (ifdOffset >= 6) {
                if (this.checkString('CR', {offset: 8})) {
                    return {
                        ext: 'cr2',
                        mime: 'image/x-canon-cr2',
                    };
                }

                if (ifdOffset >= 8 && (this.check([0x1C, 0x00, 0xFE, 0x00], {offset: 8}) || this.check([0x1F, 0x00, 0x0B, 0x00], {offset: 8}))) {
                    return {
                        ext: 'nef',
                        mime: 'image/x-nikon-nef',
                    };
                }
            }

            await this.tokenizer.ignore(ifdOffset);
            const fileType = await this.readTiffIFD(false);
            return fileType ? fileType : {
                ext: 'tif',
                mime: 'image/tiff',
            };
        }

        if (version === 43) {	// Big TIFF file header
            return {
                ext: 'tif',
                mime: 'image/tiff',
            };
        }
    }
}
/* piexifjs

The MIT License (MIT)

Copyright (c) 2014, 2015 hMatoba(https://github.com/hMatoba)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function () {
    "use strict";
    var that = {};
    that.version = "1.0.4";

    that.remove = function (jpeg) {
        var b64 = false;
        if (jpeg.slice(0, 2) == "\xff\xd8") {
        } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
            jpeg = atob(jpeg.split(",")[1]);
            b64 = true;
        } else {
            throw new Error("Given data is not jpeg.");
        }
        
        var segments = splitIntoSegments(jpeg);
        var newSegments = segments.filter(function(seg){
          return  !(seg.slice(0, 2) == "\xff\xe1" &&
                   seg.slice(4, 10) == "Exif\x00\x00"); 
        });
        
        var new_data = newSegments.join("");
        if (b64) {
            new_data = "data:image/jpeg;base64," + btoa(new_data);
        }

        return new_data;
    };


    that.insert = function (exif, jpeg) {
        var b64 = false;
        if (exif.slice(0, 6) != "\x45\x78\x69\x66\x00\x00") {
            throw new Error("Given data is not exif.");
        }
        if (jpeg.slice(0, 2) == "\xff\xd8") {
        } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
            jpeg = atob(jpeg.split(",")[1]);
            b64 = true;
        } else {
            throw new Error("Given data is not jpeg.");
        }

        var exifStr = "\xff\xe1" + pack(">H", [exif.length + 2]) + exif;
        var segments = splitIntoSegments(jpeg);
        var new_data = mergeSegments(segments, exifStr);
        if (b64) {
            new_data = "data:image/jpeg;base64," + btoa(new_data);
        }

        return new_data;
    };


    that.load = function (data) {
        var input_data;
        if (typeof (data) == "string") {
            if (data.slice(0, 2) == "\xff\xd8") {
                input_data = data;
            } else if (data.slice(0, 23) == "data:image/jpeg;base64," || data.slice(0, 22) == "data:image/jpg;base64,") {
                input_data = atob(data.split(",")[1]);
            } else if (data.slice(0, 4) == "Exif") {
                input_data = data.slice(6);
            } else {
                throw new Error("'load' gots invalid file data.");
            }
        } else {
            throw new Error("'load' gots invalid type argument.");
        }

        var exifDict = {};
        var exif_dict = {
            "0th": {},
            "Exif": {},
            "GPS": {},
            "Interop": {},
            "1st": {},
            "thumbnail": null
        };
        var exifReader = new ExifReader(input_data);
        if (exifReader.tiftag === null) {
            return exif_dict;
        }

        if (exifReader.tiftag.slice(0, 2) == "\x49\x49") {
            exifReader.endian_mark = "<";
        } else {
            exifReader.endian_mark = ">";
        }

        var pointer = unpack(exifReader.endian_mark + "L",
            exifReader.tiftag.slice(4, 8))[0];
        exif_dict["0th"] = exifReader.get_ifd(pointer, "0th");

        var first_ifd_pointer = exif_dict["0th"]["first_ifd_pointer"];
        delete exif_dict["0th"]["first_ifd_pointer"];

        if (34665 in exif_dict["0th"]) {
            pointer = exif_dict["0th"][34665];
            exif_dict["Exif"] = exifReader.get_ifd(pointer, "Exif");
        }
        if (34853 in exif_dict["0th"]) {
            pointer = exif_dict["0th"][34853];
            exif_dict["GPS"] = exifReader.get_ifd(pointer, "GPS");
        }
        if (40965 in exif_dict["Exif"]) {
            pointer = exif_dict["Exif"][40965];
            exif_dict["Interop"] = exifReader.get_ifd(pointer, "Interop");
        }
        if (first_ifd_pointer != "\x00\x00\x00\x00") {
            pointer = unpack(exifReader.endian_mark + "L",
                first_ifd_pointer)[0];
            exif_dict["1st"] = exifReader.get_ifd(pointer, "1st");
            if ((513 in exif_dict["1st"]) && (514 in exif_dict["1st"])) {
                var end = exif_dict["1st"][513] + exif_dict["1st"][514];
                var thumb = exifReader.tiftag.slice(exif_dict["1st"][513], end);
                exif_dict["thumbnail"] = thumb;
            }
        }

        return exif_dict;
    };


    that.dump = function (exif_dict_original) {
        var TIFF_HEADER_LENGTH = 8;

        var exif_dict = copy(exif_dict_original);
        var header = "Exif\x00\x00\x4d\x4d\x00\x2a\x00\x00\x00\x08";
        var exif_is = false;
        var gps_is = false;
        var interop_is = false;
        var first_is = false;

        var zeroth_ifd,
            exif_ifd,
            interop_ifd,
            gps_ifd,
            first_ifd;
        
        if ("0th" in exif_dict) {
            zeroth_ifd = exif_dict["0th"];
        } else {
            zeroth_ifd = {};
        }
        
        if ((("Exif" in exif_dict) && (Object.keys(exif_dict["Exif"]).length)) ||
            (("Interop" in exif_dict) && (Object.keys(exif_dict["Interop"]).length))) {
            zeroth_ifd[34665] = 1;
            exif_is = true;
            exif_ifd = exif_dict["Exif"];
            if (("Interop" in exif_dict) && Object.keys(exif_dict["Interop"]).length) {
                exif_ifd[40965] = 1;
                interop_is = true;
                interop_ifd = exif_dict["Interop"];
            } else if (Object.keys(exif_ifd).indexOf(that.ExifIFD.InteroperabilityTag.toString()) > -1) {
                delete exif_ifd[40965];
            }
        } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.ExifTag.toString()) > -1) {
            delete zeroth_ifd[34665];
        }

        if (("GPS" in exif_dict) && (Object.keys(exif_dict["GPS"]).length)) {
            zeroth_ifd[that.ImageIFD.GPSTag] = 1;
            gps_is = true;
            gps_ifd = exif_dict["GPS"];
        } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.GPSTag.toString()) > -1) {
            delete zeroth_ifd[that.ImageIFD.GPSTag];
        }
        
        if (("1st" in exif_dict) &&
            ("thumbnail" in exif_dict) &&
            (exif_dict["thumbnail"] != null)) {
            first_is = true;
            exif_dict["1st"][513] = 1;
            exif_dict["1st"][514] = 1;
            first_ifd = exif_dict["1st"];
        }
        
        var zeroth_set = _dict_to_bytes(zeroth_ifd, "0th", 0);
        var zeroth_length = (zeroth_set[0].length + exif_is * 12 + gps_is * 12 + 4 +
            zeroth_set[1].length);

        var exif_set,
            exif_bytes = "",
            exif_length = 0,
            gps_set,
            gps_bytes = "",
            gps_length = 0,
            interop_set,
            interop_bytes = "",
            interop_length = 0,
            first_set,
            first_bytes = "",
            thumbnail;
        if (exif_is) {
            exif_set = _dict_to_bytes(exif_ifd, "Exif", zeroth_length);
            exif_length = exif_set[0].length + interop_is * 12 + exif_set[1].length;
        }
        if (gps_is) {
            gps_set = _dict_to_bytes(gps_ifd, "GPS", zeroth_length + exif_length);
            gps_bytes = gps_set.join("");
            gps_length = gps_bytes.length;
        }
        if (interop_is) {
            var offset = zeroth_length + exif_length + gps_length;
            interop_set = _dict_to_bytes(interop_ifd, "Interop", offset);
            interop_bytes = interop_set.join("");
            interop_length = interop_bytes.length;
        }
        if (first_is) {
            var offset = zeroth_length + exif_length + gps_length + interop_length;
            first_set = _dict_to_bytes(first_ifd, "1st", offset);
            thumbnail = _get_thumbnail(exif_dict["thumbnail"]);
            if (thumbnail.length > 64000) {
                throw new Error("Given thumbnail is too large. max 64kB");
            }
        }

        var exif_pointer = "",
            gps_pointer = "",
            interop_pointer = "",
            first_ifd_pointer = "\x00\x00\x00\x00";
        if (exif_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length;
            var pointer_str = pack(">L", [pointer_value]);
            var key = 34665;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            exif_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (gps_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length + exif_length;
            var pointer_str = pack(">L", [pointer_value]);
            var key = 34853;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            gps_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (interop_is) {
            var pointer_value = (TIFF_HEADER_LENGTH +
                zeroth_length + exif_length + gps_length);
            var pointer_str = pack(">L", [pointer_value]);
            var key = 40965;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            interop_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (first_is) {
            var pointer_value = (TIFF_HEADER_LENGTH + zeroth_length +
                exif_length + gps_length + interop_length);
            first_ifd_pointer = pack(">L", [pointer_value]);
            var thumbnail_pointer = (pointer_value + first_set[0].length + 24 +
                4 + first_set[1].length);
            var thumbnail_p_bytes = ("\x02\x01\x00\x04\x00\x00\x00\x01" +
                pack(">L", [thumbnail_pointer]));
            var thumbnail_length_bytes = ("\x02\x02\x00\x04\x00\x00\x00\x01" +
                pack(">L", [thumbnail.length]));
            first_bytes = (first_set[0] + thumbnail_p_bytes +
                thumbnail_length_bytes + "\x00\x00\x00\x00" +
                first_set[1] + thumbnail);
        }

        var zeroth_bytes = (zeroth_set[0] + exif_pointer + gps_pointer +
            first_ifd_pointer + zeroth_set[1]);
        if (exif_is) {
            exif_bytes = exif_set[0] + interop_pointer + exif_set[1];
        }

        return (header + zeroth_bytes + exif_bytes + gps_bytes +
            interop_bytes + first_bytes);
    };


    function copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }


    function _get_thumbnail(jpeg) {
        var segments = splitIntoSegments(jpeg);
        while (("\xff\xe0" <= segments[1].slice(0, 2)) && (segments[1].slice(0, 2) <= "\xff\xef")) {
            segments = [segments[0]].concat(segments.slice(2));
        }
        return segments.join("");
    }


    function _pack_byte(array) {
        return pack(">" + nStr("B", array.length), array);
    }


    function _pack_short(array) {
        return pack(">" + nStr("H", array.length), array);
    }


    function _pack_long(array) {
        return pack(">" + nStr("L", array.length), array);
    }


    function _value_to_bytes(raw_value, value_type, offset) {
        var four_bytes_over = "";
        var value_str = "";
        var length,
            new_value,
            num,
            den;

        if (value_type == "Byte") {
            length = raw_value.length;
            if (length <= 4) {
                value_str = (_pack_byte(raw_value) +
                    nStr("\x00", 4 - length));
            } else {
                value_str = pack(">L", [offset]);
                four_bytes_over = _pack_byte(raw_value);
            }
        } else if (value_type == "Short") {
            length = raw_value.length;
            if (length <= 2) {
                value_str = (_pack_short(raw_value) +
                    nStr("\x00\x00", 2 - length));
            } else {
                value_str = pack(">L", [offset]);
                four_bytes_over = _pack_short(raw_value);
            }
        } else if (value_type == "Long") {
            length = raw_value.length;
            if (length <= 1) {
                value_str = _pack_long(raw_value);
            } else {
                value_str = pack(">L", [offset]);
                four_bytes_over = _pack_long(raw_value);
            }
        } else if (value_type == "Ascii") {
            new_value = raw_value + "\x00";
            length = new_value.length;
            if (length > 4) {
                value_str = pack(">L", [offset]);
                four_bytes_over = new_value;
            } else {
                value_str = new_value + nStr("\x00", 4 - length);
            }
        } else if (value_type == "Rational") {
            if (typeof (raw_value[0]) == "number") {
                length = 1;
                num = raw_value[0];
                den = raw_value[1];
                new_value = pack(">L", [num]) + pack(">L", [den]);
            } else {
                length = raw_value.length;
                new_value = "";
                for (var n = 0; n < length; n++) {
                    num = raw_value[n][0];
                    den = raw_value[n][1];
                    new_value += (pack(">L", [num]) +
                        pack(">L", [den]));
                }
            }
            value_str = pack(">L", [offset]);
            four_bytes_over = new_value;
        } else if (value_type == "SRational") {
            if (typeof (raw_value[0]) == "number") {
                length = 1;
                num = raw_value[0];
                den = raw_value[1];
                new_value = pack(">l", [num]) + pack(">l", [den]);
            } else {
                length = raw_value.length;
                new_value = "";
                for (var n = 0; n < length; n++) {
                    num = raw_value[n][0];
                    den = raw_value[n][1];
                    new_value += (pack(">l", [num]) +
                        pack(">l", [den]));
                }
            }
            value_str = pack(">L", [offset]);
            four_bytes_over = new_value;
        } else if (value_type == "Undefined") {
            length = raw_value.length;
            if (length > 4) {
                value_str = pack(">L", [offset]);
                four_bytes_over = raw_value;
            } else {
                value_str = raw_value + nStr("\x00", 4 - length);
            }
        }

        var length_str = pack(">L", [length]);

        return [length_str, value_str, four_bytes_over];
    }

    function _dict_to_bytes(ifd_dict, ifd, ifd_offset) {
        var TIFF_HEADER_LENGTH = 8;
        var tag_count = Object.keys(ifd_dict).length;
        var entry_header = pack(">H", [tag_count]);
        var entries_length;
        if (["0th", "1st"].indexOf(ifd) > -1) {
            entries_length = 2 + tag_count * 12 + 4;
        } else {
            entries_length = 2 + tag_count * 12;
        }
        var entries = "";
        var values = "";
        var key;

        for (var key in ifd_dict) {
            if (typeof (key) == "string") {
                key = parseInt(key);
            }
            if ((ifd == "0th") && ([34665, 34853].indexOf(key) > -1)) {
                continue;
            } else if ((ifd == "Exif") && (key == 40965)) {
                continue;
            } else if ((ifd == "1st") && ([513, 514].indexOf(key) > -1)) {
                continue;
            }

            var raw_value = ifd_dict[key];
            var key_str = pack(">H", [key]);
            var value_type = TAGS[ifd][key]["type"];
            var type_str = pack(">H", [TYPES[value_type]]);

            if (typeof (raw_value) == "number") {
                raw_value = [raw_value];
            }
            var offset = TIFF_HEADER_LENGTH + entries_length + ifd_offset + values.length;
            var b = _value_to_bytes(raw_value, value_type, offset);
            var length_str = b[0];
            var value_str = b[1];
            var four_bytes_over = b[2];

            entries += key_str + type_str + length_str + value_str;
            values += four_bytes_over;
        }

        return [entry_header + entries, values];
    }



    function ExifReader(data) {
        var segments,
            app1;
        if (data.slice(0, 2) == "\xff\xd8") { // JPEG
            segments = splitIntoSegments(data);
            app1 = getExifSeg(segments);
            if (app1) {
                this.tiftag = app1.slice(10);
            } else {
                this.tiftag = null;
            }
        } else if (["\x49\x49", "\x4d\x4d"].indexOf(data.slice(0, 2)) > -1) { // TIFF
            this.tiftag = data;
        } else if (data.slice(0, 4) == "Exif") { // Exif
            this.tiftag = data.slice(6);
        } else {
            throw new Error("Given file is neither JPEG nor TIFF.");
        }
    }

    ExifReader.prototype = {
        get_ifd: function (pointer, ifd_name) {
            var ifd_dict = {};
            var tag_count = unpack(this.endian_mark + "H",
                this.tiftag.slice(pointer, pointer + 2))[0];
            var offset = pointer + 2;
            var t;
            if (["0th", "1st"].indexOf(ifd_name) > -1) {
                t = "Image";
            } else {
                t = ifd_name;
            }

            for (var x = 0; x < tag_count; x++) {
                pointer = offset + 12 * x;
                var tag = unpack(this.endian_mark + "H",
                    this.tiftag.slice(pointer, pointer + 2))[0];
                var value_type = unpack(this.endian_mark + "H",
                    this.tiftag.slice(pointer + 2, pointer + 4))[0];
                var value_num = unpack(this.endian_mark + "L",
                    this.tiftag.slice(pointer + 4, pointer + 8))[0];
                var value = this.tiftag.slice(pointer + 8, pointer + 12);

                var v_set = [value_type, value_num, value];
                if (tag in TAGS[t]) {
                    ifd_dict[tag] = this.convert_value(v_set);
                }
            }

            if (ifd_name == "0th") {
                pointer = offset + 12 * tag_count;
                ifd_dict["first_ifd_pointer"] = this.tiftag.slice(pointer, pointer + 4);
            }

            return ifd_dict;
        },

        convert_value: function (val) {
            var data = null;
            var t = val[0];
            var length = val[1];
            var value = val[2];
            var pointer;

            if (t == 1) { // BYTE
                if (length > 4) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = unpack(this.endian_mark + nStr("B", length),
                        this.tiftag.slice(pointer, pointer + length));
                } else {
                    data = unpack(this.endian_mark + nStr("B", length), value.slice(0, length));
                }
            } else if (t == 2) { // ASCII
                if (length > 4) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = this.tiftag.slice(pointer, pointer + length - 1);
                } else {
                    data = value.slice(0, length - 1);
                }
            } else if (t == 3) { // SHORT
                if (length > 2) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = unpack(this.endian_mark + nStr("H", length),
                        this.tiftag.slice(pointer, pointer + length * 2));
                } else {
                    data = unpack(this.endian_mark + nStr("H", length),
                        value.slice(0, length * 2));
                }
            } else if (t == 4) { // LONG
                if (length > 1) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = unpack(this.endian_mark + nStr("L", length),
                        this.tiftag.slice(pointer, pointer + length * 4));
                } else {
                    data = unpack(this.endian_mark + nStr("L", length),
                        value);
                }
            } else if (t == 5) { // RATIONAL
                pointer = unpack(this.endian_mark + "L", value)[0];
                if (length > 1) {
                    data = [];
                    for (var x = 0; x < length; x++) {
                        data.push([unpack(this.endian_mark + "L",
                                this.tiftag.slice(pointer + x * 8, pointer + 4 + x * 8))[0],
                                   unpack(this.endian_mark + "L",
                                this.tiftag.slice(pointer + 4 + x * 8, pointer + 8 + x * 8))[0]
                                   ]);
                    }
                } else {
                    data = [unpack(this.endian_mark + "L",
                            this.tiftag.slice(pointer, pointer + 4))[0],
                            unpack(this.endian_mark + "L",
                            this.tiftag.slice(pointer + 4, pointer + 8))[0]
                            ];
                }
            } else if (t == 7) { // UNDEFINED BYTES
                if (length > 4) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = this.tiftag.slice(pointer, pointer + length);
                } else {
                    data = value.slice(0, length);
                }
            } else if (t == 9) { // SLONG
                if (length > 1) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = unpack(this.endian_mark + nStr("l", length),
                        this.tiftag.slice(pointer, pointer + length * 4));
                } else {
                    data = unpack(this.endian_mark + nStr("l", length),
                        value);
                }
            } else if (t == 10) { // SRATIONAL
                pointer = unpack(this.endian_mark + "L", value)[0];
                if (length > 1) {
                    data = [];
                    for (var x = 0; x < length; x++) {
                        data.push([unpack(this.endian_mark + "l",
                                this.tiftag.slice(pointer + x * 8, pointer + 4 + x * 8))[0],
                                   unpack(this.endian_mark + "l",
                                this.tiftag.slice(pointer + 4 + x * 8, pointer + 8 + x * 8))[0]
                                  ]);
                    }
                } else {
                    data = [unpack(this.endian_mark + "l",
                            this.tiftag.slice(pointer, pointer + 4))[0],
                            unpack(this.endian_mark + "l",
                            this.tiftag.slice(pointer + 4, pointer + 8))[0]
                           ];
                }
            } else {
                throw new Error("Exif might be wrong. Got incorrect value " +
                    "type to decode. type:" + t);
            }

            if ((data instanceof Array) && (data.length == 1)) {
                return data[0];
            } else {
                return data;
            }
        },
    };


    if (typeof window !== "undefined" && typeof window.btoa === "function") {
        var btoa = window.btoa;
    }
    if (typeof btoa === "undefined") {
        var btoa = function (input) {        var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                keyStr.charAt(enc3) + keyStr.charAt(enc4);

            }

            return output;
        };
    }
    
    
    if (typeof window !== "undefined" && typeof window.atob === "function") {
        var atob = window.atob;
    }
    if (typeof atob === "undefined") {
        var atob = function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            return output;
        };
    }


    function getImageSize(imageArray) {
        var segments = slice2Segments(imageArray);
        var seg,
            width,
            height,
            SOF = [192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207];

        for (var x = 0; x < segments.length; x++) {
            seg = segments[x];
            if (SOF.indexOf(seg[1]) >= 0) {
                height = seg[5] * 256 + seg[6];
                width = seg[7] * 256 + seg[8];
                break;
            }
        }
        return [width, height];
    }


    function pack(mark, array) {
        if (!(array instanceof Array)) {
            throw new Error("'pack' error. Got invalid type argument.");
        }
        if ((mark.length - 1) != array.length) {
            throw new Error("'pack' error. " + (mark.length - 1) + " marks, " + array.length + " elements.");
        }

        var littleEndian;
        if (mark[0] == "<") {
            littleEndian = true;
        } else if (mark[0] == ">") {
            littleEndian = false;
        } else {
            throw new Error("");
        }
        var packed = "";
        var p = 1;
        var val = null;
        var c = null;
        var valStr = null;

        while (c = mark[p]) {
            if (c.toLowerCase() == "b") {
                val = array[p - 1];
                if ((c == "b") && (val < 0)) {
                    val += 0x100;
                }
                if ((val > 0xff) || (val < 0)) {
                    throw new Error("'pack' error.");
                } else {
                    valStr = String.fromCharCode(val);
                }
            } else if (c == "H") {
                val = array[p - 1];
                if ((val > 0xffff) || (val < 0)) {
                    throw new Error("'pack' error.");
                } else {
                    valStr = String.fromCharCode(Math.floor((val % 0x10000) / 0x100)) +
                        String.fromCharCode(val % 0x100);
                    if (littleEndian) {
                        valStr = valStr.split("").reverse().join("");
                    }
                }
            } else if (c.toLowerCase() == "l") {
                val = array[p - 1];
                if ((c == "l") && (val < 0)) {
                    val += 0x100000000;
                }
                if ((val > 0xffffffff) || (val < 0)) {
                    throw new Error("'pack' error.");
                } else {
                    valStr = String.fromCharCode(Math.floor(val / 0x1000000)) +
                        String.fromCharCode(Math.floor((val % 0x1000000) / 0x10000)) +
                        String.fromCharCode(Math.floor((val % 0x10000) / 0x100)) +
                        String.fromCharCode(val % 0x100);
                    if (littleEndian) {
                        valStr = valStr.split("").reverse().join("");
                    }
                }
            } else {
                throw new Error("'pack' error.");
            }

            packed += valStr;
            p += 1;
        }

        return packed;
    }

    function unpack(mark, str) {
        if (typeof (str) != "string") {
            throw new Error("'unpack' error. Got invalid type argument.");
        }
        var l = 0;
        for (var markPointer = 1; markPointer < mark.length; markPointer++) {
            if (mark[markPointer].toLowerCase() == "b") {
                l += 1;
            } else if (mark[markPointer].toLowerCase() == "h") {
                l += 2;
            } else if (mark[markPointer].toLowerCase() == "l") {
                l += 4;
            } else {
                throw new Error("'unpack' error. Got invalid mark.");
            }
        }

        if (l != str.length) {
            throw new Error("'unpack' error. Mismatch between symbol and string length. " + l + ":" + str.length);
        }

        var littleEndian;
        if (mark[0] == "<") {
            littleEndian = true;
        } else if (mark[0] == ">") {
            littleEndian = false;
        } else {
            throw new Error("'unpack' error.");
        }
        var unpacked = [];
        var strPointer = 0;
        var p = 1;
        var val = null;
        var c = null;
        var length = null;
        var sliced = "";

        while (c = mark[p]) {
            if (c.toLowerCase() == "b") {
                length = 1;
                sliced = str.slice(strPointer, strPointer + length);
                val = sliced.charCodeAt(0);
                if ((c == "b") && (val >= 0x80)) {
                    val -= 0x100;
                }
            } else if (c == "H") {
                length = 2;
                sliced = str.slice(strPointer, strPointer + length);
                if (littleEndian) {
                    sliced = sliced.split("").reverse().join("");
                }
                val = sliced.charCodeAt(0) * 0x100 +
                    sliced.charCodeAt(1);
            } else if (c.toLowerCase() == "l") {
                length = 4;
                sliced = str.slice(strPointer, strPointer + length);
                if (littleEndian) {
                    sliced = sliced.split("").reverse().join("");
                }
                val = sliced.charCodeAt(0) * 0x1000000 +
                    sliced.charCodeAt(1) * 0x10000 +
                    sliced.charCodeAt(2) * 0x100 +
                    sliced.charCodeAt(3);
                if ((c == "l") && (val >= 0x80000000)) {
                    val -= 0x100000000;
                }
            } else {
                throw new Error("'unpack' error. " + c);
            }

            unpacked.push(val);
            strPointer += length;
            p += 1;
        }

        return unpacked;
    }

    function nStr(ch, num) {
        var str = "";
        for (var i = 0; i < num; i++) {
            str += ch;
        }
        return str;
    }

    function splitIntoSegments(data) {
        if (data.slice(0, 2) != "\xff\xd8") {
            throw new Error("Given data isn't JPEG.");
        }

        var head = 2;
        var segments = ["\xff\xd8"];
        while (true) {
            if (data.slice(head, head + 2) == "\xff\xda") {
                segments.push(data.slice(head));
                break;
            } else {
                var length = unpack(">H", data.slice(head + 2, head + 4))[0];
                var endPoint = head + length + 2;
                segments.push(data.slice(head, endPoint));
                head = endPoint;
            }

            if (head >= data.length) {
                throw new Error("Wrong JPEG data.");
            }
        }
        return segments;
    }


    function getExifSeg(segments) {
        var seg;
        for (var i = 0; i < segments.length; i++) {
            seg = segments[i];
            if (seg.slice(0, 2) == "\xff\xe1" &&
                   seg.slice(4, 10) == "Exif\x00\x00") {
                return seg;
            }
        }
        return null;
    }


    function mergeSegments(segments, exif) {
        var hasExifSegment = false;
        var additionalAPP1ExifSegments = [];

        segments.forEach(function(segment, i) {
            // Replace first occurence of APP1:Exif segment
            if (segment.slice(0, 2) == "\xff\xe1" &&
                segment.slice(4, 10) == "Exif\x00\x00"
            ) {
                if (!hasExifSegment) {
                    segments[i] = exif;
                    hasExifSegment = true;
                } else {
                    additionalAPP1ExifSegments.unshift(i);
                }
            }
        });

        // Remove additional occurences of APP1:Exif segment
        additionalAPP1ExifSegments.forEach(function(segmentIndex) {
            segments.splice(segmentIndex, 1);
        });

        if (!hasExifSegment && exif) {
            segments = [segments[0], exif].concat(segments.slice(1));
        }

        return segments.join("");
    }


    function toHex(str) {
        var hexStr = "";
        for (var i = 0; i < str.length; i++) {
            var h = str.charCodeAt(i);
            var hex = ((h < 10) ? "0" : "") + h.toString(16);
            hexStr += hex + " ";
        }
        return hexStr;
    }


    var TYPES = {
        "Byte": 1,
        "Ascii": 2,
        "Short": 3,
        "Long": 4,
        "Rational": 5,
        "Undefined": 7,
        "SLong": 9,
        "SRational": 10
    };


    var TAGS = {
        'Image': {
            11: {
                'name': 'ProcessingSoftware',
                'type': 'Ascii'
            },
            254: {
                'name': 'NewSubfileType',
                'type': 'Long'
            },
            255: {
                'name': 'SubfileType',
                'type': 'Short'
            },
            256: {
                'name': 'ImageWidth',
                'type': 'Long'
            },
            257: {
                'name': 'ImageLength',
                'type': 'Long'
            },
            258: {
                'name': 'BitsPerSample',
                'type': 'Short'
            },
            259: {
                'name': 'Compression',
                'type': 'Short'
            },
            262: {
                'name': 'PhotometricInterpretation',
                'type': 'Short'
            },
            263: {
                'name': 'Threshholding',
                'type': 'Short'
            },
            264: {
                'name': 'CellWidth',
                'type': 'Short'
            },
            265: {
                'name': 'CellLength',
                'type': 'Short'
            },
            266: {
                'name': 'FillOrder',
                'type': 'Short'
            },
            269: {
                'name': 'DocumentName',
                'type': 'Ascii'
            },
            270: {
                'name': 'ImageDescription',
                'type': 'Ascii'
            },
            271: {
                'name': 'Make',
                'type': 'Ascii'
            },
            272: {
                'name': 'Model',
                'type': 'Ascii'
            },
            273: {
                'name': 'StripOffsets',
                'type': 'Long'
            },
            274: {
                'name': 'Orientation',
                'type': 'Short'
            },
            277: {
                'name': 'SamplesPerPixel',
                'type': 'Short'
            },
            278: {
                'name': 'RowsPerStrip',
                'type': 'Long'
            },
            279: {
                'name': 'StripByteCounts',
                'type': 'Long'
            },
            282: {
                'name': 'XResolution',
                'type': 'Rational'
            },
            283: {
                'name': 'YResolution',
                'type': 'Rational'
            },
            284: {
                'name': 'PlanarConfiguration',
                'type': 'Short'
            },
            290: {
                'name': 'GrayResponseUnit',
                'type': 'Short'
            },
            291: {
                'name': 'GrayResponseCurve',
                'type': 'Short'
            },
            292: {
                'name': 'T4Options',
                'type': 'Long'
            },
            293: {
                'name': 'T6Options',
                'type': 'Long'
            },
            296: {
                'name': 'ResolutionUnit',
                'type': 'Short'
            },
            301: {
                'name': 'TransferFunction',
                'type': 'Short'
            },
            305: {
                'name': 'Software',
                'type': 'Ascii'
            },
            306: {
                'name': 'DateTime',
                'type': 'Ascii'
            },
            315: {
                'name': 'Artist',
                'type': 'Ascii'
            },
            316: {
                'name': 'HostComputer',
                'type': 'Ascii'
            },
            317: {
                'name': 'Predictor',
                'type': 'Short'
            },
            318: {
                'name': 'WhitePoint',
                'type': 'Rational'
            },
            319: {
                'name': 'PrimaryChromaticities',
                'type': 'Rational'
            },
            320: {
                'name': 'ColorMap',
                'type': 'Short'
            },
            321: {
                'name': 'HalftoneHints',
                'type': 'Short'
            },
            322: {
                'name': 'TileWidth',
                'type': 'Short'
            },
            323: {
                'name': 'TileLength',
                'type': 'Short'
            },
            324: {
                'name': 'TileOffsets',
                'type': 'Short'
            },
            325: {
                'name': 'TileByteCounts',
                'type': 'Short'
            },
            330: {
                'name': 'SubIFDs',
                'type': 'Long'
            },
            332: {
                'name': 'InkSet',
                'type': 'Short'
            },
            333: {
                'name': 'InkNames',
                'type': 'Ascii'
            },
            334: {
                'name': 'NumberOfInks',
                'type': 'Short'
            },
            336: {
                'name': 'DotRange',
                'type': 'Byte'
            },
            337: {
                'name': 'TargetPrinter',
                'type': 'Ascii'
            },
            338: {
                'name': 'ExtraSamples',
                'type': 'Short'
            },
            339: {
                'name': 'SampleFormat',
                'type': 'Short'
            },
            340: {
                'name': 'SMinSampleValue',
                'type': 'Short'
            },
            341: {
                'name': 'SMaxSampleValue',
                'type': 'Short'
            },
            342: {
                'name': 'TransferRange',
                'type': 'Short'
            },
            343: {
                'name': 'ClipPath',
                'type': 'Byte'
            },
            344: {
                'name': 'XClipPathUnits',
                'type': 'Long'
            },
            345: {
                'name': 'YClipPathUnits',
                'type': 'Long'
            },
            346: {
                'name': 'Indexed',
                'type': 'Short'
            },
            347: {
                'name': 'JPEGTables',
                'type': 'Undefined'
            },
            351: {
                'name': 'OPIProxy',
                'type': 'Short'
            },
            512: {
                'name': 'JPEGProc',
                'type': 'Long'
            },
            513: {
                'name': 'JPEGInterchangeFormat',
                'type': 'Long'
            },
            514: {
                'name': 'JPEGInterchangeFormatLength',
                'type': 'Long'
            },
            515: {
                'name': 'JPEGRestartInterval',
                'type': 'Short'
            },
            517: {
                'name': 'JPEGLosslessPredictors',
                'type': 'Short'
            },
            518: {
                'name': 'JPEGPointTransforms',
                'type': 'Short'
            },
            519: {
                'name': 'JPEGQTables',
                'type': 'Long'
            },
            520: {
                'name': 'JPEGDCTables',
                'type': 'Long'
            },
            521: {
                'name': 'JPEGACTables',
                'type': 'Long'
            },
            529: {
                'name': 'YCbCrCoefficients',
                'type': 'Rational'
            },
            530: {
                'name': 'YCbCrSubSampling',
                'type': 'Short'
            },
            531: {
                'name': 'YCbCrPositioning',
                'type': 'Short'
            },
            532: {
                'name': 'ReferenceBlackWhite',
                'type': 'Rational'
            },
            700: {
                'name': 'XMLPacket',
                'type': 'Byte'
            },
            18246: {
                'name': 'Rating',
                'type': 'Short'
            },
            18249: {
                'name': 'RatingPercent',
                'type': 'Short'
            },
            32781: {
                'name': 'ImageID',
                'type': 'Ascii'
            },
            33421: {
                'name': 'CFARepeatPatternDim',
                'type': 'Short'
            },
            33422: {
                'name': 'CFAPattern',
                'type': 'Byte'
            },
            33423: {
                'name': 'BatteryLevel',
                'type': 'Rational'
            },
            33432: {
                'name': 'Copyright',
                'type': 'Ascii'
            },
            33434: {
                'name': 'ExposureTime',
                'type': 'Rational'
            },
            34377: {
                'name': 'ImageResources',
                'type': 'Byte'
            },
            34665: {
                'name': 'ExifTag',
                'type': 'Long'
            },
            34675: {
                'name': 'InterColorProfile',
                'type': 'Undefined'
            },
            34853: {
                'name': 'GPSTag',
                'type': 'Long'
            },
            34857: {
                'name': 'Interlace',
                'type': 'Short'
            },
            34858: {
                'name': 'TimeZoneOffset',
                'type': 'Long'
            },
            34859: {
                'name': 'SelfTimerMode',
                'type': 'Short'
            },
            37387: {
                'name': 'FlashEnergy',
                'type': 'Rational'
            },
            37388: {
                'name': 'SpatialFrequencyResponse',
                'type': 'Undefined'
            },
            37389: {
                'name': 'Noise',
                'type': 'Undefined'
            },
            37390: {
                'name': 'FocalPlaneXResolution',
                'type': 'Rational'
            },
            37391: {
                'name': 'FocalPlaneYResolution',
                'type': 'Rational'
            },
            37392: {
                'name': 'FocalPlaneResolutionUnit',
                'type': 'Short'
            },
            37393: {
                'name': 'ImageNumber',
                'type': 'Long'
            },
            37394: {
                'name': 'SecurityClassification',
                'type': 'Ascii'
            },
            37395: {
                'name': 'ImageHistory',
                'type': 'Ascii'
            },
            37397: {
                'name': 'ExposureIndex',
                'type': 'Rational'
            },
            37398: {
                'name': 'TIFFEPStandardID',
                'type': 'Byte'
            },
            37399: {
                'name': 'SensingMethod',
                'type': 'Short'
            },
            40091: {
                'name': 'XPTitle',
                'type': 'Byte'
            },
            40092: {
                'name': 'XPComment',
                'type': 'Byte'
            },
            40093: {
                'name': 'XPAuthor',
                'type': 'Byte'
            },
            40094: {
                'name': 'XPKeywords',
                'type': 'Byte'
            },
            40095: {
                'name': 'XPSubject',
                'type': 'Byte'
            },
            50341: {
                'name': 'PrintImageMatching',
                'type': 'Undefined'
            },
            50706: {
                'name': 'DNGVersion',
                'type': 'Byte'
            },
            50707: {
                'name': 'DNGBackwardVersion',
                'type': 'Byte'
            },
            50708: {
                'name': 'UniqueCameraModel',
                'type': 'Ascii'
            },
            50709: {
                'name': 'LocalizedCameraModel',
                'type': 'Byte'
            },
            50710: {
                'name': 'CFAPlaneColor',
                'type': 'Byte'
            },
            50711: {
                'name': 'CFALayout',
                'type': 'Short'
            },
            50712: {
                'name': 'LinearizationTable',
                'type': 'Short'
            },
            50713: {
                'name': 'BlackLevelRepeatDim',
                'type': 'Short'
            },
            50714: {
                'name': 'BlackLevel',
                'type': 'Rational'
            },
            50715: {
                'name': 'BlackLevelDeltaH',
                'type': 'SRational'
            },
            50716: {
                'name': 'BlackLevelDeltaV',
                'type': 'SRational'
            },
            50717: {
                'name': 'WhiteLevel',
                'type': 'Short'
            },
            50718: {
                'name': 'DefaultScale',
                'type': 'Rational'
            },
            50719: {
                'name': 'DefaultCropOrigin',
                'type': 'Short'
            },
            50720: {
                'name': 'DefaultCropSize',
                'type': 'Short'
            },
            50721: {
                'name': 'ColorMatrix1',
                'type': 'SRational'
            },
            50722: {
                'name': 'ColorMatrix2',
                'type': 'SRational'
            },
            50723: {
                'name': 'CameraCalibration1',
                'type': 'SRational'
            },
            50724: {
                'name': 'CameraCalibration2',
                'type': 'SRational'
            },
            50725: {
                'name': 'ReductionMatrix1',
                'type': 'SRational'
            },
            50726: {
                'name': 'ReductionMatrix2',
                'type': 'SRational'
            },
            50727: {
                'name': 'AnalogBalance',
                'type': 'Rational'
            },
            50728: {
                'name': 'AsShotNeutral',
                'type': 'Short'
            },
            50729: {
                'name': 'AsShotWhiteXY',
                'type': 'Rational'
            },
            50730: {
                'name': 'BaselineExposure',
                'type': 'SRational'
            },
            50731: {
                'name': 'BaselineNoise',
                'type': 'Rational'
            },
            50732: {
                'name': 'BaselineSharpness',
                'type': 'Rational'
            },
            50733: {
                'name': 'BayerGreenSplit',
                'type': 'Long'
            },
            50734: {
                'name': 'LinearResponseLimit',
                'type': 'Rational'
            },
            50735: {
                'name': 'CameraSerialNumber',
                'type': 'Ascii'
            },
            50736: {
                'name': 'LensInfo',
                'type': 'Rational'
            },
            50737: {
                'name': 'ChromaBlurRadius',
                'type': 'Rational'
            },
            50738: {
                'name': 'AntiAliasStrength',
                'type': 'Rational'
            },
            50739: {
                'name': 'ShadowScale',
                'type': 'SRational'
            },
            50740: {
                'name': 'DNGPrivateData',
                'type': 'Byte'
            },
            50741: {
                'name': 'MakerNoteSafety',
                'type': 'Short'
            },
            50778: {
                'name': 'CalibrationIlluminant1',
                'type': 'Short'
            },
            50779: {
                'name': 'CalibrationIlluminant2',
                'type': 'Short'
            },
            50780: {
                'name': 'BestQualityScale',
                'type': 'Rational'
            },
            50781: {
                'name': 'RawDataUniqueID',
                'type': 'Byte'
            },
            50827: {
                'name': 'OriginalRawFileName',
                'type': 'Byte'
            },
            50828: {
                'name': 'OriginalRawFileData',
                'type': 'Undefined'
            },
            50829: {
                'name': 'ActiveArea',
                'type': 'Short'
            },
            50830: {
                'name': 'MaskedAreas',
                'type': 'Short'
            },
            50831: {
                'name': 'AsShotICCProfile',
                'type': 'Undefined'
            },
            50832: {
                'name': 'AsShotPreProfileMatrix',
                'type': 'SRational'
            },
            50833: {
                'name': 'CurrentICCProfile',
                'type': 'Undefined'
            },
            50834: {
                'name': 'CurrentPreProfileMatrix',
                'type': 'SRational'
            },
            50879: {
                'name': 'ColorimetricReference',
                'type': 'Short'
            },
            50931: {
                'name': 'CameraCalibrationSignature',
                'type': 'Byte'
            },
            50932: {
                'name': 'ProfileCalibrationSignature',
                'type': 'Byte'
            },
            50934: {
                'name': 'AsShotProfileName',
                'type': 'Byte'
            },
            50935: {
                'name': 'NoiseReductionApplied',
                'type': 'Rational'
            },
            50936: {
                'name': 'ProfileName',
                'type': 'Byte'
            },
            50937: {
                'name': 'ProfileHueSatMapDims',
                'type': 'Long'
            },
            50938: {
                'name': 'ProfileHueSatMapData1',
                'type': 'Float'
            },
            50939: {
                'name': 'ProfileHueSatMapData2',
                'type': 'Float'
            },
            50940: {
                'name': 'ProfileToneCurve',
                'type': 'Float'
            },
            50941: {
                'name': 'ProfileEmbedPolicy',
                'type': 'Long'
            },
            50942: {
                'name': 'ProfileCopyright',
                'type': 'Byte'
            },
            50964: {
                'name': 'ForwardMatrix1',
                'type': 'SRational'
            },
            50965: {
                'name': 'ForwardMatrix2',
                'type': 'SRational'
            },
            50966: {
                'name': 'PreviewApplicationName',
                'type': 'Byte'
            },
            50967: {
                'name': 'PreviewApplicationVersion',
                'type': 'Byte'
            },
            50968: {
                'name': 'PreviewSettingsName',
                'type': 'Byte'
            },
            50969: {
                'name': 'PreviewSettingsDigest',
                'type': 'Byte'
            },
            50970: {
                'name': 'PreviewColorSpace',
                'type': 'Long'
            },
            50971: {
                'name': 'PreviewDateTime',
                'type': 'Ascii'
            },
            50972: {
                'name': 'RawImageDigest',
                'type': 'Undefined'
            },
            50973: {
                'name': 'OriginalRawFileDigest',
                'type': 'Undefined'
            },
            50974: {
                'name': 'SubTileBlockSize',
                'type': 'Long'
            },
            50975: {
                'name': 'RowInterleaveFactor',
                'type': 'Long'
            },
            50981: {
                'name': 'ProfileLookTableDims',
                'type': 'Long'
            },
            50982: {
                'name': 'ProfileLookTableData',
                'type': 'Float'
            },
            51008: {
                'name': 'OpcodeList1',
                'type': 'Undefined'
            },
            51009: {
                'name': 'OpcodeList2',
                'type': 'Undefined'
            },
            51022: {
                'name': 'OpcodeList3',
                'type': 'Undefined'
            }
        },
        'Exif': {
            33434: {
                'name': 'ExposureTime',
                'type': 'Rational'
            },
            33437: {
                'name': 'FNumber',
                'type': 'Rational'
            },
            34850: {
                'name': 'ExposureProgram',
                'type': 'Short'
            },
            34852: {
                'name': 'SpectralSensitivity',
                'type': 'Ascii'
            },
            34855: {
                'name': 'ISOSpeedRatings',
                'type': 'Short'
            },
            34856: {
                'name': 'OECF',
                'type': 'Undefined'
            },
            34864: {
                'name': 'SensitivityType',
                'type': 'Short'
            },
            34865: {
                'name': 'StandardOutputSensitivity',
                'type': 'Long'
            },
            34866: {
                'name': 'RecommendedExposureIndex',
                'type': 'Long'
            },
            34867: {
                'name': 'ISOSpeed',
                'type': 'Long'
            },
            34868: {
                'name': 'ISOSpeedLatitudeyyy',
                'type': 'Long'
            },
            34869: {
                'name': 'ISOSpeedLatitudezzz',
                'type': 'Long'
            },
            36864: {
                'name': 'ExifVersion',
                'type': 'Undefined'
            },
            36867: {
                'name': 'DateTimeOriginal',
                'type': 'Ascii'
            },
            36868: {
                'name': 'DateTimeDigitized',
                'type': 'Ascii'
            },
            37121: {
                'name': 'ComponentsConfiguration',
                'type': 'Undefined'
            },
            37122: {
                'name': 'CompressedBitsPerPixel',
                'type': 'Rational'
            },
            37377: {
                'name': 'ShutterSpeedValue',
                'type': 'SRational'
            },
            37378: {
                'name': 'ApertureValue',
                'type': 'Rational'
            },
            37379: {
                'name': 'BrightnessValue',
                'type': 'SRational'
            },
            37380: {
                'name': 'ExposureBiasValue',
                'type': 'SRational'
            },
            37381: {
                'name': 'MaxApertureValue',
                'type': 'Rational'
            },
            37382: {
                'name': 'SubjectDistance',
                'type': 'Rational'
            },
            37383: {
                'name': 'MeteringMode',
                'type': 'Short'
            },
            37384: {
                'name': 'LightSource',
                'type': 'Short'
            },
            37385: {
                'name': 'Flash',
                'type': 'Short'
            },
            37386: {
                'name': 'FocalLength',
                'type': 'Rational'
            },
            37396: {
                'name': 'SubjectArea',
                'type': 'Short'
            },
            37500: {
                'name': 'MakerNote',
                'type': 'Undefined'
            },
            37510: {
                'name': 'UserComment',
                'type': 'Ascii'
            },
            37520: {
                'name': 'SubSecTime',
                'type': 'Ascii'
            },
            37521: {
                'name': 'SubSecTimeOriginal',
                'type': 'Ascii'
            },
            37522: {
                'name': 'SubSecTimeDigitized',
                'type': 'Ascii'
            },
            40960: {
                'name': 'FlashpixVersion',
                'type': 'Undefined'
            },
            40961: {
                'name': 'ColorSpace',
                'type': 'Short'
            },
            40962: {
                'name': 'PixelXDimension',
                'type': 'Long'
            },
            40963: {
                'name': 'PixelYDimension',
                'type': 'Long'
            },
            40964: {
                'name': 'RelatedSoundFile',
                'type': 'Ascii'
            },
            40965: {
                'name': 'InteroperabilityTag',
                'type': 'Long'
            },
            41483: {
                'name': 'FlashEnergy',
                'type': 'Rational'
            },
            41484: {
                'name': 'SpatialFrequencyResponse',
                'type': 'Undefined'
            },
            41486: {
                'name': 'FocalPlaneXResolution',
                'type': 'Rational'
            },
            41487: {
                'name': 'FocalPlaneYResolution',
                'type': 'Rational'
            },
            41488: {
                'name': 'FocalPlaneResolutionUnit',
                'type': 'Short'
            },
            41492: {
                'name': 'SubjectLocation',
                'type': 'Short'
            },
            41493: {
                'name': 'ExposureIndex',
                'type': 'Rational'
            },
            41495: {
                'name': 'SensingMethod',
                'type': 'Short'
            },
            41728: {
                'name': 'FileSource',
                'type': 'Undefined'
            },
            41729: {
                'name': 'SceneType',
                'type': 'Undefined'
            },
            41730: {
                'name': 'CFAPattern',
                'type': 'Undefined'
            },
            41985: {
                'name': 'CustomRendered',
                'type': 'Short'
            },
            41986: {
                'name': 'ExposureMode',
                'type': 'Short'
            },
            41987: {
                'name': 'WhiteBalance',
                'type': 'Short'
            },
            41988: {
                'name': 'DigitalZoomRatio',
                'type': 'Rational'
            },
            41989: {
                'name': 'FocalLengthIn35mmFilm',
                'type': 'Short'
            },
            41990: {
                'name': 'SceneCaptureType',
                'type': 'Short'
            },
            41991: {
                'name': 'GainControl',
                'type': 'Short'
            },
            41992: {
                'name': 'Contrast',
                'type': 'Short'
            },
            41993: {
                'name': 'Saturation',
                'type': 'Short'
            },
            41994: {
                'name': 'Sharpness',
                'type': 'Short'
            },
            41995: {
                'name': 'DeviceSettingDescription',
                'type': 'Undefined'
            },
            41996: {
                'name': 'SubjectDistanceRange',
                'type': 'Short'
            },
            42016: {
                'name': 'ImageUniqueID',
                'type': 'Ascii'
            },
            42032: {
                'name': 'CameraOwnerName',
                'type': 'Ascii'
            },
            42033: {
                'name': 'BodySerialNumber',
                'type': 'Ascii'
            },
            42034: {
                'name': 'LensSpecification',
                'type': 'Rational'
            },
            42035: {
                'name': 'LensMake',
                'type': 'Ascii'
            },
            42036: {
                'name': 'LensModel',
                'type': 'Ascii'
            },
            42037: {
                'name': 'LensSerialNumber',
                'type': 'Ascii'
            },
            42240: {
                'name': 'Gamma',
                'type': 'Rational'
            }
        },
        'GPS': {
            0: {
                'name': 'GPSVersionID',
                'type': 'Byte'
            },
            1: {
                'name': 'GPSLatitudeRef',
                'type': 'Ascii'
            },
            2: {
                'name': 'GPSLatitude',
                'type': 'Rational'
            },
            3: {
                'name': 'GPSLongitudeRef',
                'type': 'Ascii'
            },
            4: {
                'name': 'GPSLongitude',
                'type': 'Rational'
            },
            5: {
                'name': 'GPSAltitudeRef',
                'type': 'Byte'
            },
            6: {
                'name': 'GPSAltitude',
                'type': 'Rational'
            },
            7: {
                'name': 'GPSTimeStamp',
                'type': 'Rational'
            },
            8: {
                'name': 'GPSSatellites',
                'type': 'Ascii'
            },
            9: {
                'name': 'GPSStatus',
                'type': 'Ascii'
            },
            10: {
                'name': 'GPSMeasureMode',
                'type': 'Ascii'
            },
            11: {
                'name': 'GPSDOP',
                'type': 'Rational'
            },
            12: {
                'name': 'GPSSpeedRef',
                'type': 'Ascii'
            },
            13: {
                'name': 'GPSSpeed',
                'type': 'Rational'
            },
            14: {
                'name': 'GPSTrackRef',
                'type': 'Ascii'
            },
            15: {
                'name': 'GPSTrack',
                'type': 'Rational'
            },
            16: {
                'name': 'GPSImgDirectionRef',
                'type': 'Ascii'
            },
            17: {
                'name': 'GPSImgDirection',
                'type': 'Rational'
            },
            18: {
                'name': 'GPSMapDatum',
                'type': 'Ascii'
            },
            19: {
                'name': 'GPSDestLatitudeRef',
                'type': 'Ascii'
            },
            20: {
                'name': 'GPSDestLatitude',
                'type': 'Rational'
            },
            21: {
                'name': 'GPSDestLongitudeRef',
                'type': 'Ascii'
            },
            22: {
                'name': 'GPSDestLongitude',
                'type': 'Rational'
            },
            23: {
                'name': 'GPSDestBearingRef',
                'type': 'Ascii'
            },
            24: {
                'name': 'GPSDestBearing',
                'type': 'Rational'
            },
            25: {
                'name': 'GPSDestDistanceRef',
                'type': 'Ascii'
            },
            26: {
                'name': 'GPSDestDistance',
                'type': 'Rational'
            },
            27: {
                'name': 'GPSProcessingMethod',
                'type': 'Undefined'
            },
            28: {
                'name': 'GPSAreaInformation',
                'type': 'Undefined'
            },
            29: {
                'name': 'GPSDateStamp',
                'type': 'Ascii'
            },
            30: {
                'name': 'GPSDifferential',
                'type': 'Short'
            },
            31: {
                'name': 'GPSHPositioningError',
                'type': 'Rational'
            }
        },
        'Interop': {
            1: {
                'name': 'InteroperabilityIndex',
                'type': 'Ascii'
            }
        },
    };
    TAGS["0th"] = TAGS["Image"];
    TAGS["1st"] = TAGS["Image"];
    that.TAGS = TAGS;

    
    that.ImageIFD = {
        ProcessingSoftware:11,
        NewSubfileType:254,
        SubfileType:255,
        ImageWidth:256,
        ImageLength:257,
        BitsPerSample:258,
        Compression:259,
        PhotometricInterpretation:262,
        Threshholding:263,
        CellWidth:264,
        CellLength:265,
        FillOrder:266,
        DocumentName:269,
        ImageDescription:270,
        Make:271,
        Model:272,
        StripOffsets:273,
        Orientation:274,
        SamplesPerPixel:277,
        RowsPerStrip:278,
        StripByteCounts:279,
        XResolution:282,
        YResolution:283,
        PlanarConfiguration:284,
        GrayResponseUnit:290,
        GrayResponseCurve:291,
        T4Options:292,
        T6Options:293,
        ResolutionUnit:296,
        TransferFunction:301,
        Software:305,
        DateTime:306,
        Artist:315,
        HostComputer:316,
        Predictor:317,
        WhitePoint:318,
        PrimaryChromaticities:319,
        ColorMap:320,
        HalftoneHints:321,
        TileWidth:322,
        TileLength:323,
        TileOffsets:324,
        TileByteCounts:325,
        SubIFDs:330,
        InkSet:332,
        InkNames:333,
        NumberOfInks:334,
        DotRange:336,
        TargetPrinter:337,
        ExtraSamples:338,
        SampleFormat:339,
        SMinSampleValue:340,
        SMaxSampleValue:341,
        TransferRange:342,
        ClipPath:343,
        XClipPathUnits:344,
        YClipPathUnits:345,
        Indexed:346,
        JPEGTables:347,
        OPIProxy:351,
        JPEGProc:512,
        JPEGInterchangeFormat:513,
        JPEGInterchangeFormatLength:514,
        JPEGRestartInterval:515,
        JPEGLosslessPredictors:517,
        JPEGPointTransforms:518,
        JPEGQTables:519,
        JPEGDCTables:520,
        JPEGACTables:521,
        YCbCrCoefficients:529,
        YCbCrSubSampling:530,
        YCbCrPositioning:531,
        ReferenceBlackWhite:532,
        XMLPacket:700,
        Rating:18246,
        RatingPercent:18249,
        ImageID:32781,
        CFARepeatPatternDim:33421,
        CFAPattern:33422,
        BatteryLevel:33423,
        Copyright:33432,
        ExposureTime:33434,
        ImageResources:34377,
        ExifTag:34665,
        InterColorProfile:34675,
        GPSTag:34853,
        Interlace:34857,
        TimeZoneOffset:34858,
        SelfTimerMode:34859,
        FlashEnergy:37387,
        SpatialFrequencyResponse:37388,
        Noise:37389,
        FocalPlaneXResolution:37390,
        FocalPlaneYResolution:37391,
        FocalPlaneResolutionUnit:37392,
        ImageNumber:37393,
        SecurityClassification:37394,
        ImageHistory:37395,
        ExposureIndex:37397,
        TIFFEPStandardID:37398,
        SensingMethod:37399,
        XPTitle:40091,
        XPComment:40092,
        XPAuthor:40093,
        XPKeywords:40094,
        XPSubject:40095,
        PrintImageMatching:50341,
        DNGVersion:50706,
        DNGBackwardVersion:50707,
        UniqueCameraModel:50708,
        LocalizedCameraModel:50709,
        CFAPlaneColor:50710,
        CFALayout:50711,
        LinearizationTable:50712,
        BlackLevelRepeatDim:50713,
        BlackLevel:50714,
        BlackLevelDeltaH:50715,
        BlackLevelDeltaV:50716,
        WhiteLevel:50717,
        DefaultScale:50718,
        DefaultCropOrigin:50719,
        DefaultCropSize:50720,
        ColorMatrix1:50721,
        ColorMatrix2:50722,
        CameraCalibration1:50723,
        CameraCalibration2:50724,
        ReductionMatrix1:50725,
        ReductionMatrix2:50726,
        AnalogBalance:50727,
        AsShotNeutral:50728,
        AsShotWhiteXY:50729,
        BaselineExposure:50730,
        BaselineNoise:50731,
        BaselineSharpness:50732,
        BayerGreenSplit:50733,
        LinearResponseLimit:50734,
        CameraSerialNumber:50735,
        LensInfo:50736,
        ChromaBlurRadius:50737,
        AntiAliasStrength:50738,
        ShadowScale:50739,
        DNGPrivateData:50740,
        MakerNoteSafety:50741,
        CalibrationIlluminant1:50778,
        CalibrationIlluminant2:50779,
        BestQualityScale:50780,
        RawDataUniqueID:50781,
        OriginalRawFileName:50827,
        OriginalRawFileData:50828,
        ActiveArea:50829,
        MaskedAreas:50830,
        AsShotICCProfile:50831,
        AsShotPreProfileMatrix:50832,
        CurrentICCProfile:50833,
        CurrentPreProfileMatrix:50834,
        ColorimetricReference:50879,
        CameraCalibrationSignature:50931,
        ProfileCalibrationSignature:50932,
        AsShotProfileName:50934,
        NoiseReductionApplied:50935,
        ProfileName:50936,
        ProfileHueSatMapDims:50937,
        ProfileHueSatMapData1:50938,
        ProfileHueSatMapData2:50939,
        ProfileToneCurve:50940,
        ProfileEmbedPolicy:50941,
        ProfileCopyright:50942,
        ForwardMatrix1:50964,
        ForwardMatrix2:50965,
        PreviewApplicationName:50966,
        PreviewApplicationVersion:50967,
        PreviewSettingsName:50968,
        PreviewSettingsDigest:50969,
        PreviewColorSpace:50970,
        PreviewDateTime:50971,
        RawImageDigest:50972,
        OriginalRawFileDigest:50973,
        SubTileBlockSize:50974,
        RowInterleaveFactor:50975,
        ProfileLookTableDims:50981,
        ProfileLookTableData:50982,
        OpcodeList1:51008,
        OpcodeList2:51009,
        OpcodeList3:51022,
        NoiseProfile:51041,
    };

    
    that.ExifIFD = {
        ExposureTime:33434,
        FNumber:33437,
        ExposureProgram:34850,
        SpectralSensitivity:34852,
        ISOSpeedRatings:34855,
        OECF:34856,
        SensitivityType:34864,
        StandardOutputSensitivity:34865,
        RecommendedExposureIndex:34866,
        ISOSpeed:34867,
        ISOSpeedLatitudeyyy:34868,
        ISOSpeedLatitudezzz:34869,
        ExifVersion:36864,
        DateTimeOriginal:36867,
        DateTimeDigitized:36868,
        ComponentsConfiguration:37121,
        CompressedBitsPerPixel:37122,
        ShutterSpeedValue:37377,
        ApertureValue:37378,
        BrightnessValue:37379,
        ExposureBiasValue:37380,
        MaxApertureValue:37381,
        SubjectDistance:37382,
        MeteringMode:37383,
        LightSource:37384,
        Flash:37385,
        FocalLength:37386,
        SubjectArea:37396,
        MakerNote:37500,
        UserComment:37510,
        SubSecTime:37520,
        SubSecTimeOriginal:37521,
        SubSecTimeDigitized:37522,
        FlashpixVersion:40960,
        ColorSpace:40961,
        PixelXDimension:40962,
        PixelYDimension:40963,
        RelatedSoundFile:40964,
        InteroperabilityTag:40965,
        FlashEnergy:41483,
        SpatialFrequencyResponse:41484,
        FocalPlaneXResolution:41486,
        FocalPlaneYResolution:41487,
        FocalPlaneResolutionUnit:41488,
        SubjectLocation:41492,
        ExposureIndex:41493,
        SensingMethod:41495,
        FileSource:41728,
        SceneType:41729,
        CFAPattern:41730,
        CustomRendered:41985,
        ExposureMode:41986,
        WhiteBalance:41987,
        DigitalZoomRatio:41988,
        FocalLengthIn35mmFilm:41989,
        SceneCaptureType:41990,
        GainControl:41991,
        Contrast:41992,
        Saturation:41993,
        Sharpness:41994,
        DeviceSettingDescription:41995,
        SubjectDistanceRange:41996,
        ImageUniqueID:42016,
        CameraOwnerName:42032,
        BodySerialNumber:42033,
        LensSpecification:42034,
        LensMake:42035,
        LensModel:42036,
        LensSerialNumber:42037,
        Gamma:42240,
    };


    that.GPSIFD = {
        GPSVersionID:0,
        GPSLatitudeRef:1,
        GPSLatitude:2,
        GPSLongitudeRef:3,
        GPSLongitude:4,
        GPSAltitudeRef:5,
        GPSAltitude:6,
        GPSTimeStamp:7,
        GPSSatellites:8,
        GPSStatus:9,
        GPSMeasureMode:10,
        GPSDOP:11,
        GPSSpeedRef:12,
        GPSSpeed:13,
        GPSTrackRef:14,
        GPSTrack:15,
        GPSImgDirectionRef:16,
        GPSImgDirection:17,
        GPSMapDatum:18,
        GPSDestLatitudeRef:19,
        GPSDestLatitude:20,
        GPSDestLongitudeRef:21,
        GPSDestLongitude:22,
        GPSDestBearingRef:23,
        GPSDestBearing:24,
        GPSDestDistanceRef:25,
        GPSDestDistance:26,
        GPSProcessingMethod:27,
        GPSAreaInformation:28,
        GPSDateStamp:29,
        GPSDifferential:30,
        GPSHPositioningError:31,
    };


    that.InteropIFD = {
        InteroperabilityIndex:1,
    };

    that.GPSHelper = {
        degToDmsRational:function (degFloat) {
            var degAbs = Math.abs(degFloat);
            var minFloat = degAbs % 1 * 60;
            var secFloat = minFloat % 1 * 60;
            var deg = Math.floor(degAbs);
            var min = Math.floor(minFloat);
            var sec = Math.round(secFloat * 100);

            return [[deg, 1], [min, 1], [sec, 100]];
        },

        dmsRationalToDeg:function (dmsArray, ref) {
            var sign = (ref === 'S' || ref === 'W') ? -1.0 : 1.0;
            var deg = dmsArray[0][0] / dmsArray[0][1] +
                      dmsArray[1][0] / dmsArray[1][1] / 60.0 +
                      dmsArray[2][0] / dmsArray[2][1] / 3600.0;

            return deg * sign;
        }
    };
    
    
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = that;
        }
        exports.piexif = that;
    } else {
        window.piexif = that;
    }

})();

/*!
 * bootstrap-fileinput v5.5.2
 * http://plugins.krajee.com/file-input
 *
 * Author: Kartik Visweswaran
 * Copyright: 2014 - 2022, Kartik Visweswaran, Krajee.com
 *
 * Licensed under the BSD-3-Clause
 * https://github.com/kartik-v/bootstrap-fileinput/blob/master/LICENSE.md
 */
(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && typeof module.exports === 'object') {
        factory(require('jquery'));
    } else {
        factory(window.jQuery);
    }
}(function ($) {
    'use strict';

    $.fn.fileinputLocales = {};
    $.fn.fileinputThemes = {};

    if (!$.fn.fileinputBsVersion) {
        $.fn.fileinputBsVersion = (window.bootstrap && window.bootstrap.Alert && window.bootstrap.Alert.VERSION) ||
            (window.Alert && window.Alert.VERSION) || '3.x.x';
    }

    String.prototype.setTokens = function (replacePairs) {
        var str = this.toString(), key, re;
        for (key in replacePairs) {
            if (replacePairs.hasOwnProperty(key)) {
                re = new RegExp('\{' + key + '\}', 'g');
                str = str.replace(re, replacePairs[key]);
            }
        }
        return str;
    };

    if (!Array.prototype.flatMap) { // polyfill flatMap
        Array.prototype.flatMap = function (lambda) {
            return [].concat(this.map(lambda));
        };
    }

    var $h, FileInput;

    // fileinput helper object for all global variables and internal helper methods
    $h = {
        FRAMES: '.kv-preview-thumb',
        SORT_CSS: 'file-sortable',
        INIT_FLAG: 'init-',
        SCRIPT_SRC: document && document.currentScript && document.currentScript.src || null,
        OBJECT_PARAMS: '<param name="controller" value="true" />\n' +
            '<param name="allowFullScreen" value="true" />\n' +
            '<param name="allowScriptAccess" value="always" />\n' +
            '<param name="autoPlay" value="false" />\n' +
            '<param name="autoStart" value="false" />\n' +
            '<param name="quality" value="high" />\n',
        DEFAULT_PREVIEW: '<div class="file-preview-other">\n' +
            '<span class="{previewFileIconClass}">{previewFileIcon}</span>\n' +
            '</div>',
        MODAL_ID: 'kvFileinputModal',
        MODAL_EVENTS: ['show', 'shown', 'hide', 'hidden', 'loaded'],
        logMessages: {
            ajaxError: '{status}: {error}. Error Details: {text}.',
            badDroppedFiles: 'Error scanning dropped files!',
            badExifParser: 'Error loading the piexif.js library. {details}',
            badInputType: 'The input "type" must be set to "file" for initializing the "bootstrap-fileinput" plugin.',
            exifWarning: 'To avoid this warning, either set "autoOrientImage" to "false" OR ensure you have loaded ' +
                'the "piexif.js" library correctly on your page before the "fileinput.js" script.',
            invalidChunkSize: 'Invalid upload chunk size: "{chunkSize}". Resumable uploads are disabled.',
            invalidThumb: 'Invalid thumb frame with id: "{id}".',
            noResumableSupport: 'The browser does not support resumable or chunk uploads.',
            noUploadUrl: 'The "uploadUrl" is not set. Ajax uploads and resumable uploads have been disabled.',
            retryStatus: 'Retrying upload for chunk # {chunk} for {filename}... retry # {retry}.',
            chunkQueueError: 'Could not push task to ajax pool for chunk index # {index}.',
            resumableMaxRetriesReached: 'Maximum resumable ajax retries ({n}) reached.',
            resumableRetryError: 'Could not retry the resumable request (try # {n})... aborting.',
            resumableAborting: 'Aborting / cancelling the resumable request.',
            resumableRequestError: 'Error processing resumable request. {msg}'

        },
        objUrl: window.URL || window.webkitURL,
        getZoomPlaceholder: function () { // used to prevent 404 errors in URL parsing
            var src = $h.SCRIPT_SRC, srcPath, zoomVar = '?kvTemp__2873389129__=';
            if (!src) {
                return zoomVar;
            }
            srcPath = src.substring(0, src.lastIndexOf("/"));
            return srcPath.substring(0, srcPath.lastIndexOf("/") + 1) + 'img/loading.gif' + zoomVar;
        },
        isBs: function (ver) {
            var chk = $.trim(($.fn.fileinputBsVersion || '') + '');
            ver = parseInt(ver, 10);
            if (!chk) {
                return ver === 4;
            }
            return ver === parseInt(chk.charAt(0), 10);

        },
        defaultButtonCss: function (fill) {
            return 'btn-default btn-' + (fill ? '' : 'outline-') + 'secondary';
        },
        now: function () {
            return new Date().getTime();
        },
        round: function (num) {
            num = parseFloat(num);
            return isNaN(num) ? 0 : Math.floor(Math.round(num));
        },
        getArray: function (obj) {
            var i, arr = [], len = obj && obj.length || 0;
            for (i = 0; i < len; i++) {
                arr.push(obj[i]);
            }
            return arr;
        },
        getFileRelativePath: function (file) {
            /** @namespace file.relativePath */
            /** @namespace file.webkitRelativePath */
            return String(file.newPath || file.relativePath || file.webkitRelativePath || $h.getFileName(file) || null);

        },
        getFileId: function (file, generateFileId) {
            var relativePath = $h.getFileRelativePath(file);
            if (typeof generateFileId === 'function') {
                return generateFileId(file);
            }
            if (!file) {
                return null;
            }
            if (!relativePath) {
                return null;
            }
            return (file.size + '_' + encodeURIComponent(relativePath).replace(/%/g, '_'));
        },
        getFrameSelector: function (id, selector) {
            selector = selector || '';
            return '[id="' + id + '"]' + selector;
        },
        getZoomSelector: function (id, selector) {
            return $h.getFrameSelector('zoom-' + id, selector);
        },
        getFrameElement: function ($element, id, selector) {
            return $element.find($h.getFrameSelector(id, selector));
        },
        getZoomElement: function ($element, id, selector) {
            return $element.find($h.getZoomSelector(id, selector));
        },
        getElapsed: function (seconds) {
            var delta = seconds, out = '', result = {}, structure = {
                year: 31536000,
                month: 2592000,
                week: 604800, // uncomment row to ignore
                day: 86400,   // feel free to add your own row
                hour: 3600,
                minute: 60,
                second: 1
            };
            $h.getObjectKeys(structure).forEach(function (key) {
                result[key] = Math.floor(delta / structure[key]);
                delta -= result[key] * structure[key];
            });
            $.each(result, function (key, value) {
                if (value > 0) {
                    out += (out ? ' ' : '') + value + key.substring(0, 1);
                }
            });
            return out;
        },
        debounce: function (func, delay) {
            var inDebounce;
            return function () {
                var args = arguments, context = this;
                clearTimeout(inDebounce);
                inDebounce = setTimeout(function () {
                    func.apply(context, args);
                }, delay);
            };
        },
        stopEvent: function (e) {
            e.stopPropagation();
            e.preventDefault();
        },
        getFileName: function (file) {
            /** @namespace file.fileName */
            return file ? (file.fileName || file.name || '') : ''; // some confusion in different versions of Firefox
        },
        createObjectURL: function (data) {
            if ($h.objUrl && $h.objUrl.createObjectURL && data) {
                return $h.objUrl.createObjectURL(data);
            }
            return '';
        },
        revokeObjectURL: function (data) {
            if ($h.objUrl && $h.objUrl.revokeObjectURL && data) {
                $h.objUrl.revokeObjectURL(data);
            }
        },
        compare: function (input, str, exact) {
            return input !== undefined && (exact ? input === str : input.match(str));
        },
        isIE: function (ver) {
            var div, status;
            // check for IE versions < 11
            if (navigator.appName !== 'Microsoft Internet Explorer') {
                return false;
            }
            if (ver === 10) {
                return new RegExp('msie\\s' + ver, 'i').test(navigator.userAgent);
            }
            div = document.createElement('div');
            div.innerHTML = '<!--[if IE ' + ver + ']> <i></i> <![endif]-->';
            status = div.getElementsByTagName('i').length;
            document.body.appendChild(div);
            div.parentNode.removeChild(div);
            return status;
        },
        canOrientImage: function ($el) {
            var $img = $(document.createElement('img')).css({width: '1px', height: '1px'}).insertAfter($el),
                flag = $img.css('image-orientation');
            $img.remove();
            return !!flag;
        },
        canAssignFilesToInput: function () {
            var input = document.createElement('input');
            try {
                input.type = 'file';
                input.files = null;
                return true;
            } catch (err) {
                return false;
            }
        },
        getDragDropFolders: function (items) {
            var i, item, len = items ? items.length : 0, folders = 0;
            if (len > 0 && items[0].webkitGetAsEntry()) {
                for (i = 0; i < len; i++) {
                    item = items[i].webkitGetAsEntry();
                    if (item && item.isDirectory) {
                        folders++;
                    }
                }
            }
            return folders;
        },
        initModal: function ($modal) {
            var $body = $('body');
            if ($body.length) {
                $modal.appendTo($body);
            }
        },
        isFunction: function (v) {
            return typeof v === 'function';
        },
        isEmpty: function (value, trim) {
            if (value === undefined || value === null || value === '') {
                return true;
            }
            if ($h.isString(value) && trim) {
                return $.trim(value) === '';
            }
            if ($h.isArray(value)) {
                return value.length === 0;
            }
            if ($.isPlainObject(value) && $.isEmptyObject(value)) {
                return true;
            }
            return false;
        },
        isArray: function (a) {
            return Array.isArray(a) || Object.prototype.toString.call(a) === '[object Array]';
        },
        isString: function (a) {
            return Object.prototype.toString.call(a) === '[object String]';
        },
        ifSet: function (needle, haystack, def) {
            def = def || '';
            return (haystack && typeof haystack === 'object' && needle in haystack) ? haystack[needle] : def;
        },
        cleanArray: function (arr) {
            if (!(arr instanceof Array)) {
                arr = [];
            }
            return arr.filter(function (e) {
                return (e !== undefined && e !== null);
            });
        },
        spliceArray: function (arr, index, reverseOrder) {
            var i, j = 0, out = [], newArr;
            if (!(arr instanceof Array)) {
                return [];
            }
            newArr = $.extend(true, [], arr);
            if (reverseOrder) {
                newArr.reverse();
            }
            for (i = 0; i < newArr.length; i++) {
                if (i !== index) {
                    out[j] = newArr[i];
                    j++;
                }
            }
            if (reverseOrder) {
                out.reverse();
            }
            return out;
        },
        getNum: function (num, def) {
            def = def || 0;
            if (typeof num === 'number') {
                return num;
            }
            if (typeof num === 'string') {
                num = parseFloat(num);
            }
            return isNaN(num) ? def : num;
        },
        hasFileAPISupport: function () {
            return !!(window.File && window.FileReader);
        },
        hasDragDropSupport: function () {
            var div = document.createElement('div');
            /** @namespace div.draggable */
            /** @namespace div.ondragstart */
            /** @namespace div.ondrop */
            return !$h.isIE(9) &&
                (div.draggable !== undefined || (div.ondragstart !== undefined && div.ondrop !== undefined));
        },
        hasFileUploadSupport: function () {
            return $h.hasFileAPISupport() && window.FormData;
        },
        hasBlobSupport: function () {
            try {
                return !!window.Blob && Boolean(new Blob());
            } catch (e) {
                return false;
            }
        },
        hasArrayBufferViewSupport: function () {
            try {
                return new Blob([new Uint8Array(100)]).size === 100;
            } catch (e) {
                return false;
            }
        },
        hasResumableUploadSupport: function () {
            /** @namespace Blob.prototype.webkitSlice */
            /** @namespace Blob.prototype.mozSlice */
            return $h.hasFileUploadSupport() && $h.hasBlobSupport() && $h.hasArrayBufferViewSupport() &&
                (!!Blob.prototype.webkitSlice || !!Blob.prototype.mozSlice || !!Blob.prototype.slice || false);
        },
        dataURI2Blob: function (dataURI) {
            var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder ||
                    window.MSBlobBuilder, canBlob = $h.hasBlobSupport(), byteStr, arrayBuffer, intArray, i, mimeStr, bb,
                canProceed = (canBlob || BlobBuilder) && window.atob && window.ArrayBuffer && window.Uint8Array;
            if (!canProceed) {
                return null;
            }
            if (dataURI.split(',')[0].indexOf('base64') >= 0) {
                byteStr = atob(dataURI.split(',')[1]);
            } else {
                byteStr = decodeURIComponent(dataURI.split(',')[1]);
            }
            arrayBuffer = new ArrayBuffer(byteStr.length);
            intArray = new Uint8Array(arrayBuffer);
            for (i = 0; i < byteStr.length; i += 1) {
                intArray[i] = byteStr.charCodeAt(i);
            }
            mimeStr = dataURI.split(',')[0].split(':')[1].split(';')[0];
            if (canBlob) {
                return new Blob([$h.hasArrayBufferViewSupport() ? intArray : arrayBuffer], {type: mimeStr});
            }
            bb = new BlobBuilder();
            bb.append(arrayBuffer);
            return bb.getBlob(mimeStr);
        },
        arrayBuffer2String: function (buffer) {
            if (window.TextDecoder) {
                return new TextDecoder('utf-8').decode(buffer);
            }
            var array = Array.prototype.slice.apply(new Uint8Array(buffer)), out = '', i = 0, len, c, char2, char3;
            len = array.length;
            while (i < len) {
                c = array[i++];
                switch (c >> 4) { // jshint ignore:line
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                        // 0xxxxxxx
                        out += String.fromCharCode(c);
                        break;
                    case 12:
                    case 13:
                        // 110x xxxx   10xx xxxx
                        char2 = array[i++];
                        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F)); // jshint ignore:line
                        break;
                    case 14:
                        // 1110 xxxx  10xx xxxx  10xx xxxx
                        char2 = array[i++];
                        char3 = array[i++];
                        out += String.fromCharCode(((c & 0x0F) << 12) | // jshint ignore:line
                            ((char2 & 0x3F) << 6) |  // jshint ignore:line
                            ((char3 & 0x3F) << 0)); // jshint ignore:line
                        break;
                }
            }
            return out;
        },
        isHtml: function (str) {
            var a = document.createElement('div');
            a.innerHTML = str;
            for (var c = a.childNodes, i = c.length; i--;) {
                if (c[i].nodeType === 1) {
                    return true;
                }
            }
            return false;
        },
        isPdf: function (str) {
            if ($h.isEmpty(str)) {
                return false;
            }
            str = str.toString().trim().replace(/\n/g, ' ');
            if (str.length === 0) {
                return false;
            }
        },
        isSvg: function (str) {
            if ($h.isEmpty(str)) {
                return false;
            }
            str = str.toString().trim().replace(/\n/g, ' ');
            if (str.length === 0) {
                return false;
            }
            return str.match(/^\s*<\?xml/i) && (str.match(/<!DOCTYPE svg/i) || str.match(/<svg/i));
        },
        getMimeType: function (sign, contents, type) {
            var signature = sign || "";
            switch (signature) {
                case 'ffd8ffe0':
                case 'ffd8ffe1':
                case 'ffd8ffe2':
                    return 'image/jpeg';
                case '89504e47':
                    return 'image/png';
                case '47494638':
                    return 'image/gif';
                case '49492a00':
                    return 'image/tiff';
                case '52494646':
                    return 'image/webp';
                case '41433130':
                    return 'image/vnd.dwg';
                case '66747970':
                    return 'video/3gp';
                case '4f676753':
                    return 'video/ogg';
                case '1a45dfa3':
                    return 'video/mkv';
                case '000001ba':
                case '000001b3':
                    return 'video/mpeg';
                case '3026b275':
                    return 'video/wmv';
                case '25504446':
                    return 'application/pdf';
                case '25215053':
                    return 'application/ps';
                case '504b0304':
                case '504b0506':
                case '504b0508':
                    return 'application/zip';
                case '377abcaf':
                    return 'application/7z';
                case '75737461':
                    return 'application/tar';
                case '7801730d':
                    return 'application/dmg';
                default:
                    switch (signature.substring(0, 6)) {
                        case '435753':
                            return 'application/x-shockwave-flash';
                        case '494433':
                            return 'audio/mp3';
                        case '425a68':
                            return 'application/bzip';
                        default:
                            switch (signature.substring(0, 4)) {
                                case '424d':
                                    return 'image/bmp';
                                case 'fffb':
                                    return 'audio/mp3';
                                case '4d5a':
                                    return 'application/exe';
                                case '1f9d':
                                case '1fa0':
                                    return 'application/zip';
                                case '1f8b':
                                    return 'application/gzip';
                                default:
                                    return contents && !contents.match(
                                        /[^\u0000-\u007f]/) ? 'application/text-plain' : type;
                            }
                    }
            }
        },
        addCss: function ($el, css) {
            $el.removeClass(css).addClass(css);
        },
        getElement: function (options, param, value) {
            return ($h.isEmpty(options) || $h.isEmpty(options[param])) ? value : $(options[param]);
        },
        createElement: function (str, tag) {
            tag = tag || 'div';
            return $($.parseHTML('<' + tag + '>' + str + '</' + tag + '>'));
        },
        uniqId: function () {
            return (new Date().getTime() + Math.floor(Math.random() * Math.pow(10, 15))).toString(36);
        },
        cspBuffer: {
            CSP_ATTRIB: 'data-csp-01928735', // a randomly named temporary attribute to store the CSP elem id
            domElementsStyles: {},
            stash: function (htmlString) {
                var self = this, outerDom = $.parseHTML('<div>' + htmlString + '</div>'), $el = $(outerDom);
                $el.find('[style]').each(function (key, elem) {
                    var $elem = $(elem), styleDeclaration = $elem[0].style, id = $h.uniqId(), styles = {};
                    if (styleDeclaration && styleDeclaration.length) {
                        $(styleDeclaration).each(function () {
                            styles[this] = styleDeclaration[this];
                        });
                        self.domElementsStyles[id] = styles;
                        $elem.removeAttr('style').attr(self.CSP_ATTRIB, id);
                    }
                });
                $el.filter('*').removeAttr('style');                   // make sure all style attr are removed
                var values = Object.values ? Object.values(outerDom) : Object.keys(outerDom).map(function (itm) {
                    return outerDom[itm];
                });
                return values.flatMap(function (elem) {
                    return elem.innerHTML;
                }).join('');
            },
            apply: function (domElement) {
                var self = this, $el = $(domElement);
                $el.find('[' + self.CSP_ATTRIB + ']').each(function (key, elem) {
                    var $elem = $(elem), id = $elem.attr(self.CSP_ATTRIB), styles = self.domElementsStyles[id];
                    if (styles) {
                        $elem.css(styles);
                    }
                    $elem.removeAttr(self.CSP_ATTRIB);
                });
                self.domElementsStyles = {};
            }
        },
        setHtml: function ($elem, htmlString) {
            var buf = $h.cspBuffer;
            $elem.html(buf.stash(htmlString));
            buf.apply($elem);
            return $elem;
        },
        htmlEncode: function (str, undefVal) {
            if (str === undefined) {
                return undefVal || null;
            }
            return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        },
        replaceTags: function (str, tags) {
            var out = str;
            if (!tags) {
                return out;
            }
            $.each(tags, function (key, value) {
                if (typeof value === 'function') {
                    value = value();
                }
                out = out.split(key).join(value);
            });
            return out;
        },
        cleanMemory: function ($thumb) {
            var data = $thumb.is('img') ? $thumb.attr('src') : $thumb.find('source').attr('src');
            $h.revokeObjectURL(data);
        },
        findFileName: function (filePath) {
            var sepIndex = filePath.lastIndexOf('/');
            if (sepIndex === -1) {
                sepIndex = filePath.lastIndexOf('\\');
            }
            return filePath.split(filePath.substring(sepIndex, sepIndex + 1)).pop();
        },
        checkFullScreen: function () {
            return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement ||
                document.msFullscreenElement;
        },
        toggleFullScreen: function (maximize) {
            var doc = document, de = doc.documentElement, isFullScreen = $h.checkFullScreen();
            if (de && maximize && !isFullScreen) {
                if (de.requestFullscreen) {
                    de.requestFullscreen();
                } else {
                    if (de.msRequestFullscreen) {
                        de.msRequestFullscreen();
                    } else {
                        if (de.mozRequestFullScreen) {
                            de.mozRequestFullScreen();
                        } else {
                            if (de.webkitRequestFullscreen) {
                                de.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                            }
                        }
                    }
                }
            } else {
                if (isFullScreen) {
                    if (doc.exitFullscreen) {
                        doc.exitFullscreen();
                    } else {
                        if (doc.msExitFullscreen) {
                            doc.msExitFullscreen();
                        } else {
                            if (doc.mozCancelFullScreen) {
                                doc.mozCancelFullScreen();
                            } else {
                                if (doc.webkitExitFullscreen) {
                                    doc.webkitExitFullscreen();
                                }
                            }
                        }
                    }
                }
            }
        },
        moveArray: function (arr, oldIndex, newIndex, reverseOrder) {
            var newArr = $.extend(true, [], arr);
            if (reverseOrder) {
                newArr.reverse();
            }
            if (newIndex >= newArr.length) {
                var k = newIndex - newArr.length;
                while ((k--) + 1) {
                    newArr.push(undefined);
                }
            }
            newArr.splice(newIndex, 0, newArr.splice(oldIndex, 1)[0]);
            if (reverseOrder) {
                newArr.reverse();
            }
            return newArr;
        },
        closeButton: function (css) {
            css = ($h.isBs(5) ? 'btn-close' : 'close') + (css ? ' ' + css : '');
            return '<button type="button" class="' + css + '" aria-label="Close">\n' +
                ($h.isBs(5) ? '' : '  <span aria-hidden="true">&times;</span>\n') +
                '</button>';
        },
        getRotation: function (value) {
            switch (value) {
                case 2:
                    return 'rotateY(180deg)';
                case 3:
                    return 'rotate(180deg)';
                case 4:
                    return 'rotate(180deg) rotateY(180deg)';
                case 5:
                    return 'rotate(270deg) rotateY(180deg)';
                case 6:
                    return 'rotate(90deg)';
                case 7:
                    return 'rotate(90deg) rotateY(180deg)';
                case 8:
                    return 'rotate(270deg)';
                default:
                    return '';
            }
        },
        setTransform: function (el, val) {
            if (!el) {
                return;
            }
            el.style.transform = val;
            el.style.webkitTransform = val;
            el.style['-moz-transform'] = val;
            el.style['-ms-transform'] = val;
            el.style['-o-transform'] = val;
        },
        getObjectKeys: function (obj) {
            var keys = [];
            if (obj) {
                $.each(obj, function (key) {
                    keys.push(key);
                });
            }
            return keys;
        },
        getObjectSize: function (obj) {
            return $h.getObjectKeys(obj).length;
        },
        /**
         * Small dependency injection for the task manager
         * https://gist.github.com/fearphage/4341799
         */
        whenAll: function (array) {
            var s = [].slice, resolveValues = arguments.length === 1 && $h.isArray(array) ? array : s.call(arguments),
                deferred = $.Deferred(), i, failed = 0, value, length = resolveValues.length,
                remaining = length, rejectContexts, rejectValues, resolveContexts, updateFunc;
            rejectContexts = rejectValues = resolveContexts = Array(length);
            updateFunc = function (index, contexts, values) {
                return function () {
                    if (values !== resolveValues) {
                        failed++;
                    }
                    deferred.notifyWith(contexts[index] = this, values[index] = s.call(arguments));
                    if (!(--remaining)) {
                        deferred[(!failed ? 'resolve' : 'reject') + 'With'](contexts, values);
                    }
                };
            };
            for (i = 0; i < length; i++) {
                if ((value = resolveValues[i]) && $.isFunction(value.promise)) {
                    value.promise()
                        .done(updateFunc(i, resolveContexts, resolveValues))
                        .fail(updateFunc(i, rejectContexts, rejectValues));
                } else {
                    deferred.notifyWith(this, value);
                    --remaining;
                }
            }
            if (!remaining) {
                deferred.resolveWith(resolveContexts, resolveValues);
            }
            return deferred.promise();
        }
    };
    FileInput = function (element, options) {
        var self = this;
        self.$element = $(element);
        self.$parent = self.$element.parent();
        if (!self._validate()) {
            return;
        }
        self.isPreviewable = $h.hasFileAPISupport();
        self.isIE9 = $h.isIE(9);
        self.isIE10 = $h.isIE(10);
        if (self.isPreviewable || self.isIE9) {
            self._init(options);
            self._listen();
        }
        self.$element.removeClass('file-loading');
    };

    FileInput.prototype = {
        constructor: FileInput,
        _cleanup: function () {
            var self = this;
            self.reader = null;
            self.clearFileStack();
            self.fileBatchCompleted = true;
            self.isError = false;
            self.isDuplicateError = false;
            self.isPersistentError = false;
            self.cancelling = false;
            self.paused = false;
            self.lastProgress = 0;
            self._initAjax();
        },
        _isAborted: function () {
            var self = this;
            return self.cancelling || self.paused;
        },
        _initAjax: function () {
            var self = this, tm = self.taskManager = {
                pool: {},
                addPool: function (id) {
                    return (tm.pool[id] = new tm.TasksPool(id));
                },
                getPool: function (id) {
                    return tm.pool[id];
                },
                addTask: function (id, logic) { // add standalone task directly from task manager
                    return new tm.Task(id, logic);
                },
                TasksPool: function (id) {
                    var tp = this;
                    tp.id = id;
                    tp.cancelled = false;
                    tp.cancelledDeferrer = $.Deferred();
                    tp.tasks = {};
                    tp.addTask = function (id, logic) {
                        return (tp.tasks[id] = new tm.Task(id, logic));
                    };
                    tp.size = function () {
                        return $h.getObjectSize(tp.tasks);
                    };
                    tp.run = function (maxThreads) {
                        var i = 0, failed = false, task, tasksList = $h.getObjectKeys(tp.tasks).map(function (key) {
                            return tp.tasks[key];
                        }), tasksDone = [], deferred = $.Deferred(), enqueue, callback;

                        if (tp.cancelled) {
                            tp.cancelledDeferrer.resolve();
                            return deferred.reject();
                        }
                        // if run all at once
                        if (!maxThreads) {
                            var tasksDeferredList = $h.getObjectKeys(tp.tasks).map(function (key) {
                                return tp.tasks[key].deferred;
                            });
                            // when all are done
                            $h.whenAll(tasksDeferredList).done(function () {
                                var argv = $h.getArray(arguments);
                                if (!tp.cancelled) {
                                    deferred.resolve.apply(null, argv);
                                    tp.cancelledDeferrer.reject();
                                } else {
                                    deferred.reject.apply(null, argv);
                                    tp.cancelledDeferrer.resolve();
                                }
                            }).fail(function () {
                                var argv = $h.getArray(arguments);
                                deferred.reject.apply(null, argv);
                                if (!tp.cancelled) {
                                    tp.cancelledDeferrer.reject();
                                } else {
                                    tp.cancelledDeferrer.resolve();
                                }
                            });
                            // run all tasks
                            $.each(tp.tasks, function (id) {
                                task = tp.tasks[id];
                                task.run();
                            });
                            return deferred;
                        }
                        enqueue = function (task) {
                            $.when(task.deferred)
                                .fail(function () {
                                    failed = true;
                                    callback.apply(null, arguments);
                                })
                                .always(callback);
                        };
                        callback = function () {
                            var argv = $h.getArray(arguments);
                            // notify a task just ended
                            deferred.notify(argv);
                            tasksDone.push(argv);
                            if (tp.cancelled) {
                                deferred.reject.apply(null, tasksDone);
                                tp.cancelledDeferrer.resolve();
                                return;
                            }
                            if (tasksDone.length === tp.size()) {
                                if (failed) {
                                    deferred.reject.apply(null, tasksDone);
                                } else {
                                    deferred.resolve.apply(null, tasksDone);
                                }
                            }
                            // if there are any tasks remaining
                            if (tasksList.length) {
                                task = tasksList.shift();
                                enqueue(task);
                                task.run();
                            }
                        };
                        // run the first "maxThreads" tasks
                        while (tasksList.length && i++ < maxThreads) {
                            task = tasksList.shift();
                            enqueue(task);
                            task.run();
                        }
                        return deferred;
                    };
                    tp.cancel = function () {
                        tp.cancelled = true;
                        return tp.cancelledDeferrer;
                    };
                },
                Task: function (id, logic) {
                    var tk = this;
                    tk.id = id;
                    tk.deferred = $.Deferred();
                    tk.logic = logic;
                    tk.context = null;
                    tk.run = function () {
                        var argv = $h.getArray(arguments);
                        argv.unshift(tk.deferred);     // add deferrer as first argument
                        logic.apply(tk.context, argv); // run task
                        return tk.deferred;            // return deferrer
                    };
                    tk.runWithContext = function (context) {
                        tk.context = context;
                        return tk.run();
                    };
                }
            };
            self.ajaxQueue = [];
            self.ajaxRequests = [];
            self.ajaxPool = null;
            self.ajaxAborted = false;
        },
        _init: function (options, refreshMode) {
            var self = this, f, $el = self.$element, $cont, t, tmp;
            self.options = options;
            self.zoomPlaceholder = $h.getZoomPlaceholder();
            self.canOrientImage = $h.canOrientImage($el);
            $.each(options, function (key, value) {
                switch (key) {
                    case 'minFileCount':
                    case 'maxFileCount':
                    case 'maxTotalFileCount':
                    case 'minFileSize':
                    case 'maxFileSize':
                    case 'maxFilePreviewSize':
                    case 'resizeQuality':
                    case 'resizeIfSizeMoreThan':
                    case 'progressUploadThreshold':
                    case 'initialPreviewCount':
                    case 'zoomModalHeight':
                    case 'minImageHeight':
                    case 'maxImageHeight':
                    case 'minImageWidth':
                    case 'maxImageWidth':
                    case 'bytesToKB':
                        self[key] = $h.getNum(value);
                        break;
                    default:
                        self[key] = value;
                        break;
                }
            });
            if (!self.bytesToKB || self.bytesToKB <= 0) {
                self.bytesToKB = 1024;
            }
            if (self.errorCloseButton === undefined) {
                self.errorCloseButton = $h.closeButton('kv-error-close' + ($h.isBs(5) ? '  float-end' : ''));
            }
            if (self.maxTotalFileCount > 0 && self.maxTotalFileCount < self.maxFileCount) {
                self.maxTotalFileCount = self.maxFileCount;
            }
            if (self.rtl) { // swap buttons for rtl
                tmp = self.previewZoomButtonIcons.prev;
                self.previewZoomButtonIcons.prev = self.previewZoomButtonIcons.next;
                self.previewZoomButtonIcons.next = tmp;
            }
            // validate chunk threads to not exceed maxAjaxThreads
            if (!isNaN(self.maxAjaxThreads) && self.maxAjaxThreads < self.resumableUploadOptions.maxThreads) {
                self.resumableUploadOptions.maxThreads = self.maxAjaxThreads;
            }
            self._initFileManager();
            if (typeof self.autoOrientImage === 'function') {
                self.autoOrientImage = self.autoOrientImage();
            }
            if (typeof self.autoOrientImageInitial === 'function') {
                self.autoOrientImageInitial = self.autoOrientImageInitial();
            }
            if (!refreshMode) {
                self._cleanup();
            }
            self.duplicateErrors = [];
            self.$form = $el.closest('form');
            self._initTemplateDefaults();
            self.uploadFileAttr = !$h.isEmpty($el.attr('name')) ? $el.attr('name') : 'file_data';
            t = self._getLayoutTemplate('progress');
            self.progressTemplate = t.replace('{class}', self.progressClass);
            self.progressInfoTemplate = t.replace('{class}', self.progressInfoClass);
            self.progressPauseTemplate = t.replace('{class}', self.progressPauseClass);
            self.progressCompleteTemplate = t.replace('{class}', self.progressCompleteClass);
            self.progressErrorTemplate = t.replace('{class}', self.progressErrorClass);
            self.isDisabled = $el.attr('disabled') || $el.attr('readonly');
            if (self.isDisabled) {
                $el.attr('disabled', true);
            }
            self.isClickable = self.browseOnZoneClick && self.showPreview &&
                (self.dropZoneEnabled || !$h.isEmpty(self.defaultPreviewContent));
            self.isAjaxUpload = $h.hasFileUploadSupport() && !$h.isEmpty(self.uploadUrl);
            self.dropZoneEnabled = $h.hasDragDropSupport() && self.dropZoneEnabled;
            if (!self.isAjaxUpload) {
                self.dropZoneEnabled = self.dropZoneEnabled && $h.canAssignFilesToInput();
            }
            self.slug = typeof options.slugCallback === 'function' ? options.slugCallback : self._slugDefault;
            self.mainTemplate = self.showCaption ? self._getLayoutTemplate('main1') : self._getLayoutTemplate('main2');
            self.captionTemplate = self._getLayoutTemplate('caption');
            self.previewGenericTemplate = self._getPreviewTemplate('generic');
            if (!self.imageCanvas && self.resizeImage && (self.maxImageWidth || self.maxImageHeight)) {
                self.imageCanvas = document.createElement('canvas');
                self.imageCanvasContext = self.imageCanvas.getContext('2d');
            }
            if ($h.isEmpty($el.attr('id'))) {
                $el.attr('id', $h.uniqId());
            }
            self.namespace = '.fileinput_' + $el.attr('id').replace(/-/g, '_');
            if (self.$container === undefined) {
                self.$container = self._createContainer();
            } else {
                self._refreshContainer();
            }
            $cont = self.$container;
            self.$dropZone = $cont.find('.file-drop-zone');
            self.$progress = $cont.find('.kv-upload-progress');
            self.$btnUpload = $cont.find('.fileinput-upload');
            self.$captionContainer = $h.getElement(options, 'elCaptionContainer', $cont.find('.file-caption'));
            self.$caption = $h.getElement(options, 'elCaptionText', $cont.find('.file-caption-name'));
            if (!$h.isEmpty(self.msgPlaceholder)) {
                f = $el.attr('multiple') ? self.filePlural : self.fileSingle;
                self.$caption.attr('placeholder', self.msgPlaceholder.replace('{files}', f));
            }
            self.$captionIcon = self.$captionContainer.find('.file-caption-icon');
            self.$previewContainer = $h.getElement(options, 'elPreviewContainer', $cont.find('.file-preview'));
            self.$preview = $h.getElement(options, 'elPreviewImage', $cont.find('.file-preview-thumbnails'));
            self.$previewStatus = $h.getElement(options, 'elPreviewStatus', $cont.find('.file-preview-status'));
            self.$errorContainer = $h.getElement(options, 'elErrorContainer',
                self.$previewContainer.find('.kv-fileinput-error'));
            self._validateDisabled();
            if (!$h.isEmpty(self.msgErrorClass)) {
                $h.addCss(self.$errorContainer, self.msgErrorClass);
            }
            if (!refreshMode) {
                self._resetErrors();
                self.$errorContainer.hide();
                self.previewInitId = 'thumb-' + $el.attr('id');
                self._initPreviewCache();
                self._initPreview(true);
                self._initPreviewActions();
                if (self.$parent.hasClass('file-loading')) {
                    self.$container.insertBefore(self.$parent);
                    self.$parent.remove();
                }
            } else {
                if (!self._errorsExist()) {
                    self.$errorContainer.hide();
                }
            }
            self._setFileDropZoneTitle();
            if ($el.attr('disabled')) {
                self.disable();
            }
            self._initZoom();
            if (self.hideThumbnailContent) {
                $h.addCss(self.$preview, 'hide-content');
            }
        },
        _initFileManager: function () {
            var self = this;
            self.uploadStartTime = $h.now();
            self.fileManager = {
                stack: {},
                filesProcessed: [],
                errors: [],
                loadedImages: {},
                totalImages: 0,
                totalFiles: null,
                totalSize: null,
                uploadedSize: 0,
                stats: {},
                bpsLog: [],
                bps: 0,
                initStats: function (id) {
                    var data = {started: $h.now()};
                    if (id) {
                        self.fileManager.stats[id] = data;
                    } else {
                        self.fileManager.stats = data;
                    }
                },
                getUploadStats: function (id, loaded, total) {
                    var fm = self.fileManager,
                        started = id ? fm.stats[id] && fm.stats[id].started || $h.now() : self.uploadStartTime,
                        elapsed = ($h.now() - started) / 1000, bps = Math.ceil(elapsed ? loaded / elapsed : 0),
                        pendingBytes = total - loaded, out, delay = fm.bpsLog.length ? self.bitrateUpdateDelay : 0;
                    setTimeout(function () {
                        var i, j = 0, n = 0, len, beg;
                        fm.bpsLog.push(bps);
                        fm.bpsLog.sort(function (a, b) {
                            return a - b;
                        });
                        len = fm.bpsLog.length;
                        beg = len > 10 ? len - 10 : Math.ceil(len / 2);
                        for (i = len; i > beg; i--) {
                            n = parseFloat(fm.bpsLog[i]);
                            j++;
                        }
                        fm.bps = (j > 0 ? n / j : 0) * 64;
                    }, delay);
                    out = {
                        fileId: id,
                        started: started,
                        elapsed: elapsed,
                        loaded: loaded,
                        total: total,
                        bps: fm.bps,
                        bitrate: self._getSize(fm.bps, false, self.bitRateUnits),
                        pendingBytes: pendingBytes
                    };
                    if (id) {
                        fm.stats[id] = out;
                    } else {
                        fm.stats = out;
                    }
                    return out;
                },
                exists: function (id) {
                    return $.inArray(id, self.fileManager.getIdList()) !== -1;
                },
                count: function () {
                    return self.fileManager.getIdList().length;
                },
                total: function () {
                    var fm = self.fileManager;
                    if (!fm.totalFiles) {
                        fm.totalFiles = fm.count();
                    }
                    return fm.totalFiles;
                },
                getTotalSize: function () {
                    var fm = self.fileManager;
                    if (fm.totalSize) {
                        return fm.totalSize;
                    }
                    fm.totalSize = 0;
                    $.each(self.getFileStack(), function (id, f) {
                        var size = parseFloat(f.size);
                        fm.totalSize += isNaN(size) ? 0 : size;
                    });
                    return fm.totalSize;
                },
                add: function (file, id) {
                    if (!id) {
                        id = self.fileManager.getId(file);
                    }
                    if (!id) {
                        return;
                    }
                    self.fileManager.stack[id] = {
                        file: file,
                        name: $h.getFileName(file),
                        relativePath: $h.getFileRelativePath(file),
                        size: file.size,
                        nameFmt: self._getFileName(file, ''),
                        sizeFmt: self._getSize(file.size)
                    };
                },
                remove: function ($thumb) {
                    var id = self._getThumbFileId($thumb);
                    self.fileManager.removeFile(id);
                },
                removeFile: function (id) {
                    var fm = self.fileManager;
                    if (!id) {
                        return;
                    }
                    delete fm.stack[id];
                    delete fm.loadedImages[id];
                },
                move: function (idFrom, idTo) {
                    var result = {}, stack = self.fileManager.stack;
                    if (!idFrom && !idTo || idFrom === idTo) {
                        return;
                    }
                    $.each(stack, function (k, v) {
                        if (k !== idFrom) {
                            result[k] = v;
                        }
                        if (k === idTo) {
                            result[idFrom] = stack[idFrom];
                        }
                    });
                    self.fileManager.stack = result;
                },
                list: function () {
                    var files = [];
                    $.each(self.getFileStack(), function (k, v) {
                        if (v && v.file) {
                            files.push(v.file);
                        }
                    });
                    return files;
                },
                isPending: function (id) {
                    return $.inArray(id, self.fileManager.filesProcessed) === -1 && self.fileManager.exists(id);
                },
                isProcessed: function () {
                    var filesProcessed = true, fm = self.fileManager;
                    $.each(self.getFileStack(), function (id) {
                        if (fm.isPending(id)) {
                            filesProcessed = false;
                        }
                    });
                    return filesProcessed;
                },
                clear: function () {
                    var fm = self.fileManager;
                    self.isDuplicateError = false;
                    self.isPersistentError = false;
                    fm.totalFiles = null;
                    fm.totalSize = null;
                    fm.uploadedSize = 0;
                    fm.stack = {};
                    fm.errors = [];
                    fm.filesProcessed = [];
                    fm.stats = {};
                    fm.bpsLog = [];
                    fm.bps = 0;
                    fm.clearImages();
                },
                clearImages: function () {
                    self.fileManager.loadedImages = {};
                    self.fileManager.totalImages = 0;
                },
                addImage: function (id, config) {
                    self.fileManager.loadedImages[id] = config;
                },
                removeImage: function (id) {
                    delete self.fileManager.loadedImages[id];
                },
                getImageIdList: function () {
                    return $h.getObjectKeys(self.fileManager.loadedImages);
                },
                getImageCount: function () {
                    return self.fileManager.getImageIdList().length;
                },
                getId: function (file) {
                    return self._getFileId(file);
                },
                getIndex: function (id) {
                    return self.fileManager.getIdList().indexOf(id);
                },
                getThumb: function (id) {
                    var $thumb = null;
                    self._getThumbs().each(function () {
                        var $t = $(this);
                        if (self._getThumbFileId($t) === id) {
                            $thumb = $t;
                        }
                    });
                    return $thumb;
                },
                getThumbIndex: function ($thumb) {
                    var id = self._getThumbFileId($thumb);
                    return self.fileManager.getIndex(id);
                },
                getIdList: function () {
                    return $h.getObjectKeys(self.fileManager.stack);
                },
                getFile: function (id) {
                    return self.fileManager.stack[id] || null;
                },
                getFileName: function (id, fmt) {
                    var file = self.fileManager.getFile(id);
                    if (!file) {
                        return '';
                    }
                    return fmt ? (file.nameFmt || '') : file.name || '';
                },
                getFirstFile: function () {
                    var ids = self.fileManager.getIdList(), id = ids && ids.length ? ids[0] : null;
                    return self.fileManager.getFile(id);
                },
                setFile: function (id, file) {
                    if (self.fileManager.getFile(id)) {
                        self.fileManager.stack[id].file = file;
                    } else {
                        self.fileManager.add(file, id);
                    }
                },
                setProcessed: function (id) {
                    self.fileManager.filesProcessed.push(id);
                },
                getProgress: function () {
                    var total = self.fileManager.total(), filesProcessed = self.fileManager.filesProcessed.length;
                    if (!total) {
                        return 0;
                    }
                    return Math.ceil(filesProcessed / total * 100);

                },
                setProgress: function (id, pct) {
                    var f = self.fileManager.getFile(id);
                    if (!isNaN(pct) && f) {
                        f.progress = pct;
                    }
                }
            };
        },
        _setUploadData: function (fd, config) {
            var self = this;
            $.each(config, function (key, value) {
                var param = self.uploadParamNames[key] || key;
                if ($h.isArray(value)) {
                    fd.append(param, value[0], value[1]);
                } else {
                    fd.append(param, value);
                }
            });
        },
        _initResumableUpload: function () {
            var self = this, opts = self.resumableUploadOptions, logs = $h.logMessages, rm, fm = self.fileManager;
            if (!self.enableResumableUpload) {
                return;
            }
            if (opts.fallback !== false && typeof opts.fallback !== 'function') {
                opts.fallback = function (s) {
                    s._log(logs.noResumableSupport);
                    s.enableResumableUpload = false;
                };
            }
            if (!$h.hasResumableUploadSupport() && opts.fallback !== false) {
                opts.fallback(self);
                return;
            }
            if (!self.uploadUrl && self.enableResumableUpload) {
                self._log(logs.noUploadUrl);
                self.enableResumableUpload = false;
                return;

            }
            opts.chunkSize = parseFloat(opts.chunkSize);
            if (opts.chunkSize <= 0 || isNaN(opts.chunkSize)) {
                self._log(logs.invalidChunkSize, {chunkSize: opts.chunkSize});
                self.enableResumableUpload = false;
                return;
            }
            rm = self.resumableManager = {
                init: function (id, f, index) {
                    rm.logs = [];
                    rm.stack = [];
                    rm.error = '';
                    rm.id = id;
                    rm.file = f.file;
                    rm.fileName = f.name;
                    rm.fileIndex = index;
                    rm.completed = false;
                    rm.lastProgress = 0;
                    if (self.showPreview) {
                        rm.$thumb = fm.getThumb(id) || null;
                        rm.$progress = rm.$btnDelete = null;
                        if (rm.$thumb && rm.$thumb.length) {
                            rm.$progress = rm.$thumb.find('.file-thumb-progress');
                            rm.$btnDelete = rm.$thumb.find('.kv-file-remove');
                        }
                    }
                    rm.chunkSize = opts.chunkSize * self.bytesToKB;
                    rm.chunkCount = rm.getTotalChunks();
                },
                setAjaxError: function (jqXHR, textStatus, errorThrown, isTest) {
                    if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                        errorThrown = jqXHR.responseJSON.error.toString();
                    }
                    if (!isTest) {
                        rm.error = errorThrown;
                    }
                    if (opts.showErrorLog) {
                        self._log(logs.ajaxError, {
                            status: jqXHR.status,
                            error: errorThrown,
                            text: jqXHR.responseText || ''
                        });
                    }
                },
                reset: function () {
                    rm.stack = [];
                    rm.chunksProcessed = {};
                },
                setProcessed: function (status) {
                    var id = rm.id, msg, $thumb = rm.$thumb, $prog = rm.$progress, hasThumb = $thumb && $thumb.length,
                        params = {id: hasThumb ? $thumb.attr('id') : '', index: fm.getIndex(id), fileId: id}, tokens,
                        skipErrorsAndProceed = self.resumableUploadOptions.skipErrorsAndProceed;
                    rm.completed = true;
                    rm.lastProgress = 0;
                    if (hasThumb) {
                        $thumb.removeClass('file-uploading');
                    }
                    if (status === 'success') {
                        fm.uploadedSize += rm.file.size;
                        if (self.showPreview) {
                            self._setProgress(101, $prog);
                            self._setThumbStatus($thumb, 'Success');
                            self._initUploadSuccess(rm.chunksProcessed[id].data, $thumb);
                        }
                        fm.removeFile(id);
                        delete rm.chunksProcessed[id];
                        self._raise('fileuploaded', [params.id, params.index, params.fileId]);
                        if (fm.isProcessed()) {
                            self._setProgress(101);
                        }
                    } else {
                        if (status !== 'cancel') {
                            if (self.showPreview) {
                                self._setThumbStatus($thumb, 'Error');
                                self._setPreviewError($thumb, true);
                                self._setProgress(101, $prog, self.msgProgressError);
                                self._setProgress(101, self.$progress, self.msgProgressError);
                                self.cancelling = !skipErrorsAndProceed;
                            }
                            if (!self.$errorContainer.find('li[data-file-id="' + params.fileId + '"]').length) {
                                tokens = {file: rm.fileName, max: opts.maxRetries, error: rm.error};
                                msg = self.msgResumableUploadRetriesExceeded.setTokens(tokens);
                                $.extend(params, tokens);
                                self._showFileError(msg, params, 'filemaxretries');
                                if (skipErrorsAndProceed) {
                                    fm.removeFile(id);
                                    delete rm.chunksProcessed[id];
                                    if (fm.isProcessed()) {
                                        self._setProgress(101);
                                    }
                                }
                            }
                        }
                    }
                    if (fm.isProcessed()) {
                        rm.reset();
                    }
                },
                check: function () {
                    var status = true;
                    $.each(rm.logs, function (index, value) {
                        if (!value) {
                            status = false;
                            return false;
                        }
                    });
                },
                processedResumables: function () {
                    var logs = rm.logs, i, count = 0;
                    if (!logs || !logs.length) {
                        return 0;
                    }
                    for (i = 0; i < logs.length; i++) {
                        if (logs[i] === true) {
                            count++;
                        }
                    }
                    return count;
                },
                getUploadedSize: function () {
                    var size = rm.processedResumables() * rm.chunkSize;
                    return size > rm.file.size ? rm.file.size : size;
                },
                getTotalChunks: function () {
                    var chunkSize = parseFloat(rm.chunkSize);
                    if (!isNaN(chunkSize) && chunkSize > 0) {
                        return Math.ceil(rm.file.size / chunkSize);
                    }
                    return 0;
                },
                getProgress: function () {
                    var chunksProcessed = rm.processedResumables(), total = rm.chunkCount;
                    if (total === 0) {
                        return 0;
                    }
                    return Math.ceil(chunksProcessed / total * 100);
                },
                checkAborted: function (intervalId) {
                    if (self._isAborted()) {
                        clearInterval(intervalId);
                        self.unlock();
                    }
                },
                upload: function () {
                    var ids = fm.getIdList(), flag = 'new', intervalId;
                    intervalId = setInterval(function () {
                        var id;
                        rm.checkAborted(intervalId);
                        if (flag === 'new') {
                            self.lock();
                            flag = 'processing';
                            id = ids.shift();
                            fm.initStats(id);
                            if (fm.stack[id]) {
                                rm.init(id, fm.stack[id], fm.getIndex(id));
                                rm.processUpload();
                            }
                        }
                        if (!fm.isPending(id) && rm.completed) {
                            flag = 'new';
                        }
                        if (fm.isProcessed()) {
                            var $initThumbs = self.$preview.find('.file-preview-initial');
                            if ($initThumbs.length) {
                                $h.addCss($initThumbs, $h.SORT_CSS);
                                self._initSortable();
                            }
                            clearInterval(intervalId);
                            self._clearFileInput();
                            self.unlock();
                            setTimeout(function () {
                                var data = self.previewCache.data;
                                if (data) {
                                    self.initialPreview = data.content;
                                    self.initialPreviewConfig = data.config;
                                    self.initialPreviewThumbTags = data.tags;
                                }
                                self._raise('filebatchuploadcomplete', [
                                    self.initialPreview,
                                    self.initialPreviewConfig,
                                    self.initialPreviewThumbTags,
                                    self._getExtraData()
                                ]);
                            }, self.processDelay);
                        }
                    }, self.processDelay);
                },
                uploadResumable: function () {
                    var i, pool, tm = self.taskManager, total = rm.chunkCount;
                    pool = tm.addPool(rm.id);
                    for (i = 0; i < total; i++) {
                        rm.logs[i] = !!(rm.chunksProcessed[rm.id] && rm.chunksProcessed[rm.id][i]);
                        if (!rm.logs[i]) {
                            rm.pushAjax(i, 0);
                        }
                    }
                    pool.run(opts.maxThreads)
                        .done(function () {
                            rm.setProcessed('success');
                        })
                        .fail(function () {
                            rm.setProcessed(pool.cancelled ? 'cancel' : 'error');
                        });
                },
                processUpload: function () {
                    var fd, f, id = rm.id, fnBefore, fnSuccess, fnError, fnComplete, outData;
                    if (!opts.testUrl) {
                        rm.uploadResumable();
                        return;
                    }
                    fd = new FormData();
                    f = fm.stack[id];
                    self._setUploadData(fd, {
                        fileId: id,
                        fileName: f.fileName,
                        fileSize: f.size,
                        fileRelativePath: f.relativePath,
                        chunkSize: rm.chunkSize,
                        chunkCount: rm.chunkCount
                    });
                    fnBefore = function (jqXHR) {
                        outData = self._getOutData(fd, jqXHR);
                        self._raise('filetestbeforesend', [id, fm, rm, outData]);
                    };
                    fnSuccess = function (data, textStatus, jqXHR) {
                        outData = self._getOutData(fd, jqXHR, data);
                        var pNames = self.uploadParamNames, chunksUploaded = pNames.chunksUploaded || 'chunksUploaded',
                            params = [id, fm, rm, outData];
                        if (!data[chunksUploaded] || !$h.isArray(data[chunksUploaded])) {
                            self._raise('filetesterror', params);
                        } else {
                            if (!rm.chunksProcessed[id]) {
                                rm.chunksProcessed[id] = {};
                            }
                            $.each(data[chunksUploaded], function (key, index) {
                                rm.logs[index] = true;
                                rm.chunksProcessed[id][index] = true;
                            });
                            rm.chunksProcessed[id].data = data;
                            self._raise('filetestsuccess', params);
                        }
                        rm.uploadResumable();
                    };
                    fnError = function (jqXHR, textStatus, errorThrown) {
                        outData = self._getOutData(fd, jqXHR);
                        self._raise('filetestajaxerror', [id, fm, rm, outData]);
                        rm.setAjaxError(jqXHR, textStatus, errorThrown, true);
                        rm.uploadResumable();
                    };
                    fnComplete = function () {
                        self._raise('filetestcomplete', [id, fm, rm, self._getOutData(fd)]);
                    };
                    self._ajaxSubmit(fnBefore, fnSuccess, fnComplete, fnError, fd, id, rm.fileIndex, opts.testUrl);
                },
                pushAjax: function (index, retry) {
                    var tm = self.taskManager, pool = tm.getPool(rm.id);
                    pool.addTask(pool.size() + 1, function (deferrer) {
                        // use fifo chunk stack
                        var arr = rm.stack.shift(), index;
                        index = arr[0];
                        if (!rm.chunksProcessed[rm.id] || !rm.chunksProcessed[rm.id][index]) {
                            rm.sendAjax(index, arr[1], deferrer);
                        } else {
                            self._log(logs.chunkQueueError, {index: index});
                        }
                    });
                    rm.stack.push([index, retry]);
                },
                sendAjax: function (index, retry, deferrer) {
                    var f, chunkSize = rm.chunkSize, id = rm.id, file = rm.file, $thumb = rm.$thumb,
                        msgs = $h.logMessages, $btnDelete = rm.$btnDelete, logError = function (msg, tokens) {
                            if (tokens) {
                                msg = msg.setTokens(tokens);
                            }
                            msg = msgs.resumableRequestError.setTokens({msg: msg});
                            self._log(msg);
                            deferrer.reject(msg);
                        };
                    if (rm.chunksProcessed[id] && rm.chunksProcessed[id][index]) {
                        return;
                    }
                    if (retry > opts.maxRetries) {
                        logError(msgs.resumableMaxRetriesReached, {n: opts.maxRetries});
                        rm.setProcessed('error');
                        return;
                    }
                    var fd, outData, fnBefore, fnSuccess, fnError, fnComplete, slice = file.slice ? 'slice' :
                            (file.mozSlice ? 'mozSlice' : (file.webkitSlice ? 'webkitSlice' : 'slice')),
                        blob = file[slice](chunkSize * index, chunkSize * (index + 1));
                    fd = new FormData();
                    f = fm.stack[id];
                    self._setUploadData(fd, {
                        chunkCount: rm.chunkCount,
                        chunkIndex: index,
                        chunkSize: chunkSize,
                        chunkSizeStart: chunkSize * index,
                        fileBlob: [blob, rm.fileName],
                        fileId: id,
                        fileName: rm.fileName,
                        fileRelativePath: f.relativePath,
                        fileSize: file.size,
                        retryCount: retry
                    });
                    if (rm.$progress && rm.$progress.length) {
                        rm.$progress.show();
                    }
                    fnBefore = function (jqXHR) {
                        outData = self._getOutData(fd, jqXHR);
                        if (self.showPreview) {
                            if (!$thumb.hasClass('file-preview-success')) {
                                self._setThumbStatus($thumb, 'Loading');
                                $h.addCss($thumb, 'file-uploading');
                            }
                            $btnDelete.attr('disabled', true);
                        }
                        self._raise('filechunkbeforesend', [id, index, retry, fm, rm, outData]);
                    };
                    fnSuccess = function (data, textStatus, jqXHR) {
                        if (self._isAborted()) {
                            logError(msgs.resumableAborting);
                            return;
                        }
                        outData = self._getOutData(fd, jqXHR, data);
                        var paramNames = self.uploadParamNames, chunkIndex = paramNames.chunkIndex || 'chunkIndex',
                            params = [id, index, retry, fm, rm, outData];
                        if (data.error) {
                            if (opts.showErrorLog) {
                                self._log(logs.retryStatus, {
                                    retry: retry + 1,
                                    filename: rm.fileName,
                                    chunk: index
                                });
                            }
                            self._raise('filechunkerror', params);
                            rm.pushAjax(index, retry + 1);
                            rm.error = data.error;
                            logError(data.error);
                        } else {
                            rm.logs[data[chunkIndex]] = true;
                            if (!rm.chunksProcessed[id]) {
                                rm.chunksProcessed[id] = {};
                            }
                            rm.chunksProcessed[id][data[chunkIndex]] = true;
                            rm.chunksProcessed[id].data = data;
                            deferrer.resolve.call(null, data);
                            self._raise('filechunksuccess', params);
                            rm.check();
                        }
                    };
                    fnError = function (jqXHR, textStatus, errorThrown) {
                        if (self._isAborted()) {
                            logError(msgs.resumableAborting);
                            return;
                        }
                        outData = self._getOutData(fd, jqXHR);
                        rm.setAjaxError(jqXHR, textStatus, errorThrown);
                        self._raise('filechunkajaxerror', [id, index, retry, fm, rm, outData]);
                        rm.pushAjax(index, retry + 1);                        // push another task
                        logError(msgs.resumableRetryError, {n: retry - 1}); // resolve the current task
                    };
                    fnComplete = function () {
                        if (!self._isAborted()) {
                            self._raise('filechunkcomplete', [id, index, retry, fm, rm, self._getOutData(fd)]);
                        }
                    };
                    self._ajaxSubmit(fnBefore, fnSuccess, fnComplete, fnError, fd, id, rm.fileIndex);
                }
            };
            rm.reset();
        },
        _initTemplateDefaults: function () {
            var self = this, tMain1, tMain2, tPreview, tFileIcon, tClose, tCaption, tBtnDefault, tBtnLink, tBtnBrowse,
                tModalMain, tModal, tProgress, tSize, tFooter, tActions, tActionDelete, tActionUpload, tActionDownload,
                tActionZoom, tActionDrag, tIndicator, tTagBef, tTagBef1, tTagBef2, tTagAft, tGeneric, tHtml, tImage,
                tText, tOffice, tGdocs, tVideo, tAudio, tFlash, tObject, tPdf, tOther, tStyle, tZoomCache, vDefaultDim,
                tActionRotate, tStats, tModalLabel, tDescClose, renderObject = function (type, mime) {
                    return '<object class="kv-preview-data file-preview-' + type + '" title="{caption}" ' +
                        'data="{data}" type="' + mime + '"' + tStyle + '>\n' + $h.DEFAULT_PREVIEW + '\n</object>\n';
                }, defBtnCss1 = 'btn btn-sm btn-kv ' + $h.defaultButtonCss();
            tMain1 = '{preview}\n' +
                '<div class="kv-upload-progress kv-hidden"></div><div class="clearfix"></div>\n' +
                '<div class="file-caption {class}">\n' +
                '  <div class="input-group {inputGroupClass}">\n' +
                '      {caption}\n<span class="file-caption-icon"></span>\n' +
                ($h.isBs(5) ? '' : '<div class="input-group-btn input-group-append">\n') +
                '      {remove}\n' +
                '      {cancel}\n' +
                '      {pause}\n' +
                '      {upload}\n' +
                '      {browse}\n' +
                ($h.isBs(5) ? '' : '    </div>\n') +
                '  </div>';
            '</div>';
            tMain2 = '{preview}\n<div class="kv-upload-progress kv-hidden"></div>\n<div class="clearfix"></div>\n' +
                '<span class="{class}">{remove}\n{cancel}\n{upload}\n{browse}\n</span>';
            tPreview = '<div class="file-preview {class}">\n' +
                '  {close}' +
                '  <div class="{dropClass} clearfix">\n' +
                '    <div class="file-preview-thumbnails clearfix">\n' +
                '    </div>\n' +
                '    <div class="file-preview-status text-center text-success"></div>\n' +
                '    <div class="kv-fileinput-error"></div>\n' +
                '  </div>\n' +
                '</div>';
            tClose = $h.closeButton('fileinput-remove');
            tFileIcon = '<i class="bi-file-earmark-arrow-up"></i>';
            // noinspection HtmlUnknownAttribute
            tCaption = '<input readonly class="file-caption-name form-control {class}">\n';
            //noinspection HtmlUnknownAttribute
            tBtnDefault = '<button type="{type}" title="{title}" class="{css}" ' +
                '{status} {tabIndexConfig}>{icon} {label}</button>';
            //noinspection HtmlUnknownTarget,HtmlUnknownAttribute
            tBtnLink = '<a href="{href}" title="{title}" class="{css}" {status} {tabIndexConfig}>{icon} {label}</a>';
            //noinspection HtmlUnknownAttribute
            tBtnBrowse = '<div class="{css}" {status} {tabIndexConfig}>{icon} {label}</div>';
            tModalLabel = $h.MODAL_ID + 'Label';
            tModalMain = '<div id="' + $h.MODAL_ID + '" class="file-zoom-dialog modal fade" ' +
                'aria-labelledby="' + tModalLabel + '" {tabIndexConfig}></div>';
            tModal = '<div class="modal-dialog modal-lg{rtl}" role="document">\n' +
                '  <div class="modal-content">\n' +
                '    <div class="modal-header kv-zoom-header">\n' +
                '      <h6 class="modal-title kv-zoom-title" id="' + tModalLabel + '"><span class="kv-zoom-caption"></span> <span class="kv-zoom-size"></span></h6>\n' +
                '      <div class="kv-zoom-actions">{rotate}{toggleheader}{fullscreen}{borderless}{close}</div>\n' +
                '    </div>\n' +
                '    <div class="floating-buttons"></div>\n' +
                '    <div class="kv-zoom-body file-zoom-content {zoomFrameClass}"></div>\n' + '{prev} {next}\n' +
                '    <div class="kv-zoom-description"></div>\n' +
                '  </div>\n' +
                '</div>\n';
            tDescClose = '<button type="button" class="kv-desc-hide" aria-label="Close">{closeIcon}</button>';
            tProgress = '<div class="progress">\n' +
                '    <div class="{class}" role="progressbar"' +
                ' aria-valuenow="{percent}" aria-valuemin="0" aria-valuemax="100" style="width:{percent}%;">\n' +
                '        {status}\n' +
                '     </div>\n' +
                '</div>{stats}';
            tStats = '<div class="text-primary file-upload-stats">' +
                '<span class="pending-time">{pendingTime}</span> ' +
                '<span class="upload-speed">{uploadSpeed}</span>' +
                '</div>';
            tSize = ' <samp>({sizeText})</samp>';
            tFooter = '<div class="file-thumbnail-footer">\n' +
                '    <div class="file-footer-caption" title="{caption}">\n' +
                '        <div class="file-caption-info">{caption}</div>\n' +
                '        <div class="file-size-info">{size}</div>\n' +
                '    </div>\n' +
                '    {progress}\n{indicator}\n{actions}\n' +
                '</div>';
            tActions = '<div class="file-actions">\n' +
                '    <div class="file-footer-buttons">\n' +
                '        {rotate} {download} {upload} {delete} {zoom} {other}' +
                '    </div>\n' +
                '</div>\n' +
                '{drag}\n' +
                '<div class="clearfix"></div>';
            //noinspection HtmlUnknownAttribute
            tActionDelete = '<button type="button" class="kv-file-remove {removeClass}" ' +
                'title="{removeTitle}" {dataUrl}{dataKey}>{removeIcon}</button>\n';
            tActionUpload = '<button type="button" class="kv-file-upload {uploadClass}" title="{uploadTitle}">' +
                '{uploadIcon}</button>';
            tActionRotate = '<button type="button" class="kv-file-rotate {rotateClass}" title="{rotateTitle}">' +
                '{rotateIcon}</button>';
            tActionDownload = '<a class="kv-file-download {downloadClass}" title="{downloadTitle}" ' +
                'href="{downloadUrl}" download="{caption}" target="_blank">{downloadIcon}</a>';
            tActionZoom = '<button type="button" class="kv-file-zoom {zoomClass}" ' +
                'title="{zoomTitle}">{zoomIcon}</button>';
            tActionDrag = '<span class="file-drag-handle {dragClass}" title="{dragTitle}">{dragIcon}</span>';
            tIndicator = '<div class="file-upload-indicator" title="{indicatorTitle}">{indicator}</div>';
            tTagBef = '<div class="file-preview-frame {frameClass}" id="{previewId}" data-fileindex="{fileindex}"' +
                ' data-fileid="{fileid}" data-filename="{filename}" data-template="{template}" data-zoom="{zoomData}"';
            tTagBef1 = tTagBef + '><div class="kv-file-content">\n';
            tTagBef2 = tTagBef + ' title="{caption}"><div class="kv-file-content">\n';
            tTagAft = '</div>{footer}\n{zoomCache}</div>\n';
            tGeneric = '{content}\n';
            tStyle = ' {style}';
            tHtml = renderObject('html', 'text/html');
            tText = renderObject('text', 'text/plain;charset=UTF-8');
            tPdf = renderObject('pdf', 'application/pdf');
            tImage = '<img src="{data}" class="file-preview-image kv-preview-data" title="{title}" alt="{alt}"' +
                tStyle + '>\n';
            tOffice = '<iframe class="kv-preview-data file-preview-office" ' +
                'src="https://view.officeapps.live.com/op/embed.aspx?src={data}"' + tStyle + '></iframe>';
            tGdocs = '<iframe class="kv-preview-data file-preview-gdocs" ' +
                'src="https://docs.google.com/gview?url={data}&embedded=true"' + tStyle + '></iframe>';
            tVideo = '<video class="kv-preview-data file-preview-video" controls' + tStyle + '>\n' +
                '<source src="{data}" type="{type}">\n' + $h.DEFAULT_PREVIEW + '\n</video>\n';
            tAudio = '<!--suppress ALL --><audio class="kv-preview-data file-preview-audio" controls' + tStyle + '>\n<source src="{data}" ' +
                'type="{type}">\n' + $h.DEFAULT_PREVIEW + '\n</audio>\n';
            tFlash = '<embed class="kv-preview-data file-preview-flash" src="{data}" type="application/x-shockwave-flash"' + tStyle + '>\n';
            tObject = '<object class="kv-preview-data file-preview-object file-object {typeCss}" ' +
                'data="{data}" type="{type}"' + tStyle + '>\n' + '<param name="movie" value="{caption}" />\n' +
                $h.OBJECT_PARAMS + ' ' + $h.DEFAULT_PREVIEW + '\n</object>\n';
            tOther = '<div class="kv-preview-data file-preview-other-frame"' + tStyle + '>\n' + $h.DEFAULT_PREVIEW + '\n</div>\n';
            tZoomCache = '<div class="kv-zoom-cache">{zoomContent}</div>';
            vDefaultDim = {width: '100%', height: '100%', 'min-height': '480px'};
            if (self._isPdfRendered()) {
                tPdf = self.pdfRendererTemplate.replace('{renderer}', self._encodeURI(self.pdfRendererUrl));
            }
            self.defaults = {
                layoutTemplates: {
                    main1: tMain1,
                    main2: tMain2,
                    preview: tPreview,
                    close: tClose,
                    fileIcon: tFileIcon,
                    caption: tCaption,
                    modalMain: tModalMain,
                    modal: tModal,
                    descriptionClose: tDescClose,
                    progress: tProgress,
                    stats: tStats,
                    size: tSize,
                    footer: tFooter,
                    indicator: tIndicator,
                    actions: tActions,
                    actionDelete: tActionDelete,
                    actionRotate: tActionRotate,
                    actionUpload: tActionUpload,
                    actionDownload: tActionDownload,
                    actionZoom: tActionZoom,
                    actionDrag: tActionDrag,
                    btnDefault: tBtnDefault,
                    btnLink: tBtnLink,
                    btnBrowse: tBtnBrowse,
                    zoomCache: tZoomCache
                },
                previewMarkupTags: {
                    tagBefore1: tTagBef1,
                    tagBefore2: tTagBef2,
                    tagAfter: tTagAft
                },
                previewContentTemplates: {
                    generic: tGeneric,
                    html: tHtml,
                    image: tImage,
                    text: tText,
                    office: tOffice,
                    gdocs: tGdocs,
                    video: tVideo,
                    audio: tAudio,
                    flash: tFlash,
                    object: tObject,
                    pdf: tPdf,
                    other: tOther
                },
                allowedPreviewTypes: ['image', 'html', 'text', 'video', 'audio', 'flash', 'pdf', 'object'],
                previewTemplates: {},
                previewSettings: {
                    image: {width: 'auto', height: 'auto', 'max-width': '100%', 'max-height': '100%'},
                    html: {width: '213px', height: '160px'},
                    text: {width: '213px', height: '160px'},
                    office: {width: '213px', height: '160px'},
                    gdocs: {width: '213px', height: '160px'},
                    video: {width: '213px', height: '160px'},
                    audio: {width: '100%', height: '30px'},
                    flash: {width: '213px', height: '160px'},
                    object: {width: '213px', height: '160px'},
                    pdf: {width: '100%', height: '160px', 'position': 'relative'},
                    other: {width: '213px', height: '160px'}
                },
                previewSettingsSmall: {
                    image: {width: 'auto', height: 'auto', 'max-width': '100%', 'max-height': '100%'},
                    html: {width: '100%', height: '160px'},
                    text: {width: '100%', height: '160px'},
                    office: {width: '100%', height: '160px'},
                    gdocs: {width: '100%', height: '160px'},
                    video: {width: '100%', height: 'auto'},
                    audio: {width: '100%', height: '30px'},
                    flash: {width: '100%', height: 'auto'},
                    object: {width: '100%', height: 'auto'},
                    pdf: {width: '100%', height: '160px'},
                    other: {width: '100%', height: '160px'}
                },
                previewZoomSettings: {
                    image: {width: 'auto', height: 'auto', 'max-width': '100%', 'max-height': '100%'},
                    html: vDefaultDim,
                    text: vDefaultDim,
                    office: {width: '100%', height: '100%', 'max-width': '100%', 'min-height': '480px'},
                    gdocs: {width: '100%', height: '100%', 'max-width': '100%', 'min-height': '480px'},
                    video: {width: 'auto', height: '100%', 'max-width': '100%'},
                    audio: {width: '100%', height: '30px'},
                    flash: {width: 'auto', height: '480px'},
                    object: {width: 'auto', height: '100%', 'max-width': '100%', 'min-height': '480px'},
                    pdf: vDefaultDim,
                    other: {width: 'auto', height: '100%', 'min-height': '480px'}
                },
                mimeTypeAliases: {
                    'video/quicktime': 'video/mp4'
                },
                fileTypeSettings: {
                    image: function (vType, vName) {
                        return ($h.compare(vType, 'image.*') && !$h.compare(vType, /(tiff?|wmf)$/i) ||
                            $h.compare(vName, /\.(gif|png|jpe?g)$/i));
                    },
                    html: function (vType, vName) {
                        return $h.compare(vType, 'text/html') || $h.compare(vName, /\.(htm|html)$/i);
                    },
                    office: function (vType, vName) {
                        return $h.compare(vType, /(word|excel|powerpoint|office)$/i) ||
                            $h.compare(vName, /\.(docx?|xlsx?|pptx?|pps|potx?)$/i);
                    },
                    gdocs: function (vType, vName) {
                        return $h.compare(vType, /(word|excel|powerpoint|office|iwork-pages|tiff?)$/i) ||
                            $h.compare(vName,
                                /\.(docx?|xlsx?|pptx?|pps|potx?|rtf|ods|odt|pages|ai|dxf|ttf|tiff?|wmf|e?ps)$/i);
                    },
                    text: function (vType, vName) {
                        return $h.compare(vType, 'text.*') || $h.compare(vName, /\.(xml|javascript)$/i) ||
                            $h.compare(vName, /\.(txt|md|nfo|ini|json|php|js|css)$/i);
                    },
                    video: function (vType, vName) {
                        return $h.compare(vType, 'video.*') && ($h.compare(vType, /(ogg|mp4|mp?g|mov|webm|3gp)$/i) ||
                            $h.compare(vName, /\.(og?|mp4|webm|mp?g|mov|3gp)$/i));
                    },
                    audio: function (vType, vName) {
                        return $h.compare(vType, 'audio.*') && ($h.compare(vName, /(ogg|mp3|mp?g|wav)$/i) ||
                            $h.compare(vName, /\.(og?|mp3|mp?g|wav)$/i));
                    },
                    flash: function (vType, vName) {
                        return $h.compare(vType, 'application/x-shockwave-flash', true) || $h.compare(vName,
                            /\.(swf)$/i);
                    },
                    pdf: function (vType, vName) {
                        return $h.compare(vType, 'application/pdf', true) || $h.compare(vName, /\.(pdf)$/i);
                    },
                    object: function () {
                        return true;
                    },
                    other: function () {
                        return true;
                    }
                },
                fileActionSettings: {
                    showRemove: true,
                    showUpload: true,
                    showDownload: true,
                    showZoom: true,
                    showDrag: true,
                    showRotate: true,
                    removeIcon: '<i class="bi-trash"></i>',
                    removeClass: defBtnCss1,
                    removeErrorClass: 'btn btn-sm btn-kv btn-danger',
                    removeTitle: 'Remove file',
                    uploadIcon: '<i class="bi-upload"></i>',
                    uploadClass: defBtnCss1,
                    uploadTitle: 'Upload file',
                    uploadRetryIcon: '<i class="bi-cloud-arrow-up-fill"></i>',
                    uploadRetryTitle: 'Retry upload',
                    downloadIcon: '<i class="bi-download"></i>',
                    downloadClass: defBtnCss1,
                    downloadTitle: 'Download file',
                    rotateIcon: '<i class="bi-arrow-clockwise"></i>',
                    rotateClass: defBtnCss1,
                    rotateTitle: 'Rotate 90 deg. clockwise',
                    zoomIcon: '<i class="bi-zoom-in"></i>',
                    zoomClass: defBtnCss1,
                    zoomTitle: 'View Details',
                    dragIcon: '<i class="bi-arrows-move"></i>',
                    dragClass: 'text-primary',
                    dragTitle: 'Move / Rearrange',
                    dragSettings: {},
                    indicatorNew: '<i class="bi-plus-lg text-warning"></i>',
                    indicatorSuccess: '<i class="bi-check-lg text-success"></i>',
                    indicatorError: '<i class="bi-exclamation-lg text-danger"></i>',
                    indicatorLoading: '<i class="bi-hourglass-bottom text-muted"></i>',
                    indicatorPaused: '<i class="bi-pause-fill text-primary"></i>',
                    indicatorNewTitle: 'Not uploaded yet',
                    indicatorSuccessTitle: 'Uploaded',
                    indicatorErrorTitle: 'Upload Error',
                    indicatorLoadingTitle: 'Uploading &hellip;',
                    indicatorPausedTitle: 'Upload Paused'
                }
            };
            $.each(self.defaults, function (key, setting) {
                if (key === 'allowedPreviewTypes') {
                    if (self.allowedPreviewTypes === undefined) {
                        self.allowedPreviewTypes = setting;
                    }
                    return;
                }
                self[key] = $.extend(true, {}, setting, self[key]);
            });
            self._initPreviewTemplates();
        },
        _initPreviewTemplates: function () {
            var self = this, tags = self.previewMarkupTags, tagBef, tagAft = tags.tagAfter;
            $.each(self.previewContentTemplates, function (key, value) {
                if ($h.isEmpty(self.previewTemplates[key])) {
                    tagBef = tags.tagBefore2;
                    if (key === 'generic' || key === 'image') {
                        tagBef = tags.tagBefore1;
                    }
                    if (self._isPdfRendered() && key === 'pdf') {
                        tagBef = tagBef.replace('kv-file-content', 'kv-file-content kv-pdf-rendered');
                    }
                    self.previewTemplates[key] = tagBef + value + tagAft;
                }
            });
        },
        _initPreviewCache: function () {
            var self = this;
            self.previewCache = {
                data: {},
                init: function () {
                    var content = self.initialPreview;
                    if (content.length > 0 && !$h.isArray(content)) {
                        content = content.split(self.initialPreviewDelimiter);
                    }
                    self.previewCache.data = {
                        content: content,
                        config: self.initialPreviewConfig,
                        tags: self.initialPreviewThumbTags
                    };
                },
                count: function (skipNull) {
                    if (!self.previewCache.data || !self.previewCache.data.content) {
                        return 0;
                    }
                    if (skipNull) {
                        var chk = self.previewCache.data.content.filter(function (n) {
                            return n !== null;
                        });
                        return chk.length;
                    }
                    return self.previewCache.data.content.length;
                },
                get: function (i, isDisabled) {
                    var ind = $h.INIT_FLAG + i, data = self.previewCache.data, config = data.config[i],
                        content = data.content[i], out, $tmp, cat, ftr,
                        fname, ftype, frameClass, asData = $h.ifSet('previewAsData', config, self.initialPreviewAsData),
                        a = config ? {title: config.title || null, alt: config.alt || null} : {title: null, alt: null},
                        parseTemplate = function (cat, dat, fname, ftype, ftr, ind, fclass, t) {
                            var fc = ' file-preview-initial ' + $h.SORT_CSS + (fclass ? ' ' + fclass : ''),
                                id = self.previewInitId + '-' + ind,
                                fileId = config && config.fileId || id;
                            /** @namespace config.zoomData */
                            return self._generatePreviewTemplate(cat, dat, fname, ftype, id, fileId, false, null, null, fc,
                                ftr, ind, t, a, config && config.zoomData || dat);
                        };
                    if (!content || !content.length) {
                        return '';
                    }
                    isDisabled = isDisabled === undefined ? true : isDisabled;
                    cat = $h.ifSet('type', config, self.initialPreviewFileType || 'generic');
                    fname = $h.ifSet('filename', config, $h.ifSet('caption', config));
                    ftype = $h.ifSet('filetype', config, cat);
                    ftr = self.previewCache.footer(i, isDisabled, (config && config.size || null));
                    frameClass = $h.ifSet('frameClass', config);
                    if (asData) {
                        out = parseTemplate(cat, content, fname, ftype, ftr, ind, frameClass);
                    } else {
                        out = parseTemplate('generic', content, fname, ftype, ftr, ind, frameClass, cat)
                            .setTokens({'content': data.content[i]});
                    }
                    if (data.tags.length && data.tags[i]) {
                        out = $h.replaceTags(out, data.tags[i]);
                    }
                    /** @namespace config.frameAttr */
                    if (!$h.isEmpty(config) && !$h.isEmpty(config.frameAttr)) {
                        $tmp = $h.createElement(out);
                        $tmp.find('.file-preview-initial').attr(config.frameAttr);
                        out = $tmp.html();
                        $tmp.remove();
                    }
                    return out;
                },
                clean: function (data) {
                    data.content = $h.cleanArray(data.content);
                    data.config = $h.cleanArray(data.config);
                    data.tags = $h.cleanArray(data.tags);
                    self.previewCache.data = data;
                },
                add: function (content, config, tags, append) {
                    var data = self.previewCache.data, index;
                    if (!content || !content.length) {
                        return 0;
                    }
                    index = content.length - 1;
                    if (!$h.isArray(content)) {
                        content = content.split(self.initialPreviewDelimiter);
                    }
                    if (append && data.content) {
                        index = data.content.push(content[0]) - 1;
                        data.config[index] = config;
                        data.tags[index] = tags;
                    } else {
                        data.content = content;
                        data.config = config;
                        data.tags = tags;
                    }
                    self.previewCache.clean(data);
                    return index;
                },
                set: function (content, config, tags, append) {
                    var data = self.previewCache.data, i, chk;
                    if (!content || !content.length) {
                        return;
                    }
                    if (!$h.isArray(content)) {
                        content = content.split(self.initialPreviewDelimiter);
                    }
                    chk = content.filter(function (n) {
                        return n !== null;
                    });
                    if (!chk.length) {
                        return;
                    }
                    if (data.content === undefined) {
                        data.content = [];
                    }
                    if (data.config === undefined) {
                        data.config = [];
                    }
                    if (data.tags === undefined) {
                        data.tags = [];
                    }
                    if (append) {
                        for (i = 0; i < content.length; i++) {
                            if (content[i]) {
                                data.content.push(content[i]);
                            }
                        }
                        for (i = 0; i < config.length; i++) {
                            if (config[i]) {
                                data.config.push(config[i]);
                            }
                        }
                        for (i = 0; i < tags.length; i++) {
                            if (tags[i]) {
                                data.tags.push(tags[i]);
                            }
                        }
                    } else {
                        data.content = content;
                        data.config = config;
                        data.tags = tags;
                    }
                    self.previewCache.clean(data);
                },
                unset: function (index) {
                    var chk = self.previewCache.count(), rev = self.reversePreviewOrder;
                    if (!chk) {
                        return;
                    }
                    if (chk === 1) {
                        self.previewCache.data.content = [];
                        self.previewCache.data.config = [];
                        self.previewCache.data.tags = [];
                        self.initialPreview = [];
                        self.initialPreviewConfig = [];
                        self.initialPreviewThumbTags = [];
                        return;
                    }
                    self.previewCache.data.content = $h.spliceArray(self.previewCache.data.content, index, rev);
                    self.previewCache.data.config = $h.spliceArray(self.previewCache.data.config, index, rev);
                    self.previewCache.data.tags = $h.spliceArray(self.previewCache.data.tags, index, rev);
                    var data = $.extend(true, {}, self.previewCache.data);
                    self.previewCache.clean(data);
                },
                out: function () {
                    var html = '', caption, len = self.previewCache.count(), i, content;
                    if (len === 0) {
                        return {content: '', caption: ''};
                    }
                    for (i = 0; i < len; i++) {
                        content = self.previewCache.get(i);
                        html = self.reversePreviewOrder ? (content + html) : (html + content);
                    }
                    caption = self._getMsgSelected(len);
                    return {content: html, caption: caption};
                },
                footer: function (i, isDisabled, size) {
                    var data = self.previewCache.data || {};
                    if ($h.isEmpty(data.content)) {
                        return '';
                    }
                    if ($h.isEmpty(data.config) || $h.isEmpty(data.config[i])) {
                        data.config[i] = {};
                    }
                    isDisabled = isDisabled === undefined ? true : isDisabled;
                    var config = data.config[i], caption = $h.ifSet('caption', config), a,
                        width = $h.ifSet('width', config, 'auto'), url = $h.ifSet('url', config, false),
                        key = $h.ifSet('key', config, null), fileId = $h.ifSet('fileId', config, null),
                        fs = self.fileActionSettings, initPreviewShowDel = self.initialPreviewShowDelete || false,
                        downloadInitialUrl = !self.initialPreviewDownloadUrl ? '' :
                            self.initialPreviewDownloadUrl + '?key=' + key + (fileId ? '&fileId=' + fileId : ''),
                        dUrl = config.downloadUrl || downloadInitialUrl,
                        dFil = config.filename || config.caption || '',
                        initPreviewShowDwl = !!(dUrl),
                        sDel = $h.ifSet('showRemove', config, initPreviewShowDel),
                        sRot = $h.ifSet('showRotate', config, $h.ifSet('showRotate', fs, true)),
                        sDwl = $h.ifSet('showDownload', config, $h.ifSet('showDownload', fs, initPreviewShowDwl)),
                        sZm = $h.ifSet('showZoom', config, $h.ifSet('showZoom', fs, true)),
                        sDrg = $h.ifSet('showDrag', config, $h.ifSet('showDrag', fs, true)),
                        dis = (url === false) && isDisabled;
                    sDwl = sDwl && config.downloadUrl !== false && !!dUrl;
                    a = self._renderFileActions(config, false, sDwl, sDel, sRot, sZm, sDrg, dis, url, key, true, dUrl, dFil);
                    return self._getLayoutTemplate('footer').setTokens({
                        'progress': self._renderThumbProgress(),
                        'actions': a,
                        'caption': caption,
                        'size': self._getSize(size),
                        'width': width,
                        'indicator': ''
                    });
                }
            };
            self.previewCache.init();
        },
        _isPdfRendered: function () {
            var self = this, useLib = self.usePdfRenderer,
                flag = typeof useLib === 'function' ? useLib() : !!useLib;
            return flag && self.pdfRendererUrl;
        },
        _handler: function ($el, event, callback) {
            var self = this, ns = self.namespace, ev = event.split(' ').join(ns + ' ') + ns;
            if (!$el || !$el.length) {
                return;
            }
            $el.off(ev).on(ev, callback);
        },
        _encodeURI: function (vUrl) {
            var self = this;
            return self.encodeUrl ? encodeURI(vUrl) : vUrl;
        },
        _log: function (msg, tokens) {
            var self = this, id = self.$element.attr('id');
            if (!self.showConsoleLogs) {
                return;
            }
            if (id) {
                msg = '"' + id + '": ' + msg;
            }
            msg = 'bootstrap-fileinput: ' + msg;
            if (typeof tokens === 'object') {
                msg = msg.setTokens(tokens);
            }
            if (window.console && typeof window.console.log !== 'undefined') {
                window.console.log(msg);
            } else {
                window.alert(msg);
            }
        },
        _validate: function () {
            var self = this, status = self.$element.attr('type') === 'file';
            if (!status) {
                self._log($h.logMessages.badInputType);
            }
            return status;
        },
        _errorsExist: function () {
            var self = this, $err, $errList = self.$errorContainer.find('li');
            if ($errList.length) {
                return true;
            }
            $err = $h.createElement(self.$errorContainer.html());
            $err.find('.kv-error-close').remove();
            $err.find('ul').remove();
            return !!$.trim($err.text()).length;
        },
        _errorHandler: function (evt, caption) {
            var self = this, err = evt.target.error, showError = function (msg) {
                self._showError(msg.replace('{name}', caption));
            };
            /** @namespace err.NOT_FOUND_ERR */
            /** @namespace err.SECURITY_ERR */
            /** @namespace err.NOT_READABLE_ERR */
            if (err.code === err.NOT_FOUND_ERR) {
                showError(self.msgFileNotFound);
            } else {
                if (err.code === err.SECURITY_ERR) {
                    showError(self.msgFileSecured);
                } else {
                    if (err.code === err.NOT_READABLE_ERR) {
                        showError(self.msgFileNotReadable);
                    } else {
                        if (err.code === err.ABORT_ERR) {
                            showError(self.msgFilePreviewAborted);
                        } else {
                            showError(self.msgFilePreviewError);
                        }
                    }
                }
            }
        },
        _addError: function (msg) {
            var self = this, $error = self.$errorContainer;
            if (msg && $error.length) {
                $h.setHtml($error, self.errorCloseButton + msg);
                self._handler($error.find('.kv-error-close'), 'click', function () {
                    setTimeout(function () {
                        if (self.showPreview && !self.getFrames().length) {
                            self.clear();
                        }
                        $error.fadeOut('slow');
                    }, self.processDelay);
                });
            }
        },
        _setValidationError: function (css) {
            var self = this;
            css = (css ? css + ' ' : '') + 'has-error';
            self.$container.removeClass(css).addClass('has-error');
            $h.addCss(self.$caption, 'is-invalid');
        },
        _resetErrors: function (fade) {
            var self = this, $error = self.$errorContainer, history = self.resumableUploadOptions.retainErrorHistory;
            if (self.isPersistentError || (self.enableResumableUpload && history && !self.clearInput)) {
                return;
            }
            self.clearInput = false;
            self.isError = false;
            self.$container.removeClass('has-error');
            self.$caption.removeClass('is-invalid is-valid file-processing');
            $error.html('');
            if (fade) {
                $error.fadeOut('slow');
            } else {
                $error.hide();
            }
        },
        _showFolderError: function (folders) {
            var self = this, $error = self.$errorContainer, msg;
            if (!folders) {
                return;
            }
            if (!self.isAjaxUpload) {
                self._clearFileInput();
            }
            msg = self.msgFoldersNotAllowed.replace('{n}', folders);
            self._addError(msg);
            self._setValidationError();
            $error.fadeIn(self.fadeDelay);
            self._raise('filefoldererror', [folders, msg]);
        },
        showUserError: function (msg, params, retainErrorHistory) {
            var self = this, fileName;
            if (!self.uploadInitiated) {
                return;
            }
            if (!params || !params.fileId) {
                if (!retainErrorHistory) {
                    self.$errorContainer.html('');
                }
            } else {
                if (!retainErrorHistory) {
                    self.$errorContainer.find('[data-file-id="' + params.fileId + '"]').remove();
                }
                fileName = self.fileManager.getFileName(params.fileId);
                if (fileName) {
                    msg = '<b>' + fileName + ':</b> ' + msg;
                }
            }
            self._showFileError(msg, params, 'fileusererror');
        },
        _showFileError: function (msg, params, event) {
            var self = this, $error = self.$errorContainer, ev = event || 'fileuploaderror',
                fId = params && params.fileId || '', e = params && params.id ?
                    '<li data-thumb-id="' + params.id + '" data-file-id="' + fId + '">' + msg + '</li>' :
                    '<li>' + msg + '</li>';

            if ($error.find('ul').length === 0) {
                self._addError('<ul>' + e + '</ul>');
            } else {
                $error.find('ul').append(e);
            }
            $error.fadeIn(self.fadeDelay);
            self._raise(ev, [params, msg]);
            self._setValidationError('file-input-new');
            return true;
        },
        _showError: function (msg, params, event) {
            var self = this, $error = self.$errorContainer, ev = event || 'fileerror';
            params = params || {};
            params.reader = self.reader;
            self._addError(msg);
            $error.fadeIn(self.fadeDelay);
            self._raise(ev, [params, msg]);
            if (!self.isAjaxUpload) {
                self._clearFileInput();
            }
            self._setValidationError('file-input-new');
            self.$btnUpload.attr('disabled', true);
            return true;
        },
        _noFilesError: function (params) {
            var self = this, label = self.minFileCount > 1 ? self.filePlural : self.fileSingle,
                msg = self.msgFilesTooLess.replace('{n}', self.minFileCount).replace('{files}', label),
                $error = self.$errorContainer;
            msg = '<li>' + msg + '</li>';
            if ($error.find('ul').length === 0) {
                self._addError('<ul>' + msg + '</ul>');
            } else {
                $error.find('ul').append(msg);
            }
            self.isError = true;
            self._updateFileDetails(0);
            $error.fadeIn(self.fadeDelay);
            self._raise('fileerror', [params, msg]);
            self._clearFileInput();
            self._setValidationError();
        },
        _parseError: function (operation, jqXHR, errorThrown, fileName) {
            /** @namespace jqXHR.responseJSON */
            var self = this, errMsg = $.trim(errorThrown + ''), textPre, errText, text;
            errText = jqXHR.responseJSON && jqXHR.responseJSON.error ? jqXHR.responseJSON.error.toString() : '';
            text = errText ? errText : jqXHR.responseText;
            if (self.cancelling && self.msgUploadAborted) {
                errMsg = self.msgUploadAborted;
            }
            if (self.showAjaxErrorDetails && text) {
                if (errText) {
                    errMsg = $.trim(errText + '');
                } else {
                    text = $.trim(text.replace(/\n\s*\n/g, '\n'));
                    textPre = text.length ? '<pre>' + text + '</pre>' : '';
                    errMsg += errMsg ? textPre : text;
                }
            }
            if (!errMsg) {
                errMsg = self.msgAjaxError.replace('{operation}', operation);
            }
            self.cancelling = false;
            return fileName ? '<b>' + fileName + ': </b>' + errMsg : errMsg;
        },
        _parseFileType: function (type, name) {
            var self = this, isValid, vType, cat, i, types = self.allowedPreviewTypes || [];
            if (type === 'application/text-plain') {
                return 'text';
            }
            for (i = 0; i < types.length; i++) {
                cat = types[i];
                isValid = self.fileTypeSettings[cat];
                vType = isValid(type, name) ? cat : '';
                if (!$h.isEmpty(vType)) {
                    return vType;
                }
            }
            return 'other';
        },
        _getPreviewIcon: function (fname) {
            var self = this, ext, out = null;
            if (fname && fname.indexOf('.') > -1) {
                ext = fname.split('.').pop();
                if (self.previewFileIconSettings) {
                    out = self.previewFileIconSettings[ext] || self.previewFileIconSettings[ext.toLowerCase()] || null;
                }
                if (self.previewFileExtSettings) {
                    $.each(self.previewFileExtSettings, function (key, func) {
                        if (self.previewFileIconSettings[key] && func(ext)) {
                            out = self.previewFileIconSettings[key];
                            //noinspection UnnecessaryReturnStatementJS
                            return;
                        }
                    });
                }
            }
            return out || self.previewFileIcon;
        },
        _parseFilePreviewIcon: function (content, fname) {
            var self = this, icn = self._getPreviewIcon(fname), out = content;
            if (out.indexOf('{previewFileIcon}') > -1) {
                out = out.setTokens({'previewFileIconClass': self.previewFileIconClass, 'previewFileIcon': icn});
            }
            return out;
        },
        _raise: function (event, params) {
            var self = this, e = $.Event(event);
            if (params !== undefined) {
                self.$element.trigger(e, params);
            } else {
                self.$element.trigger(e);
            }
            var out = e.result, isAborted = out === false;
            if (e.isDefaultPrevented() || isAborted) {
                return false;
            }
            if (e.type === 'filebatchpreupload' && (out || isAborted)) {
                self.ajaxAborted = out;
                return false;
            }
            switch (event) {
                // ignore these events
                case 'filebatchuploadcomplete':
                case 'filebatchuploadsuccess':
                case 'fileuploaded':
                case 'fileclear':
                case 'filecleared':
                case 'filereset':
                case 'fileerror':
                case 'filefoldererror':
                case 'filecustomerror':
                case 'filesuccessremove':
                    break;
                // receive data response via `filecustomerror` event`
                default:
                    if (!self.ajaxAborted) {
                        self.ajaxAborted = out;
                    }
                    break;
            }
            return true;
        },
        _listenFullScreen: function (isFullScreen) {
            var self = this, $modal = self.$modal, $btnFull, $btnBord;
            if (!$modal || !$modal.length) {
                return;
            }
            $btnFull = $modal && $modal.find('.btn-kv-fullscreen');
            $btnBord = $modal && $modal.find('.btn-kv-borderless');
            if (!$btnFull.length || !$btnBord.length) {
                return;
            }
            $btnFull.removeClass('active').attr('aria-pressed', 'false');
            $btnBord.removeClass('active').attr('aria-pressed', 'false');
            if (isFullScreen) {
                $btnFull.addClass('active').attr('aria-pressed', 'true');
            } else {
                $btnBord.addClass('active').attr('aria-pressed', 'true');
            }
            if ($modal.hasClass('file-zoom-fullscreen')) {
                self._maximizeZoomDialog();
            } else {
                if (isFullScreen) {
                    self._maximizeZoomDialog();
                } else {
                    $btnBord.removeClass('active').attr('aria-pressed', 'false');
                }
            }
        },
        _listen: function () {
            var self = this, $el = self.$element, $form = self.$form, $cont = self.$container, fullScreenEv;
            self._handler($el, 'click', function (e) {
                self._initFileSelected();
                if ($el.hasClass('file-no-browse')) {
                    if ($el.data('zoneClicked')) {
                        $el.data('zoneClicked', false);
                    } else {
                        e.preventDefault();
                    }
                }
            });
            self._handler($el, 'change', $.proxy(self._change, self));
            self._handler(self.$caption, 'paste', $.proxy(self.paste, self));
            if (self.showBrowse) {
                self._handler(self.$btnFile, 'click', $.proxy(self._browse, self));
                self._handler(self.$btnFile, 'keypress', function (e) {
                    var keycode = e.keyCode || e.which;
                    if (keycode === 13) {
                        $el.trigger('click');
                        self._browse(e);
                    }
                });
            }
            self._handler($cont.find('.fileinput-remove:not([disabled])'), 'click', $.proxy(self.clear, self));
            self._handler($cont.find('.fileinput-cancel'), 'click', $.proxy(self.cancel, self));
            self._handler($cont.find('.fileinput-pause'), 'click', $.proxy(self.pause, self));
            self._initDragDrop();
            self._handler($form, 'reset', $.proxy(self.clear, self));
            if (!self.isAjaxUpload) {
                self._handler($form, 'submit', $.proxy(self._submitForm, self));
            }
            self._handler(self.$container.find('.fileinput-upload'), 'click', $.proxy(self._uploadClick, self));
            self._handler($(window), 'resize', function () {
                self._listenFullScreen(screen.width === window.innerWidth && screen.height === window.innerHeight);
            });
            fullScreenEv = 'webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange';
            self._handler($(document), fullScreenEv, function () {
                self._listenFullScreen($h.checkFullScreen());
            });
            self.$caption.on('focus', function () {
                self.$captionContainer.focus();
            });
            self._autoFitContent();
            self._initClickable();
            self._refreshPreview();
        },
        _autoFitContent: function () {
            var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
                self = this, config = width < 400 ? (self.previewSettingsSmall || self.defaults.previewSettingsSmall) :
                    (self.previewSettings || self.defaults.previewSettings), sel;
            $.each(config, function (cat, settings) {
                sel = '.file-preview-frame .file-preview-' + cat;
                self.$preview.find(sel + '.kv-preview-data,' + sel + ' .kv-preview-data').css(settings);
            });
        },
        _scanDroppedItems: function (item, files, path) {
            path = path || '';
            var self = this, i, dirReader, readDir, errorHandler = function (e) {
                self._log($h.logMessages.badDroppedFiles);
                self._log(e);
            };
            if (item.isFile) {
                item.file(function (file) {
                    if (path) {
                        file.newPath = path + file.name;
                    }
                    files.push(file);
                }, errorHandler);
            } else {
                if (item.isDirectory) {
                    dirReader = item.createReader();
                    readDir = function () {
                        dirReader.readEntries(function (entries) {
                            if (entries && entries.length > 0) {
                                for (i = 0; i < entries.length; i++) {
                                    self._scanDroppedItems(entries[i], files, path + item.name + '/');
                                }
                                // recursively call readDir() again, since browser can only handle first 100 entries.
                                readDir();
                            }
                            return null;
                        }, errorHandler);
                    };
                    readDir();
                }
            }

        },
        _initDragDrop: function () {
            var self = this, $zone = self.$dropZone;
            if (self.dropZoneEnabled && self.showPreview) {
                self._handler($zone, 'dragenter dragover', $.proxy(self._zoneDragEnter, self));
                self._handler($zone, 'dragleave', $.proxy(self._zoneDragLeave, self));
                self._handler($zone, 'drop', $.proxy(self._zoneDrop, self));
                self._handler($(document), 'dragenter dragover drop', self._zoneDragDropInit);
            }
        },
        _zoneDragDropInit: function (e) {
            e.stopPropagation();
            e.preventDefault();
        },
        _zoneDragEnter: function (e) {
            var self = this, dt = e.originalEvent.dataTransfer, hasFiles = $.inArray('Files', dt.types) > -1;
            self._zoneDragDropInit(e);
            if (self.isDisabled || !hasFiles) {
                dt.effectAllowed = 'none';
                dt.dropEffect = 'none';
                return;
            }
            dt.dropEffect = 'copy';
            if (self._raise('fileDragEnter', {'sourceEvent': e, 'files': dt.types.Files})) {
                $h.addCss(self.$dropZone, 'file-highlighted');
            }
        },
        _zoneDragLeave: function (e) {
            var self = this;
            self._zoneDragDropInit(e);
            if (self.isDisabled) {
                return;
            }
            if (self._raise('fileDragLeave', {'sourceEvent': e})) {
                self.$dropZone.removeClass('file-highlighted');
            }

        },
        _dropFiles: function (e, files) {
            var self = this, $el = self.$element;
            if (!self.isAjaxUpload) {
                self.changeTriggered = true;
                $el.get(0).files = files;
                setTimeout(function () {
                    self.changeTriggered = false;
                    $el.trigger('change' + self.namespace);
                }, self.processDelay);
            } else {
                self._change(e, files);
            }
            self.$dropZone.removeClass('file-highlighted');
        },
        _zoneDrop: function (e) {
            /** @namespace e.originalEvent.dataTransfer */
            var self = this, i, $el = self.$element, dt = e.originalEvent.dataTransfer,
                files = dt.files, items = dt.items, folders = $h.getDragDropFolders(items);
            e.preventDefault();
            if (self.isDisabled || $h.isEmpty(files)) {
                return;
            }
            if (!self._raise('fileDragDrop', {'sourceEvent': e, 'files': files})) {
                return;
            }
            if (folders > 0) {
                if (!self.isAjaxUpload) {
                    self._showFolderError(folders);
                    return;
                }
                files = [];
                for (i = 0; i < items.length; i++) {
                    var item = items[i].webkitGetAsEntry();
                    if (item) {
                        self._scanDroppedItems(item, files);
                    }
                }
                setTimeout(function () {
                    self._dropFiles(e, files);
                }, 500);
            } else {
                self._dropFiles(e, files);
            }
        },
        _uploadClick: function (e) {
            var self = this, $btn = self.$container.find('.fileinput-upload'), $form,
                isEnabled = !$btn.hasClass('disabled') && $h.isEmpty($btn.attr('disabled'));
            if (e && e.isDefaultPrevented()) {
                return;
            }
            if (!self.isAjaxUpload) {
                if (isEnabled && $btn.attr('type') !== 'submit') {
                    e.preventDefault();
                    $form = $btn.closest('form');
                    // downgrade to normal form submit if possible
                    if ($form.length) {
                        $form.trigger('submit');
                    }
                }
                return;
            }
            e.preventDefault();
            if (isEnabled) {
                self.upload();
            }
        },
        _submitForm: function () {
            var self = this;
            return self._isFileSelectionValid() && !self._abort({});
        },
        _clearPreview: function () {
            var self = this,
                $thumbs = self.showUploadedThumbs ? self.getFrames(':not(.file-preview-success)') : self.getFrames();
            $thumbs.each(function () {
                var $thumb = $(this);
                $thumb.remove();
            });
            if (!self.getFrames().length || !self.showPreview) {
                self._resetUpload();
            }
            self._validateDefaultPreview();
        },
        _initSortable: function () {
            var self = this, $el = self.$preview, settings, selector = '.' + $h.SORT_CSS, $cont, $body = $('body'),
                $html = $('html'), rev = self.reversePreviewOrder, Sortable = window.Sortable, beginGrab, endGrab;
            if (!Sortable || $el.find(selector).length === 0) {
                return;
            }
            $cont = $body.length ? $body : ($html.length ? $html : self.$container);
            beginGrab = function () {
                $cont.addClass('file-grabbing');
            };
            endGrab = function () {
                $cont.removeClass('file-grabbing');
            };
            settings = {
                handle: '.drag-handle-init',
                dataIdAttr: 'data-fileid',
                animation: 600,
                draggable: selector,
                scroll: false,
                forceFallback: true,
                onChoose: beginGrab,
                onStart: beginGrab,
                onUnchoose: endGrab,
                onEnd: endGrab,
                onSort: function (e) {
                    var oldIndex = e.oldIndex, newIndex = e.newIndex, i = 0, len = self.initialPreviewConfig.length,
                        exceedsLast = len > 0 && newIndex >= len, $item = $(e.item), $first;
                    if (exceedsLast) {
                        newIndex = len - 1;
                    }
                    self.initialPreview = $h.moveArray(self.initialPreview, oldIndex, newIndex, rev);
                    self.initialPreviewConfig = $h.moveArray(self.initialPreviewConfig, oldIndex, newIndex, rev);
                    self.previewCache.init();
                    self.getFrames('.file-preview-initial').each(function () {
                        $(this).attr('data-fileindex', $h.INIT_FLAG + i);
                        i++;
                    });
                    if (exceedsLast) {
                        $first = self.getFrames(':not(.file-preview-initial):first');
                        if ($first.length) {
                            $item.slideUp(function () {
                                $item.insertBefore($first).slideDown();
                            });
                        }
                    }
                    self._raise('filesorted', {
                        previewId: $item.attr('id'),
                        'oldIndex': oldIndex,
                        'newIndex': newIndex,
                        stack: self.initialPreviewConfig
                    });
                },
            };
            $.extend(true, settings, self.fileActionSettings.dragSettings);
            if (self.sortable) {
                self.sortable.destroy();
            }
            self.sortable = Sortable.create($el[0], settings);
        },
        _setPreviewContent: function (content) {
            var self = this;
            $h.setHtml(self.$preview, content);
            self._autoFitContent();
        },
        _initPreviewImageOrientations: function () {
            var self = this, i = 0, canOrientImage = self.canOrientImage;
            if (!self.autoOrientImageInitial && !canOrientImage) {
                return;
            }
            self.getFrames('.file-preview-initial').each(function () {
                var $thumb = $(this), $img, $zoomImg, id, config = self.initialPreviewConfig[i];
                /** @namespace config.exif */
                if (config && config.exif && config.exif.Orientation) {
                    id = $thumb.attr('id');
                    $img = $thumb.find('>.kv-file-content img');
                    $zoomImg = self._getZoom(id, ' >.kv-file-content img');
                    if (canOrientImage) {
                        $img.css('image-orientation', (self.autoOrientImageInitial ? 'from-image' : 'none'));
                    } else {
                        self.setImageOrientation($img, $zoomImg, config.exif.Orientation, $thumb);
                    }
                }
                i++;
            });
        },
        _initPreview: function (isInit) {
            var self = this, cap = self.initialCaption || '', out;
            if (!self.previewCache.count(true)) {
                self._clearPreview();
                if (isInit) {
                    self._setCaption(cap);
                } else {
                    self._initCaption();
                }
                return;
            }
            out = self.previewCache.out();
            cap = isInit && self.initialCaption ? self.initialCaption : out.caption;
            self._setPreviewContent(out.content);
            self._setInitThumbAttr();
            self._setCaption(cap);
            self._initSortable();
            if (!$h.isEmpty(out.content)) {
                self.$container.removeClass('file-input-new');
            }
            self._initPreviewImageOrientations();
        },
        _getZoomButton: function (type) {
            var self = this, label = self.previewZoomButtonIcons[type], css = self.previewZoomButtonClasses[type],
                title = ' title="' + (self.previewZoomButtonTitles[type] || '') + '" ', tag = $h.isBs(5) ? 'bs-' : '',
                params = title + (type === 'close' ? ' data-' + tag + 'dismiss="modal" aria-hidden="true"' : '');
            if (type === 'fullscreen' || type === 'borderless' || type === 'toggleheader') {
                params += ' data-toggle="button" aria-pressed="false" autocomplete="off"';
            }
            return '<button type="button" class="' + css + ' btn-kv-' + type + '"' + params + '>' + label + '</button>';
        },
        _getModalContent: function () {
            var self = this;
            return self._getLayoutTemplate('modal').setTokens({
                'rtl': self.rtl ? ' kv-rtl' : '',
                'zoomFrameClass': self.frameClass,
                'prev': self._getZoomButton('prev'),
                'next': self._getZoomButton('next'),
                'rotate': self._getZoomButton('rotate'),
                'toggleheader': self._getZoomButton('toggleheader'),
                'fullscreen': self._getZoomButton('fullscreen'),
                'borderless': self._getZoomButton('borderless'),
                'close': self._getZoomButton('close')
            });
        },
        _listenModalEvent: function (event) {
            var self = this, $modal = self.$modal, getParams = function (e) {
                return {
                    sourceEvent: e,
                    previewId: $modal.data('previewId'),
                    modal: $modal
                };
            };
            $modal.on(event + '.bs.modal', function (e) {
                if (e.namespace !== 'bs.modal') {
                    return;
                }
                var $btnFull = $modal.find('.btn-fullscreen'), $btnBord = $modal.find('.btn-borderless');
                if ($modal.data('fileinputPluginId') === self.$element.attr('id')) {
                    self._raise('filezoom' + event, getParams(e));
                }
                if (event === 'shown') {
                    self._handleRotation($modal, $modal.find('.file-zoom-detail'), $modal.data('angle'));
                    $btnBord.removeClass('active').attr('aria-pressed', 'false');
                    $btnFull.removeClass('active').attr('aria-pressed', 'false');
                    if ($modal.hasClass('file-zoom-fullscreen')) {
                        self._maximizeZoomDialog();
                        if ($h.checkFullScreen()) {
                            $btnFull.addClass('active').attr('aria-pressed', 'true');
                        } else {
                            $btnBord.addClass('active').attr('aria-pressed', 'true');
                        }
                    }
                }
            });
        },
        _initZoom: function () {
            var self = this, $dialog, modalMain = self._getLayoutTemplate('modalMain'), modalId = '#' + $h.MODAL_ID;
            modalMain = self._setTabIndex('modal', modalMain);
            if (!self.showPreview) {
                return;
            }
            self.$modal = $(modalId);
            if (!self.$modal || !self.$modal.length) {
                $dialog = $h.createElement($h.cspBuffer.stash(modalMain)).insertAfter(self.$container);
                self.$modal = $(modalId).insertBefore($dialog);
                $h.cspBuffer.apply(self.$modal);
                $dialog.remove();
            }
            $h.initModal(self.$modal);
            self.$modal.html($h.cspBuffer.stash(self._getModalContent()));
            $h.cspBuffer.apply(self.$modal);
            $.each($h.MODAL_EVENTS, function (key, event) {
                self._listenModalEvent(event);
            });
        },
        _initZoomButtons: function () {
            var self = this, $modal = self.$modal, previewId = $modal.data('previewId') || '', $first, $last,
                thumbs = self.getFrames().toArray(), len = thumbs.length, $prev = $modal.find('.btn-kv-prev'),
                $next = $modal.find('.btn-kv-next'), $rotate = $modal.find('.btn-kv-rotate');
            if (thumbs.length < 2) {
                $prev.hide();
                $next.hide();
                return;
            } else {
                $prev.show();
                $next.show();
            }
            if (!len) {
                return;
            }
            $first = $(thumbs[0]);
            $last = $(thumbs[len - 1]);
            $prev.removeAttr('disabled');
            $next.removeAttr('disabled');
            if (self.reversePreviewOrder) {
                [$prev, $next] = [$next, $prev]; // swap
            }
            if ($first.length && $first.attr('id') === previewId) {
                $prev.attr('disabled', true);
            }
            if ($last.length && $last.attr('id') === previewId) {
                $next.attr('disabled', true);
            }
        },
        _maximizeZoomDialog: function () {
            var self = this, $modal = self.$modal, $head = $modal.find('.modal-header:visible'),
                $foot = $modal.find('.modal-footer:visible'), $body = $modal.find('.kv-zoom-body'),
                h = $(window).height(), diff = 0;
            $modal.addClass('file-zoom-fullscreen');
            if ($head && $head.length) {
                h -= $head.outerHeight(true);
            }
            if ($foot && $foot.length) {
                h -= $foot.outerHeight(true);
            }
            if ($body && $body.length) {
                diff = $body.outerHeight(true) - $body.height();
                h -= diff;
            }
            $modal.find('.kv-zoom-body').height(h);
        },
        _resizeZoomDialog: function (fullScreen) {
            var self = this, $modal = self.$modal, $btnFull = $modal.find('.btn-kv-fullscreen'),
                $btnBord = $modal.find('.btn-kv-borderless');
            if ($modal.hasClass('file-zoom-fullscreen')) {
                $h.toggleFullScreen(false);
                if (!fullScreen) {
                    if (!$btnFull.hasClass('active')) {
                        $modal.removeClass('file-zoom-fullscreen');
                        self.$modal.find('.kv-zoom-body').css('height', self.zoomModalHeight);
                    } else {
                        $btnFull.removeClass('active').attr('aria-pressed', 'false');
                    }
                } else {
                    if (!$btnFull.hasClass('active')) {
                        $modal.removeClass('file-zoom-fullscreen');
                        self._resizeZoomDialog(true);
                        if ($btnBord.hasClass('active')) {
                            $btnBord.removeClass('active').attr('aria-pressed', 'false');
                        }
                    }
                }
            } else {
                if (!fullScreen) {
                    self._maximizeZoomDialog();
                    return;
                }
                $h.toggleFullScreen(true);
            }
            $modal.focus();
        },
        _setZoomContent: function ($frame, navigate) {
            var self = this, $content, tmplt, body, title, $body, $dataEl, config, previewId = $frame.attr('id'),
                $zoomPreview = self._getZoom(previewId), $modal = self.$modal, $tmp, desc, $desc,
                $btnFull = $modal.find('.btn-kv-fullscreen'), $btnBord = $modal.find('.btn-kv-borderless'), cap, size,
                $btnTogh = $modal.find('.btn-kv-toggleheader'), dir = navigate === 'prev' ? 'Left' : 'Right',
                slideIn = 'slideIn' + dir, slideOut = 'slideOut' + dir, parsed, zoomData = $frame.data('zoom');
            if (zoomData) {
                zoomData = decodeURIComponent(zoomData);
                parsed = $zoomPreview.html().replace(self.zoomPlaceholder, '').setTokens({zoomData: zoomData});
                $zoomPreview.html(parsed);
                $frame.data('zoom', '');
                $zoomPreview.attr('data-zoom', zoomData);
            }
            tmplt = $zoomPreview.attr('data-template') || 'generic';
            $content = $zoomPreview.find('.kv-file-content');
            body = $content.length ? $content.html() : '';
            cap = $frame.data('caption') || self.msgZoomModalHeading;
            size = $frame.data('size') || '';
            desc = $frame.data('description') || '';
            $modal.find('.kv-zoom-caption').attr('title', cap).html(cap);
            $modal.find('.kv-zoom-size').html(size);
            $desc = $modal.find('.kv-zoom-description').hide();
            if (desc) {
                if (self.showDescriptionClose) {
                    desc = self._getLayoutTemplate('descriptionClose').setTokens({
                        closeIcon: self.previewZoomButtonIcons.close
                    }) + '</button>' + desc;
                }
                $desc.show().html(desc);
                if (self.showDescriptionClose) {
                    self._handler($modal.find('.kv-desc-hide'), 'click', function () {
                        $(this).parent().fadeOut('fast', function () {
                            $modal.focus();
                        });
                    });
                }
            }
            $body = $modal.find('.kv-zoom-body');
            $modal.removeClass('kv-single-content');
            if (navigate) {
                $tmp = $body.addClass('file-thumb-loading').clone().insertAfter($body);
                $h.setHtml($body, body).hide();
                $tmp.fadeOut('fast', function () {
                    $body.fadeIn('fast', function () {
                        $body.removeClass('file-thumb-loading');
                    });
                    $tmp.remove();
                });
            } else {
                $h.setHtml($body, body);
            }
            config = self.previewZoomSettings[tmplt];
            if (config) {
                $dataEl = $body.find('.kv-preview-data');
                $h.addCss($dataEl, 'file-zoom-detail');
                $.each(config, function (key, value) {
                    $dataEl.css(key, value);
                    if (($dataEl.attr('width') && key === 'width') || ($dataEl.attr('height') && key === 'height')) {
                        $dataEl.removeAttr(key);
                    }
                });
            }
            $modal.data('previewId', previewId);
            self._handler($modal.find('.btn-kv-prev'), 'click', function () {
                self._zoomSlideShow('prev', previewId);
            });
            self._handler($modal.find('.btn-kv-next'), 'click', function () {
                self._zoomSlideShow('next', previewId);
            });
            self._handler($btnFull, 'click', function () {
                self._resizeZoomDialog(true);
            });
            self._handler($btnBord, 'click', function () {
                self._resizeZoomDialog(false);
            });
            self._handler($btnTogh, 'click', function () {
                var $header = $modal.find('.modal-header'), $floatBar = $modal.find('.floating-buttons'),
                    ht, $actions = $header.find('.kv-zoom-actions'), resize = function (height) {
                        var $body = self.$modal.find('.kv-zoom-body'), h = self.zoomModalHeight;
                        if ($modal.hasClass('file-zoom-fullscreen')) {
                            h = $body.outerHeight(true);
                            if (!height) {
                                h = h - $header.outerHeight(true);
                            }
                        }
                        $body.css('height', height ? h + height : h);
                    };
                if ($header.is(':visible')) {
                    ht = $header.outerHeight(true);
                    $header.slideUp('slow', function () {
                        $actions.find('.btn').appendTo($floatBar);
                        resize(ht);
                    });
                } else {
                    $floatBar.find('.btn').appendTo($actions);
                    $header.slideDown('slow', function () {
                        resize();
                    });
                }
                $modal.focus();
            });
            self._handler($modal, 'keydown', function (e) {
                var key = e.which || e.keyCode, delay = self.processDelay + 1, $prev = $(this).find('.btn-kv-prev'),
                    $next = $(this).find('.btn-kv-next'), vId = $(this).data('previewId'), vPrevKey, vNextKey;
                [vPrevKey, vNextKey] = self.rtl ? [39, 37] : [37, 39];
                $.each({prev: [$prev, vPrevKey], next: [$next, vNextKey]}, function (direction, config) {
                    var $btn = config[0], vKey = config[1];
                    if (key === vKey && $btn.length) {
                        $modal.focus();
                        if (!$btn.attr('disabled')) {
                            $btn.blur();
                            setTimeout(function () {
                                $btn.focus();
                                self._zoomSlideShow(direction, vId);
                                setTimeout(function () {
                                    if ($btn.attr('disabled')) {
                                        $modal.focus();
                                    }
                                }, delay);
                            }, delay);
                        }
                    }
                });
            });
        },
        _showModal: function ($frame) {
            var self = this, $modal = self.$modal, $content, css, angle;
            if (!$frame || !$frame.length) {
                return;
            }
            $h.initModal($modal);
            $h.setHtml($modal, self._getModalContent());
            self._setZoomContent($frame);
            $modal.removeClass('rotatable');
            $modal.data({backdrop: false, fileinputPluginId: self.$element.attr('id')});
            $modal.find('.kv-zoom-body').css('height', self.zoomModalHeight);
            $content = $frame.find('.kv-file-content > :first-child');
            if ($content.length) {
                css = $content.css('transform');
                if (css) {
                    $modal.find('.file-zoom-detail').css('transform', css);
                }
            }
            if ($frame.hasClass('rotatable')) {
                $modal.addClass('rotatable');
            }
            if ($frame.data('angle')) {
                $modal.data('angle', $frame.data('angle'));
            }
            angle = ($frame.data('angle') || 0);
            $modal.modal('show');
            self._initZoomButtons();
            self._initRotateZoom($frame, $content);
        },
        _zoomPreview: function ($btn) {
            var self = this, $frame;
            if (!$btn.length) {
                throw 'Cannot zoom to detailed preview!';
            }
            $frame = $btn.closest($h.FRAMES);
            self._showModal($frame);
        },
        _zoomSlideShow: function (dir, previewId) {
            var self = this, $modal = self.$modal, $btn = $modal.find('.kv-zoom-actions .btn-kv-' + dir), $targFrame, i,
                $thumb, thumbsData = self.getFrames().toArray(), thumbs = [], len = thumbsData.length, out, angle,
                $content;
            if (self.reversePreviewOrder) {
                dir = dir === 'prev' ? 'next' : 'prev';
            }
            if ($btn.attr('disabled')) {
                return;
            }
            for (i = 0; i < len; i++) {
                $thumb = $(thumbsData[i]);
                if ($thumb && $thumb.length && $thumb.find('.kv-file-zoom:visible').length) {
                    thumbs.push(thumbsData[i]);
                }
            }
            len = thumbs.length;
            for (i = 0; i < len; i++) {
                if ($(thumbs[i]).attr('id') === previewId) {
                    out = dir === 'prev' ? i - 1 : i + 1;
                    break;
                }
            }
            if (out < 0 || out >= len || !thumbs[out]) {
                return;
            }
            $targFrame = $(thumbs[out]);
            if ($targFrame.length) {
                self._setZoomContent($targFrame, dir);
            }
            self._initZoomButtons();
            if ($targFrame.length && $targFrame.hasClass('rotatable')) {
                angle = $targFrame.data('angle') || 0;
                $modal.addClass('rotatable').data('angle', angle);
                $content = $targFrame.find('.kv-file-content > :first-child');
                self._initRotateZoom($targFrame, $content);
            } else {
                $modal.removeClass('rotatable').removeData('angle');
            }
            self._raise('filezoom' + dir, {'previewId': previewId, modal: self.$modal});
        },
        _initZoomButton: function () {
            var self = this;
            self.$preview.find('.kv-file-zoom').each(function () {
                var $el = $(this);
                self._handler($el, 'click', function () {
                    self._zoomPreview($el);
                });
            });
        },
        _inputFileCount: function () {
            return this.$element[0].files.length;
        },
        _refreshPreview: function () {
            var self = this, files;
            if ((!self._inputFileCount() && !self.isAjaxUpload) || !self.showPreview || !self.isPreviewable) {
                return;
            }
            if (self.isAjaxUpload) {
                if (self.fileManager.count() > 0) {
                    files = $.extend(true, [], self.getFileList());
                    self.fileManager.clear();
                    self._clearFileInput();
                } else {
                    files = self.$element[0].files;
                }
            } else {
                files = self.$element[0].files;
            }
            if (files && files.length) {
                self.readFiles(files);
            }
        },
        _clearObjects: function ($el) {
            $el.find('video audio').each(function () {
                this.pause();
                $(this).remove();
            });
            $el.find('img object div').each(function () {
                $(this).remove();
            });
        },
        _clearFileInput: function () {
            var self = this, $el = self.$element, $srcFrm, $tmpFrm, $tmpEl;
            if (!self._inputFileCount()) {
                return;
            }
            $srcFrm = $el.closest('form');
            $tmpFrm = $(document.createElement('form'));
            $tmpEl = $(document.createElement('div'));
            $el.before($tmpEl);
            if ($srcFrm.length) {
                $srcFrm.after($tmpFrm);
            } else {
                $tmpEl.after($tmpFrm);
            }
            $tmpFrm.append($el).trigger('reset');
            $tmpEl.before($el).remove();
            $tmpFrm.remove();
        },
        _resetUpload: function () {
            var self = this;
            self.uploadInitiated = false;
            self.uploadStartTime = $h.now();
            self.uploadCache = [];
            self.$btnUpload.removeAttr('disabled');
            self._setProgress(0);
            self._hideProgress();
            self._resetErrors(false);
            self._initAjax();
            self.fileManager.clearImages();
            self._resetCanvas();
            if (self.overwriteInitial) {
                self.initialPreview = [];
                self.initialPreviewConfig = [];
                self.initialPreviewThumbTags = [];
                self.previewCache.data = {
                    content: [],
                    config: [],
                    tags: []
                };
            }
        },
        _resetCanvas: function () {
            var self = this;
            if (self.imageCanvas && self.imageCanvasContext) {
                self.imageCanvasContext.clearRect(0, 0, self.imageCanvas.width, self.imageCanvas.height);
            }
        },
        _hasInitialPreview: function () {
            var self = this;
            return !self.overwriteInitial && self.previewCache.count(true);
        },
        _resetPreview: function () {
            var self = this, out, cap, $div, hasSuc = self.showUploadedThumbs, hasErr = !self.removeFromPreviewOnError,
                includeProcessed = (hasSuc || hasErr) && self.isDuplicateError;
            if (self.previewCache.count(true)) {
                out = self.previewCache.out();
                if (includeProcessed) {
                    $div = $h.createElement('').insertAfter(self.$container);
                    self.getFrames().each(function () {
                        var $thumb = $(this);
                        if ((hasSuc && $thumb.hasClass('file-preview-success')) ||
                            (hasErr && $thumb.hasClass('file-preview-error'))) {
                            $div.append($thumb);
                        }
                    });
                }
                self._setPreviewContent(out.content);
                self._setInitThumbAttr();
                cap = self.initialCaption ? self.initialCaption : out.caption;
                self._setCaption(cap);
                if (includeProcessed) {
                    $div.contents().appendTo(self.$preview);
                    $div.remove();
                }
            } else {
                self._clearPreview();
                self._initCaption();
            }
            if (self.showPreview) {
                self._initZoom();
                self._initSortable();
            }
            self.isDuplicateError = false;
        },
        _clearDefaultPreview: function () {
            var self = this;
            self.$preview.find('.file-default-preview').remove();
        },
        _validateDefaultPreview: function () {
            var self = this;
            if (!self.showPreview || $h.isEmpty(self.defaultPreviewContent)) {
                return;
            }
            self._setPreviewContent('<div class="file-default-preview">' + self.defaultPreviewContent + '</div>');
            self.$container.removeClass('file-input-new');
            self._initClickable();
        },
        _resetPreviewThumbs: function (isAjax) {
            var self = this, out;
            if (isAjax) {
                self._clearPreview();
                self.clearFileStack();
                return;
            }
            if (self._hasInitialPreview()) {
                out = self.previewCache.out();
                self._setPreviewContent(out.content);
                self._setInitThumbAttr();
                self._setCaption(out.caption);
                self._initPreviewActions();
            } else {
                self._clearPreview();
            }
        },
        _getLayoutTemplate: function (t) {
            var self = this, template = self.layoutTemplates[t];
            if ($h.isEmpty(self.customLayoutTags)) {
                return template;
            }
            return $h.replaceTags(template, self.customLayoutTags);
        },
        _getPreviewTemplate: function (t) {
            var self = this, templates = self.previewTemplates, template = templates[t] || templates.other;
            if ($h.isEmpty(self.customPreviewTags)) {
                return template;
            }
            return $h.replaceTags(template, self.customPreviewTags);
        },
        _getOutData: function (formdata, jqXHR, responseData, filesData) {
            var self = this;
            jqXHR = jqXHR || {};
            responseData = responseData || {};
            filesData = filesData || self.fileManager.list();
            return {
                formdata: formdata,
                files: filesData,
                filenames: self.filenames,
                filescount: self.getFilesCount(),
                extra: self._getExtraData(),
                response: responseData,
                reader: self.reader,
                jqXHR: jqXHR
            };
        },
        _getMsgSelected: function (n, processing) {
            var self = this, strFiles = n === 1 ? self.fileSingle : self.filePlural;
            return n > 0 ? self.msgSelected.replace('{n}', n).replace('{files}', strFiles) :
                (processing ? self.msgProcessing : self.msgNoFilesSelected);
        },
        _getFrame: function (id, skipWarning) {
            var self = this, $frame = $h.getFrameElement(self.$preview, id);
            if (self.showPreview && !skipWarning && !$frame.length) {
                self._log($h.logMessages.invalidThumb, {id: id});
            }
            return $frame;
        },
        _getZoom: function (id, selector) {
            var self = this, $frame = $h.getZoomElement(self.$preview, id, selector);
            if (self.showPreview && !$frame.length) {
                self._log($h.logMessages.invalidThumb, {id: id});
            }
            return $frame;
        },
        _getThumbs: function (css) {
            css = css || '';
            return this.getFrames(':not(.file-preview-initial)' + css);
        },
        _getThumbId: function (fileId) {
            var self = this;
            return self.previewInitId + '-' + fileId;
        },
        _getExtraData: function (fileId, index) {
            var self = this, data = self.uploadExtraData;
            if (typeof self.uploadExtraData === 'function') {
                data = self.uploadExtraData(fileId, index);
            }
            return data;
        },
        _initXhr: function (xhrobj, fileId) {
            var self = this, fm = self.fileManager, func = function (event) {
                var pct = 0, total = event.total, loaded = event.loaded || event.position,
                    stats = fm.getUploadStats(fileId, loaded, total);
                /** @namespace event.lengthComputable */
                if (event.lengthComputable && !self.enableResumableUpload) {
                    pct = $h.round(loaded / total * 100);
                }
                if (fileId) {
                    self._setFileUploadStats(fileId, pct, stats);
                } else {
                    self._setProgress(pct, null, null, self._getStats(stats));
                }
                self._raise('fileajaxprogress', [stats]);
            };
            if (xhrobj.upload) {
                if (self.progressDelay) {
                    func = $h.debounce(func, self.progressDelay);
                }
                xhrobj.upload.addEventListener('progress', func, false);
            }
            return xhrobj;
        },
        _initAjaxSettings: function () {
            var self = this;
            self._ajaxSettings = $.extend(true, {}, self.ajaxSettings);
            self._ajaxDeleteSettings = $.extend(true, {}, self.ajaxDeleteSettings);
        },
        _mergeAjaxCallback: function (funcName, srcFunc, type) {
            var self = this, settings = self._ajaxSettings, flag = self.mergeAjaxCallbacks, targFunc;
            if (type === 'delete') {
                settings = self._ajaxDeleteSettings;
                flag = self.mergeAjaxDeleteCallbacks;
            }
            targFunc = settings[funcName];
            if (flag && typeof targFunc === 'function') {
                if (flag === 'before') {
                    settings[funcName] = function () {
                        targFunc.apply(this, arguments);
                        srcFunc.apply(this, arguments);
                    };
                } else {
                    settings[funcName] = function () {
                        srcFunc.apply(this, arguments);
                        targFunc.apply(this, arguments);
                    };
                }
            } else {
                settings[funcName] = srcFunc;
            }
        },
        _ajaxSubmit: function (fnBefore, fnSuccess, fnComplete, fnError, formdata, fileId, index, vUrl) {
            var self = this, settings, defaults, data, tm = self.taskManager;
            if (!self._raise('filepreajax', [formdata, fileId, index])) {
                return;
            }
            formdata.append('initialPreview', JSON.stringify(self.initialPreview));
            formdata.append('initialPreviewConfig', JSON.stringify(self.initialPreviewConfig));
            formdata.append('initialPreviewThumbTags', JSON.stringify(self.initialPreviewThumbTags));
            self._initAjaxSettings();
            self._mergeAjaxCallback('beforeSend', fnBefore);
            self._mergeAjaxCallback('success', fnSuccess);
            self._mergeAjaxCallback('complete', fnComplete);
            self._mergeAjaxCallback('error', fnError);
            vUrl = vUrl || self.uploadUrlThumb || self.uploadUrl;
            if (typeof vUrl === 'function') {
                vUrl = vUrl();
            }
            data = self._getExtraData(fileId, index) || {};
            if (typeof data === 'object') {
                $.each(data, function (key, value) {
                    formdata.append(key, value);
                });
            }
            defaults = {
                xhr: function () {
                    var xhrobj = $.ajaxSettings.xhr();
                    return self._initXhr(xhrobj, fileId);
                },
                url: self._encodeURI(vUrl),
                type: 'POST',
                dataType: 'json',
                data: formdata,
                cache: false,
                processData: false,
                contentType: false
            };
            settings = $.extend(true, {}, defaults, self._ajaxSettings);
            self.ajaxQueue.push(settings);
            tm.addTask(fileId + '-' + index, function () {
                var self = this.self, config, xhr;
                config = self.ajaxQueue.shift();
                xhr = $.ajax(config);
                self.ajaxRequests.push(xhr);
            }).runWithContext({self: self});
        },
        _mergeArray: function (prop, content) {
            var self = this, arr1 = $h.cleanArray(self[prop]), arr2 = $h.cleanArray(content);
            self[prop] = arr1.concat(arr2);
        },
        _initUploadSuccess: function (out, $thumb, allFiles) {
            var self = this, append, data, index, $div, content, config, tags, id, i;
            if (!self.showPreview || typeof out !== 'object' || $.isEmptyObject(out)) {
                self._resetCaption();
                return;
            }
            if (out.initialPreview !== undefined && out.initialPreview.length > 0) {
                self.hasInitData = true;
                content = out.initialPreview || [];
                config = out.initialPreviewConfig || [];
                tags = out.initialPreviewThumbTags || [];
                append = out.append === undefined || out.append;
                if (content.length > 0 && !$h.isArray(content)) {
                    content = content.split(self.initialPreviewDelimiter);
                }
                if (content.length) {
                    self._mergeArray('initialPreview', content);
                    self._mergeArray('initialPreviewConfig', config);
                    self._mergeArray('initialPreviewThumbTags', tags);
                }
                if ($thumb !== undefined) {
                    if (!allFiles) {
                        index = self.previewCache.add(content[0], config[0], tags[0], append);
                        data = self.previewCache.get(index, false);
                        $div = $h.createElement(data).hide().appendTo($thumb);
                        $thumb.fadeOut('slow', function () {
                            var $newThumb = $div.find('> .file-preview-frame');
                            if ($newThumb && $newThumb.length) {
                                $newThumb.insertBefore($thumb).fadeIn('slow').css('display:inline-block');
                            }
                            self._initPreviewActions();
                            self._clearFileInput();
                            $thumb.remove();
                            $div.remove();
                            self._initSortable();
                        });
                    } else {
                        id = $thumb.attr('id');
                        i = self._getUploadCacheIndex(id);
                        if (i !== null) {
                            self.uploadCache[i] = {
                                id: id,
                                content: content[0],
                                config: config[0] || [],
                                tags: tags[0] || [],
                                append: append
                            };
                        }
                    }
                } else {
                    self.previewCache.set(content, config, tags, append);
                    self._initPreview();
                    self._initPreviewActions();
                }
            }
            self._resetCaption();
        },
        _getUploadCacheIndex: function (id) {
            var self = this, i, len = self.uploadCache.length, config;
            for (i = 0; i < len; i++) {
                config = self.uploadCache[i];
                if (config.id === id) {
                    return i;
                }
            }
            return null;
        },
        _initSuccessThumbs: function () {
            var self = this;
            if (!self.showPreview) {
                return;
            }
            setTimeout(function () {
                self._getThumbs($h.FRAMES + '.file-preview-success').each(function () {
                    var $thumb = $(this), $remove = $thumb.find('.kv-file-remove');
                    $remove.removeAttr('disabled');
                    self._handler($remove, 'click', function () {
                        var id = $thumb.attr('id'),
                            out = self._raise('filesuccessremove', [id, $thumb.attr('data-fileindex')]);
                        $h.cleanMemory($thumb);
                        if (out === false) {
                            return;
                        }
                        self.$caption.attr('title', '');
                        $thumb.fadeOut('slow', function () {
                            var fm = self.fileManager;
                            $thumb.remove();
                            if (!self.getFrames().length) {
                                self.reset();
                            }
                        });
                    });
                });
            }, self.processDelay);
        },
        _updateInitialPreview: function () {
            var self = this, u = self.uploadCache;
            if (self.showPreview) {
                $.each(u, function (key, setting) {
                    self.previewCache.add(setting.content, setting.config, setting.tags, setting.append);
                });
                if (self.hasInitData) {
                    self._initPreview();
                    self._initPreviewActions();
                }
            }
        },
        _getThumbFileId: function ($thumb) {
            var self = this;
            if (self.showPreview && $thumb !== undefined) {
                return $thumb.attr('data-fileid');
            }
            return null;
        },
        _getThumbFile: function ($thumb) {
            var self = this, id = self._getThumbFileId($thumb);
            return id ? self.fileManager.getFile(id) : null;
        },
        _uploadSingle: function (i, id, isBatch, deferrer) {
            var self = this, fm = self.fileManager, count = fm.count(), formdata = new FormData(), outData,
                previewId = self._getThumbId(id), $thumb, chkComplete, $btnUpload, $btnDelete,
                hasPostData = count > 0 || !$.isEmptyObject(self.uploadExtraData), uploadFailed, $prog, fnBefore,
                errMsg, fnSuccess, fnComplete, fnError, updateUploadLog, op = self.ajaxOperations.uploadThumb,
                fileObj = fm.getFile(id), params = {id: previewId, index: i, fileId: id},
                fileName = self.fileManager.getFileName(id, true), resolve = function () {
                    if (deferrer && deferrer.resolve) {
                        deferrer.resolve();
                    }
                }, reject = function () {
                    if (deferrer && deferrer.reject) {
                        deferrer.reject();
                    }
                };
            if (self.enableResumableUpload) { // not enabled for resumable uploads
                return;
            }
            self.uploadInitiated = true;
            if (self.showPreview) {
                $thumb = fm.getThumb(id);
                $prog = $thumb.find('.file-thumb-progress');
                $btnUpload = $thumb.find('.kv-file-upload');
                $btnDelete = $thumb.find('.kv-file-remove');
                $prog.show();
            }
            if (count === 0 || !hasPostData || (self.showPreview && $btnUpload && $btnUpload.hasClass('disabled')) ||
                self._abort(params)) {
                return;
            }
            updateUploadLog = function () {
                if (!uploadFailed) {
                    fm.removeFile(id);
                } else {
                    fm.errors.push(id);
                }
                fm.setProcessed(id);
                if (fm.isProcessed()) {
                    self.fileBatchCompleted = true;
                    chkComplete();
                }
            };
            chkComplete = function () {
                var $initThumbs;
                if (!self.fileBatchCompleted) {
                    return;
                }
                setTimeout(function () {
                    var triggerReset = fm.count() === 0, errCount = fm.errors.length;
                    self._updateInitialPreview();
                    self.unlock(triggerReset);
                    if (triggerReset) {
                        self._clearFileInput();
                    }
                    $initThumbs = self.$preview.find('.file-preview-initial');
                    if (self.uploadAsync && $initThumbs.length) {
                        $h.addCss($initThumbs, $h.SORT_CSS);
                        self._initSortable();
                    }
                    self._raise('filebatchuploadcomplete', [fm.stack, self._getExtraData()]);
                    if (!self.retryErrorUploads || errCount === 0) {
                        fm.clear();
                    }
                    self._setProgress(101);
                    self.ajaxAborted = false;
                    self.uploadInitiated = false;
                }, self.processDelay);
            };
            fnBefore = function (jqXHR) {
                outData = self._getOutData(formdata, jqXHR);
                fm.initStats(id);
                self.fileBatchCompleted = false;
                if (!isBatch) {
                    self.ajaxAborted = false;
                }
                if (self.showPreview) {
                    if (!$thumb.hasClass('file-preview-success')) {
                        self._setThumbStatus($thumb, 'Loading');
                        $h.addCss($thumb, 'file-uploading');
                    }
                    $btnUpload.attr('disabled', true);
                    $btnDelete.attr('disabled', true);
                }
                if (!isBatch) {
                    self.lock();
                }
                if (fm.errors.indexOf(id) !== -1) {
                    delete fm.errors[id];
                }
                self._raise('filepreupload', [outData, previewId, i, self._getThumbFileId($thumb)]);
                $.extend(true, params, outData);
                if (self._abort(params)) {
                    jqXHR.abort();

                    if (!isBatch) {
                        self._setThumbStatus($thumb, 'New');
                        $thumb.removeClass('file-uploading');
                        $btnUpload.removeAttr('disabled');
                        $btnDelete.removeAttr('disabled');
                    }
                    self._setProgressCancelled();
                }
            };
            fnSuccess = function (data, textStatus, jqXHR) {
                var pid = self.showPreview && $thumb.attr('id') ? $thumb.attr('id') : previewId;
                outData = self._getOutData(formdata, jqXHR, data);
                $.extend(true, params, outData);
                setTimeout(function () {
                    if ($h.isEmpty(data) || $h.isEmpty(data.error)) {
                        if (self.showPreview) {
                            self._setThumbStatus($thumb, 'Success');
                            $btnUpload.hide();
                            self._initUploadSuccess(data, $thumb, isBatch);
                            self._setProgress(101, $prog);
                        }
                        self._raise('fileuploaded', [outData, pid, i, self._getThumbFileId($thumb)]);
                        if (!isBatch) {
                            self.fileManager.remove($thumb);
                        } else {
                            updateUploadLog();
                            resolve();
                        }
                    } else {
                        uploadFailed = true;
                        errMsg = self._parseError(op, jqXHR, self.msgUploadError, self.fileManager.getFileName(id));
                        self._showFileError(errMsg, params);
                        self._setPreviewError($thumb, true);
                        if (!self.retryErrorUploads) {
                            $btnUpload.hide();
                        }
                        if (isBatch) {
                            updateUploadLog();
                            resolve();
                        }
                        self._setProgress(101, self._getFrame(pid).find('.file-thumb-progress'),
                            self.msgUploadError);
                    }
                }, self.processDelay);
            };
            fnComplete = function () {
                if (self.showPreview) {
                    $btnUpload.removeAttr('disabled');
                    $btnDelete.removeAttr('disabled');
                    $thumb.removeClass('file-uploading');
                }
                if (!isBatch) {
                    self.unlock(false);
                    self._clearFileInput();
                } else {
                    chkComplete();
                }
                self._initSuccessThumbs();
            };
            fnError = function (jqXHR, textStatus, errorThrown) {
                errMsg = self._parseError(op, jqXHR, errorThrown, self.fileManager.getFileName(id));
                uploadFailed = true;
                setTimeout(function () {
                    var $prog;
                    if (isBatch) {
                        updateUploadLog();
                        reject();
                    }
                    self.fileManager.setProgress(id, 100);
                    self._setPreviewError($thumb, true);
                    if (!self.retryErrorUploads) {
                        $btnUpload.hide();
                    }
                    $.extend(true, params, self._getOutData(formdata, jqXHR));
                    self._setProgress(101, self.$progress, self.msgAjaxProgressError.replace('{operation}', op));
                    $prog = self.showPreview && $thumb ? $thumb.find('.file-thumb-progress') : '';
                    self._setProgress(101, $prog, self.msgUploadError);
                    self._showFileError(errMsg, params);
                }, self.processDelay);
            };
            self._setFileData(formdata, fileObj.file, fileName, id);
            self._setUploadData(formdata, {fileId: id});
            self._ajaxSubmit(fnBefore, fnSuccess, fnComplete, fnError, formdata, id, i);
        },
        _setFileData: function (formdata, file, fileName, fileId) {
            var self = this, preProcess = self.preProcessUpload;
            if (preProcess && typeof preProcess === 'function') {
                formdata.append(self.uploadFileAttr, preProcess(fileId, file));
            } else {
                formdata.append(self.uploadFileAttr, file, fileName);
            }
        },
        _checkBatchPreupload: function (outData, jqXHR) {
            var self = this, out = self._raise('filebatchpreupload', [outData]);
            if (out) {
                return true;
            }
            self._abort(outData);
            if (jqXHR) {
                jqXHR.abort();
            }
            self._getThumbs().each(function () {
                var $thumb = $(this), $btnUpload = $thumb.find('.kv-file-upload'),
                    $btnDelete = $thumb.find('.kv-file-remove');
                if ($thumb.hasClass('file-preview-loading')) {
                    self._setThumbStatus($thumb, 'New');
                    $thumb.removeClass('file-uploading');
                }
                $btnUpload.removeAttr('disabled');
                $btnDelete.removeAttr('disabled');
            });
            self._setProgressCancelled();
            return false;
        },
        _uploadBatch: function () {
            var self = this, fm = self.fileManager, total = fm.total(), params = {}, fnBefore, fnSuccess, fnError,
                fnComplete, hasPostData = total > 0 || !$.isEmptyObject(self.uploadExtraData), errMsg,
                setAllUploaded, formdata = new FormData(), op = self.ajaxOperations.uploadBatch;
            if (total === 0 || !hasPostData || self._abort(params)) {
                return;
            }
            setAllUploaded = function () {
                self.fileManager.clear();
                self._clearFileInput();
            };
            fnBefore = function (jqXHR) {
                self.lock();
                fm.initStats();
                var outData = self._getOutData(formdata, jqXHR);
                self.ajaxAborted = false;
                if (self.showPreview) {
                    self._getThumbs().each(function () {
                        var $thumb = $(this), $btnUpload = $thumb.find('.kv-file-upload'),
                            $btnDelete = $thumb.find('.kv-file-remove');
                        if (!$thumb.hasClass('file-preview-success')) {
                            self._setThumbStatus($thumb, 'Loading');
                            $h.addCss($thumb, 'file-uploading');
                        }
                        $btnUpload.attr('disabled', true);
                        $btnDelete.attr('disabled', true);
                    });
                }
                self._checkBatchPreupload(outData, jqXHR);
            };
            fnSuccess = function (data, textStatus, jqXHR) {
                /** @namespace data.errorkeys */
                var outData = self._getOutData(formdata, jqXHR, data), key = 0,
                    $thumbs = self._getThumbs(':not(.file-preview-success)'),
                    keys = $h.isEmpty(data) || $h.isEmpty(data.errorkeys) ? [] : data.errorkeys;

                if ($h.isEmpty(data) || $h.isEmpty(data.error)) {
                    self._raise('filebatchuploadsuccess', [outData]);
                    setAllUploaded();
                    if (self.showPreview) {
                        $thumbs.each(function () {
                            var $thumb = $(this);
                            self._setThumbStatus($thumb, 'Success');
                            $thumb.removeClass('file-uploading');
                            $thumb.find('.kv-file-upload').hide().removeAttr('disabled');
                        });
                        self._initUploadSuccess(data);
                    } else {
                        self.reset();
                    }
                    self._setProgress(101);
                } else {
                    if (self.showPreview) {
                        $thumbs.each(function () {
                            var $thumb = $(this);
                            $thumb.removeClass('file-uploading');
                            $thumb.find('.kv-file-upload').removeAttr('disabled');
                            $thumb.find('.kv-file-remove').removeAttr('disabled');
                            if (keys.length === 0 || $.inArray(key, keys) !== -1) {
                                self._setPreviewError($thumb, true);
                                if (!self.retryErrorUploads) {
                                    $thumb.find('.kv-file-upload').hide();
                                    self.fileManager.remove($thumb);
                                }
                            } else {
                                $thumb.find('.kv-file-upload').hide();
                                self._setThumbStatus($thumb, 'Success');
                                self.fileManager.remove($thumb);
                            }
                            if (!$thumb.hasClass('file-preview-error') || self.retryErrorUploads) {
                                key++;
                            }
                        });
                        self._initUploadSuccess(data);
                    }
                    errMsg = self._parseError(op, jqXHR, self.msgUploadError);
                    self._showFileError(errMsg, outData, 'filebatchuploaderror');
                    self._setProgress(101, self.$progress, self.msgUploadError);
                }
            };
            fnComplete = function () {
                self.unlock();
                self._initSuccessThumbs();
                self._clearFileInput();
                self._raise('filebatchuploadcomplete', [self.fileManager.stack, self._getExtraData()]);
            };
            fnError = function (jqXHR, textStatus, errorThrown) {
                var outData = self._getOutData(formdata, jqXHR);
                errMsg = self._parseError(op, jqXHR, errorThrown);
                self._showFileError(errMsg, outData, 'filebatchuploaderror');
                self.uploadFileCount = total - 1;
                if (!self.showPreview) {
                    return;
                }
                self._getThumbs().each(function () {
                    var $thumb = $(this);
                    $thumb.removeClass('file-uploading');
                    if (self._getThumbFile($thumb)) {
                        self._setPreviewError($thumb);
                    }
                });
                self._getThumbs().removeClass('file-uploading');
                self._getThumbs(' .kv-file-upload').removeAttr('disabled');
                self._getThumbs(' .kv-file-delete').removeAttr('disabled');
                self._setProgress(101, self.$progress, self.msgAjaxProgressError.replace('{operation}', op));
            };
            var ctr = 0;
            $.each(self.fileManager.stack, function (key, data) {
                if (!$h.isEmpty(data.file)) {
                    self._setFileData(formdata, data.file, (data.nameFmt || ('untitled_' + ctr)), key);
                }
                ctr++;
            });
            self._ajaxSubmit(fnBefore, fnSuccess, fnComplete, fnError, formdata);
        },
        _uploadExtraOnly: function () {
            var self = this, params = {}, fnBefore, fnSuccess, fnComplete, fnError, formdata = new FormData(), errMsg,
                op = self.ajaxOperations.uploadExtra;
            fnBefore = function (jqXHR) {
                self.lock();
                var outData = self._getOutData(formdata, jqXHR);
                self._setProgress(50);
                params.data = outData;
                params.xhr = jqXHR;
                self._checkBatchPreupload(outData, jqXHR);
            };
            fnSuccess = function (data, textStatus, jqXHR) {
                var outData = self._getOutData(formdata, jqXHR, data);
                if ($h.isEmpty(data) || $h.isEmpty(data.error)) {
                    self._raise('filebatchuploadsuccess', [outData]);
                    self._clearFileInput();
                    self._initUploadSuccess(data);
                    self._setProgress(101);
                } else {
                    errMsg = self._parseError(op, jqXHR, self.msgUploadError);
                    self._showFileError(errMsg, outData, 'filebatchuploaderror');
                }
            };
            fnComplete = function () {
                self.unlock();
                self._clearFileInput();
                self._raise('filebatchuploadcomplete', [self.fileManager.stack, self._getExtraData()]);
            };
            fnError = function (jqXHR, textStatus, errorThrown) {
                var outData = self._getOutData(formdata, jqXHR);
                errMsg = self._parseError(op, jqXHR, errorThrown);
                params.data = outData;
                self._showFileError(errMsg, outData, 'filebatchuploaderror');
                self._setProgress(101, self.$progress, self.msgAjaxProgressError.replace('{operation}', op));
            };
            self._ajaxSubmit(fnBefore, fnSuccess, fnComplete, fnError, formdata);
        },
        _deleteFileIndex: function ($frame) {
            var self = this, ind = $frame.attr('data-fileindex'), rev = self.reversePreviewOrder;
            if (ind.substring(0, 5) === $h.INIT_FLAG) {
                ind = parseInt(ind.replace($h.INIT_FLAG, ''));
                self.initialPreview = $h.spliceArray(self.initialPreview, ind, rev);
                self.initialPreviewConfig = $h.spliceArray(self.initialPreviewConfig, ind, rev);
                self.initialPreviewThumbTags = $h.spliceArray(self.initialPreviewThumbTags, ind, rev);
                self.getFrames().each(function () {
                    var $nFrame = $(this), nInd = $nFrame.attr('data-fileindex');
                    if (nInd.substring(0, 5) === $h.INIT_FLAG) {
                        nInd = parseInt(nInd.replace($h.INIT_FLAG, ''));
                        if (nInd > ind) {
                            nInd--;
                            $nFrame.attr('data-fileindex', $h.INIT_FLAG + nInd);
                        }
                    }
                });
            }
        },
        _resetCaption: function () {
            var self = this;
            setTimeout(function () {
                var cap = '', n, chk = self.previewCache.count(true), len = self.fileManager.count(), file,
                    incomplete = ':not(.file-preview-success):not(.file-preview-error)', cfg,
                    hasThumb = self.showPreview && self.getFrames(incomplete).length;
                if (len === 0 && chk === 0 && !hasThumb) {
                    self.reset();
                } else {
                    n = chk + len;
                    if (n > 1) {
                        cap = self._getMsgSelected(n);
                    } else {
                        if (len === 0) {
                            cfg = self.initialPreviewConfig[0];
                            cap = '';
                            if (cfg) {
                                cap = cfg.caption || cfg.filename || '';
                            }
                            if (!cap) {
                                cap = self._getMsgSelected(n);
                            }
                        } else {
                            file = self.fileManager.getFirstFile();
                            cap = file ? file.nameFmt : '_';
                        }
                    }
                    self._setCaption(cap);
                }
            }, self.processDelay);
        },
        _handleRotation: function ($el, $content, angle) {
            var self = this, css, newCss, addCss = '', scale = 1, elContent = $content[0], quadrant, transform, h, w,
                wNew, $parent = $content.parent(), hParent, wParent, $body = $('body'), bodyExists = !!$body.length;
            if (bodyExists) {
                $body.addClass('kv-overflow-hidden');
            }
            if (!$content.length || $el.hasClass('hide-rotate')) {
                if (bodyExists) {
                    $body.removeClass('kv-overflow-hidden');
                }
                return;
            }
            transform = $content.css('transform');
            if (transform) {
                $content.css('transform', 'none');
            }
            if (transform) {
                $content.css('transform', transform);
            }
            angle = angle || 0;
            quadrant = angle % 360;
            css = 'rotate(' + angle + 'deg)';
            newCss = 'rotate(' + quadrant + 'deg)';
            addCss = '';
            if (quadrant === 90 || quadrant === 270) {
                w = elContent.naturalWidth || $content.outerWidth() || 0;
                h = elContent.naturalHeight || $content.outerHeight() || 0;
                scale = w > h && w != 0 ? (h / w).toFixed(2) : 1;
                if ($parent.length) {
                    hParent = $parent.height();
                    wParent = $parent.width();
                    wNew = Math.min(w, wParent);
                    if (hParent > scale * wNew) {
                        scale = wNew > hParent && wNew != 0 ? (hParent / wNew).toFixed(2) : 1;
                    }
                }
                if (scale !== 1) {
                    addCss = ' scale(' + scale + ')';
                }
            }
            $content.addClass('rotate-animate').css('transform', css + addCss);
            setTimeout(function () {
                $content.removeClass('rotate-animate').css('transform', newCss + addCss);
                if (bodyExists) {
                    $body.removeClass('kv-overflow-hidden');
                }
                $el.data('angle', quadrant);
            }, self.fadeDelay);
        },
        _initRotateButton: function () {
            var self = this;
            self.getFrames('.rotatable .kv-file-rotate').each(function () {
                var $el = $(this), $frame = $el.closest($h.FRAMES),
                    $content = $frame.find('.kv-file-content > :first-child');
                self._handler($el, 'click', function () {
                    var angle = ($frame.data('angle') || 0) + 90;
                    self._handleRotation($frame, $content, angle);
                });
            });
        },
        _initRotateZoom: function ($frame, $content) {
            var self = this, $modal = self.$modal, $rotate = $modal.find('.btn-kv-rotate'),
                angle = $frame.data('angle');
            $modal.data('angle', angle);
            if ($rotate.length) {
                $rotate.off('click');
                if ($modal.hasClass('rotatable')) {
                    $rotate.on('click', function () {
                        angle = ($modal.data('angle') || 0) + 90;
                        $modal.data('angle', angle);
                        self._handleRotation($modal, $modal.find('.file-zoom-detail'), angle);
                        self._handleRotation($frame, $content, angle);
                        if ($frame.hasClass('hide-rotate')) {
                            $frame.data('angle', angle);
                        }
                    });
                }
            }
        },
        _initFileActions: function () {
            var self = this;
            if (!self.showPreview) {
                return;
            }
            self._initZoomButton();
            self._initRotateButton();
            self.getFrames(' .kv-file-remove').each(function () {
                var $el = $(this), $frame = $el.closest($h.FRAMES), hasError, id = $frame.attr('id'),
                    ind = $frame.attr('data-fileindex'), status, fm = self.fileManager;
                self._handler($el, 'click', function () {
                    status = self._raise('filepreremove', [id, ind]);
                    if (status === false || !self._validateMinCount()) {
                        return false;
                    }
                    hasError = $frame.hasClass('file-preview-error');
                    $h.cleanMemory($frame);
                    $frame.fadeOut('slow', function () {
                        self.fileManager.remove($frame);
                        self._clearObjects($frame);
                        $frame.remove();
                        if (id && hasError) {
                            self.$errorContainer.find('li[data-thumb-id="' + id + '"]').fadeOut('fast', function () {
                                $(this).remove();
                                if (!self._errorsExist()) {
                                    self._resetErrors();
                                }
                            });
                        }
                        self._clearFileInput();
                        self._resetCaption();
                        self._raise('fileremoved', [id, ind]);
                    });
                });
            });
            self.getFrames(' .kv-file-upload').each(function () {
                var $el = $(this);
                self._handler($el, 'click', function () {
                    var $frame = $el.closest($h.FRAMES), fileId = self._getThumbFileId($frame);
                    self._hideProgress();
                    if ($frame.hasClass('file-preview-error') && !self.retryErrorUploads) {
                        return;
                    }
                    self._uploadSingle(self.fileManager.getIndex(fileId), fileId, false);
                });
            });
        },
        _initPreviewActions: function () {
            var self = this, $preview = self.$preview, deleteExtraData = self.deleteExtraData || {},
                btnRemove = $h.FRAMES + ' .kv-file-remove', settings = self.fileActionSettings,
                origClass = settings.removeClass, errClass = settings.removeErrorClass,
                resetProgress = function () {
                    var hasFiles = self.isAjaxUpload ? self.previewCache.count(true) : self._inputFileCount();
                    if (!self.getFrames().length && !hasFiles) {
                        self._setCaption('');
                        self.reset();
                        self.initialCaption = '';
                    } else {
                        self._resetCaption();
                    }
                };
            self._initZoomButton();
            self._initRotateButton();
            $preview.find(btnRemove).each(function () {
                var $el = $(this), vUrl = $el.data('url') || self.deleteUrl, vKey = $el.data('key'), errMsg, fnBefore,
                    fnSuccess, fnError, op = self.ajaxOperations.deleteThumb;
                if ($h.isEmpty(vUrl) || vKey === undefined) {
                    return;
                }
                if (typeof vUrl === 'function') {
                    vUrl = vUrl();
                }
                var $frame = $el.closest($h.FRAMES), cache = self.previewCache.data, settings, params, config,
                    fileName, extraData, index = $frame.attr('data-fileindex');
                index = parseInt(index.replace($h.INIT_FLAG, ''));
                config = $h.isEmpty(cache.config) && $h.isEmpty(cache.config[index]) ? null : cache.config[index];
                extraData = $h.isEmpty(config) || $h.isEmpty(config.extra) ? deleteExtraData : config.extra;
                fileName = config && (config.filename || config.caption) || '';
                if (typeof extraData === 'function') {
                    extraData = extraData();
                }
                params = {id: $el.attr('id'), key: vKey, extra: extraData};
                fnBefore = function (jqXHR) {
                    self.ajaxAborted = false;
                    self._raise('filepredelete', [vKey, jqXHR, extraData]);
                    if (self._abort()) {
                        jqXHR.abort();
                    } else {
                        $el.removeClass(errClass);
                        $h.addCss($frame, 'file-uploading');
                        $h.addCss($el, 'disabled ' + origClass);
                    }
                };
                fnSuccess = function (data, textStatus, jqXHR) {
                    var n, cap;
                    if (!$h.isEmpty(data) && !$h.isEmpty(data.error)) {
                        params.jqXHR = jqXHR;
                        params.response = data;
                        errMsg = self._parseError(op, jqXHR, self.msgDeleteError, fileName);
                        self._showFileError(errMsg, params, 'filedeleteerror');
                        $frame.removeClass('file-uploading');
                        $el.removeClass('disabled ' + origClass).addClass(errClass);
                        resetProgress();
                        return;
                    }
                    $frame.removeClass('file-uploading').addClass('file-deleted');
                    $frame.fadeOut('slow', function () {
                        index = parseInt(($frame.attr('data-fileindex')).replace($h.INIT_FLAG, ''));
                        self.previewCache.unset(index);
                        self._deleteFileIndex($frame);
                        n = self.previewCache.count(true);
                        cap = n > 0 ? self._getMsgSelected(n) : '';
                        self._setCaption(cap);
                        self._raise('filedeleted', [vKey, jqXHR, extraData]);
                        self._clearObjects($frame);
                        $frame.remove();
                        resetProgress();
                    });
                };
                fnError = function (jqXHR, textStatus, errorThrown) {
                    var errMsg = self._parseError(op, jqXHR, errorThrown, fileName);
                    params.jqXHR = jqXHR;
                    params.response = {};
                    self._showFileError(errMsg, params, 'filedeleteerror');
                    $frame.removeClass('file-uploading');
                    $el.removeClass('disabled ' + origClass).addClass(errClass);
                    resetProgress();
                };
                self._initAjaxSettings();
                self._mergeAjaxCallback('beforeSend', fnBefore, 'delete');
                self._mergeAjaxCallback('success', fnSuccess, 'delete');
                self._mergeAjaxCallback('error', fnError, 'delete');
                settings = $.extend(true, {}, {
                    url: self._encodeURI(vUrl),
                    type: 'POST',
                    dataType: 'json',
                    data: $.extend(true, {}, {key: vKey}, extraData)
                }, self._ajaxDeleteSettings);
                self._handler($el, 'click', function () {
                    if (!self._validateMinCount()) {
                        return false;
                    }
                    self.ajaxAborted = false;
                    self._raise('filebeforedelete', [vKey, extraData]);
                    if (self.ajaxAborted instanceof Promise) {
                        self.ajaxAborted.then(function (result) {
                            if (!result) {
                                $.ajax(settings);
                            }
                        });
                    } else {
                        if (!self.ajaxAborted) {
                            $.ajax(settings);
                        }
                    }
                });
            });
        },
        _hideFileIcon: function () {
            var self = this;
            if (self.overwriteInitial) {
                self.$captionContainer.removeClass('icon-visible');
            }
        },
        _showFileIcon: function () {
            var self = this;
            $h.addCss(self.$captionContainer, 'icon-visible');
        },
        _getSize: function (bytes, skipTemplate, sizeUnits) {
            var self = this, size = parseFloat(bytes), i = 0, factor = self.bytesToKB, func = self.fileSizeGetter, out,
                sizeHuman = size, newSize;
            if (!$.isNumeric(bytes) || !$.isNumeric(size)) {
                return '';
            }
            if (typeof func === 'function') {
                out = func(size);
            } else {
                if (!sizeUnits) {
                    sizeUnits = self.sizeUnits;
                }
                if (size > 0) {
                    while (sizeHuman >= factor) {
                        sizeHuman /= factor;
                        ++i;
                    }
                    if (!sizeUnits[i]) {
                        sizeHuman = size;
                        i = 0;
                    }
                }
                newSize = sizeHuman.toFixed(2);
                if (newSize == sizeHuman) {
                    newSize = sizeHuman;
                }
                out = newSize + ' ' + sizeUnits[i];
            }
            return skipTemplate ? out : self._getLayoutTemplate('size').replace('{sizeText}', out);
        },
        _getFileType: function (ftype) {
            var self = this;
            return self.mimeTypeAliases[ftype] || ftype;
        },
        _generatePreviewTemplate: function (
            cat,
            data,
            fname,
            ftype,
            previewId,
            fileId,
            isError,
            size,
            fnameUpdated,
            frameClass,
            foot,
            ind,
            templ,
            attrs,
            zoomData
        ) {
            var self = this, caption = self.slug(fname), prevContent, zoomContent = '', styleAttribs = '',
                filename = fnameUpdated || fname, isIconic, ext = filename.split('.').pop().toLowerCase(),
                screenW = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
                config, title = caption, alt = caption, typeCss = 'type-default', getContent, addFrameCss,
                footer = foot || self._renderFileFooter(cat, caption, size, 'auto', isError), isRotatable,
                alwaysPreview = $.inArray(ext, self.alwaysPreviewFileExtensions) !== -1,
                forcePrevIcon = self.preferIconicPreview && !alwaysPreview,
                forceZoomIcon = self.preferIconicZoomPreview && !alwaysPreview, newCat = forcePrevIcon ? 'other' : cat;
            config = screenW < 400 ? (self.previewSettingsSmall[newCat] || self.defaults.previewSettingsSmall[newCat]) :
                (self.previewSettings[newCat] || self.defaults.previewSettings[newCat]);
            if (config) {
                $.each(config, function (key, val) {
                    styleAttribs += key + ':' + val + ';';
                });
            }
            getContent = function (vCat, vData, zoom, frameCss, vZoomData) {
                var id = zoom ? 'zoom-' + previewId : previewId, tmplt = self._getPreviewTemplate(vCat),
                    css = (frameClass || '') + ' ' + frameCss, tokens;
                if (self.frameClass) {
                    css = self.frameClass + ' ' + css;
                }
                if (zoom) {
                    css = css.replace(' ' + $h.SORT_CSS, '');
                }
                tmplt = self._parseFilePreviewIcon(tmplt, fname);
                if (cat === 'object' && !ftype) {
                    $.each(self.defaults.fileTypeSettings, function (key, func) {
                        if (key === 'object' || key === 'other') {
                            return;
                        }
                        if (func(fname, ftype)) {
                            typeCss = 'type-' + key;
                        }
                    });
                }
                if (!$h.isEmpty(attrs)) {
                    if (attrs.title !== undefined && attrs.title !== null) {
                        title = attrs.title;
                    }
                    if (attrs.alt !== undefined && attrs.alt !== null) {
                        alt = title = attrs.alt;
                    }
                }
                tokens = {
                    'previewId': id,
                    'caption': caption,
                    'title': title,
                    'alt': alt,
                    'frameClass': css,
                    'type': self._getFileType(ftype),
                    'fileindex': ind,
                    'fileid': fileId || '',
                    'filename': filename,
                    'typeCss': typeCss,
                    'footer': footer,
                    'data': zoom && vZoomData ? self.zoomPlaceholder + '{zoomData}' : vData,
                    'template': templ || cat,
                    'style': styleAttribs ? 'style="' + styleAttribs + '"' : '',
                    'zoomData': vZoomData ? encodeURIComponent(vZoomData) : ''
                };
                if (zoom) {
                    tokens.zoomCache = '';
                    tokens.zoomData = '{zoomData}';
                }
                return tmplt.setTokens(tokens);
            };
            ind = ind || previewId.slice(previewId.lastIndexOf('-') + 1);
            isRotatable = self.fileActionSettings.showRotate && $.inArray(ext, self.rotatableFileExtensions) !== -1;
            if (self.fileActionSettings.showZoom) {
                addFrameCss = 'kv-zoom-thumb';
                if (isRotatable) {
                    addFrameCss += ' rotatable' + (forceZoomIcon ? ' hide-rotate' : '');
                }
                zoomContent = getContent((forceZoomIcon ? 'other' : cat), data, true, addFrameCss, zoomData);
            }
            zoomContent = '\n' + self._getLayoutTemplate('zoomCache').replace('{zoomContent}', zoomContent);
            if (typeof self.sanitizeZoomCache === 'function') {
                zoomContent = self.sanitizeZoomCache(zoomContent);
            }
            addFrameCss = 'kv-preview-thumb';
            if (isRotatable) {
                isIconic = forcePrevIcon || self.hideThumbnailContent || !!self.previewFileIconSettings[ext];
                addFrameCss += ' rotatable' + (isIconic ? ' hide-rotate' : '');
            }
            prevContent = getContent((forcePrevIcon ? 'other' : cat), data, false, addFrameCss, zoomData);
            return prevContent.setTokens({zoomCache: zoomContent});
        },
        _addToPreview: function ($preview, content) {
            var self = this, $el;
            content = $h.cspBuffer.stash(content);
            $el = self.reversePreviewOrder ? $preview.prepend(content) : $preview.append(content);
            $h.cspBuffer.apply($preview);
            return $el;
        },
        _previewDefault: function (file, isDisabled) {
            var self = this, $preview = self.$preview;
            if (!self.showPreview) {
                return;
            }
            var fname = $h.getFileName(file), ftype = file ? file.type : '', content, size = file.size || 0,
                caption = self._getFileName(file, ''), isError = isDisabled === true && !self.isAjaxUpload,
                data = $h.createObjectURL(file), fileId = self.fileManager.getId(file),
                previewId = self._getThumbId(fileId);
            self._clearDefaultPreview();
            content = self._generatePreviewTemplate('other', data, fname, ftype, previewId, fileId, isError, size);
            self._addToPreview($preview, content);
            self._setThumbAttr(previewId, caption, size);
            if (isDisabled === true && self.isAjaxUpload) {
                self._setThumbStatus(self._getFrame(previewId), 'Error');
            }
        },
        _previewFile: function (i, file, theFile, data, fileInfo) {
            if (!this.showPreview) {
                return;
            }
            var self = this, fname = $h.getFileName(file), ftype = fileInfo.type, content,
                caption = fileInfo.name, cat = self._parseFileType(ftype, fname), $preview = self.$preview,
                fsize = file.size || 0, iData = cat === 'image' ? theFile.target.result : data, fm = self.fileManager,
                fileId = fm.getId(file), previewId = self._getThumbId(fileId);
            /** @namespace window.DOMPurify */
            content = self._generatePreviewTemplate(cat, iData, fname, ftype, previewId, fileId, false, fsize, fileInfo.filename);
            self._clearDefaultPreview();
            self._addToPreview($preview, content);
            var $thumb = self._getFrame(previewId);
            self._validateImageOrientation($thumb.find('img'), file, previewId, fileId, caption, ftype, fsize, iData);
            self._setThumbAttr(previewId, caption, fsize);
            self._initSortable();
        },
        _setThumbAttr: function (id, caption, size, description) {
            var self = this, $frame = self._getFrame(id);
            if ($frame.length) {
                size = size && size > 0 ? self._getSize(size) : '';
                $frame.data({'caption': caption, 'size': size, 'description': description || ''});
            }
        },
        _setInitThumbAttr: function () {
            var self = this, data = self.previewCache.data, len = self.previewCache.count(true), config,
                caption, size, description, previewId;
            if (len === 0) {
                return;
            }
            for (var i = 0; i < len; i++) {
                config = data.config[i];
                previewId = self.previewInitId + '-' + $h.INIT_FLAG + i;
                caption = $h.ifSet('caption', config, $h.ifSet('filename', config));
                size = $h.ifSet('size', config);
                description = $h.ifSet('description', config);
                self._setThumbAttr(previewId, caption, size, description);
            }
        },
        _slugDefault: function (text) {
            // noinspection RegExpRedundantEscape
            return $h.isEmpty(text, true) ? '' : String(text).replace(/[\[\]\/\{}:;#%=\(\)\*\+\?\\\^\$\|<>&"']/g, '_');
        },
        _updateFileDetails: function (numFiles) {
            var self = this, $el = self.$element, label, n, log, nFiles, file,
                name = ($h.isIE(9) && $h.findFileName($el.val())) || ($el[0].files[0] && $el[0].files[0].name);
            if (!name && self.fileManager.count() > 0) {
                file = self.fileManager.getFirstFile();
                label = file.nameFmt;
            } else {
                label = name ? self.slug(name) : '_';
            }
            n = self.isAjaxUpload ? self.fileManager.count() : numFiles;
            nFiles = self.previewCache.count(true) + n;
            log = n === 1 ? label : self._getMsgSelected(nFiles, !self.isAjaxUpload && !self.isError);
            if (self.isError) {
                self.$previewContainer.removeClass('file-thumb-loading');
                self._initCapStatus();
                self.$previewStatus.html('');
                self.$captionContainer.removeClass('icon-visible');
            } else {
                self._showFileIcon();
            }
            self._setCaption(log, self.isError);
            self.$container.removeClass('file-input-new file-input-ajax-new');
            self._raise('fileselect', [numFiles, label]);
            if (self.previewCache.count(true)) {
                self._initPreviewActions();
            }
        },
        _setThumbStatus: function ($thumb, status) {
            var self = this;
            if (!self.showPreview) {
                return;
            }
            var icon = 'indicator' + status, msg = icon + 'Title',
                css = 'file-preview-' + status.toLowerCase(),
                $indicator = $thumb.find('.file-upload-indicator'),
                config = self.fileActionSettings;
            $thumb.removeClass('file-preview-success file-preview-error file-preview-paused file-preview-loading');
            if (status === 'Success') {
                $thumb.find('.file-drag-handle').remove();
            }
            $h.setHtml($indicator, config[icon]);
            $indicator.attr('title', config[msg]);
            $thumb.addClass(css);
            if (status === 'Error' && !self.retryErrorUploads) {
                $thumb.find('.kv-file-upload').attr('disabled', true);
            }
        },
        _setProgressCancelled: function () {
            var self = this;
            self._setProgress(101, self.$progress, self.msgCancelled);
        },
        _setProgress: function (p, $el, error, stats) {
            var self = this;
            $el = $el || self.$progress;
            if (!$el.length) {
                return;
            }
            var pct = Math.min(p, 100), out, pctLimit = self.progressUploadThreshold,
                t = p <= 100 ? self.progressTemplate : self.progressCompleteTemplate,
                template = pct < 100 ? self.progressTemplate :
                    (error ? (self.paused ? self.progressPauseTemplate : self.progressErrorTemplate) : t);
            if (p >= 100) {
                stats = '';
            }
            if (!$h.isEmpty(template)) {
                if (pctLimit && pct > pctLimit && p <= 100) {
                    out = template.setTokens({'percent': pctLimit, 'status': self.msgUploadThreshold});
                } else {
                    out = template.setTokens({'percent': pct, 'status': (p > 100 ? self.msgUploadEnd : pct + '%')});
                }
                stats = stats || '';
                out = out.setTokens({stats: stats});
                $h.setHtml($el, out);
                if (error) {
                    $h.setHtml($el.find('[role="progressbar"]'), error);
                }
            }
        },
        _hasFiles: function () {
            var el = this.$element[0];
            return !!(el && el.files && el.files.length);
        },
        _setFileDropZoneTitle: function () {
            var self = this, $zone = self.$container.find('.file-drop-zone'), title = self.dropZoneTitle, strFiles;
            if (self.isClickable) {
                strFiles = $h.isEmpty(self.$element.attr('multiple')) ? self.fileSingle : self.filePlural;
                title += self.dropZoneClickTitle.replace('{files}', strFiles);
            }
            $zone.find('.' + self.dropZoneTitleClass).remove();
            if (!self.showPreview || $zone.length === 0 || self.fileManager.count() > 0 || !self.dropZoneEnabled ||
                self.previewCache.count() > 0 || (!self.isAjaxUpload && self._hasFiles())) {
                return;
            }
            if ($zone.find($h.FRAMES).length === 0 && $h.isEmpty(self.defaultPreviewContent)) {
                $zone.prepend('<div class="' + self.dropZoneTitleClass + '">' + title + '</div>');
            }
            self.$container.removeClass('file-input-new');
            $h.addCss(self.$container, 'file-input-ajax-new');
        },
        _getStats: function (stats) {
            var self = this, pendingTime, t;
            if (!self.showUploadStats || !stats || !stats.bitrate) {
                return '';
            }
            t = self._getLayoutTemplate('stats');
            pendingTime = (!stats.elapsed || !stats.bps) ? self.msgCalculatingTime :
                self.msgPendingTime.setTokens({time: $h.getElapsed(Math.ceil(stats.pendingBytes / stats.bps))});

            return t.setTokens({
                uploadSpeed: stats.bitrate,
                pendingTime: pendingTime
            });
        },
        _setResumableProgress: function (pct, stats, $thumb) {
            var self = this, rm = self.resumableManager, obj = $thumb ? rm : self,
                $prog = $thumb ? $thumb.find('.file-thumb-progress') : null;
            if (obj.lastProgress === 0) {
                obj.lastProgress = pct;
            }
            if (pct < obj.lastProgress) {
                pct = obj.lastProgress;
            }
            self._setProgress(pct, $prog, null, self._getStats(stats));
            obj.lastProgress = pct;
        },
        _toggleResumableProgress: function (template, message) {
            var self = this, $progress = self.$progress;
            if ($progress && $progress.length) {
                $h.setHtml($progress, template.setTokens({
                    percent: 101,
                    status: message,
                    stats: ''
                }));
            }
        },
        _setFileUploadStats: function (id, pct, stats) {
            var self = this, $prog = self.$progress;
            if (!self.showPreview && (!$prog || !$prog.length)) {
                return;
            }
            var fm = self.fileManager, rm = self.resumableManager, $thumb = fm.getThumb(id), pctTot,
                totUpSize = 0, totSize = fm.getTotalSize(), totStats = $.extend(true, {}, stats);
            if (self.enableResumableUpload) {
                var loaded = stats.loaded, currUplSize = rm.getUploadedSize(), currTotSize = rm.file.size, totLoaded;
                loaded += currUplSize;
                totLoaded = fm.uploadedSize + loaded;
                pct = $h.round(100 * loaded / currTotSize);
                stats.pendingBytes = currTotSize - currUplSize;
                self._setResumableProgress(pct, stats, $thumb);
                pctTot = Math.floor(100 * totLoaded / totSize);
                totStats.pendingBytes = totSize - totLoaded;
                self._setResumableProgress(pctTot, totStats);
            } else {
                fm.setProgress(id, pct);
                $prog = $thumb && $thumb.length ? $thumb.find('.file-thumb-progress') : null;
                self._setProgress(pct, $prog, null, self._getStats(stats));
                $.each(fm.stats, function (id, cfg) {
                    totUpSize += cfg.loaded;
                });
                totStats.pendingBytes = totSize - totUpSize;
                pctTot = $h.round(totUpSize / totSize * 100);
                self._setProgress(pctTot, null, null, self._getStats(totStats));
            }
        },
        _validateMinCount: function () {
            var self = this, len = self.isAjaxUpload ? self.fileManager.count() : self._inputFileCount();
            if (self.validateInitialCount && self.minFileCount > 0 && self._getFileCount(len - 1) < self.minFileCount) {
                self._noFilesError({});
                return false;
            }
            return true;
        },
        _getFileCount: function (fileCount, includeInitial) {
            var self = this, addCount = 0;
            if (includeInitial === undefined) {
                includeInitial = self.validateInitialCount && !self.overwriteInitial;
            }
            if (includeInitial) {
                addCount = self.previewCache.count(true);
                fileCount += addCount;
            }
            return fileCount;
        },
        _getFileId: function (file) {
            return $h.getFileId(file, this.generateFileId);
        },
        _getFileName: function (file, defaultValue) {
            var self = this, fileName = $h.getFileName(file);
            return fileName ? self.slug(fileName) : defaultValue;
        },
        _getFileNames: function (skipNull) {
            var self = this;
            return self.filenames.filter(function (n) {
                return (skipNull ? n !== undefined : n !== undefined && n !== null);
            });
        },
        _setPreviewError: function ($thumb, keepFile) {
            var self = this, removeFrame = self.removeFromPreviewOnError && !self.retryErrorUploads;
            if (!keepFile || removeFrame) {
                self.fileManager.remove($thumb);
            }
            if (!self.showPreview) {
                return;
            }
            if (removeFrame) {
                $thumb.remove();
                return;
            } else {
                self._setThumbStatus($thumb, 'Error');
            }
            self._refreshUploadButton($thumb);
        },
        _refreshUploadButton: function ($thumb) {
            var self = this, $btn = $thumb.find('.kv-file-upload'), cfg = self.fileActionSettings,
                icon = cfg.uploadIcon, title = cfg.uploadTitle;
            if (!$btn.length) {
                return;
            }
            if (self.retryErrorUploads) {
                icon = cfg.uploadRetryIcon;
                title = cfg.uploadRetryTitle;
            }
            $btn.attr('title', title);
            $h.setHtml($btn, icon);
        },
        _isValidSize: function (size, type, $image, $thumb, filename, params) {
            var self = this, msg, dim, $img, tag = size === 'Small' ? 'min' : 'max', limit = self[tag + 'Image' + type];
            if ($h.isEmpty(limit) || !$image.length) {
                return true;
            }
            $img = $image[0];
            dim = (type === 'Width') ? $img.naturalWidth || $img.width : $img.naturalHeight || $img.height;
            if (size === 'Small' ? dim >= limit : dim <= limit) {
                return true;
            }
            msg = self['msgImage' + type + size] || 'Image "{name}" has a size validation error (limit "{size}").';
            self._showFileError(msg.setTokens({'name': filename, 'size': limit, 'dimension': dim}), params);
            self._setPreviewError($thumb);
            self.fileManager.remove($thumb);
            self._clearFileInput();
            return false;
        },
        _getExifObj: function (data) {
            var self = this, exifObj, error = $h.logMessages.exifWarning;
            if (data.slice(0, 23) !== 'data:image/jpeg;base64,' && data.slice(0, 22) !== 'data:image/jpg;base64,') {
                exifObj = null;
                return;
            }
            try {
                exifObj = window.piexif ? window.piexif.load(data) : null;
            } catch (err) {
                exifObj = null;
                error = err && err.message || '';
            }
            if (!exifObj && self.showExifErrorLog) {
                self._log($h.logMessages.badExifParser, {details: error});
            }
            return exifObj;
        },
        setImageOrientation: function ($img, $zoomImg, value, $thumb) {
            var self = this, invalidImg = !$img || !$img.length, invalidZoomImg = !$zoomImg || !$zoomImg.length, $mark,
                isHidden = false, $div, zoomOnly = invalidImg && $thumb && $thumb.attr('data-template') === 'image', ev;
            if (invalidImg && invalidZoomImg) {
                return;
            }
            ev = 'load.fileinputimageorient';
            if (zoomOnly) {
                $img = $zoomImg;
                $zoomImg = null;
                $img.css(self.previewSettings.image);
                $div = $(document.createElement('div')).appendTo($thumb.find('.kv-file-content'));
                $mark = $(document.createElement('span')).insertBefore($img);
                $img.css('visibility', 'hidden').removeClass('file-zoom-detail').appendTo($div);
            } else {
                isHidden = !$img.is(':visible');
            }
            $img.off(ev).on(ev, function () {
                if (isHidden) {
                    self.$preview.removeClass('hide-content');
                    $thumb.find('.kv-file-content').css('visibility', 'hidden');
                }
                var img = $img[0], zoomImg = $zoomImg && $zoomImg.length ? $zoomImg[0] : null,
                    h = img.offsetHeight, w = img.offsetWidth, r = $h.getRotation(value);
                if (isHidden) {
                    $thumb.find('.kv-file-content').css('visibility', 'visible');
                    self.$preview.addClass('hide-content');
                }
                $img.data('orientation', value);
                if (zoomImg) {
                    $zoomImg.data('orientation', value);
                }
                if (value < 5) {
                    $h.setTransform(img, r);
                    $h.setTransform(zoomImg, r);
                    return;
                }
                var offsetAngle = Math.atan(w / h), origFactor = Math.sqrt(Math.pow(h, 2) + Math.pow(w, 2)),
                    scale = !origFactor ? 1 : (h / Math.cos(Math.PI / 2 + offsetAngle)) / origFactor,
                    s = ' scale(' + Math.abs(scale) + ')';
                $h.setTransform(img, r + s);
                $h.setTransform(zoomImg, r + s);
                if (zoomOnly) {
                    $img.css('visibility', 'visible').insertAfter($mark).addClass('file-zoom-detail');
                    $mark.remove();
                    $div.remove();
                }
            });
        },
        _validateImageOrientation: function ($img, file, previewId, fileId, caption, ftype, fsize, iData) {
            var self = this, exifObj = null, value, autoOrientImage = self.autoOrientImage, selector;
            exifObj = self._getExifObj(iData);
            if (self.canOrientImage) {
                $img.css('image-orientation', (autoOrientImage ? 'from-image' : 'none'));
                self._validateImage(previewId, fileId, caption, ftype, fsize, iData, exifObj);
                return;
            }
            selector = $h.getZoomSelector(previewId, ' img');
            value = exifObj ? exifObj['0th'][piexif.ImageIFD.Orientation] : null; // jshint ignore:line
            if (!value) {
                self._validateImage(previewId, fileId, caption, ftype, fsize, iData, exifObj);
                return;
            }
            self.setImageOrientation($img, $(selector), value, self._getFrame(previewId));
            self._raise('fileimageoriented', {'$img': $img, 'file': file});
            self._validateImage(previewId, fileId, caption, ftype, fsize, iData, exifObj);
        },
        _validateImage: function (previewId, fileId, fname, ftype, fsize, iData, exifObj) {
            var self = this, $preview = self.$preview, params, w1, w2, $thumb = self._getFrame(previewId),
                i = $thumb.attr('data-fileindex'), $img = $thumb.find('img');
            fname = fname || 'Untitled';
            $img.one('load', function () {
                if ($img.data('validated')) {
                    return;
                }
                $img.data('validated', true);
                w1 = $thumb.width();
                w2 = $preview.width();
                if (w1 > w2) {
                    $img.css('width', '100%');
                }
                params = {ind: i, id: previewId, fileId: fileId};
                setTimeout(function () {
                    var isValidWidth, isValidHeight;
                    isValidWidth = self._isValidSize('Small', 'Width', $img, $thumb, fname, params);
                    isValidHeight = self._isValidSize('Small', 'Height', $img, $thumb, fname, params);
                    if (!self.resizeImage) {
                        isValidWidth = isValidWidth && self._isValidSize('Large', 'Width', $img, $thumb, fname, params);
                        isValidHeight = isValidHeight && self._isValidSize('Large', 'Height', $img, $thumb, fname, params);
                    }
                    self._raise('fileimageloaded', [previewId]);
                    $thumb.data('exif', exifObj);
                    if (isValidWidth && isValidHeight) {
                        self.fileManager.addImage(fileId, {
                            ind: i,
                            img: $img,
                            thumb: $thumb,
                            pid: previewId,
                            typ: ftype,
                            siz: fsize,
                            validated: false,
                            imgData: iData,
                            exifObj: exifObj
                        });
                        self._validateAllImages();
                    }
                }, self.processDelay);
            }).one('error', function () {
                self._raise('fileimageloaderror', [previewId]);
            });
        },
        _validateAllImages: function () {
            var self = this, counter = {val: 0}, numImgs = self.fileManager.getImageCount(), fsize,
                minSize = self.resizeIfSizeMoreThan;
            if (numImgs !== self.fileManager.totalImages) {
                return;
            }
            self._raise('fileimagesloaded');
            if (!self.resizeImage) {
                return;
            }
            $.each(self.fileManager.loadedImages, function (id, config) {
                if (!config.validated) {
                    fsize = config.siz;
                    if (fsize && fsize > minSize * self.bytesToKB) {
                        self._getResizedImage(id, config, counter, numImgs);
                    }
                    config.validated = true;
                }
            });
        },
        _getResizedImage: function (id, config, counter, numImgs) {
            var self = this, img = $(config.img)[0], width = img.naturalWidth, height = img.naturalHeight, blob,
                ratio = 1, maxWidth = self.maxImageWidth || width, maxHeight = self.maxImageHeight || height,
                isValidImage = !!(width && height), chkWidth, chkHeight, canvas = self.imageCanvas, dataURI,
                context = self.imageCanvasContext, type = config.typ, pid = config.pid, ind = config.ind,
                $thumb = config.thumb, throwError, msg, exifObj = config.exifObj, exifStr, file, params, evParams;
            throwError = function (msg, params, ev) {
                if (self.isAjaxUpload) {
                    self._showFileError(msg, params, ev);
                } else {
                    self._showError(msg, params, ev);
                }
                self._setPreviewError($thumb);
            };
            file = self.fileManager.getFile(id);
            params = {id: pid, 'index': ind, fileId: id};
            evParams = [id, pid, ind];
            if (!file || !isValidImage || (width <= maxWidth && height <= maxHeight)) {
                if (isValidImage && file) {
                    self._raise('fileimageresized', evParams);
                }
                counter.val++;
                if (counter.val === numImgs) {
                    self._raise('fileimagesresized');
                }
                if (!isValidImage) {
                    throwError(self.msgImageResizeError, params, 'fileimageresizeerror');
                    return;
                }
            }
            type = type || self.resizeDefaultImageType;
            chkWidth = width > maxWidth;
            chkHeight = height > maxHeight;
            if (self.resizePreference === 'width') {
                ratio = chkWidth ? maxWidth / width : (chkHeight ? maxHeight / height : 1);
            } else {
                ratio = chkHeight ? maxHeight / height : (chkWidth ? maxWidth / width : 1);
            }
            self._resetCanvas();
            width *= ratio;
            height *= ratio;
            canvas.width = width;
            canvas.height = height;
            try {
                context.drawImage(img, 0, 0, width, height);
                dataURI = canvas.toDataURL(type, self.resizeQuality);
                if (exifObj) {
                    exifStr = window.piexif.dump(exifObj);
                    dataURI = window.piexif.insert(exifStr, dataURI);
                }
                blob = $h.dataURI2Blob(dataURI);
                self.fileManager.setFile(id, blob);
                self._raise('fileimageresized', evParams);
                counter.val++;
                if (counter.val === numImgs) {
                    self._raise('fileimagesresized', [undefined, undefined]);
                }
                if (!(blob instanceof Blob)) {
                    throwError(self.msgImageResizeError, params, 'fileimageresizeerror');
                }
            } catch (err) {
                counter.val++;
                if (counter.val === numImgs) {
                    self._raise('fileimagesresized', [undefined, undefined]);
                }
                msg = self.msgImageResizeException.replace('{errors}', err.message);
                throwError(msg, params, 'fileimageresizeexception');
            }
        },
        _showProgress: function () {
            var self = this;
            if (self.$progress && self.$progress.length) {
                self.$progress.show();
            }
        },
        _hideProgress: function () {
            var self = this;
            if (self.$progress && self.$progress.length) {
                self.$progress.hide();
            }
        },
        _initBrowse: function ($container) {
            var self = this, $el = self.$element;
            if (self.showBrowse) {
                self.$btnFile = $container.find('.btn-file').append($el);
            } else {
                $el.appendTo($container).attr('tabindex', -1);
                $h.addCss($el, 'file-no-browse');
            }
        },
        _initClickable: function () {
            var self = this, $zone, $tmpZone;
            if (!self.isClickable) {
                return;
            }
            $zone = self.$dropZone;
            if (!self.isAjaxUpload) {
                $tmpZone = self.$preview.find('.file-default-preview');
                if ($tmpZone.length) {
                    $zone = $tmpZone;
                }
            }

            $h.addCss($zone, 'clickable');
            $zone.attr('tabindex', -1);
            self._handler($zone, 'click', function (e) {
                var $tar = $(e.target);
                if (!self.$errorContainer.is(':visible') && (!$tar.parents(
                    '.file-preview-thumbnails').length || $tar.parents(
                    '.file-default-preview').length)) {
                    self.$element.data('zoneClicked', true).trigger('click');
                    $zone.blur();
                }
            });
        },
        _initCaption: function () {
            var self = this, cap = self.initialCaption || '';
            if (self.overwriteInitial || $h.isEmpty(cap)) {
                self.$caption.val('');
                return false;
            }
            self._setCaption(cap);
            return true;
        },
        _setCaption: function (content, isError) {
            var self = this, title, out, icon, n, cap, file;
            if (!self.$caption.length) {
                return;
            }
            self.$captionContainer.removeClass('icon-visible');
            if (isError) {
                title = $('<div>' + self.msgValidationError + '</div>').text();
                n = self.fileManager.count();
                if (n) {
                    file = self.fileManager.getFirstFile();
                    cap = n === 1 && file ? file.nameFmt : self._getMsgSelected(n);
                } else {
                    cap = self._getMsgSelected(self.msgNo);
                }
                out = $h.isEmpty(content) ? cap : content;
                icon = '<span class="' + self.msgValidationErrorClass + '">' + self.msgValidationErrorIcon + '</span>';
            } else {
                if ($h.isEmpty(content)) {
                    self.$caption.attr('title', '');
                    return;
                }
                title = $('<div>' + content + '</div>').text();
                out = title;
                icon = self._getLayoutTemplate('fileIcon');
            }
            self.$captionContainer.addClass('icon-visible');
            self.$caption.attr('title', title).val(out);
            $h.setHtml(self.$captionIcon, icon);
        },
        _createContainer: function () {
            var self = this, attribs = {'class': 'file-input file-input-new' + (self.rtl ? ' kv-rtl' : '')},
                $container = $h.createElement($h.cspBuffer.stash(self._renderMain()));
            $h.cspBuffer.apply($container);
            $container.insertBefore(self.$element).attr(attribs);
            self._initBrowse($container);
            if (self.theme) {
                $container.addClass('theme-' + self.theme);
            }
            return $container;
        },
        _refreshContainer: function () {
            var self = this, $container = self.$container, $el = self.$element;
            $el.insertAfter($container);
            $h.setHtml($container, self._renderMain());
            self._initBrowse($container);
            self._validateDisabled();
        },
        _validateDisabled: function () {
            var self = this;
            self.$caption.attr({readonly: self.isDisabled});
        },
        _setTabIndex: function (type, html) {
            var self = this, index = self.tabIndexConfig[type];
            return html.setTokens({
                tabIndexConfig: index === undefined || index === null ? '' : 'tabindex="' + index + '"'
            });
        },
        _renderMain: function () {
            var self = this,
                dropCss = self.dropZoneEnabled ? ' file-drop-zone' : 'file-drop-disabled',
                close = !self.showClose ? '' : self._getLayoutTemplate('close'),
                preview = !self.showPreview ? '' : self._getLayoutTemplate('preview')
                    .setTokens({'class': self.previewClass, 'dropClass': dropCss}),
                css = self.isDisabled ? self.captionClass + ' file-caption-disabled' : self.captionClass,
                caption = self.captionTemplate.setTokens({'class': css + ' kv-fileinput-caption'});
            caption = self._setTabIndex('caption', caption);
            return self.mainTemplate.setTokens({
                'class': self.mainClass + (!self.showBrowse && self.showCaption ? ' no-browse' : ''),
                'inputGroupClass': self.inputGroupClass,
                'preview': preview,
                'close': close,
                'caption': caption,
                'upload': self._renderButton('upload'),
                'remove': self._renderButton('remove'),
                'cancel': self._renderButton('cancel'),
                'pause': self._renderButton('pause'),
                'browse': self._renderButton('browse')
            });

        },
        _renderButton: function (type) {
            var self = this, tmplt = self._getLayoutTemplate('btnDefault'), css = self[type + 'Class'],
                title = self[type + 'Title'], icon = self[type + 'Icon'], label = self[type + 'Label'],
                status = self.isDisabled ? ' disabled' : '', btnType = 'button';
            switch (type) {
                case 'remove':
                    if (!self.showRemove) {
                        return '';
                    }
                    break;
                case 'cancel':
                    if (!self.showCancel) {
                        return '';
                    }
                    css += ' kv-hidden';
                    break;
                case 'pause':
                    if (!self.showPause) {
                        return '';
                    }
                    css += ' kv-hidden';
                    break;
                case 'upload':
                    if (!self.showUpload) {
                        return '';
                    }
                    if (self.isAjaxUpload && !self.isDisabled) {
                        tmplt = self._getLayoutTemplate('btnLink').replace('{href}', self.uploadUrl);
                    } else {
                        btnType = 'submit';
                    }
                    break;
                case 'browse':
                    if (!self.showBrowse) {
                        return '';
                    }
                    tmplt = self._getLayoutTemplate('btnBrowse');
                    break;
                default:
                    return '';
            }
            tmplt = self._setTabIndex(type, tmplt);

            css += type === 'browse' ? ' btn-file' : ' fileinput-' + type + ' fileinput-' + type + '-button';
            if (!$h.isEmpty(label)) {
                label = ' <span class="' + self.buttonLabelClass + '">' + label + '</span>';
            }
            return tmplt.setTokens({
                'type': btnType, 'css': css, 'title': title, 'status': status, 'icon': icon, 'label': label
            });
        },
        _renderThumbProgress: function () {
            var self = this;
            return '<div class="file-thumb-progress kv-hidden">' +
                self.progressInfoTemplate.setTokens({percent: 101, status: self.msgUploadBegin, stats: ''}) +
                '</div>';
        },
        _renderFileFooter: function (cat, caption, size, width, isError) {
            var self = this, config = self.fileActionSettings, rem = config.showRemove, drg = config.showDrag,
                upl = config.showUpload, rot = config.showRotate, zoom = config.showZoom, out, params,
                template = self._getLayoutTemplate('footer'), tInd = self._getLayoutTemplate('indicator'),
                ind = isError ? config.indicatorError : config.indicatorNew,
                title = isError ? config.indicatorErrorTitle : config.indicatorNewTitle,
                indicator = tInd.setTokens({'indicator': ind, 'indicatorTitle': title});
            size = self._getSize(size);
            params = {type: cat, caption: caption, size: size, width: width, progress: '', indicator: indicator};
            if (self.isAjaxUpload) {
                params.progress = self._renderThumbProgress();
                params.actions = self._renderFileActions(params, upl, false, rem, rot, zoom, drg, false, false, false);
            } else {
                params.actions = self._renderFileActions(params, false, false, false, false, zoom, drg, false, false, false);
            }
            out = template.setTokens(params);
            out = $h.replaceTags(out, self.previewThumbTags);
            return out;
        },
        _renderFileActions: function (
            cfg,
            showUpl,
            showDwn,
            showDel,
            showRot,
            showZoom,
            showDrag,
            disabled,
            url,
            key,
            isInit,
            dUrl,
            dFile
        ) {
            var self = this;
            if (!cfg.type && isInit) {
                cfg.type = 'image';
            }
            if (self.enableResumableUpload) {
                showUpl = false;
            } else {
                if (typeof showUpl === 'function') {
                    showUpl = showUpl(cfg);
                }
            }
            if (typeof showDwn === 'function') {
                showDwn = showDwn(cfg);
            }
            if (typeof showDel === 'function') {
                showDel = showDel(cfg);
            }
            if (typeof showZoom === 'function') {
                showZoom = showZoom(cfg);
            }
            if (typeof showDrag === 'function') {
                showDrag = showDrag(cfg);
            }
            if (typeof showRot === 'function') {
                showRot = showRot(cfg);
            }
            if (!showUpl && !showDwn && !showDel && !showRot && !showZoom && !showDrag) {
                return '';
            }
            var vUrl = url === false ? '' : ' data-url="' + url + '"', btnZoom = '', btnDrag = '', btnRotate = '', css,
                vKey = key === false ? '' : ' data-key="' + key + '"', btnDelete = '', btnUpload = '', btnDownload = '',
                template = self._getLayoutTemplate('actions'), config = self.fileActionSettings,
                otherButtons = self.otherActionButtons.setTokens({'dataKey': vKey, 'key': key}),
                removeClass = disabled ? config.removeClass + ' disabled' : config.removeClass;
            if (showDel) {
                btnDelete = self._getLayoutTemplate('actionDelete').setTokens({
                    'removeClass': removeClass,
                    'removeIcon': config.removeIcon,
                    'removeTitle': config.removeTitle,
                    'dataUrl': vUrl,
                    'dataKey': vKey,
                    'key': key
                });
            }
            if (showRot) {
                btnRotate = self._getLayoutTemplate('actionRotate').setTokens({
                    'rotateClass': config.rotateClass,
                    'rotateIcon': config.rotateIcon,
                    'rotateTitle': config.rotateTitle
                });
            }
            if (showUpl) {
                btnUpload = self._getLayoutTemplate('actionUpload').setTokens({
                    'uploadClass': config.uploadClass,
                    'uploadIcon': config.uploadIcon,
                    'uploadTitle': config.uploadTitle
                });
            }
            if (showDwn) {
                btnDownload = self._getLayoutTemplate('actionDownload').setTokens({
                    'downloadClass': config.downloadClass,
                    'downloadIcon': config.downloadIcon,
                    'downloadTitle': config.downloadTitle,
                    'downloadUrl': dUrl || self.initialPreviewDownloadUrl
                });
                btnDownload = btnDownload.setTokens({'filename': dFile, 'key': key});
            }
            if (showZoom) {
                btnZoom = self._getLayoutTemplate('actionZoom').setTokens({
                    'zoomClass': config.zoomClass,
                    'zoomIcon': config.zoomIcon,
                    'zoomTitle': config.zoomTitle
                });
            }
            if (showDrag && isInit) {
                css = 'drag-handle-init ' + config.dragClass;
                btnDrag = self._getLayoutTemplate('actionDrag').setTokens({
                    'dragClass': css,
                    'dragTitle': config.dragTitle,
                    'dragIcon': config.dragIcon
                });
            }
            return template.setTokens({
                'delete': btnDelete,
                'upload': btnUpload,
                'download': btnDownload,
                'rotate': btnRotate,
                'zoom': btnZoom,
                'drag': btnDrag,
                'other': otherButtons
            });
        },
        _browse: function (e) {
            var self = this;
            if (e && e.isDefaultPrevented() || !self._raise('filebrowse')) {
                return;
            }
            if (self.isError && !self.isAjaxUpload) {
                self.clear();
            }
            if (self.focusCaptionOnBrowse) {
                self.$captionContainer.focus();
            }
        },
        _change: function (e) {
            var self = this;
            $(document.body).off('focusin.fileinput focusout.fileinput');
            if (self.changeTriggered) {
                self._toggleLoading('hide');
                return;
            }
            self._toggleLoading('show');
            var $el = self.$element, isDragDrop = arguments.length > 1, isAjaxUpload = self.isAjaxUpload,
                tfiles, files = isDragDrop ? arguments[1] : $el[0].files, ctr = self.fileManager.count(),
                total, initCount, len, isSingleUpl = $h.isEmpty($el.attr('multiple')),
                maxCount = !isAjaxUpload && isSingleUpl ? 1 : self.maxFileCount, maxTotCount = self.maxTotalFileCount,
                inclAll = maxTotCount > 0 && maxTotCount > maxCount, flagSingle = (isSingleUpl && ctr > 0),
                throwError = function (mesg, file, previewId, index) {
                    var p1 = $.extend(true, {}, self._getOutData(null, {}, {}, files), {id: previewId, index: index}),
                        p2 = {id: previewId, index: index, file: file, files: files};
                    self.isPersistentError = true;
                    self._toggleLoading('hide');
                    return isAjaxUpload ? self._showFileError(mesg, p1) : self._showError(mesg, p2);
                },
                maxCountCheck = function (n, m, all) {
                    var msg = all ? self.msgTotalFilesTooMany : self.msgFilesTooMany;
                    msg = msg.replace('{m}', m).replace('{n}', n);
                    self.isError = throwError(msg, null, null, null);
                    self.$captionContainer.removeClass('icon-visible');
                    self._setCaption('', true);
                    self.$container.removeClass('file-input-new file-input-ajax-new');
                };
            self.reader = null;
            self._resetUpload();
            self._hideFileIcon();
            if (self.dropZoneEnabled) {
                self.$container.find('.file-drop-zone .' + self.dropZoneTitleClass).remove();
            }
            if (!isAjaxUpload) {
                if (e.target && e.target.files === undefined) {
                    files = e.target.value ? [{name: e.target.value.replace(/^.+\\/, '')}] : [];
                } else {
                    files = e.target.files || {};
                }
            }
            tfiles = files;
            if ($h.isEmpty(tfiles) || tfiles.length === 0) {
                if (!isAjaxUpload) {
                    self.clear();
                }
                self._raise('fileselectnone');
                return;
            }
            self._resetErrors();
            len = tfiles.length;
            initCount = isAjaxUpload ? (self.fileManager.count() + len) : len;
            total = self._getFileCount(initCount, inclAll ? false : undefined);
            if (maxCount > 0 && total > maxCount) {
                if (!self.autoReplace || len > maxCount) {
                    maxCountCheck((self.autoReplace && len > maxCount ? len : total), maxCount);
                    return;
                }
                if (total > maxCount) {
                    self._resetPreviewThumbs(isAjaxUpload);
                }

            } else {
                if (inclAll) {
                    total = self._getFileCount(initCount, true);
                    if (maxTotCount > 0 && total > maxTotCount) {
                        if (!self.autoReplace || len > maxCount) {
                            maxCountCheck((self.autoReplace && len > maxTotCount ? len : total), maxTotCount, true);
                            return;
                        }
                        if (total > maxCount) {
                            self._resetPreviewThumbs(isAjaxUpload);
                        }
                    }
                }
                if (!isAjaxUpload || flagSingle) {
                    self._resetPreviewThumbs(false);
                    if (flagSingle) {
                        self.clearFileStack();
                    }
                } else {
                    if (isAjaxUpload && ctr === 0 && (!self.previewCache.count(true) || self.overwriteInitial)) {
                        self._resetPreviewThumbs(true);
                    }
                }
            }
            if (self.autoReplace) {
                self._getThumbs().each(function () {
                    var $thumb = $(this);
                    if ($thumb.hasClass('file-preview-success') || $thumb.hasClass('file-preview-error')) {
                        $thumb.remove();
                    }
                });
            }
            self.readFiles(tfiles);
            self._toggleLoading('hide');
        },
        _abort: function (params) {
            var self = this, data;
            if (self.ajaxAborted && typeof self.ajaxAborted === 'object' && self.ajaxAborted.message !== undefined) {
                data = $.extend(true, {}, self._getOutData(null), params);
                data.abortData = self.ajaxAborted.data || {};
                data.abortMessage = self.ajaxAborted.message;
                self._setProgress(101, self.$progress, self.msgCancelled);
                self._showFileError(self.ajaxAborted.message, data, 'filecustomerror');
                self.cancel();
                self.unlock();
                return true;
            }
            return !!self.ajaxAborted;
        },
        _resetFileStack: function () {
            var self = this, i = 0;
            self._getThumbs().each(function () {
                var $thumb = $(this), ind = $thumb.attr('data-fileindex'), pid = $thumb.attr('id');
                if (ind === '-1' || ind === -1) {
                    return;
                }
                if (!self._getThumbFile($thumb)) {
                    $thumb.attr({'data-fileindex': i});
                    i++;
                } else {
                    $thumb.attr({'data-fileindex': '-1'});
                }
                self._getZoom(pid).attr({
                    'data-fileindex': $thumb.attr('data-fileindex')
                });
            });
        },
        _isFileSelectionValid: function (cnt) {
            var self = this;
            cnt = cnt || 0;
            if (self.required && !self.getFilesCount()) {
                self.$errorContainer.html('');
                self._showFileError(self.msgFileRequired);
                return false;
            }
            if (self.minFileCount > 0 && self._getFileCount(cnt) < self.minFileCount) {
                self._noFilesError({});
                return false;
            }
            return true;
        },
        _canPreview: function (file) {
            var self = this;
            if (!file || !self.showPreview || !self.$preview || !self.$preview.length) {
                return false;
            }
            var name = file.name || '', type = file.type || '', size = (file.size || 0) / self.bytesToKB,
                cat = self._parseFileType(type, name), allowedTypes, allowedMimes, allowedExts, skipPreview,
                types = self.allowedPreviewTypes, mimes = self.allowedPreviewMimeTypes,
                exts = self.allowedPreviewExtensions || [], dTypes = self.disabledPreviewTypes,
                dMimes = self.disabledPreviewMimeTypes, dExts = self.disabledPreviewExtensions || [],
                maxSize = self.maxFilePreviewSize && parseFloat(self.maxFilePreviewSize) || 0,
                expAllExt = new RegExp('\\.(' + exts.join('|') + ')$', 'i'),
                expDisExt = new RegExp('\\.(' + dExts.join('|') + ')$', 'i');
            allowedTypes = !types || types.indexOf(cat) !== -1;
            allowedMimes = !mimes || mimes.indexOf(type) !== -1;
            allowedExts = !exts.length || $h.compare(name, expAllExt);
            skipPreview = (dTypes && dTypes.indexOf(cat) !== -1) || (dMimes && dMimes.indexOf(type) !== -1) ||
                (dExts.length && $h.compare(name, expDisExt)) || (maxSize && !isNaN(maxSize) && size > maxSize);
            return !skipPreview && (allowedTypes || allowedMimes || allowedExts);
        },
        addToStack: function (file, id) {
            var self = this;
            self.stackIsUpdating = true;
            self.fileManager.add(file, id);
            self._refreshPreview();
            self.stackIsUpdating = false;
        },
        clearFileStack: function () {
            var self = this;
            self.fileManager.clear();
            self._initResumableUpload();
            if (self.enableResumableUpload) {
                if (self.showPause === null) {
                    self.showPause = true;
                }
                if (self.showCancel === null) {
                    self.showCancel = false;
                }
            } else {
                self.showPause = false;
                if (self.showCancel === null) {
                    self.showCancel = true;
                }
            }
            return self.$element;
        },
        getFileStack: function () {
            return this.fileManager.stack;
        },
        getFileList: function () {
            return this.fileManager.list();
        },
        getFilesSize: function () {
            return this.fileManager.getTotalSize();
        },
        getFilesCount: function (includeInitial) {
            var self = this, len = self.isAjaxUpload ? self.fileManager.count() : self._inputFileCount();
            if (includeInitial) {
                len += self.previewCache.count(true);
            }
            return self._getFileCount(len);
        },
        _initCapStatus: function (status) {
            var self = this, $cap = self.$caption;
            $cap.removeClass('is-valid file-processing');
            if (!status) {
                return;
            }
            if (status === 'processing') {
                $cap.addClass('file-processing');
            } else {
                $cap.addClass('is-valid');
            }
        },
        _toggleLoading: function (type) {
            var self = this;
            self.$previewStatus.html(type === 'hide' ? '' : self.msgProcessing);
            self.$container.removeClass('file-thumb-loading');
            self._initCapStatus(type === 'hide' ? '' : 'processing');
            if (type !== 'hide') {
                if (self.dropZoneEnabled) {
                    self.$container.find('.file-drop-zone .' + self.dropZoneTitleClass).remove();
                }
                self.$container.addClass('file-thumb-loading');
            }
        },
        _initFileSelected: function () {
            var self = this, $el = self.$element, $body = $(document.body), ev = 'focusin.fileinput focusout.fileinput';
            if ($body.length) {
                $body.off(ev).on('focusout.fileinput', function () {
                    self._toggleLoading('show');
                }).on('focusin.fileinput', function () {
                    setTimeout(function () {
                        if (!$el.val()) {
                            self._setFileDropZoneTitle();
                        }
                        $body.off(ev);
                        self._toggleLoading('hide');
                    }, 2500);
                });
            } else {
                self._toggleLoading('hide');
            }
        },
        readFiles: function (files) {
            this.reader = new FileReader();
            var self = this, reader = self.reader, $container = self.$previewContainer,
                $status = self.$previewStatus, msgLoading = self.msgLoading, msgProgress = self.msgProgress,
                previewInitId = self.previewInitId, numFiles = files.length, settings = self.fileTypeSettings,
                readFile, fileTypes = self.allowedFileTypes, typLen = fileTypes ? fileTypes.length : 0,
                fileExt = self.allowedFileExtensions, strExt = $h.isEmpty(fileExt) ? '' : fileExt.join(', '),
                throwError = function (msg, file, previewId, index, fileId) {
                    var $thumb, p1 = $.extend(true, {}, self._getOutData(null, {}, {}, files),
                            {id: previewId, index: index, fileId: fileId}),
                        p2 = {id: previewId, index: index, fileId: fileId, file: file, files: files};
                    self._previewDefault(file, true);
                    $thumb = self._getFrame(previewId, true);
                    self._toggleLoading('hide');
                    if (self.isAjaxUpload) {
                        setTimeout(function () {
                            readFile(index + 1);
                        }, self.processDelay);
                    } else {
                        self.unlock();
                        numFiles = 0;
                    }
                    if (self.removeFromPreviewOnError && $thumb.length) {
                        $thumb.remove();
                    } else {
                        self._initFileActions();
                        $thumb.find('.kv-file-upload').remove();
                    }
                    self.isPersistentError = true;
                    self.isError = self.isAjaxUpload ? self._showFileError(msg, p1) : self._showError(msg, p2);
                    self._updateFileDetails(numFiles);
                };
            self.fileManager.clearImages();
            $.each(files, function (key, file) {
                var func = self.fileTypeSettings.image;
                if (func && func(file.type)) {
                    self.fileManager.totalImages++;
                }
            });
            readFile = function (i) {
                var $error = self.$errorContainer, errors, fm = self.fileManager;
                if (i >= numFiles) {
                    self.unlock();
                    if (self.duplicateErrors.length) {
                        errors = '<li>' + self.duplicateErrors.join('</li><li>') + '</li>';
                        if ($error.find('ul').length === 0) {
                            $h.setHtml($error, self.errorCloseButton + '<ul>' + errors + '</ul>');
                        } else {
                            $error.find('ul').append(errors);
                        }
                        $error.fadeIn(self.fadeDelay);
                        self._handler($error.find('.kv-error-close'), 'click', function () {
                            $error.fadeOut(self.fadeDelay);
                        });
                        self.duplicateErrors = [];
                    }
                    if (self.isAjaxUpload) {
                        self._raise('filebatchselected', [fm.stack]);
                        if (fm.count() === 0 && !self.isError) {
                            self.reset();
                        }
                    } else {
                        self._raise('filebatchselected', [files]);
                    }
                    $container.removeClass('file-thumb-loading');
                    self._initCapStatus('valid');
                    $status.html('');
                    return;
                }
                self.lock(true);
                var file = files[i], id, previewId, fileProcessed,
                    fSize = (file && file.size || 0), sizeHuman = self._getSize(fSize, true), j, msg,
                    fnImage = settings.image, chk, typ, typ1, typ2, caption, fileSize = fSize / self.bytesToKB,
                    fileExtExpr = '', previewData, fileCount = 0, strTypes = '', fileId, canLoad,
                    fileReaderAborted = false, func, knownTypes = 0, isImage, processFileLoaded, initFileData;
                initFileData = function (dataSource) {
                    dataSource = dataSource || file;
                    id = fileId = self._getFileId(file);
                    previewId = previewInitId + '-' + id;
                    previewData = $h.createObjectURL(dataSource);
                    caption = self._getFileName(file, '');
                };
                processFileLoaded = function () {
                    var isImageResized = !!fm.loadedImages[id], msg = msgProgress.setTokens({
                        'index': i + 1,
                        'files': numFiles,
                        'percent': 50,
                        'name': caption
                    });
                    setTimeout(function () {
                        $status.html(msg);
                        self._updateFileDetails(numFiles);
                        if (self.getFilesCount(true) > 0 && self.getFrames(':visible')) {
                            self.$dropZone.find('.' + self.dropZoneTitleClass).remove();
                        }
                        readFile(i + 1);
                    }, self.processDelay);
                    if (self._raise('fileloaded', [file, previewId, id, i, reader]) && self.isAjaxUpload) {
                        if (!isImageResized) {
                            fm.add(file);
                        }
                    } else {
                        if (isImageResized) {
                            fm.removeFile(id);
                        }
                    }
                };
                if (!file) {
                    return;
                }
                initFileData();

                if (typLen > 0) {
                    for (j = 0; j < typLen; j++) {
                        typ1 = fileTypes[j];
                        typ2 = self.msgFileTypes[typ1] || typ1;
                        strTypes += j === 0 ? typ2 : ', ' + typ2;
                    }
                }
                if (caption === false) {
                    readFile(i + 1);
                    return;
                }
                if (caption.length === 0) {
                    msg = self.msgInvalidFileName.replace('{name}', $h.htmlEncode($h.getFileName(file), '[unknown]'));
                    throwError(msg, file, previewId, i, fileId);
                    return;
                }
                if (!$h.isEmpty(fileExt)) {
                    fileExtExpr = new RegExp('\\.(' + fileExt.join('|') + ')$', 'i');
                }
                if (self.isAjaxUpload && fm.exists(fileId) || self._getFrame(previewId, true).length) {
                    var p2 = {id: previewId, index: i, fileId: fileId, file: file, files: files};
                    msg = self.msgDuplicateFile.setTokens({name: caption, size: sizeHuman});
                    if (self.isAjaxUpload) {
                        if (!self.stackIsUpdating) {
                            self.duplicateErrors.push(msg);
                            self.isDuplicateError = true;
                            self._raise('fileduplicateerror', [file, fileId, caption, sizeHuman, previewId, i]);
                        }
                        readFile(i + 1);
                        self._updateFileDetails(numFiles);
                    } else {
                        self._showError(msg, p2);
                        self.unlock();
                        numFiles = 0;
                        self._clearFileInput();
                        self.reset();
                        self._updateFileDetails(numFiles);
                    }
                    return;
                }
                if (self.maxFileSize > 0 && fileSize > self.maxFileSize) {
                    msg = self.msgSizeTooLarge.setTokens({
                        'name': caption,
                        'size': sizeHuman,
                        'maxSize': self._getSize(self.maxFileSize * self.bytesToKB, true)
                    });
                    throwError(msg, file, previewId, i, fileId);
                    return;
                }
                if (self.minFileSize !== null && fileSize <= $h.getNum(self.minFileSize)) {
                    msg = self.msgSizeTooSmall.setTokens({
                        'name': caption,
                        'size': sizeHuman,
                        'minSize': self._getSize(self.minFileSize * self.bytesToKB, true)
                    });
                    throwError(msg, file, previewId, i, fileId);
                    return;
                }
                if (!$h.isEmpty(fileTypes) && $h.isArray(fileTypes)) {
                    for (j = 0; j < fileTypes.length; j += 1) {
                        typ = fileTypes[j];
                        func = settings[typ];
                        fileCount += !func || (typeof func !== 'function') ? 0 : (func(file.type,
                            $h.getFileName(file)) ? 1 : 0);
                    }
                    if (fileCount === 0) {
                        msg = self.msgInvalidFileType.setTokens({name: caption, types: strTypes});
                        throwError(msg, file, previewId, i, fileId);
                        return;
                    }
                }
                if (fileCount === 0 && !$h.isEmpty(fileExt) && $h.isArray(fileExt) && !$h.isEmpty(fileExtExpr)) {
                    chk = $h.compare(caption, fileExtExpr);
                    fileCount += $h.isEmpty(chk) ? 0 : chk.length;
                    if (fileCount === 0) {
                        msg = self.msgInvalidFileExtension.setTokens({name: caption, extensions: strExt});
                        throwError(msg, file, previewId, i, fileId);
                        return;
                    }
                }
                if (!self._canPreview(file)) {
                    canLoad = self._raise('filebeforeload', [file, i, reader]);
                    if (self.isAjaxUpload && canLoad) {
                        fm.add(file);
                    }
                    if (self.showPreview && canLoad) {
                        $container.addClass('file-thumb-loading');
                        self._initCapStatus('processing');
                        self._previewDefault(file);
                        self._initFileActions();
                    }
                    setTimeout(function () {
                        if (canLoad) {
                            self._updateFileDetails(numFiles);
                        }
                        readFile(i + 1);
                        self._raise('fileloaded', [file, previewId, id, i]);
                    }, 10);
                    return;
                }
                isImage = fnImage(file.type, caption);
                $status.html(msgLoading.replace('{index}', i + 1).replace('{files}', numFiles));
                $container.addClass('file-thumb-loading');
                self._initCapStatus('processing');
                reader.onerror = function (evt) {
                    self._errorHandler(evt, caption);
                };
                reader.onload = function (theFile) {
                    var hex, fileInfo, fileData, byte, bytes = [], contents, mime,
                        processPreview = function (fType, ext) {
                            if ($h.isEmpty(fType)) { // look for ascii text content
                                contents = $h.arrayBuffer2String(reader.result);
                                fType = $h.isSvg(contents) ? 'image/svg+xml' : $h.getMimeType(hex, contents, file.type);
                            }
                            fileInfo = {'name': caption, 'type': fType || ''};
                            if (ext && typeof File !== "undefined") {
                                try {
                                    var fName = fileInfo.filename = caption + '.' + ext;
                                    fileProcessed = new File([file], fName, {type: fileInfo.type});
                                    initFileData(fileProcessed);
                                } catch (err) {
                                }
                            }
                            isImage = fnImage(fType, '');
                            if (isImage) {
                                var newReader = new FileReader();
                                newReader.onerror = function (theFileNew) {
                                    self._errorHandler(theFileNew, caption);
                                };
                                newReader.onload = function (theFileNew) {
                                    if (self.isAjaxUpload && !self._raise('filebeforeload', [file, i, reader])) {
                                        fileReaderAborted = true;
                                        self._resetCaption();
                                        reader.abort();
                                        $status.html('');
                                        $container.removeClass('file-thumb-loading');
                                        self._initCapStatus('valid');
                                        self.enable();
                                        return;
                                    }
                                    self._previewFile(i, file, theFileNew, previewData, fileInfo);
                                    self._initFileActions();
                                    processFileLoaded();
                                };
                                newReader.readAsDataURL(file);
                                return;
                            }
                            if (self.isAjaxUpload && !self._raise('filebeforeload', [file, i, reader])) {
                                fileReaderAborted = true;
                                self._resetCaption();
                                reader.abort();
                                $status.html('');
                                $container.removeClass('file-thumb-loading');
                                self._initCapStatus('valid');
                                self.enable();
                                return;
                            }
                            self._previewFile(i, file, theFile, previewData, fileInfo);
                            self._initFileActions();
                            processFileLoaded();
                        };
                    mime = file.type;
                    fileInfo = {'name': caption, 'type': mime};
                    $.each(settings, function (k, f) {
                        if (k !== 'object' && k !== 'other' && typeof f === 'function' && f(mime, caption)) {
                            knownTypes++;
                        }
                    });
                    if (typeof FileTypeParser !== "undefined") {
                        fileData = new Uint8Array(theFile.target.result);
                        new FileTypeParser().parse(fileData).then(function (result) {
                            processPreview(result && result.mime || mime, result && result.ext || '');
                        });
                    } else {
                        if (knownTypes === 0) { // auto detect mime types from content if no known file types detected
                            fileData = new Uint8Array(theFile.target.result);
                            for (j = 0; j < fileData.length; j++) {
                                byte = fileData[j].toString(16);
                                bytes.push(byte);
                            }
                            hex = bytes.join('').toLowerCase().substring(0, 8);
                            mime = $h.getMimeType(hex, '', '');
                        }
                        processPreview(mime);
                    }
                };
                reader.onprogress = function (data) {
                    if (data.lengthComputable) {
                        var fact = (data.loaded / data.total) * 100, progress = Math.ceil(fact);
                        msg = msgProgress.setTokens({
                            'index': i + 1,
                            'files': numFiles,
                            'percent': progress,
                            'name': caption
                        });
                        setTimeout(function () {
                            if (!fileReaderAborted) {
                                $status.html(msg);
                            }
                        }, self.processDelay);
                    }
                };
                reader.readAsArrayBuffer(file);
            };

            readFile(0);
            self._updateFileDetails(numFiles);
        },
        lock: function (selectMode) {
            var self = this, $container = self.$container;
            self._resetErrors();
            self.disable();
            if (!selectMode && self.showCancel) {
                $container.find('.fileinput-cancel').show();
            }
            if (!selectMode && self.showPause) {
                $container.find('.fileinput-pause').show();
            }
            self._initCapStatus('processing');
            self._raise('filelock', [self.fileManager.stack, self._getExtraData()]);
            return self.$element;
        },
        unlock: function (reset) {
            var self = this, $container = self.$container;
            if (reset === undefined) {
                reset = true;
            }
            self.enable();
            $container.removeClass('is-locked');
            if (self.showCancel) {
                $container.find('.fileinput-cancel').hide();
            }
            if (self.showPause) {
                $container.find('.fileinput-pause').hide();
            }
            if (reset) {
                self._resetFileStack();
            }
            self._initCapStatus();
            self._raise('fileunlock', [self.fileManager.stack, self._getExtraData()]);
            return self.$element;
        },
        resume: function () {
            var self = this, fm = self.fileManager, flag = false, rm = self.resumableManager;
            fm.bpsLog = [];
            fm.bps = 0;
            if (!self.enableResumableUpload) {
                return self.$element;
            }
            if (self.paused) {
                self._toggleResumableProgress(self.progressPauseTemplate, self.msgUploadResume);
            } else {
                flag = true;
            }
            self.paused = false;
            if (flag) {
                self._toggleResumableProgress(self.progressInfoTemplate, self.msgUploadBegin);
            }
            setTimeout(function () {
                rm.upload();
            }, self.processDelay);
            return self.$element;
        },
        paste: function (e) {
            var self = this, ev = e.originalEvent, files = ev.clipboardData && ev.clipboardData.files || null;
            if (files) {
                self._dropFiles(e, files);
            }
            return self.$element;
        },
        pause: function () {
            var self = this, rm = self.resumableManager, xhr = self.ajaxRequests, len = xhr.length, i,
                pct = rm.getProgress(), actions = self.fileActionSettings, tm = self.taskManager,
                pool = tm.getPool(rm.id);
            if (!self.enableResumableUpload) {
                return self.$element;
            } else {
                if (pool) {
                    pool.cancel();
                }
            }
            self._raise('fileuploadpaused', [self.fileManager, rm]);
            if (len > 0) {
                for (i = 0; i < len; i += 1) {
                    self.paused = true;
                    xhr[i].abort();
                }
            }
            if (self.showPreview) {
                self._getThumbs().each(function () {
                    var $thumb = $(this), t = self._getLayoutTemplate('stats'), stats,
                        $indicator = $thumb.find('.file-upload-indicator');
                    $thumb.removeClass('file-uploading');
                    if ($indicator.attr('title') === actions.indicatorLoadingTitle) {
                        self._setThumbStatus($thumb, 'Paused');
                        stats = t.setTokens({pendingTime: self.msgPaused, uploadSpeed: ''});
                        self.paused = true;
                        self._setProgress(pct, $thumb.find('.file-thumb-progress'), pct + '%', stats);
                    }
                    if (!self._getThumbFile($thumb)) {
                        $thumb.find('.kv-file-remove').removeClass('disabled').removeAttr('disabled');
                    }
                });
            }
            self._setProgress(101, self.$progress, self.msgPaused);
            return self.$element;
        },
        cancel: function () {
            var self = this, xhr = self.ajaxRequests,
                rm = self.resumableManager, tm = self.taskManager,
                pool = rm ? tm.getPool(rm.id) : undefined, len = xhr.length, i;
            if (self.enableResumableUpload && pool) {
                pool.cancel().done(function () {
                    self._setProgressCancelled();
                });
                rm.reset();
                self._raise('fileuploadcancelled', [self.fileManager, rm]);
            } else {
                if (self.ajaxPool) {
                    self.ajaxPool.cancel();
                }
                self._raise('fileuploadcancelled', [self.fileManager]);
            }
            self._initAjax();
            if (len > 0) {
                for (i = 0; i < len; i += 1) {
                    self.cancelling = true;
                    xhr[i].abort();
                }
            }
            self._getThumbs().each(function () {
                var $thumb = $(this), $prog = $thumb.find('.file-thumb-progress');
                $thumb.removeClass('file-uploading');
                self._setProgress(0, $prog);
                $prog.hide();
                if (!self._getThumbFile($thumb)) {
                    $thumb.find('.kv-file-upload').removeClass('disabled').removeAttr('disabled');
                    $thumb.find('.kv-file-remove').removeClass('disabled').removeAttr('disabled');
                }
                self.unlock();
            });
            setTimeout(function () {
                self._setProgressCancelled();
            }, self.processDelay);
            return self.$element;
        },
        clear: function () {
            var self = this, cap;
            if (!self._raise('fileclear')) {
                return;
            }
            self.clearInput = true;
            self.$btnUpload.removeAttr('disabled');
            self._getThumbs().find('video,audio,img').each(function () {
                $h.cleanMemory($(this));
            });
            self._clearFileInput();
            self._resetUpload();
            self.clearFileStack();
            self.isDuplicateError = false;
            self.isPersistentError = false;
            self._resetErrors(true);
            if (self._hasInitialPreview()) {
                self._showFileIcon();
                self._resetPreview();
                self._initPreviewActions();
                self.$container.removeClass('file-input-new');
            } else {
                self._getThumbs().each(function () {
                    self._clearObjects($(this));
                });
                if (self.isAjaxUpload) {
                    self.previewCache.data = {};
                }
                self.$preview.html('');
                cap = (!self.overwriteInitial && self.initialCaption.length > 0) ? self.initialCaption : '';
                self.$caption.attr('title', '').val(cap);
                $h.addCss(self.$container, 'file-input-new');
                self._validateDefaultPreview();
            }
            if (self.$container.find($h.FRAMES).length === 0) {
                if (!self._initCaption()) {
                    self.$captionContainer.removeClass('icon-visible');
                }
            }
            self._hideFileIcon();
            if (self.focusCaptionOnClear) {
                self.$captionContainer.focus();
            }
            self._setFileDropZoneTitle();
            self._raise('filecleared');
            return self.$element;
        },
        reset: function () {
            var self = this;
            if (!self._raise('filereset')) {
                return;
            }
            self.lastProgress = 0;
            self._resetPreview();
            self.$container.find('.fileinput-filename').text('');
            $h.addCss(self.$container, 'file-input-new');
            if (self.getFrames().length) {
                self.$container.removeClass('file-input-new');
            }
            self.clearFileStack();
            self._setFileDropZoneTitle();
            return self.$element;
        },
        disable: function () {
            var self = this, $container = self.$container;
            self.isDisabled = true;
            self._raise('filedisabled');
            self.$element.attr('disabled', 'disabled');
            $container.addClass('is-locked');
            $h.addCss($container.find('.btn-file'), 'disabled');
            $container.find('.kv-fileinput-caption').addClass('file-caption-disabled');
            $container.find('.fileinput-remove, .fileinput-upload, .file-preview-frame button')
                .attr('disabled', true);
            self._initDragDrop();
            return self.$element;
        },
        enable: function () {
            var self = this, $container = self.$container;
            self.isDisabled = false;
            self._raise('fileenabled');
            self.$element.removeAttr('disabled');
            $container.removeClass('is-locked');
            $container.find('.kv-fileinput-caption').removeClass('file-caption-disabled');
            $container.find('.fileinput-remove, .fileinput-upload, .file-preview-frame button')
                .removeAttr('disabled');
            $container.find('.btn-file').removeClass('disabled');
            self._initDragDrop();
            return self.$element;
        },
        upload: function () {
            var self = this, fm = self.fileManager, totLen = fm.count(), i, outData, tm = self.taskManager,
                hasExtraData = !$.isEmptyObject(self._getExtraData());
            fm.bpsLog = [];
            fm.bps = 0;
            if (!self.isAjaxUpload || self.isDisabled || !self._isFileSelectionValid(totLen)) {
                return;
            }
            self.lastProgress = 0;
            self._resetUpload();
            if (totLen === 0 && !hasExtraData) {
                self._showFileError(self.msgUploadEmpty);
                return;
            }
            self.cancelling = false;
            self.uploadInitiated = true;
            self._showProgress();
            self.lock();
            if (totLen === 0 && hasExtraData) {
                self._setProgress(2);
                self._uploadExtraOnly();
                return;
            }
            if (self.enableResumableUpload) {
                return self.resume();
            }
            if (self.uploadAsync || self.enableResumableUpload) {
                outData = self._getOutData(null);
                if (!self._checkBatchPreupload(outData)) {
                    return;
                }
                self.fileBatchCompleted = false;
                self.uploadCache = [];
                $.each(self.getFileStack(), function (id) {
                    var previewId = self._getThumbId(id);
                    self.uploadCache.push({id: previewId, content: null, config: null, tags: null, append: true});
                });
                self.$preview.find('.file-preview-initial').removeClass($h.SORT_CSS);
                self._initSortable();
            }
            self._setProgress(2);
            self.hasInitData = false;
            if (self.uploadAsync) {
                i = 0;
                var pool = self.ajaxPool = tm.addPool($h.uniqId());
                $.each(self.getFileStack(), function (id) {
                    pool.addTask(id + i, function (deferrer) {
                        self._uploadSingle(i, id, true, deferrer);
                    });
                    i++;
                });

                pool.run(self.maxAjaxThreads).done(function () {
                    self._log('Async upload batch completed successfully.');
                    self._raise('filebatchuploadsuccess', [fm.stack, self._getExtraData()]);
                }).fail(function () {
                    self._log('Async upload batch completed with errors.');
                    self._raise('filebatchuploaderror', [fm.stack, self._getExtraData()]);
                });
                return;
            }
            self._uploadBatch();
            return self.$element;
        },
        destroy: function () {
            var self = this, $form = self.$form, $cont = self.$container, $el = self.$element, ns = self.namespace;
            $(document).off(ns);
            $(window).off(ns);
            if ($form && $form.length) {
                $form.off(ns);
            }
            if (self.isAjaxUpload) {
                self._clearFileInput();
            }
            self._cleanup();
            self._initPreviewCache();
            $el.insertBefore($cont).off(ns).removeData();
            $cont.off().remove();
            return $el;
        },
        refresh: function (options) {
            var self = this, $el = self.$element;
            if (typeof options !== 'object' || $h.isEmpty(options)) {
                options = self.options;
            } else {
                options = $.extend(true, {}, self.options, options);
            }
            self._init(options, true);
            self._listen();
            return $el;
        },
        zoom: function (frameId) {
            var self = this, $frame = self._getFrame(frameId);
            self._showModal($frame);
        },
        getExif: function (frameId) {
            var self = this, $frame = self._getFrame(frameId);
            return $frame && $frame.data('exif') || null;
        },
        getFrames: function (cssFilter) {
            var self = this, $frames;
            cssFilter = cssFilter || '';
            $frames = self.$preview.find($h.FRAMES + cssFilter);
            if (self.reversePreviewOrder) {
                $frames = $($frames.get().reverse());
            }
            return $frames;
        },
        getPreview: function () {
            var self = this;
            return {
                content: self.initialPreview,
                config: self.initialPreviewConfig,
                tags: self.initialPreviewThumbTags
            };
        }
    };

    $.fn.fileinput = function (option) {
        if (!$h.hasFileAPISupport() && !$h.isIE(9)) {
            return;
        }
        var args = Array.apply(null, arguments), retvals = [];
        args.shift();
        this.each(function () {
            var self = $(this), data = self.data('fileinput'), options = typeof option === 'object' && option,
                theme = options.theme || self.data('theme'), l = {}, t = {},
                lang = options.language || self.data('language') || $.fn.fileinput.defaults.language || 'en', opt;
            if (!data) {
                if (theme) {
                    t = $.fn.fileinputThemes[theme] || {};
                }
                if (lang !== 'en' && !$h.isEmpty($.fn.fileinputLocales[lang])) {
                    l = $.fn.fileinputLocales[lang] || {};
                }
                opt = $.extend(true, {}, $.fn.fileinput.defaults, t, $.fn.fileinputLocales.en, l, options, self.data());
                data = new FileInput(this, opt);
                self.data('fileinput', data);
            }

            if (typeof option === 'string') {
                retvals.push(data[option].apply(data, args));
            }
        });
        switch (retvals.length) {
            case 0:
                return this;
            case 1:
                return retvals[0];
            default:
                return retvals;
        }
    };

    var IFRAME_ATTRIBS = 'class="kv-preview-data file-preview-pdf" src="{renderer}?file={data}" {style}',
        defBtnCss1 = 'btn btn-sm btn-kv ' + $h.defaultButtonCss(), defBtnCss2 = 'btn ' + $h.defaultButtonCss();

    $.fn.fileinput.defaults = {
        language: 'en',
        bytesToKB: 1024,
        showCaption: true,
        showBrowse: true,
        showPreview: true,
        showRemove: true,
        showUpload: true,
        showUploadStats: true,
        showCancel: null,
        showPause: null,
        showClose: true,
        showUploadedThumbs: true,
        showConsoleLogs: false,
        browseOnZoneClick: false,
        autoReplace: false,
        showDescriptionClose: true,
        autoOrientImage: function () { // applicable for JPEG images only and non ios safari
            var ua = window.navigator.userAgent, webkit = !!ua.match(/WebKit/i),
                iOS = !!ua.match(/iP(od|ad|hone)/i), iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
            return !iOSSafari;
        },
        autoOrientImageInitial: true,
        showExifErrorLog: false,
        required: false,
        rtl: false,
        hideThumbnailContent: false,
        encodeUrl: true,
        focusCaptionOnBrowse: true,
        focusCaptionOnClear: true,
        generateFileId: null,
        previewClass: '',
        captionClass: '',
        frameClass: 'krajee-default',
        mainClass: '',
        inputGroupClass: '',
        mainTemplate: null,
        fileSizeGetter: null,
        initialCaption: '',
        initialPreview: [],
        initialPreviewDelimiter: '*$$*',
        initialPreviewAsData: false,
        initialPreviewFileType: 'image',
        initialPreviewConfig: [],
        initialPreviewThumbTags: [],
        previewThumbTags: {},
        initialPreviewShowDelete: true,
        initialPreviewDownloadUrl: '',
        removeFromPreviewOnError: false,
        deleteUrl: '',
        deleteExtraData: {},
        overwriteInitial: true,
        sanitizeZoomCache: function (content) {
            var $container = $h.createElement(content);
            $container.find('input,textarea,select,datalist,form,.file-thumbnail-footer').remove();
            return $container.html();
        },
        previewZoomButtonIcons: {
            prev: '<i class="bi-chevron-left"></i>',
            next: '<i class="bi-chevron-right"></i>',
            rotate: '<i class="bi-arrow-clockwise"></i>',
            toggleheader: '<i class="bi-arrows-expand"></i>',
            fullscreen: '<i class="bi-arrows-fullscreen"></i>',
            borderless: '<i class="bi-arrows-angle-expand"></i>',
            close: '<i class="bi-x-lg"></i>'
        },
        previewZoomButtonClasses: {
            prev: 'btn btn-default btn-outline-secondary btn-navigate',
            next: 'btn btn-default btn-outline-secondary btn-navigate',
            rotate: defBtnCss1,
            toggleheader: defBtnCss1,
            fullscreen: defBtnCss1,
            borderless: defBtnCss1,
            close: defBtnCss1
        },
        previewTemplates: {},
        previewContentTemplates: {},
        preferIconicPreview: false,
        preferIconicZoomPreview: false,
        alwaysPreviewFileExtensions: [],
        rotatableFileExtensions: ['jpg', 'jpeg', 'png', 'gif'],
        allowedFileTypes: null,
        allowedFileExtensions: null,
        allowedPreviewTypes: undefined,
        allowedPreviewMimeTypes: null,
        allowedPreviewExtensions: null,
        disabledPreviewTypes: undefined,
        disabledPreviewExtensions: ['msi', 'exe', 'com', 'zip', 'rar', 'app', 'vb', 'scr'],
        disabledPreviewMimeTypes: null,
        defaultPreviewContent: null,
        customLayoutTags: {},
        customPreviewTags: {},
        previewFileIcon: '<i class="bi-file-earmark-fill"></i>',
        previewFileIconClass: 'file-other-icon',
        previewFileIconSettings: {},
        previewFileExtSettings: {},
        buttonLabelClass: 'hidden-xs',
        browseIcon: '<i class="bi-folder2-open"></i> ',
        browseClass: 'btn btn-primary',
        removeIcon: '<i class="bi-trash"></i>',
        removeClass: defBtnCss2,
        cancelIcon: '<i class="bi-slash-circle"></i>',
        cancelClass: defBtnCss2,
        pauseIcon: '<i class="bi-pause-fill"></i>',
        pauseClass: defBtnCss2,
        uploadIcon: '<i class="bi-upload"></i>',
        uploadClass: defBtnCss2,
        uploadUrl: null,
        uploadUrlThumb: null,
        uploadAsync: true,
        uploadParamNames: {
            chunkCount: 'chunkCount',
            chunkIndex: 'chunkIndex',
            chunkSize: 'chunkSize',
            chunkSizeStart: 'chunkSizeStart',
            chunksUploaded: 'chunksUploaded',
            fileBlob: 'fileBlob',
            fileId: 'fileId',
            fileName: 'fileName',
            fileRelativePath: 'fileRelativePath',
            fileSize: 'fileSize',
            retryCount: 'retryCount'
        },
        maxAjaxThreads: 5,
        fadeDelay: 800,
        processDelay: 100,
        bitrateUpdateDelay: 500,
        queueDelay: 10, // must be lesser than process delay
        progressDelay: 0, // must be lesser than process delay
        enableResumableUpload: false,
        resumableUploadOptions: {
            fallback: null,
            testUrl: null, // used for checking status of chunks/ files previously / partially uploaded
            chunkSize: 2048, // in KB
            maxThreads: 4,
            maxRetries: 3,
            showErrorLog: true,
            retainErrorHistory: false, // when set to true, display complete error history always unless user explicitly resets upload
            skipErrorsAndProceed: false // when set to true, files with errors will be skipped and upload will continue with other files
        },
        uploadExtraData: {},
        zoomModalHeight: 485, // 5px more than the default preview content heights set for text, html, pdf etc.
        minImageWidth: null,
        minImageHeight: null,
        maxImageWidth: null,
        maxImageHeight: null,
        resizeImage: false,
        resizePreference: 'width',
        resizeQuality: 0.92,
        resizeDefaultImageType: 'image/jpeg',
        resizeIfSizeMoreThan: 0, // in KB
        minFileSize: -1,
        maxFileSize: 0,
        maxFilePreviewSize: 25600, // 25 MB
        minFileCount: 0,
        maxFileCount: 0,
        maxTotalFileCount: 0,
        validateInitialCount: false,
        msgValidationErrorClass: 'text-danger',
        msgValidationErrorIcon: '<i class="bi-exclamation-circle-fill"></i> ',
        msgErrorClass: 'file-error-message',
        progressThumbClass: 'progress-bar progress-bar-striped active progress-bar-animated',
        progressClass: 'progress-bar bg-success progress-bar-success progress-bar-striped active progress-bar-animated',
        progressInfoClass: 'progress-bar bg-info progress-bar-info progress-bar-striped active progress-bar-animated',
        progressCompleteClass: 'progress-bar bg-success progress-bar-success',
        progressPauseClass: 'progress-bar bg-primary progress-bar-primary progress-bar-striped active progress-bar-animated',
        progressErrorClass: 'progress-bar bg-danger progress-bar-danger',
        progressUploadThreshold: 99,
        previewFileType: 'image',
        elCaptionContainer: null,
        elCaptionText: null,
        elPreviewContainer: null,
        elPreviewImage: null,
        elPreviewStatus: null,
        elErrorContainer: null,
        errorCloseButton: undefined,
        slugCallback: null,
        dropZoneEnabled: true,
        dropZoneTitleClass: 'file-drop-zone-title',
        fileActionSettings: {},
        otherActionButtons: '',
        textEncoding: 'UTF-8',
        preProcessUpload: null,
        ajaxSettings: {},
        ajaxDeleteSettings: {},
        showAjaxErrorDetails: true,
        mergeAjaxCallbacks: false,
        mergeAjaxDeleteCallbacks: false,
        retryErrorUploads: true,
        reversePreviewOrder: false,
        usePdfRenderer: function () {
            var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
            return !!navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/i) || isIE11;
        },
        pdfRendererUrl: '',
        pdfRendererTemplate: '<iframe ' + IFRAME_ATTRIBS + '></iframe>',
        tabIndexConfig: {
            browse: 500,
            remove: 500,
            upload: 500,
            cancel: null,
            pause: null,
            modal: -1
        }
    };

    // noinspection HtmlUnknownAttribute
    $.fn.fileinputLocales.en = {
        sizeUnits: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        bitRateUnits: ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s', 'EB/s', 'ZB/s', 'YB/s'],
        fileSingle: 'file',
        filePlural: 'files',
        browseLabel: 'Browse &hellip;',
        removeLabel: 'Remove',
        removeTitle: 'Clear all unprocessed files',
        cancelLabel: 'Cancel',
        cancelTitle: 'Abort ongoing upload',
        pauseLabel: 'Pause',
        pauseTitle: 'Pause ongoing upload',
        uploadLabel: 'Upload',
        uploadTitle: 'Upload selected files',
        msgNo: 'No',
        msgNoFilesSelected: 'No files selected',
        msgCancelled: 'Cancelled',
        msgPaused: 'Paused',
        msgPlaceholder: 'Select {files} ...',
        msgZoomModalHeading: 'Detailed Preview',
        msgFileRequired: 'You must select a file to upload.',
        msgSizeTooSmall: 'File "{name}" (<b>{size}</b>) is too small and must be larger than <b>{minSize}</b>.',
        msgSizeTooLarge: 'File "{name}" (<b>{size}</b>) exceeds maximum allowed upload size of <b>{maxSize}</b>.',
        msgFilesTooLess: 'You must select at least <b>{n}</b> {files} to upload.',
        msgFilesTooMany: 'Number of files selected for upload <b>({n})</b> exceeds maximum allowed limit of <b>{m}</b>.',
        msgTotalFilesTooMany: 'You can upload a maximum of <b>{m}</b> files (<b>{n}</b> files detected).',
        msgFileNotFound: 'File "{name}" not found!',
        msgFileSecured: 'Security restrictions prevent reading the file "{name}".',
        msgFileNotReadable: 'File "{name}" is not readable.',
        msgFilePreviewAborted: 'File preview aborted for "{name}".',
        msgFilePreviewError: 'An error occurred while reading the file "{name}".',
        msgInvalidFileName: 'Invalid or unsupported characters in file name "{name}".',
        msgInvalidFileType: 'Invalid type for file "{name}". Only "{types}" files are supported.',
        msgInvalidFileExtension: 'Invalid extension for file "{name}". Only "{extensions}" files are supported.',
        msgFileTypes: {
            'image': 'image',
            'html': 'HTML',
            'text': 'text',
            'video': 'video',
            'audio': 'audio',
            'flash': 'flash',
            'pdf': 'PDF',
            'object': 'object'
        },
        msgUploadAborted: 'The file upload was aborted',
        msgUploadThreshold: 'Processing &hellip;',
        msgUploadBegin: 'Initializing &hellip;',
        msgUploadEnd: 'Done',
        msgUploadResume: 'Resuming upload &hellip;',
        msgUploadEmpty: 'No valid data available for upload.',
        msgUploadError: 'Upload Error',
        msgDeleteError: 'Delete Error',
        msgProgressError: 'Error',
        msgValidationError: 'Validation Error',
        msgLoading: 'Loading file {index} of {files} &hellip;',
        msgProgress: 'Loading file {index} of {files} - {name} - {percent}% completed.',
        msgSelected: '{n} {files} selected',
        msgProcessing: 'Processing ...',
        msgFoldersNotAllowed: 'Drag & drop files only! {n} folder(s) dropped were skipped.',
        msgImageWidthSmall: 'Width of image file "{name}" must be at least <b>{size} px</b> (detected <b>{dimension} px</b>).',
        msgImageHeightSmall: 'Height of image file "{name}" must be at least <b>{size} px</b> (detected <b>{dimension} px</b>).',
        msgImageWidthLarge: 'Width of image file "{name}" cannot exceed <b>{size} px</b> (detected <b>{dimension} px</b>).',
        msgImageHeightLarge: 'Height of image file "{name}" cannot exceed <b>{size} px</b> (detected <b>{dimension} px</b>).',
        msgImageResizeError: 'Could not get the image dimensions to resize.',
        msgImageResizeException: 'Error while resizing the image.<pre>{errors}</pre>',
        msgAjaxError: 'Something went wrong with the {operation} operation. Please try again later!',
        msgAjaxProgressError: '{operation} failed',
        msgDuplicateFile: 'File "{name}" of same size "{size}" has already been selected earlier. Skipping duplicate selection.',
        msgResumableUploadRetriesExceeded: 'Upload aborted beyond <b>{max}</b> retries for file <b>{file}</b>! Error Details: <pre>{error}</pre>',
        msgPendingTime: '{time} remaining',
        msgCalculatingTime: 'calculating time remaining',
        ajaxOperations: {
            deleteThumb: 'file delete',
            uploadThumb: 'file upload',
            uploadBatch: 'batch file upload',
            uploadExtra: 'form data upload'
        },
        dropZoneTitle: 'Drag & drop files here &hellip;',
        dropZoneClickTitle: '<br>(or click to select {files})',
        previewZoomButtonTitles: {
            prev: 'View previous file',
            next: 'View next file',
            rotate: 'Rotate 90 deg. clockwise',
            toggleheader: 'Toggle header',
            fullscreen: 'Toggle full screen',
            borderless: 'Toggle borderless mode',
            close: 'Close detailed preview'
        }
    };

    $.fn.fileinput.Constructor = FileInput;

    /**
     * Convert automatically file inputs with class 'file' into a bootstrap fileinput control.
     */
    $(document).ready(function () {
        var $input = $('input.file[type=file]');
        if ($input.length) {
            $input.fileinput();
        }
    });
}));
/*!
 * FileInput <_LANG_> Translations
 *
 * This file must be loaded after 'fileinput.js'. Patterns in braces '{}', or
 * any HTML markup tags in the messages must not be converted or translated.
 *
 * @see http://github.com/kartik-v/bootstrap-fileinput
 *
 * NOTE: this file must be saved in UTF-8 encoding.
 */
(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && typeof module.exports === 'object') {
        factory(require('jquery'));
    } else {
        factory(window.jQuery);
    }
}(function ($) {
    "use strict";

    $.fn.fileinputLocales['_LANG_'] = {
        sizeUnits: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'], 
        bitRateUnits: ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s', 'EB/s', 'ZB/s', 'YB/s'],
        fileSingle: 'file',
        filePlural: 'files',
        browseLabel: 'Browse &hellip;',
        removeLabel: 'Remove',
        removeTitle: 'Clear selected files',
        cancelLabel: 'Cancel',
        cancelTitle: 'Abort ongoing upload',
        pauseLabel: 'Pause',
        pauseTitle: 'Pause ongoing upload',
        uploadLabel: 'Upload',
        uploadTitle: 'Upload selected files',
        msgNo: 'No',
        msgNoFilesSelected: 'No files selected',
        msgPaused: 'Paused',
        msgCancelled: 'Cancelled',
        msgPlaceholder: 'Select {files} ...',
        msgZoomModalHeading: 'Detailed Preview',
        msgFileRequired: 'You must select a file to upload.',
        msgSizeTooSmall: 'File "{name}" (<b>{size}</b>) is too small and must be larger than <b>{minSize}</b>.',
        msgSizeTooLarge: 'File "{name}" (<b>{size}</b>) exceeds maximum allowed upload size of <b>{maxSize}</b>.',
        msgFilesTooLess: 'You must select at least <b>{n}</b> {files} to upload.',
        msgFilesTooMany: 'Number of files selected for upload <b>({n})</b> exceeds maximum allowed limit of <b>{m}</b>.',
        msgTotalFilesTooMany: 'You can upload a maximum of <b>{m}</b> files (<b>{n}</b> files detected).',
        msgFileNotFound: 'File "{name}" not found!',
        msgFileSecured: 'Security restrictions prevent reading the file "{name}".',
        msgFileNotReadable: 'File "{name}" is not readable.',
        msgFilePreviewAborted: 'File preview aborted for "{name}".',
        msgFilePreviewError: 'An error occurred while reading the file "{name}".',
        msgInvalidFileName: 'Invalid or unsupported characters in file name "{name}".',
        msgInvalidFileType: 'Invalid type for file "{name}". Only "{types}" files are supported.',
        msgInvalidFileExtension: 'Invalid extension for file "{name}". Only "{extensions}" files are supported.',
        msgFileTypes: {
            'image': 'image',
            'html': 'HTML',
            'text': 'text',
            'video': 'video',
            'audio': 'audio',
            'flash': 'flash',
            'pdf': 'PDF',
            'object': 'object'
        },
        msgUploadAborted: 'The file upload was aborted',
        msgUploadThreshold: 'Processing &hellip;',
        msgUploadBegin: 'Initializing &hellip;',
        msgUploadEnd: 'Done',
        msgUploadResume: 'Resuming upload &hellip;',
        msgUploadEmpty: 'No valid data available for upload.',
        msgUploadError: 'Upload Error',
        msgDeleteError: 'Delete Error',
        msgProgressError: 'Error',
        msgValidationError: 'Validation Error',
        msgLoading: 'Loading file {index} of {files} &hellip;',
        msgProgress: 'Loading file {index} of {files} - {name} - {percent}% completed.',
        msgSelected: '{n} {files} selected',
        msgProcessing: 'Processing ...',
        msgFoldersNotAllowed: 'Drag & drop files only! Skipped {n} dropped folder(s).',
        msgImageWidthSmall: 'Width of image file "{name}" must be at least <b>{size} px</b> (detected <b>{dimension} px</b>).',
        msgImageHeightSmall: 'Height of image file "{name}" must be at least <b>{size} px</b> (detected <b>{dimension} px</b>).',
        msgImageWidthLarge: 'Width of image file "{name}" cannot exceed <b>{size} px</b> (detected <b>{dimension} px</b>).',
        msgImageHeightLarge: 'Height of image file "{name}" cannot exceed <b>{size} px</b> (detected <b>{dimension} px</b>).',
        msgImageResizeError: 'Could not get the image dimensions to resize.',
        msgImageResizeException: 'Error while resizing the image.<pre>{errors}</pre>',
        msgAjaxError: 'Something went wrong with the {operation} operation. Please try again later!',
        msgAjaxProgressError: '{operation} failed',
        msgDuplicateFile: 'File "{name}" of same size "{size}" has already been selected earlier. Skipping duplicate selection.',
        msgResumableUploadRetriesExceeded:  'Upload aborted beyond <b>{max}</b> retries for file <b>{file}</b>! Error Details: <pre>{error}</pre>',
        msgPendingTime: '{time} remaining',
        msgCalculatingTime: 'calculating time remaining',
        ajaxOperations: {
            deleteThumb: 'file delete',
            uploadThumb: 'file upload',
            uploadBatch: 'batch file upload',
            uploadExtra: 'form data upload'
        },
        dropZoneTitle: 'Drag & drop files here &hellip;',
        dropZoneClickTitle: '<br>(or click to select {files})',
        fileActionSettings: {
            removeTitle: 'Remove file',
            uploadTitle: 'Upload file',
            uploadRetryTitle: 'Retry upload',
            downloadTitle: 'Download file',
            rotateTitle: 'Rotate 90 deg. clockwise',
            zoomTitle: 'View details',
            dragTitle: 'Move / Rearrange',
            indicatorNewTitle: 'Not uploaded yet',
            indicatorSuccessTitle: 'Uploaded',
            indicatorErrorTitle: 'Upload Error',
            indicatorPausedTitle: 'Upload Paused',
            indicatorLoadingTitle:  'Uploading &hellip;'
        },
        previewZoomButtonTitles: {
            prev: 'View previous file',
            next: 'View next file',
            rotate: 'Rotate 90 deg. clockwise',
            toggleheader: 'Toggle header',
            fullscreen: 'Toggle full screen',
            borderless: 'Toggle borderless mode',
            close: 'Close detailed preview'
        }
    };
}));