'use strict';
// license: https://mit-license.org
//
//  DIMP : Decentralized Instant Messaging Protocol
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

//! require <dimsdk.js>

    ///  History command: {
    ///      type : i2s(0x88),
    ///      sn   : 123,
    ///
    ///      command : "query",
    ///      time    : 123.456,
    ///
    ///      group     : "{GROUP_ID}",
    ///      last_time : 0
    ///  }
    dkd.protocol.QueryCommand = Interface(null, [GroupCommand]);
    var QueryCommand = dkd.protocol.QueryCommand;

    // NOTICE:
    //     This command is just for querying group info,
    //     should not be saved in group history
    GroupCommand.QUERY  = 'query';  // Deprecated

    /**
     *  Last group history time for querying
     *
     * @return {Date}
     */
    QueryCommand.prototype.getLastTime = function () {};

    //
    //  Factory
    //
    GroupCommand.query = function (group, lastTime) {
        return new QueryGroupCommand(group, lastTime);
    };


    /**
     *  Create query group command
     *
     *      1. new QueryGroupCommand(dict);
     *      2. new QueryGroupCommand(group, lastTime);
     */
    dkd.dkd.QueryGroupCommand = function () {
        if (arguments.length === 1) {
            // 1. new QueryGroupCommand(dict);
            var content = arguments[0];
            BaseGroupCommand.call(this, content);
        } else if (arguments.length === 2) {
            // 2. new QueryGroupCommand(group, lastTime);
            var group = arguments[0];
            var lastTime = arguments[1];
            BaseGroupCommand.call(this, GroupCommand.QUERY, group);
            if (lastTime) {
                this.setDateTime('last_time', lastTime);
            }
        } else {
            throw new SyntaxError('arguments error: ' + arguments);
        }
    };
    var QueryGroupCommand = dkd.dkd.QueryGroupCommand;

    Class(QueryGroupCommand, BaseGroupCommand, [QueryCommand], {

        // Override
        getLastTime: function () {
            return this.getDateTime('last_time', null);
        }
    });


    ///  Group Query Command: {
    ///      "type" : i2s(0xCC),
    ///      "sn"   : 123,
    ///      "time" : 123.456,
    ///
    ///      "app"  : "chat.dim.group",
    ///      "mod"  : "history",
    ///      "act"  : "query",
    ///
    ///      "group"     : "{GROUP_ID}",
    ///      "last_time" : 0,             // Last group history time for querying
    ///  }
    dkd.protocol.GroupHistory = Interface(null, null);
    var GroupHistory = dkd.protocol.GroupHistory;

    GroupHistory.APP = 'chat.dim.group';
    GroupHistory.MOD = 'history';

    GroupHistory.ACT_QUERY = 'query';

    //
    //  Factory method
    //
    GroupHistory.queryGroupHistory = function (group, lastTime) {
        var content = CustomizedContent.create(
            GroupHistory.APP,
            GroupHistory.MOD,
            GroupHistory.ACT_QUERY
        );
        content.setGroup(group);
        if (lastTime) {
            // Last group history time for querying
            content.setDateTime('last_time', lastTime);
        }
        return content;
    };


    ///  Group Keys Command: {
    ///      "type" : i2s(0xCC),
    ///      "sn"   : 123,
    ///      "time" : 123.456,
    ///
    ///      "app"  : "chat.dim.group",
    ///      "mod"  : "keys",
    ///      "act"  : "query",   // "update", "request", "respond"
    ///
    ///      "group"  : "{GROUP_ID}",
    ///      "from"   : "{SENDER_ID}",
    ///      "to"     : ["{MEMBER_ID}", ],  // query for members
    ///      "digest" : "{KEY_DIGEST}",     // query with digest
    ///      "keys"   : {
    ///          "digest"      : "{KEY_DIGEST}",
    ///          "{MEMBER_ID}" : "{ENCRYPTED_KEY}",
    ///      }
    ///  }
    dkd.protocol.GroupKeys = Interface(null, null);
    var GroupKeys = dkd.protocol.GroupKeys;

    GroupKeys.APP = 'chat.dim.group';
    GroupKeys.MOD = 'keys';

    ///  Group Key Actions:
    ///
    ///     1. when group bot found new member, or key digest updated,
    ///        send a 'query' command to the message sender for new keys;
    ///
    ///     2. send all keys with digest to the group bot;
    ///
    ///     3. if a member received a group message with new key digest,
    ///        send a 'request' command to the group bot;
    ///
    ///     4. send new key to the group member.
    ///
    GroupKeys.ACT_QUERY   = 'query';    // 1. bot -> sender
    GroupKeys.ACT_UPDATE  = 'update';   // 2. sender -> bot
    GroupKeys.ACT_REQUEST = 'request';  // 3. member -> bot
    GroupKeys.ACT_RESPOND = 'respond';  // 4. bot -> member

    //
    //  Factory methods
    //

    /**
     *  Create group command for keys
     *
     * @param {string} action
     * @param {ID} group
     * @param {ID} sender     - keys from this user
     * @param {ID[]} members  - query for members
     * @param {String} digest - query with digest
     * @param encodedKeys     - update/respond keys (and digest)
     * @return {CustomizedContent}
     */
    GroupKeys.create = function (action, group, sender, members, digest, encodedKeys) {
        // 1. create group command
        var content = CustomizedContent.create(GroupKeys.APP, GroupKeys.MOD, action);
        content.setGroup(group);
        // 2. direction: sender -> members
        content.setString('from', sender);
        if (members instanceof Array) {
            content['to'] = ID.revert(members);
        }
        // 3. keys and digest
        if (encodedKeys) {
            content['keys'] = encodedKeys;
        } else if (digest) {
            content['digest'] = digest;
        }
        // OK
        return content;
    };

    // 1. bot -> sender

    /**
     *  Query group keys from sender
     *
     * @param {ID} group
     * @param {ID} sender
     * @param {ID[]} members
     * @param {String} digest
     * @return {CustomizedContent}
     */
    GroupKeys.queryGroupKeys = function (group, sender, members, digest) {
        return GroupKeys.create(GroupKeys.ACT_QUERY, group, sender, members, digest, null);
    };

    // 2. sender -> bot

    /**
     *  Update group keys from sender
     *
     * @param {ID} group
     * @param {ID} sender
     * @param encodedKeys
     * @return {CustomizedContent}
     */
    GroupKeys.updateGroupKeys = function (group, sender, encodedKeys) {
        return GroupKeys.create(GroupKeys.ACT_UPDATE, group, sender, null, null, encodedKeys);
    };

    // 3. member -> bot

    /**
     *  Request group key for this member
     *
     * @param {ID} group
     * @param {ID} sender
     * @param {String} digest
     * @return {CustomizedContent}
     */
    GroupKeys.requestGroupKey = function (group, sender, digest) {
        return GroupKeys.create(GroupKeys.ACT_REQUEST, group, sender, null, digest, null);
    };

    GroupKeys.respondGroupKey = function (group, sender, member, digest, encodedKey) {
        var keys = {};
        keys['digest'] = digest;
        keys[member.toString()] = encodedKey;
        return GroupKeys.create(GroupKeys.ACT_RESPOND, group, sender, null, null, keys);
    };
