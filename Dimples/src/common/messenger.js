'use strict';
// license: https://mit-license.org
//
//  DIMPLES: DIMP Library for Easy Startup
//
//                               Written in 2021 by Moky <albert.moky@gmail.com>
//
// =============================================================================
// The MIT License (MIT)
//
// Copyright (c) 2021 Albert Moky
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
//! require 'mem/*.js'
//! require 'network/*.js'

    app.CommonMessenger = function (session, facebook, database) {
        Messenger.call(this);
        this.__session = session;    // Session
        this.__facebook = facebook;  // CommonFacebook
        this.__database = database;  // CipherKeyDelegate
        this.__packer = null;        // Packer
        this.__processor = null;     // Processor
        this.__compressor = new CompatibleCompressor();
    };
    var CommonMessenger = app.CommonMessenger;

    Class(CommonMessenger, Messenger, null, null);

    CommonMessenger.prototype.getSession = function () {
        return this.__session;
    };

    CommonMessenger.prototype.getDatabase = function () {
        return this.__database;
    };

    // Override
    CommonMessenger.prototype.getFacebook = function () {
        return this.__facebook;
    };

    // Override
    CommonMessenger.prototype.getCompressor = function () {
        return this.__compressor;
    };

    // Override
    CommonMessenger.prototype.getCipherKeyDelegate = function () {
        return this.__database;
    };

    // Override
    CommonMessenger.prototype.getPacker = function () {
        return this.__packer;
    };
    CommonMessenger.prototype.setPacker = function (packer) {
        this.__packer = packer;
    };

    // Override
    CommonMessenger.prototype.getProcessor = function () {
        return this.__processor;
    };
    CommonMessenger.prototype.setProcessor = function (processor) {
        this.__processor = processor;
    };

    // Override
    CommonMessenger.prototype.serializeMessage = function (rMsg) {
        Compatible.fixMetaAttachment(rMsg);
        Compatible.fixVisaAttachment(rMsg);
        return Messenger.prototype.serializeMessage.call(this, rMsg);
    };

    // Override
    CommonMessenger.prototype.deserializeMessage = function (data) {
        if (!data || data.length <= 8) {
            // message data error
            return null;
        // } else if (data[0] !== '{' || data[data.length-1] !== '}') {
        //     // only support JsON format now
        //     return null;
        }
        var rMsg = Messenger.prototype.deserializeMessage.call(this, data);
        if (rMsg) {
            Compatible.fixMetaAttachment(rMsg);
            Compatible.fixVisaAttachment(rMsg);
        }
        return rMsg;
    };

    //-------- InstantMessageDelegate

    // Override
    CommonMessenger.prototype.encryptKey = function (keyData, receiver, iMsg) {
        try {
            return Messenger.prototype.encryptKey.call(this, keyData, receiver, iMsg);
        } catch (e) {
            // FIXME:
            Log.error('failed to encrypt key for receiver', receiver, e);
            return null;
        }
    };

    // Override
    CommonMessenger.prototype.serializeKey = function (password, iMsg) {
        // TODO: reuse message key

        // 0. check message key
        var reused = password.getValue('reused');
        var digest = password.getValue('digest');
        if (reused === null && digest === null) {
            // flags not exist, serialize it directly
            return Messenger.prototype.serializeKey.call(this, password, iMsg);
        }
        // 1. remove before serializing key
        password.removeValue('reused');
        password.removeValue('digest');
        // 2. serialize key without flags
        var data = Messenger.prototype.serializeKey.call(this, password, iMsg);
        // 3. put them back after serialized
        if (Converter.getBoolean(reused, false)) {
            password.setValue('reused', true);
        }
        if (digest) {
            password.setValue('digest', digest);
        }
        // OK
        return data;
    };

    // Override
    CommonMessenger.prototype.serializeContent = function (content, password, iMsg) {
        CompatibleOutgoing.fixContent(content);
        return Messenger.prototype.serializeContent.call(this, content, password, iMsg);
    };

    //
    //  Interfaces for Transmitting Message
    //

    // Override
    CommonMessenger.prototype.sendContent = function (content, sender, receiver, priority) {
        if (!sender) {
            var facebook = this.getFacebook();
            var current = facebook.getCurrentUser();
            sender = current.getIdentifier();
        }
        var env = Envelope.create(sender, receiver, null);
        var iMsg = InstantMessage.create(env, content);
        var rMsg = this.sendInstantMessage(iMsg, priority);
        return [iMsg, rMsg];
    };

    // private
    CommonMessenger.prototype.attachVisaTime = function (sender, iMsg) {
        if (Interface.conforms(iMsg.getContent(), Command)) {
            // no need to attach times for command
            return false;
        }
        var facebook = this.getFacebook();
        var doc = facebook.getVisa(sender);
        if (!doc) {
            Log.warning('failed to get visa document for sender', sender);
            return false;
        }
        // attach sender document time
        var lastDocumentTime = doc.getTime();
        if (!lastDocumentTime) {
            Log.error('document error:', doc);
            return false;
        }
        iMsg.setDateTime('SDT', lastDocumentTime);
        return true;
    };

    // Override
    CommonMessenger.prototype.sendInstantMessage = function (iMsg, priority) {
        var sender = iMsg.getSender();
        var receiver = iMsg.getReceiver();
        //
        //  0. check cycled message
        //
        if (sender.equals(receiver)) {
            Log.warning('drop cycled message', iMsg.getContent(), sender, receiver, iMsg.getGroup());
            return null;
        } else {
            Log.debug('send instant message, type:' + iMsg.getContent().getType(), sender, receiver, iMsg.getGroup());
            // attach sender's document times
            // for the receiver to check whether user info synchronized
            this.attachVisaTime(sender, iMsg);
        }
        //
        //  1. encrypt message
        //
        var sMsg = this.encryptMessage(iMsg);
        if (!sMsg) {
            // assert(false, 'public key not found?');
            return null;
        }
        //
        //  2. sign message
        //
        var rMsg = this.signMessage(sMsg);
        if (!rMsg) {
            // TODO: set msg.state = error
            throw new Error('failed to sign message: ' + sMsg.toString());
        }
        //
        //  3. send message
        //
        if (this.sendReliableMessage(rMsg, priority)) {
            return rMsg;
        } else {
            // failed
            return null;
        }
    };

    // Override
    CommonMessenger.prototype.sendReliableMessage = function (rMsg, priority) {
        var sender = rMsg.getSender();
        var receiver = rMsg.getReceiver();
        //
        //  0. check cycled message
        //
        if (sender.equals(receiver)) {
            Log.warning('drop cycled message', sender, receiver, rMsg.getGroup());
            return false;
        }
        // 1. serialize message
        var data = this.serializeMessage(rMsg);
        if (!data || data.length === 0) {
            Log.error('failed to serialize message', rMsg);
            return false;
        }
        // 2. call gate keeper to send the message data package
        //    put message package into the waiting queue of current session
        var session = this.getSession();
        return session.queueMessagePackage(rMsg, data, priority);
    };
