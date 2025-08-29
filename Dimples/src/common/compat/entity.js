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
//! require 'network.js'

    /**
     *  ID for entity (User/Group)
     *
     *      data format: "name@address[/terminal]"
     *
     *      fields:
     *          name     - entity name, the seed of fingerprint to build address
     *          address  - a string to identify an entity
     *          terminal - entity login resource(device), OPTIONAL
     */
    app.compat.EntityID = function (identifier, name, address, terminal) {
        Identifier.call(this, identifier, name, address, terminal);
    };
    var EntityID = app.compat.EntityID;

    Class(EntityID, Identifier, null, {

        // Override
        getType: function () {
            var name = this.getName();
            if (!name || name.length === 0) {
                // all ID without 'name' field must be a user
                // e.g.: BTC address
                return EntityType.USER;
            }
            var network = this.getAddress().getType();
            // compatible with MKM 0.9.*
            return NetworkType.getEntityType(network);
        }
    });

    /*/
    EntityID.create = function (name, address, terminal) {
        var string = Identifier.concat(name, address, terminal);
        return new EntityID(string, name, address, terminal)
    };
    /*/

    /**
     *  EntityID Factory
     *  ~~~~~~~~~~~~~~~~
     */
    app.compat.EntityIDFactory = function () {
        IdentifierFactory.call(this);
    };
    var EntityIDFactory = app.compat.EntityIDFactory;

    Class(EntityIDFactory, IdentifierFactory, null, null);

    // Override
    EntityIDFactory.prototype.newID = function (string, name, address, terminal) {
        return new EntityID(string, name, address, terminal);
    };

    // Override
    EntityIDFactory.prototype.parse = function (identifier) {
        if (!identifier) {
            throw new ReferenceError('ID empty');
        }
        var size = identifier.length;
        if (size < 4 || size > 64) {
            return false;
        } else if (size === 15) {
            // "anyone@anywhere"
            if (identifier.toLowerCase() === 'anyone@anywhere') {
                return ID.ANYONE;
            }
        } else if (size === 19) {
            // "everyone@everywhere"
            // "stations@everywhere"
            if (identifier.toLowerCase() === 'everyone@everywhere') {
                return ID.EVERYONE;
            }
        } else if (size === 13) {
            // "moky@anywhere"
            if (identifier.toLowerCase() === 'moky@anywhere') {
                return ID.FOUNDER;
            }
        }
        return IdentifierFactory.prototype.parse.call(this, identifier);
    };

    /**
     *  Call it when received 'UIApplicationDidReceiveMemoryWarningNotification',
     *  this will remove 50% of cached objects
     *
     * @return {uint} number of survivors
     */
    EntityIDFactory.prototype.reduceMemory = function () {
        var finger = 0;
        finger = thanos(this._identifiers, finger);
        return finger >> 1;
    };
