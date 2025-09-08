'use strict';
// license: https://mit-license.org
// =============================================================================
// The MIT License (MIT)
//
// Copyright (c) 2025 Albert Moky
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

    app.compat.CompatibleCompressor = function () {
        MessageCompressor.call(this, new CompatibleShortener());
    };
    var CompatibleCompressor = app.compat.CompatibleCompressor;

    Class(CompatibleCompressor, MessageCompressor, null);

    Implementation(CompatibleCompressor, {

        // // Override
        // compressContent: function (content, key) {
        //     CompatibleOutgoing.fixContent(content);
        //     return MessageCompressor.prototype.compressContent.call(this, content, key);
        // },

        // Override
        extractContent: function (data, key) {
            var content = MessageCompressor.prototype.extractContent.call(this, data, key);
            if (content) {
                CompatibleIncoming.fixContent(content);
            }
            return content;
        }

    });

    app.compat.CompatibleShortener = function () {
        MessageShortener.call(this);
    };
    var CompatibleShortener = app.compat.CompatibleShortener;

    Class(CompatibleShortener, MessageShortener, null);

    Implementation(CompatibleShortener, {

        // Override
        moveKey: function (from, to, info) {
            var value = info[from];
            if (value) {
                if (info[to]) {
                    console.assert(false, 'keys conflicted: ', from, to, info);
                    return;
                }
                delete info[from];
                info[to] = value
            }
        },
        
        // Override
        compressContent: function (content) {
            // DON'T COMPRESS NOW
            return content;
        },

        // Override
        compressSymmetricKey: function (key) {
            // DON'T COMPRESS NOW
            return key;
        },

        // Override
        compressReliableMessage: function (msg) {
            // DON'T COMPRESS NOW
            return msg;
        }

    });
