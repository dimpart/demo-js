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
     *  Simple Log
     *  ~~~~~~~~~~
     */
    sg.lnc.Log = {

        //
        //  Levels
        //
        DEBUG:   DEBUG_FLAG | INFO_FLAG | WARNING_FLAG | ERROR_FLAG,
        DEVELOP:              INFO_FLAG | WARNING_FLAG | ERROR_FLAG,
        RELEASE:                          WARNING_FLAG | ERROR_FLAG,

        level: WARNING_FLAG | ERROR_FLAG,  // RELEASE

        showTime: false,
        showCaller: false,  // (Reserved)

        //
        //  Conveniences
        //
        debug: function (msg) {
            this.logger.debug.apply(this.logger, arguments);
        },
        info: function (msg) {
            this.logger.info.apply(this.logger, arguments);
        },
        warning: function (msg) {
            this.logger.warning.apply(this.logger, arguments);
        },
        error: function (msg) {
            this.logger.error.apply(this.logger, arguments);
        },

        logger: null  // DefaultLogger
    };
    var Log = sg.lnc.Log;

    /**
     *  Log with class name
     *  ~~~~~~~~~~~~~~~~~~~
     */
    sg.lnc.Logging = Mixin(null, {

        logDebug: function (msg) {
            Log.debug.apply(Log, logging_args(this, arguments));
        },

        logInfo: function (msg) {
            Log.info.apply(Log, logging_args(this, arguments));
        },

        logWarning: function (msg) {
            Log.warning.apply(Log, logging_args(this, arguments));
        },

        logError: function (msg) {
            Log.error.apply(Log, logging_args(this, arguments));
        }
    });

    var logging_args = function (obj, args) {
        // get class name
        var getClassName = obj.getClassName;
        if (typeof getClassName !== 'function') {
            getClassName = BaseObject.prototype.getClassName;
        }
        var clazz = getClassName.call(obj);
        // insert class name
        args = Array.prototype.slice.call(args);
        args.unshift(clazz + ' > ');
        return args;
    };


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

    Class(DefaultLogger, BaseObject, [Logger]);

    Implementation(DefaultLogger, {

        // Override
        debug: function (msg) {
            var flag = Log.level & DEBUG_FLAG;
            if (flag > 0) {
                console.debug.apply(console, log_args(arguments));
            }
        },

        // Override
        info: function (msg) {
            var flag = Log.level & INFO_FLAG;
            if (flag > 0) {
                console.info.apply(console, log_args(arguments));
            }
        },

        // Override
        warning: function (msg) {
            var flag = Log.level & WARNING_FLAG;
            if (flag > 0) {
                console.warn.apply(console, log_args(arguments));
            }
        },

        // Override
        error: function (msg) {
            var flag = Log.level & ERROR_FLAG;
            if (flag > 0) {
                console.error.apply(console, log_args(arguments));
            }
        }
    });

    var log_args = function (args) {
        if (Log.showTime) {
            args = Array.prototype.slice.call(args);
            args.unshift('[' + current_time() + ']');
        }
        return args;
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
