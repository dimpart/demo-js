'use strict';
// license: https://mit-license.org
//
//  DIMPLES: DIMP Library for Easy Startup
//
//                               Written in 2023 by Moky <albert.moky@gmail.com>
//
// =============================================================================
// The MIT License (MIT)
//
// Copyright (c) 2023 Albert Moky
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

//!require <dimsdk.js>

    app.utils.MemoryCache = Interface(null, null);
    var MemoryCache = app.utils.MemoryCache;

    MemoryCache.prototype = {

        get: function (key) {},

        put: function (key, value) {},

        reduceMemory: function () {}

    };


    app.utils.ThanosCache = function () {
        BaseObject.call(this);
        this.__caches = {};
    };
    var ThanosCache = app.utils.ThanosCache;

    Class(ThanosCache, BaseObject, [MemoryCache], null);

    // Override
    ThanosCache.prototype.get = function (key) {
        return this.__caches[key];
    };

    // Override
    ThanosCache.prototype.put = function (key, value) {
        if (value) {
            this.__caches[key] = value;
        } else {
            delete this.__caches[key];
        }
    };

    // Override
    ThanosCache.prototype.reduceMemory = function () {
        var finger = 0;
        finger = thanos(this.__caches, finger);
        return finger >> 1;
    };

    /**
     *  Thanos
     *  ~~~~~~
     *  Thanos can kill half lives of a world with a snap of the finger
     */
    var thanos = function (planet, finger) {
        var keys = Object.keys(planet);
        var k;
        // if ++finger is odd, remove it,
        // else, let it go
        for (var i = 0; i < keys.length; ++i) {
            k = keys[i];
            finger += 1;
            if ((finger & 1) === 1) {
                delete planet[k]
            }
        }
        return finger
    };
