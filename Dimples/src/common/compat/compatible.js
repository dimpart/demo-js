'use strict';
// license: https://mit-license.org
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

    // TODO: remove after all server/client upgraded
    app.compat.Compatible = {

        fixMetaAttachment: function (rMsg) {
            var meta = rMsg.getValue('meta');
            if (meta) {
                fixMetaVersion(meta);
            }
        },
        // fixMetaType: function (meta) {
        //     fixMetaVersion(meta);
        // },

        fixVisaAttachment: function (rMsg) {
            var visa = rMsg.getValue('visa');
            if (visa) {
                fixDocument(visa);
            }
        }
        // fixDocumentID: function (document) {
        //     fixDocId(document);
        // }

    };
    var Compatible = app.compat.Compatible;

    /**
     *  'type' <-> 'version'
     */
    var fixMetaVersion = function (meta) {
        var type = meta['type'];
        if (!type) {
            type = meta['version'];
        } else if (IObject.isString(type) && !meta['algorithm']) {
            // TODO: check number
            if (type.length > 2) {
                meta['algorithm'] = type;
            }
        }
        var version = MetaVersion.parseInt(type, 0);
        if (version > 0) {
            meta['type'] = version;
            meta['version'] = version;
        }
    };

    /**
     *  'ID' <-> 'did'
     */
    var fixDocument = function (document) {
        fixDid(document);
        return document;
    };
    var fixDid = function (content) {
        var did = content['did'];
        if (!did) {
            // 'did' not exists, copy the value from 'ID'
            did = content['ID'];
            if (did) {
                content['did'] = did;
            } else {
                console.assert(false, 'did not exists:', content);
            }
        } else if (content['ID']) {
            // these two values must be equal
            console.assert(content['ID'] === did, 'did error:', content);
        } else {
            // copy value from 'did' to 'ID'
            content['ID'] = did;
        }
    };

    /**
     *  'cmd' <-> 'command'
     */
    var fixCmd = function (content) {
        var cmd = content['command'];
        if (!cmd) {
            cmd = content['cmd'];
            if (cmd) {
                content['command'] = cmd;
            } else {
                console.assert(false, 'command error:', content);
            }
        } else if (content['cmd']) {
            // these two values must be equal
            console.assert(content['cmd'] === cmd, 'command error:', content);
        } else {
            // copy value from 'command' to 'cmd'
            content['cmd'] = cmd;
        }
    };

    var fixFileContent = function (content) {
        var pwd = content['key'];
        if (pwd) {
            // Tarsier version > 1.3.7
            // DIM SDK version > 1.1.0
            content['password'] = pwd;
        } else {
            // Tarsier version <= 1.3.7
            // DIM SDK version <= 1.1.0
            pwd = content['password'];
            if (pwd) {
                content['key'] = pwd;
            }
        }
    };

    var fileTypes = [
        ContentType.FILE, 'file',
        ContentType.IMAGE, 'image',
        ContentType.AUDIO, 'audio',
        ContentType.VIDEO, 'video'
    ];

    var array_contains = function (array, value) {
        var i = array.length - 1;
        for (; i >= 0; --i) {
            if (array[i] === value) {
                return true;
            }
        }
        return false;
    };

    // TODO: remove after all server/client upgraded
    app.compat.CompatibleIncoming = {

        fixContent: function (content) {
            // get content type
            var type = Converter.getString(content['type'], '');

            if (array_contains(fileTypes, type)) {
                // 1. 'key' <-> 'password'
                fixFileContent(content);
                return;
            }

            if (ContentType.NAME_CARD === type || type === 'card') {
                // 1. 'ID' <-> 'did'
                fixDid(content);
                return;
            }

            if (ContentType.COMMAND === type || type === 'command') {
                // 1. 'cmd' <-> 'command'
                fixCmd(content);
            }
            //
            //  get command name
            //
            var cmd = Converter.getString(content['command'], '');
            if (!cmd/* || cmd.length === 0*/) {
                return;
            }

            // if (Command.RECEIPT === cmd) {
            //     // pass
            // }

            if (Command.LOGIN === cmd) {
                // 2. 'ID' <-> 'did'
                fixDid(content);
                return;
            }

            if (Command.DOCUMENTS === cmd || cmd === 'document') {
                // 2. cmd: 'document' -> 'documents'
                this._fixDocs(content);
            }

            if (Command.META === cmd || Command.DOCUMENTS === cmd || cmd === 'document') {
                // 3. 'ID' <-> 'did'
                fixDid(content);

                var meta = content['meta'];
                if (meta) {
                    // 4. 'type' <-> 'version'
                    fixMetaVersion(meta);
                }
            }

        },

        _fixDocs: function (content) {
            // cmd: 'document' -> 'documents'
            var cmd = content['command'];
            if (cmd === 'document') {
                content['command'] = 'documents';
            }
            // 'document' -> 'documents
            var doc = content['document'];
            if (doc) {
                content['documents'] = [fixDocument(doc)];
                delete content['document'];
            }
        }

    };
    var CompatibleIncoming = app.compat.CompatibleIncoming;

    /**
     *  Change 'type' value from string to int
     */
    var fixType = function (content) {
        var type = content['type'];
        if (IObject.isString(type)) {
            var number = Converter.getInt(type, 0);
            if (number >= 0) {
                content['type'] = number;
            }
        }
    };

    /// TODO: remove after all server/client upgraded
    app.compat.CompatibleOutgoing = {

        fixContent: function (content) {
            // fix content type
            fixType(content.toMap());

            if (Interface.conforms(content, FileContent)) {
                // 1. 'key' <-> 'password'
                fixFileContent(content.toMap());
                return;
            }

            if (Interface.conforms(content, NameCard)) {
                // 1. 'ID' <-> 'did'
                fixDid(content.toMap());
                return;
            }

            if (Interface.conforms(content, Command)) {
                // 1. 'cmd' <-> 'command'
                fixCmd(content.toMap());
            }

            if (Interface.conforms(content, ReceiptCommand)) {
                // 2. check for v2.0
                fixReceiptCommand(content.toMap());
                return;
            }

            if (Interface.conforms(content, LoginCommand)) {
                // 2. 'ID' <-> 'did'
                fixDid(content.toMap());
                // 3. fix station
                var station = content['station'];
                if (typeof station === 'object') {
                    fixDid(station);
                }
                // 4. fix provider
                var provider = content['provider'];
                if (typeof provider === 'object') {
                    fixDid(provider);
                }
                return;
            }

            // if (Interface.conforms(content, ReportCommand)) {
            //   // check state for oldest version
            // }

            if (Interface.conforms(content, DocumentCommand)) {
                // 2. cmd: 'documents' -> 'document'
                this._fixDocs(content);
            }

            if (Interface.conforms(content, MetaCommand)) {
                // 3. 'ID' <-> 'did'
                fixDid(content.toMap());

                var meta = content['meta'];
                if (meta) {
                    // 4. 'type' <-> 'version'
                    fixMetaVersion(meta);
                }
            }
        },

        _fixDocs: function (content) {
            // cmd: 'documents' -> 'document'
            var cmd = content.getCmd();
            if (cmd === 'documents') {
                content['cmd'] = 'document';
                content['command'] = 'document';
            }
            // 'documents' -> 'document'
            var array = content['documents'];
            if (array instanceof Array) {
                var docs = Document.convert(array);
                var last = DocumentUtils.lastDocument(docs);
                if (last != null) {
                    content['document'] = fixDocument(last.toMap());
                }
                if (docs.length === 1) {
                    delete content['documents'];
                }
            }
            var document = content['document'];
            if (typeof document === 'object') {
                fixDid(document);
            }
        }

    };
    var CompatibleOutgoing = app.compat.CompatibleOutgoing

    var fixReceiptCommand = function (content) {
        // TODO: check for v2.0
    };
