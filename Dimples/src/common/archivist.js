'use strict';
// license: https://mit-license.org
//
//  DIMPLES: DIMP Library for Easy Startup
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

    app.CommonArchivist = function (facebook, database) {
        Barrack.call(this);
        this.__facebook = facebook;
        this.__database = database;  // AccountDB
        // memory caches
        this.__userCache = this.createUserCache();
        this.__groupCache = this.createGroupCache();
    };
    var CommonArchivist = app.CommonArchivist;

    Class(CommonArchivist, Barrack, [Archivist]);

    CommonArchivist.prototype.getDatabase = function () {
        return this.__database;
    };

    CommonArchivist.prototype.getFacebook = function () {
        return this.__facebook;
    };

    // protected
    CommonArchivist.prototype.createUserCache = function () {
        return new ThanosCache();
    };
    // protected
    CommonArchivist.prototype.createGroupCache = function () {
        return new ThanosCache();
    };

    /**
     *  Call it when received 'UIApplicationDidReceiveMemoryWarningNotification',
     *  this will remove 50% of cached objects
     *
     * @return {uint} number of survivors
     */
    CommonArchivist.prototype.reduceMemory = function () {
        var cnt1 = this.__userCache.reduceMemory();
        var cnt2 = this.__groupCache.reduceMemory();
        return cnt1 + cnt2;
    };

    //
    //  Barrack
    //

    // Override
    CommonArchivist.prototype.cacheUser = function (user) {
        if (!user.getDataSource()) {
            user.setDataSource(this.getFacebook());
        }
        var uid = user.getIdentifier().toString();
        this.__userCache.put(uid, user);
    };

    // Override
    CommonArchivist.prototype.cacheGroup = function (group) {
        if (!group.getDataSource()) {
            group.setDataSource(this.getFacebook());
        }
        var gid = group.getIdentifier().toString();
        this.__groupCache.put(gid, group);
    };

    // Override
    CommonArchivist.prototype.getUser = function (identifier) {
        var uid = identifier.toString();
        return this.__userCache.get(uid);
    };

    // Override
    CommonArchivist.prototype.getGroup = function (identifier) {
        var gid = identifier.toString();
        return this.__groupCache.get(gid);
    };

    //
    //  Archivist
    //

    // Override
    CommonArchivist.prototype.saveMeta = function (meta, identifier) {
        //
        //  1. check valid
        //
        if (this.checkMeta(meta, identifier)) {
            // meta valid
        } else {
            Log.error('meta not valid:', identifier, meta);
            return false;
        }
        //
        //  2. check duplicated
        //
        var facebook = this.getFacebook();
        var old = facebook.getMeta(identifier);
        if (old) {
            Log.debug('meta duplicated: ', identifier);
            return true;
        }
        //
        //  3. save into database
        //
        var db = this.getDatabase();
        return db.saveMeta(meta, identifier);
    };

    // protected
    CommonArchivist.prototype.checkMeta = function (meta, identifier) {
        return meta.isValid() && MetaUtils.matchIdentifier(identifier, meta);
    };

    // Override
    CommonArchivist.prototype.saveDocument = function (doc) {
        //
        //  1. check valid
        //
        if (this.checkDocumentValid(doc)) {
            // document valid
        } else {
            Log.error('document not valid:', doc.getIdentifier(), doc);
            return false;
        }
        //
        //  2. check expired
        //
        if (this.checkDocumentExpired(doc)) {
            Log.info('drop expired document:', doc.getIdentifier(), doc);
            return false;
        }
        //
        //  3. save into database
        //
        var db = this.getDatabase();
        return db.saveDocument(doc);
    };

    // protected
    CommonArchivist.prototype.checkDocumentValid = function (doc) {
        var identifier = doc.getIdentifier();
        var docTime = doc.getTime();
        // check document time
        if (!docTime) {
            Log.warning('document without time:', identifier);
        } else {
            // calibrate the clock
            // make sure the document time is not in the far future
            var now = new Date();
            var nearFuture = Duration.ofMinutes(30).addTo(now);
            if (docTime.getTime() > nearFuture.getTime()) {
                Log.error('document time error:', docTime, identifier);
                return false;
            }
        }
        // check valid
        return this.verifyDocument(doc);
    };

    // protected
    CommonArchivist.prototype.verifyDocument = function (doc) {
        if (doc.isValid()) {
            return true;
        }
        var identifier = doc.getIdentifier();
        var facebook = this.getFacebook();
        var meta = facebook.getMeta(identifier);
        if (!meta) {
            Log.warning('failed to get meta:', identifier);
            return false;
        }
        var pKey = meta.getPublicKey();
        return doc.verify(pKey);
    };

    // protected
    CommonArchivist.prototype.checkDocumentExpired = function (doc) {
        var identifier = doc.getIdentifier();
        var type = DocumentUtils.getDocumentType(doc);
        if (!type) {
            type = '*';
        }
        var facebook = this.getFacebook();
        // check old documents with type
        var documents = facebook.getDocuments(identifier);
        if (!documents || documents.length === 0) {
            return false;
        }
        var old = DocumentUtils.lastDocument(documents, type);
        return old && DocumentUtils.isExpired(doc, old);
    };

    // Override
    CommonArchivist.prototype.getMetaKey = function (uid) {
        var facebook = this.getFacebook();
        var meta = facebook.getMeta(uid);
        return !meta ? null : meta.getPublicKey();
    };

    // Override
    CommonArchivist.prototype.getVisaKey = function (uid) {
        var facebook = this.getFacebook();
        var docs = facebook.getDocuments(uid);
        if (!docs || docs.length === 0) {
            return null;
        }
        var visa = DocumentUtils.lastVisa(docs);
        return !visa ? null : visa.getPublicKey();
    };

    // Override
    CommonArchivist.prototype.getLocalUsers = function () {
        var db = this.getDatabase();
        return db.getLocalUsers();
    };
