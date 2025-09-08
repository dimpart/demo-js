'use strict';
// license: https://mit-license.org
//
//  LNC : Log, Notification & Cache
//
//                               Written in 2025 by Moky <albert.moky@gmail.com>
//
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

//! require 'requires.js'

    var parseDuration = function (duration, defaultValueInSeconds) {
        if (duration instanceof Duration) {
            return duration;
        }
        var seconds = Converter.getFloat(duration, defaultValueInSeconds);
        return Duration.ofSeconds(seconds);
    };

    var parseDateTime = function (time) {
        var date = Converter.getDateTime(time, null);
        return date || new Date();
    };

    /**
     *  Holder for cache value with times in seconds
     *
     * @param value
     * @param {fsm.type.Duration} lifeSpan
     * @param {Date} now
     * @constructor
     */
    sg.lnc.CacheHolder = function (value, lifeSpan, now) {
        lifeSpan = parseDuration(lifeSpan, 128);
        now = parseDateTime(now);
        this.__value = value;
        this.__lifeSpan = lifeSpan;             // life span (in seconds)
        var period = lifeSpan.multiplies(2);
        this.__expired = lifeSpan.addTo(now);   // time to expired
        this.__deprecated = period.addTo(now);  // time to deprecated
    };
    var CacheHolder = sg.lnc.CacheHolder;

    CacheHolder.prototype.getValue = function () {
        return this.__value;
    };

    /**
     *  Update cached value with current time in seconds
     *
     * @param value
     * @param {Date} now
     */
    CacheHolder.prototype.updateValue = function (value, now) {
        now = parseDateTime(now);
        this.__value = value;
        var lifeSpan = this.__lifeSpan;
        var period = lifeSpan.multiplies(2);
        this.__expired = lifeSpan.addTo(now);
        this.__deprecated = period.addTo(now);
    };

    /**
     *  Check whether cache is alive with current time in seconds
     *
     * @param {Date} now
     * @return {boolean}
     */
    CacheHolder.prototype.isAlive = function (now) {
        now = parseDateTime(now);
        return now.getTime() < this.__expired.getTime();
    };

    /**
     *  Check whether cache is deprecated with current time in seconds
     *
     * @param {Date} now
     * @return {boolean}
     */
    CacheHolder.prototype.isDeprecated = function (now) {
        now = parseDateTime(now);
        return now.getTime() > this.__deprecated.getTime();
    };

    /**
     *  Renewal cache with a temporary life span and current time in seconds
     *
     * @param {fsm.type.Duration} duration
     * @param {Date} now
     */
    CacheHolder.prototype.renewal = function (duration, now) {
        duration = parseDuration(duration, 128);
        now = parseDateTime(now);
        var lifeSpan = this.__lifeSpan;
        var period = lifeSpan.multiplies(2);
        this.__expired = duration.addTo(now);
        this.__deprecated = period.addTo(now);
    };


    sg.lnc.CachePair = function (value, holder) {
        this.value = value;
        this.holder = holder;
    };
    var CachePair = sg.lnc.CachePair;


    /**
     *  Pool for cache holders with keys
     *  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */
    sg.lnc.CachePool = function () {
        this.__holders = {};  // key => CacheHolder
    };
    var CachePool = sg.lnc.CachePool

    CachePool.prototype.getKeys = function () {
        return Object.keys(this.__holders);
    };

    /**
     *  Update cache holder for key
     *
     * @param key
     * @param {CacheHolder} holder
     * @return {CacheHolder}
     */
    CachePool.prototype.updateHolder = function (key, holder) {
        this.__holders[key] = holder;
        return holder;
    };

    /**
     *  Update cache value for key with timestamp in seconds
     *
     * @param key
     * @param value
     * @param {fsm.type.Duration} lifeSpan
     * @param {Date} now
     * @return {CacheHolder}
     */
    CachePool.prototype.updateValue = function (key, value, lifeSpan, now) {
        var holder = new CacheHolder(value, lifeSpan, now);
        return this.updateHolder(key, holder);
    };

    /**
     *  Erase cache for key
     *
     * @param key
     * @param {Date} now
     * @return {null}
     */
    CachePool.prototype.erase = function (key, now) {
        var old = null;
        if (now) {
            // get exists value before erasing
            old = this.fetch(key, now);
        }
        delete this.__holders[key];
        return old;
    };

    /**
     *  Fetch cache value & its holder
     *
     * @param key
     * @param {Date} now
     * @return {CachePair}
     */
    CachePool.prototype.fetch = function (key, now) {
        var holder = this.__holders[key];
        if (!holder) {
            // holder not found
            return null;
        } else if (holder.isAlive(now)) {
            return new CachePair(holder.getValue(), holder);
        } else {
            // holder expired
            return new CachePair(null, holder);
        }
    };

    /**
     *  Clear expired cache holders
     *
     * @param {Date} now
     * @return {number}
     */
    CachePool.prototype.purge = function (now) {
        now = parseDateTime(now);
        var count = 0;
        var all_holders = this.__holders;
        Mapper.forEach(all_holders, function (key, holder) {
            if (!holder || holder.isDeprecated(now)) {
                // remove expired holders
                delete all_holders[key];
                ++count;
            }
            return false;
        });
        return count;
    };


    var CacheRunner = function (duration) {
        Runner.call(this);
        duration = parseDuration(duration, 300);
        this.__interval = duration;
        this.__expired = duration.addTo(new Date());
        this.__pools = {};
        // background thread
        this.__thread = new Thread(this);
    };
    Class(CacheRunner, Runner, null);

    CacheRunner.prototype.start = function () {
        this.__thread.start();
    };
    CacheRunner.prototype.stop = function () {
        this.__thread.stop();
    };

    // Override
    CacheRunner.prototype.process = function () {
        var now = new Date();
        if (now.getTime() > this.__expired.getTime()) {
            this.__expired = this.__interval.addTo(now);
            try {
                var cnt = this.purge(now);
                if (cnt > 0) {
                    Log.info('CacheManager: ' + cnt + ' object(s) removed.');
                }
            } catch (e) {
                Log.error('CacheManager::run()', e);
            }
        }
        return false;
    };

    CacheRunner.prototype.purge = function (now) {
        var count = 0;
        Mapper.forEach(this.__pools, function (name, pool) {
            if (pool) {
                count += pool.purge(now);
            }
            return false;
        });
        return count;
    };

    /**
     *  Get pool with name
     *
     * @param {string} name - pool name
     * @return {CachePool} cache pool
     */
    CacheRunner.prototype.getPool = function (name) {
        var pool = this.__pools[name];
        if (!pool) {
            pool = new CachePool();
            this.__pools[name] = pool;
        }
        return pool;
    };

    /**
     *  Singleton
     *  ~~~~~~~~~
     */
    sg.lnc.CacheManager = {

        /**
         *  Get pool with name
         *
         * @param {string} name - pool name
         * @return {CachePool} cache pool
         */
        getPool: function (name) {
            this.getInstance();
            return this.cacheRunner.getPool(name);
        },

        getInstance: function () {
            if (!this.cacheRunner) {
                this.cacheRunner = new CacheRunner();
                this.cacheRunner.start();
            }
            return this;
        },

        cacheRunner: null
    };
    var CacheManager = sg.lnc.CacheManager;
