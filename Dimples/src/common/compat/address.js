'use strict';
// license: https://mit-license.org
//
//  Ming-Ke-Ming : Decentralized User Identity Authentication
//
//                               Written in 2024 by Moky <albert.moky@gmail.com>
//
// =============================================================================
// The MIT License (MIT)
//
// Copyright (c) 2024 Albert Moky
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// =============================================================================
//

//! require <dimsdk.js>

    /**
     *  Unsupported Address
     *  ~~~~~~~~~~~~~~~~~~~
     */
    app.compat.UnknownAddress = function (string) {
        ConstantString.call(this, string);
    };
    var UnknownAddress = app.compat.UnknownAddress;

    Class(UnknownAddress, ConstantString, [Address], {
        // Override
        getType: function () {
            return 0;  // EntityType.USER;
        }
    });

    /**
     *  Compatible Address Factory
     *  ~~~~~~~~~~~~~~~~~~~~~~~~~~
     */
    app.compat.CompatibleAddressFactory = function () {
        BaseAddressFactory.call(this);
    };
    var CompatibleAddressFactory = app.compat.CompatibleAddressFactory;

    Class(CompatibleAddressFactory, BaseAddressFactory, null, null);

    /**
     *  Call it when received 'UIApplicationDidReceiveMemoryWarningNotification',
     *  this will remove 50% of cached objects
     *
     * @return {uint} number of survivors
     */
    CompatibleAddressFactory.prototype.reduceMemory = function () {
        var finger = 0;
        finger = thanos(this._addresses, finger);
        return finger >> 1;
    };

    // Override
    CompatibleAddressFactory.prototype.parse = function(address) {
        if (!address) {
            //throw new ReferenceError('address empty');
            return null;
        }
        var len = address.length;
        if (len === 8) {
            // "anywhere"
            if (address.toLowerCase() === 'anywhere') {
                return Address.ANYWHERE;
            }
        } else if (len === 10) {
            // "everywhere"
            if (address.toLowerCase() === 'everywhere') {
                return Address.EVERYWHERE;
            }
        }
        var res;
        if (26 <= len && len <= 35) {
            res = BTCAddress.parse(address);
        } else if (len === 42) {
            res = ETHAddress.parse(address);
        } else {
            //throw new TypeError('invalid address: ' + address);
            res = null;
        }
        // TODO: other types of address
        if (!res && 4 <= len && len <= 64) {
            res = new UnknownAddress(address);
        }
        return res;
    };
