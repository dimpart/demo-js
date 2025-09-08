'use strict';
// license: https://mit-license.org
//
//  DIMPLES: DIMP Library for Easy Startup
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

    app.EntityChecker = function (database) {
        BaseObject.call(this);
        this.__database = database;  // AccountDBI
        // query checkers
        this.__metaQueries    = new FrequencyChecker(EntityChecker.QUERY_EXPIRES);
        this.__docsQueries    = new FrequencyChecker(EntityChecker.QUERY_EXPIRES);
        this.__membersQueries = new FrequencyChecker(EntityChecker.QUERY_EXPIRES);
        // response checker
        this.__visaResponses  = new FrequencyChecker(EntityChecker.RESPOND_EXPIRES);
        // recent time checkers
        this.__lastDocumentTimes = new RecentTimeChecker();
        this.__lastHistoryTimes  = new RecentTimeChecker();
        // group => member
        this.__lastActiveMembers = {};  // -> String(ID) => ID
    };
    var EntityChecker = app.EntityChecker;

    Class(EntityChecker, BaseObject, null);

    /**
     *  each query will be expired after 10 minutes
     */
    EntityChecker.QUERY_EXPIRES = Duration.ofMinutes(10);

    /**
     *  each respond will be expired after 10 minutes
     */
    EntityChecker.RESPOND_EXPIRES = Duration.ofMinutes(10);

    // protected
    EntityChecker.prototype.getDatabase = function () {
        return this.__database;
    };

    // protected
    EntityChecker.prototype.isMetaQueryExpired = function (identifier) {
        var did = identifier.toString();
        return this.__metaQueries.isExpired(did, null, false);
    };
    // protected
    EntityChecker.prototype.isDocumentQueryExpired = function (identifier) {
        var did = identifier.toString();
        return this.__docsQueries.isExpired(did, null, false);
    };
    // protected
    EntityChecker.prototype.isMembersQueryExpired = function (group) {
        var gid = group.toString();
        return this.__membersQueries.isExpired(gid, null, false);
    };
    // protected
    EntityChecker.prototype.isDocumentResponseExpired = function (identifier, force) {
        var did = identifier.toString();
        return this.__visaResponses.isExpired(did, null, force);
    };

    /**
     *  Set last active member for group
     *
     * @param {ID} member
     * @param {ID} group
     */
    EntityChecker.prototype.setLastActiveMember = function (member, group) {
        var gid = group.toString();
        this.__lastActiveMembers[gid] = member;
    };
    // protected
    EntityChecker.prototype.getLastActiveMember = function (group) {
        var gid = group.toString();
        return this.__lastActiveMembers[gid];
    };

    /**
     *  Update 'SDT' - Sender Document Time
     *
     * @param {Date} current
     * @param {ID} identifier
     * @return {boolean}
     */
    EntityChecker.prototype.setLastDocumentTime = function (current, identifier) {
        var did = identifier.toString();
        return this.__lastDocumentTimes.setLastTime(did, current);
    };

    /**
     *  Update 'GHT' - Group History Time
     *
     * @param {Date} current
     * @param {ID} group
     * @return {boolean}
     */
    EntityChecker.prototype.setLastGroupHistoryTime = function (current, group) {
        var gid = group.toString();
        return this.__lastHistoryTimes.setLastTime(gid, current);
    };

    //
    //  Meta
    //

    /**
     *  Check meta for querying
     *
     * @param {mkm.protocol.ID} identifier - entity ID
     * @param {Meta} meta                  - exists meta
     * @return {boolean} true on querying
     */
    EntityChecker.prototype.checkMeta = function (meta, identifier) {
        if (this.needsQueryMeta(identifier, meta)) {
            // if (this.isMetaQueryExpired(identifier)) {} else {
            //     // query not expired yet
            //     return false;
            // }
            return this.queryMeta(identifier);
        } else {
            // no need to query meta again
            return false;
        }
    };

    /**
     *  Check whether need to query meta
     *
     * @param {mkm.protocol.ID} identifier - entity ID
     * @param {Meta} meta                  - exists meta
     * @return {Boolean}
     */
    // protected
    EntityChecker.prototype.needsQueryMeta = function (identifier, meta) {
        if (identifier.isBroadcast()) {
            // broadcast entity has no meta to query
            return false;
        } else if (!meta) {
            // meta not found, sure to query
            return true;
        }
        // return MetaUtils.matchIdentifier(identifier, meta);
        return false;
    };

    //
    //  Documents
    //

    /**
     *  Check documents for querying/updating
     *
     * @param {mkm.protocol.ID} identifier - entity ID
     * @param {Document[]} docs            - exist documents
     * @return {boolean} true on querying
     */
    EntityChecker.prototype.checkDocuments = function (identifier, docs) {
        if (this.needsQueryDocuments(identifier, docs)) {
            // if (this.isDocumentQueryExpired(identifier)) {} else {
            //     // query not expired yet
            //     return false;
            // }
            return this.queryDocuments(identifier, docs);
        } else {
            // no need to update documents now
            return false;
        }
    };

    /**
     *  Check whether need to query documents
     *
     * @param {mkm.protocol.ID} identifier - entity ID
     * @param {Document[]} docs            - exist documents
     * @return {Boolean}
     */
    // protected
    EntityChecker.prototype.needsQueryDocuments = function (identifier, docs) {
        if (identifier.isBroadcast()) {
            // broadcast entity has no document to query
            return false;
        } else if (!docs || docs.length === 0) {
            // documents not found, sure to query
            return true;
        }
        var currentTime = this.getLastDocumentTime(identifier, docs);
        var did = identifier.toString();
        return this.__lastDocumentTimes.isExpired(did, currentTime);
    };

    // protected
    EntityChecker.prototype.getLastDocumentTime = function (identifier, docs) {
        if (!docs || docs.length === 0) {
            return null;
        }
        var docTime, lastTime = null;  // Date
        for (var i = 0; i < docs.length; ++i) {
            docTime = docs[i].getTime();
            if (!docTime) {
                // document error
                Log.warning('document time error:', docs[i]);
            } else if (!lastTime || lastTime.getTime() < docTime.getTime()) {
                lastTime = docTime;
            }
        }
        return lastTime;
    };

    //
    //  Group Members
    //

    /**
     *  Check group members for querying
     *
     * @param {mkm.protocol.ID} group - group ID
     * @param {ID[]} members          - exist members
     * @return {boolean} true on querying
     */
    EntityChecker.prototype.checkMembers = function (group, members) {
        if (this.needsQueryMembers(group, members)) {
            // if (this.isMembersQueryExpired(identifier)) {} else {
            //     // query not expired yet
            //     return false;
            // }
            return this.queryMembers(group, members);
        } else {
            // no need to update group members now
            return false;
        }
    };

    /**
     *  Check whether need to query group members
     *
     * @param {mkm.protocol.ID} group - group ID
     * @param {ID[]} members          - exist members
     * @return {Boolean}
     */
    // protected
    EntityChecker.prototype.needsQueryMembers = function (group, members) {
        if (group.isBroadcast()) {
            // broadcast group has no members to query
            return false;
        } else if (!members || members.length === 0) {
            // members not found, sure to query
            return true;
        }
        var currentTime = this.getLastGroupHistoryTime(group);
        var gid = group.toString();
        return this.__lastHistoryTimes.isExpired(gid, currentTime);
    };

    EntityChecker.prototype.getLastGroupHistoryTime = function (group) {
        var db = this.getDatabase();
        var array = db.getGroupHistories(group);
        if (!array || array.length === 0) {
            return null;
        }
        var hisTime, lastTime = null;  // Date
        var his;  // GroupCommand
        var pair;
        for (var i = 0; i < array.length; ++i) {
            pair = array[i];
            his = pair.a;
            hisTime = his.getTime();
            if (!hisTime) {
                Log.warning('group command time error:', his);
            } else if (!lastTime || lastTime.getTime() < hisTime.getTime()) {
                lastTime = hisTime;
            }
        }
        return lastTime;
    };

    // -------- Querying

    /**
     *  Request for meta with entity ID
     *  (call 'isMetaQueryExpired()' before sending command)
     *
     * @param {mkm.protocol.ID} identifier - entity ID
     * @return {boolean} false on duplicated
     */
    EntityChecker.prototype.queryMeta = function (identifier) {};

    /**
     *  Request for documents with entity ID
     *  (call 'isDocumentQueryExpired()' before sending command)
     *
     * @param {mkm.protocol.ID} identifier - entity ID
     * @param {Document[]} docs            - exist documents
     * @return {boolean} false on duplicated
     */
    EntityChecker.prototype.queryDocuments = function (identifier, docs) {};

    /**
     *  Request for group members with group ID
     *  (call 'isMembersQueryExpired()' before sending command)
     *
     * @param {mkm.protocol.ID} group      - group ID
     * @param {ID[]} members               - exist members
     * @return {boolean} false on duplicated
     */
    EntityChecker.prototype.queryMembers = function (group, members) {};

    // -------- Responding

    /**
     *  Send my visa document to contact
     *  if document is updated, force to send it again.
     *  else only send once every 10 minutes.
     *
     * @param {Visa} visa
     * @param {ID} receiver
     * @param {Boolean} updated
     */
    EntityChecker.prototype.sendVisa = function (visa, receiver, updated) {};
