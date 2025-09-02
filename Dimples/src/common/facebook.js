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

//! require 'protocol/*.js'
//! require 'db/*.js'
//! require 'network/*.js'

    app.CommonFacebook = function (database) {
        Facebook.call(this);
        this.__database = database;   // AccountDBI
        this.__barrack = null;        // CommonArchivist
        this.__entityChecker = null;  // EntityChecker
        this.__currentUser = null;    // User
    };
    var CommonFacebook = app.CommonFacebook;

    Class(CommonFacebook, Facebook, null, null);

    CommonFacebook.prototype.getDatabase = function () {
        return this.__database;
    };

    // Override
    CommonFacebook.prototype.getArchivist = function () {
        return this.__barrack;
    };

    // Override
    CommonFacebook.prototype.getBarrack = function () {
        return this.__barrack;
    };

    CommonFacebook.prototype.setBarrack = function (archivist) {
        this.__barrack = archivist;
    };

    CommonFacebook.prototype.getEntityChecker = function () {
        return this.__entityChecker;
    };
    CommonFacebook.prototype.setEntityChecker = function (checker) {
        this.__entityChecker = checker;
    };

    //
    //  Current User
    //

    CommonFacebook.prototype.getCurrentUser = function () {
        // Get current user (for signing and sending message)
        var current = this.__currentUser;
        if (current) {
            return current;
        }
        var db = this.getDatabase();
        var array = db.getLocalUsers();
        if (!array || array.length) {
            return null;
        }
        current = this.getUser(array[0]);
        this.__currentUser = current;
        return current;
    };

    CommonFacebook.prototype.setCurrentUser = function (user) {
        if (!user.getDataSource()) {
            user.setDataSource(this);
        }
        this.__currentUser = user;
    };

    // Override
    CommonFacebook.prototype.selectLocalUser = function (receiver) {
        var user = this.__currentUser;
        if (user) {
            var current = user.getIdentifier();
            if (receiver.isBroadcast()) {
                // broadcast message can be decrypted by anyone, so
                // just return current user here
                return current;
            } else if (receiver.isGroup()) {
                // group message (recipient not designated)
                //
                // the messenger will check group info before decrypting message,
                // so we can trust that the group's meta & members MUST exist here.
                var members = this.getMember(receiver);
                if (!members || members.length === 0) {
                    Log.warning('members not found:', receiver);
                    return null;
                } else if (members_contains(members, current)) {
                    return current;
                }
            } else if (receiver.equals(current)) {
                return current;
            }
        }
        // check local users
        return Facebook.prototype.selectLocalUser.call(this, receiver);
    };

    var members_contains = function (array, value) {
        var item;
        var i = array.length - 1;
        for (; i >= 0; --i) {
            item = array[i];
            if (!item) {
                // error
            } else if (item.equals(value)) {
                return true;
            }
        }
        return false;
    };

    //
    //  Documents
    //

    CommonFacebook.prototype.getDocument = function (identifier, type) {
        var documents = this.getDocuments(identifier);
        var doc = DocumentUtils.lastDocument(documents, type);
        // compatible for document type
        if (!doc && type === DocumentType.VISA) {
            doc = DocumentUtils.lastDocument(documents, DocumentType.PROFILE);
        }
        return doc;
    };

    CommonFacebook.prototype.getVisa = function (user) {
        var documents = this.getDocuments(user);
        return DocumentUtils.lastVisa(documents);
    };

    CommonFacebook.prototype.getBulletin = function (group) {
        var documents = this.getDocuments(group);
        return DocumentUtils.lastBulletin(documents);
    };

    CommonFacebook.prototype.getName = function (identifier) {
        var type;
        if (identifier.isUser()) {
            type = DocumentType.VISA;
        } else if (identifier.isGroup()) {
            type = DocumentType.BULLETIN;
        } else {
            type = '*';
        }
        var doc = this.getDocument(identifier, type);
        if (doc) {
            var name = doc.getName();
            if (name && name.length > 0) {
                return name;
            }
        }
        // get name from ID
        return Anonymous.getName(identifier);
    };

    CommonFacebook.prototype.getAvatar = function (user) {
        var doc = this.getVisa(user);
        return !doc ? null : doc.getAvatar();
    };

    //
    //  Entity DataSource
    //

    // Override
    CommonFacebook.prototype.getMeta = function (identifier) {
        var db = this.getDatabase();
        var meta = db.getMeta(identifier);
        var checker = this.getEntityChecker();
        if (checker) {
            checker.checkMeta(meta, identifier);
        }
        return meta;
    };

    // Override
    CommonFacebook.prototype.getDocuments = function (identifier) {
        var db = this.getDatabase();
        var docs = db.getDocuments(identifier);
        var checker = this.getEntityChecker();
        if (checker) {
            checker.checkDocuments(identifier, docs);
        }
        return docs;
    };

    //
    //  User DataSource
    //

    // Override
    CommonFacebook.prototype.getContacts = function (user) {
        var db = this.getDatabase();
        return db.getContacts(user);
    };

    // Override
    CommonFacebook.prototype.getPrivateKeysForDecryption = function (user) {
        var db = this.getDatabase();
        return db.getPrivateKeysForDecryption(user);
    };

    // Override
    CommonFacebook.prototype.getPrivateKeyForSignature = function (user) {
        var db = this.getDatabase();
        return db.getPrivateKeyForSignature(user);
    };

    // Override
    CommonFacebook.prototype.getPrivateKeyForVisaSignature = function (user) {
        var db = this.getDatabase();
        return db.getPrivateKeyForVisaSignature(user);
    };

    //
    //  Organizational Structure
    //

    CommonFacebook.prototype.getAdministrators = function (group) {};
    CommonFacebook.prototype.saveAdministrators = function (admins, group) {};

    CommonFacebook.prototype.saveMembers = function (newMembers, group) {};
