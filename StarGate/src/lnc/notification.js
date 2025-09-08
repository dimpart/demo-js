'use strict';
// license: https://mit-license.org
//
//  LNC : Local Notification Center
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

//! require 'requires.js'

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

    Class(Notification, BaseObject, null);

    Implementation(Notification, {

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


    sg.lnc.BaseCenter = function () {
        BaseObject.call(this);
        this.__observers = {}; // str(name) => Set<Observer>
    };
    var BaseCenter = sg.lnc.BaseCenter;

    Class(BaseCenter, BaseObject, null);

    /**
     *  Add observer with notification name
     *
     * @param {Observer} observer
     * @param {string} name
     */
    BaseCenter.prototype.addObserver = function (observer, name) {
        var listeners = this.__observers[name];
        if (!listeners) {
            // new set
            listeners = new HashSet();
            this.__observers[name] = listeners;
        }
        listeners.add(observer);
    };

    /**
     *  Remove observer from notification center
     *
     * @param {Object} observer
     * @param {String} name
     */
    BaseCenter.prototype.removeObserver = function (observer, name) {
        var keys = !name ? Object.keys(this.__observers) : [name];
        for (var i = keys.length - 1; i >= 0; --i) {
            name = keys[i];
            // Remove observer for notification name
            var listeners = this.__observers[name];
            if (listeners/* instanceof HashSet*/) {
                listeners.remove(observer);
                if (listeners.isEmpty()) {
                    delete this.__observers[name];
                }
            }
        }
    };

    /**
     *  Post notification with name
     *
     * @param {string} name
     * @param {Object} sender
     * @param {{}} userInfo
     */
    BaseCenter.prototype.postNotification = function (name, sender, userInfo) {
        var notification = new Notification(name, sender, userInfo);
        return this.post(notification);
    };

    BaseCenter.prototype.post = function (notification) {
        // send to all observers with this notification name
        var listeners = this.__observers[notification.getName()];
        if (!listeners || listeners.isEmpty()) {
            // no listeners for this notification
            return;
        }
        var observers = listeners.toArray();
        var obs;  // Observer
        for (var i = observers.length - 1; i >= 0; --i) {
            obs = observers[i];
            try {
                if (Interface.conforms(obs, Observer)) {
                    obs.onReceiveNotification(notification);
                } else if (typeof obs === 'function') {
                    obs.call(notification);
                } else {
                    Log.error('Notification observer error', obs, notification);
                }
            } catch (e) {
                Log.error('DefaultCenter::post() error', notification, obs, e);
            }
        }
    };


    /**
     *  Singleton
     *  ~~~~~~~~~
     */
    sg.lnc.NotificationCenter = {

        /**
         *  Add observer with notification name
         *
         * @param {Observer|Function} observer
         * @param {string} name
         */
        addObserver: function (observer, name) {
            this.center.addObserver(observer, name);
        },

        /**
         *  Remove observer from notification center
         *
         * @param {Observer|Function} observer
         * @param {string} name - OPTIONAL
         */
        removeObserver: function (observer, name) {
            this.center.removeObserver(observer, name);
        },

        /**
         *  Post notification with name
         *
         * @param {Notification|String} notification - notification or name
         * @param {Object} sender
         * @param {{}} userInfo - OPTIONAL
         */
        postNotification: function (notification, sender, userInfo) {
            if (notification instanceof Notification) {
                this.center.post(notification);
            } else {
                this.center.postNotification(notification, sender, userInfo);
            }
        },

        getInstance: function () {
            return this;
        },

        center: new BaseCenter()
    };
    var NotificationCenter = sg.lnc.NotificationCenter;


    /**
     *  Asynchronous Notification Center
     *  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     *
     *  call for each observers in background thread
     */
    sg.lnc.AsyncCenter = function () {
        BaseCenter.call(this);
        this.__notifications = []; // List<Notification>
        this.__running = false;
        this.__thread = null;
    };
    var AsyncCenter = sg.lnc.AsyncCenter;

    Class(AsyncCenter, BaseCenter, [Runnable]);

    Implementation(AsyncCenter, {

        // Override
        postNotification: function (name, sender, userInfo) {
            var notification = new Notification(name, sender, userInfo);
            this.__notifications.push(notification);
        },

        // Override
        post: function (notification) {
            this.__notifications.push(notification);
        },

        // Override
        run: function () {
            while (this.isRunning()) {
                if (!this.process()) {
                    // nothing to do now,
                    // return true to run again after idled a while.
                    return true;
                }
            }
            // return false to stopped running
            return false;
        },

        // protected
        process: function () {
            var notification = this.__notifications.shift();
            if (notification) {
                BaseCenter.prototype.post.call(this, notification);
                return true;
            } else {
                // nothing to do now,
                // return false to have a rest ^_^
                return false;
            }
        }
    });

    AsyncCenter.prototype.start = function () {
        force_stop.call(this);
        this.__running = true;
        var thread = new Thread(this);
        thread.start();
        this.__thread = thread;
    };
    AsyncCenter.prototype.stop = function () {
        force_stop.call(this);
    };
    var force_stop = function () {
        var thread = this.__thread;
        if (thread) {
            this.__thread = null;
            thread.stop();
        }
    };

    AsyncCenter.prototype.isRunning = function () {
        return this.__running;
    };
