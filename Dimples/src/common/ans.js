'use strict';
// license: https://mit-license.org
//
//  DIMPLES: DIMP Library for Easy Startup
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

//! require <dimp.js>

    app.AddressNameService = Interface(null, null);
    var AddressNameService = app.AddressNameService;

    AddressNameService.KEYWORDS = [
        "all", "everyone", "anyone", "owner", "founder",
        // --------------------------------
        "dkd", "mkm", "dimp", "dim", "dimt",
        "rsa", "ecc", "aes", "des", "btc", "eth",
        // --------------------------------
        "crypto", "key", "symmetric", "asymmetric",
        "public", "private", "secret", "password",
        "id", "address", "meta",
        "tai", "document", "profile", "visa", "bulletin",
        "entity", "user", "group", "contact",
        // --------------------------------
        "member", "admin", "administrator", "assistant",
        "main", "polylogue", "chatroom",
        "social", "organization",
        "company", "school", "government", "department",
        "provider", "station", "thing", "bot", "robot",
        // --------------------------------
        "message", "instant", "secure", "reliable",
        "envelope", "sender", "receiver", "time",
        "content", "forward", "command", "history",
        "keys", "data", "signature",
        // --------------------------------
        "type", "serial", "sn",
        "text", "file", "image", "audio", "video", "page",
        "handshake", "receipt", "block", "mute",
        "register", "suicide", "found", "abdicate",
        "invite", "expel", "join", "quit", "reset", "query",
        "hire", "fire", "resign",
        // --------------------------------
        "server", "client", "terminal", "local", "remote",
        "barrack", "cache", "transceiver",
        "ans", "facebook", "store", "messenger",
        "root", "supervisor"
    ];

    /**
     *  Check whether the alias is available
     *
     * @param {string} name
     * @return {boolean} true on reserved
     */
    AddressNameService.prototype.isReserved = function (name) {};

    /**
     *  Get ID by short name
     *
     * @param {string} name - short name
     * @returns {ID}
     */
    AddressNameService.prototype.getIdentifier = function (name) {};

    /**
     *  Get all short names with the same ID
     *
     * @param {ID} identifier
     * @returns {string[]}
     */
    AddressNameService.prototype.getNames = function (identifier) {};


    app.AddressNameServer = function() {
        BaseObject.call(this);
        // constant ANS records
        var caches = {
            'all':      ID.EVERYONE,
            'everyone': ID.EVERYONE,
            'anyone':   ID.ANYONE,
            'owner':    ID.ANYONE,
            'founder':  ID.FOUNDER
        };
        // reserved names
        var reserved = {};
        var keywords = AddressNameService.KEYWORDS;
        for (var i = 0; i < keywords.length; ++i) {
            reserved[keywords[i]] = true;
        }
        // init
        this.__reserved = reserved;  // String => Boolean
        this.__caches = caches;      // String => ID
        this.__tables = {}           // String(ID) => String[]
    };
    var AddressNameServer = app.AddressNameServer;

    Class(AddressNameServer, BaseObject, [AddressNameService], null);

    // Override
    AddressNameServer.prototype.isReserved = function (name) {
        return this.__reserved[name] === true;
    };

    // Override
    AddressNameServer.prototype.getIdentifier = function (name) {
        return this.__caches[name];
    };

    // Override
    AddressNameServer.prototype.getNames = function (identifier) {
        var array = this.__tables[identifier.toString()];
        if (array === null) {
            array = [];
            // TODO: update all tables?
            Mapper.forEach(this.__caches, function (name, did) {
                if (identifier.equals(did)) {
                    array.push(name);
                }
                return false;
            });
            this.__tables[identifier.toString()] = array;
        }
        return array;
    };

    // protected
    AddressNameServer.prototype.cache = function (name, identifier) {
        if (this.isReserved(name)) {
            // this name is reserved, cannot register
            return false;
        }
        if (identifier) {
            this.__caches[name] = identifier;
            // names changed, remove the table of names for this ID
            delete this.__tables[identifier.toString()]
        } else {
            delete this.__caches[name];
            // TODO: only remove one table?
            this.__tables = {}
        }
        return true;
    };

    /**
     *  Save ANS record
     *
     * @param {string} name   - username
     * @param {ID} identifier - user ID; if empty, means delete this name
     * @return {boolean} true on success
     */
    AddressNameServer.prototype.save = function (name, identifier) {
        // TODO: override to save this record
        return this.cache(name, identifier);
    };
