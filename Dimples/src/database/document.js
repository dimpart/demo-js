'use strict';
// license: https://mit-license.org
//
//  DIMPLES: DIMP Library for Easy Startup
//
//                               Written in 2023 by Moky <albert.moky@gmail.com>
//
// =============================================================================
// The MIT License (MIT)
//
// Copyright (c) 2023 Albert Moky
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

//! require 'dbi/*.js'

    var db_doc_path = function (entity) {
        return 'pub.' + entity.getAddress().toString() + '.docs';
    };

    /**
     *  Document for Entities (User/Group)
     *  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     *
     *  storage path: 'dim.fs.pub.{ADDRESS}.docs'
     */
    app.database.DocumentStorage = function () {
        BaseObject.call(this);
    };
    var DocumentStorage = app.database.DocumentStorage;

    Class(DocumentStorage, BaseObject, [DocumentDBI], null);

    // Override
    DocumentStorage.prototype.saveDocument = function (doc) {
        var entity = doc.getIdentifier();
        var type = doc.getString('type', '');
        // 1. check old records
        var documents = this.getDocuments(entity);
        var index = find_document(documents, entity, type);
        if (index < 0) {
            documents.unshift(doc);
        } else if (documents[index].equals(doc)) {
            // same document, no need to update
            return true;
        } else {
            documents.splice(index, 1);
            documents.unshift(doc);
        }
        // 2. save as JsON
        var array = revert_documents(documents);
        var path = db_doc_path(entity);
        return Storage.saveJSON(array, path);
    };

    // Override
    DocumentStorage.prototype.getDocuments = function (entity) {
        var path = db_doc_path(entity);
        var array = Storage.loadJSON(path);
        return !array ? [] : convert_documents(array);
    };

    var convert_documents = function (array) {
        var documents = [];
        var doc;
        for (var i = 0; i < array.length; ++i) {
            doc = DocumentStorage.parse_document(array[i]);
            if (doc) {
                documents.push(doc);
            }
        }
        return documents;
    };

    var revert_documents = function (documents) {
        var array = [];
        for (var i = 0; i < documents.length; ++i) {
            array.push(documents[i].toMap());
        }
        return array;
    };

    var find_document = function (documents, identifier, type) {
        var item;  // Document
        for (var i = 0; i < documents.length; ++i) {
            item = documents[i];
            if (item.getIdentifier().equals(identifier) &&
                item.getString('type', '') === type) {
                return i;
            }
        }
        return -1;
    };

    DocumentStorage.parse_document = function (dict, identifier, type) {
        // check document ID
        var entity = ID.parse(dict['did']);
        if (!entity) {
            entity = ID.parse(dict['ID']);
        }
        if (!identifier) {
            identifier = entity;
        } else if (!identifier.equals(entity)) {
            throw new TypeError('document error: ' + dict);
        }
        // check document type
        if (!type) {
            type = '*';
        }
        var dt = dict['type'];
        if (dt) {
            type = dt;
        }
        // check document data
        var data = dict['data'];
        if (!data) {
            // compatible with v1.0
            data = dict['profile'];
        }
        // check document signature
        var signature = dict['signature'];
        if (!data || !signature) {
            throw new ReferenceError('document error: ' + dict);
        }
        var ted = TransportableData.parse(signature);
        return Document.create(type, identifier, data, ted);
    };
