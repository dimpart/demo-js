'use strict';
// license: https://mit-license.org
//
//  Local Notification Service
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

//! require 'namespace.js'

    /**
     *  Notification observer
     *  ~~~~~~~~~~~~~~~~~~~~~
     */
    sg.lnc.Observer = Interface(null, null);
    var Observer = sg.lnc.Observer;

    /**
     *  Callback when received notification
     *
     * @param {Notification} notification
     */
    Observer.prototype.onReceiveNotification = function (notification) {};


    /**
     *  Notification object with name, sender and extra info
     *
     * @param {string} name
     * @param {Object} sender
     * @param {{}} userInfo
     */
    sg.lnc.Notification = function (name, sender, userInfo) {
        BaseObject.call(this);
        this.__name = name;
        this.__sender = sender;
        this.__info = userInfo;
    };
    var Notification = sg.lnc.Notification;

    Class(Notification, BaseObject, null, {

        // Override
        toString: function () {
            var clazz     = this.getClassName();
            return '<' + clazz + ' name="' + this.getName() + '>\n' +
                '\t<sender>' + this.getSender() + '</sender>\n' +
                '\t<info>' + this.getUserInfo() + '</info>\n' +
                '</' + clazz + '>';
        }
    });

    Notification.prototype.getName = function () {
        return this.__name;
    };

    Notification.prototype.getSender = function () {
        return this.__sender;
    };

    Notification.prototype.getUserInfo = function () {
        return this.__info;
    };
