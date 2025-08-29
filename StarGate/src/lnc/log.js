'use strict';
// license: https://mit-license.org
//
//  LNC : Log, Notification & Cache
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

//! require 'requires.js'

    var DEBUG_FLAG   = 1 << 0;
    var INFO_FLAG    = 1 << 1;
    var WARNING_FLAG = 1 << 2;
    var ERROR_FLAG   = 1 << 3;

    /**
     *  Log Interface
     *  ~~~~~~~~~~~~~
     */
    sg.lnc.Log = {

        //
        //  Levels
        //
        DEBUG:   DEBUG_FLAG | INFO_FLAG | WARNING_FLAG | ERROR_FLAG,
        DEVELOP:              INFO_FLAG | WARNING_FLAG | ERROR_FLAG,
        RELEASE:                          WARNING_FLAG | ERROR_FLAG,

        level: this.RELEASE,           // WARNING_FLAG | ERROR_FLAG

        showTime: false,
        showCaller: false,  // (Reserved)

        logger: null,  // DefaultLogger

        //
        //  Interfaces
        //
        debug: function (msg) {
            var flag = this.level & DEBUG_FLAG;
            if (flag > 0) {
                this.logger.debug.apply(this.logger, arguments);
            }
        },
        info: function (msg) {
            var flag = this.level & INFO_FLAG;
            if (flag > 0) {
                this.logger.info.apply(this.logger, arguments);
            }
        },
        warning: function (msg) {
            var flag = this.level & WARNING_FLAG;
            if (flag > 0) {
                this.logger.warning.apply(this.logger, arguments);
            }
        },
        error: function (msg) {
            var flag = this.level & ERROR_FLAG;
            if (flag > 0) {
                this.logger.error.apply(this.logger, arguments);
            }
        }

    };
    var Log = sg.lnc.Log;


    sg.lnc.Logger = Interface(null, null);
    var Logger = sg.lnc.Logger;

    Logger.prototype.debug   = function (msg) {};
    Logger.prototype.info    = function (msg) {};
    Logger.prototype.warning = function (msg) {};
    Logger.prototype.error   = function (msg) {};


    sg.lnc.DefaultLogger = function () {
        BaseObject.call(this);
    };
    var DefaultLogger = sg.lnc.DefaultLogger;

    Class(DefaultLogger, BaseObject, [Logger], {

        // Override
        debug: function () {
            console.debug.apply(console, log_args(arguments));
        },

        // Override
        info: function () {
            console.info.apply(console, log_args(arguments));
        },

        // Override
        warning: function () {
            console.warn.apply(console, log_args(arguments));
        },

        // Override
        error: function () {
            console.error.apply(console, log_args(arguments));
        }
    });

    var log_args = function (args) {
        if (Log.showTime === false) {
            return args;
        }
        var array = ['[' + current_time() + ']'];
        for (var i = 0; i < args.length; ++i) {
            array.push(args[i]);
        }
        return array;
    };

    //
    //  LogTimer
    //
    var current_time = function () {
        var now = new Date();
        var year    = now.getFullYear();
        var month   = now.getMonth();
        var date    = now.getDate();
        var hours   = now.getHours();
        var minutes = now.getMinutes();
        var seconds = now.getSeconds();
        return year + '-' + two_digits(month + 1) + '-' + two_digits(date)
            + ' ' + two_digits(hours) + ':' + two_digits(minutes) + ':' + two_digits(seconds);
    };
    var two_digits = function (value) {
        if (value < 10) {
            return '0' + value;
        } else {
            return '' + value;
        }
    };

    Log.logger = new DefaultLogger();
