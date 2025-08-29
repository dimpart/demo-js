'use strict';
// license: https://mit-license.org
//
//  DIM-SDK : Decentralized Instant Messaging Software Development Kit
//
//                               Written in 2020 by Moky <albert.moky@gmail.com>
//
// =============================================================================
// The MIT License (MIT)
//
// Copyright (c) 2020 Albert Moky
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

//! require <fsm.js>

    /**
     *  Frequency checker for duplicated queries
     */
    app.utils.FrequencyChecker = function (lifeSpan) {
        BaseObject.call(this);
        if (lifeSpan instanceof Duration) {} else {
            var seconds = Converter.getFloat(lifeSpan, 300);
            lifeSpan = Duration.ofSeconds(seconds);
        }
        this.__expires = lifeSpan;  // seconds
        this.__records = {};        // ID => Date
    };
    var FrequencyChecker = app.utils.FrequencyChecker;

    Class(FrequencyChecker, BaseObject, null, null);

    // private
    FrequencyChecker.prototype.checkExpired = function (key, now) {
        var expired = this.__records[key];
        if (expired && expired.getTime() > now.getTime()) {
            // record exists and not expired yet
            return false;
        }
        this.__records[key] = this.__expires.addTo(now);
        return true;
    };

    // private
    FrequencyChecker.prototype.forceExpired = function (key, now) {
        this.__records[key] = this.__expires.addTo(now);
        return true;
    };

    FrequencyChecker.prototype.isExpired = function (key, now, force) {
        now = Converter.getDateTime(now, null);
        if (!now) {
            now = new Date();
        }
        // if force == true:
        //     ignore last updated time, force to update now
        // else:
        //     check last update time
        if (force) {
            return this.forceExpired(key, now);
        } else {
            return this.checkExpired(key, now);
        }
    };


    /**
     *  Recent time checker for querying
     */
    app.utils.RecentTimeChecker = function () {
        this.__times = {};  // ID => Date
    };
    var RecentTimeChecker = app.utils.RecentTimeChecker

    Class(RecentTimeChecker, null, null, null);

    RecentTimeChecker.prototype.setLastTime = function (key, when) {
        if (!when) {
            return false;
        } else {
            when = Converter.getDateTime(when, null);
        }
        var last = this.__times[key];
        if (!last || last.getTime() < when.getTime()) {
            this.__times[key] = when;
            return true;
        } else {
            return false;
        }
    };

    RecentTimeChecker.prototype.isExpired = function (key, now) {
        if (!now) {
            return true;
        } else {
            now = Converter.getDateTime(now, null);
        }
        var last = this.__times[key];
        return last && last.getTime() > now.getTime();
    };
