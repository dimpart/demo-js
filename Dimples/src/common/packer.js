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

    app.CommonPacker = function (facebook, messenger) {
        MessagePacker.call(this, facebook, messenger);
    };
    var CommonPacker = app.CommonPacker;

    Class(CommonPacker, MessagePacker, null);

    /**
     *  Add income message in a queue for waiting sender's visa
     *
     * @param {ReliableMessage} rMsg - incoming message
     * @param {{}} info              - error info
     */
    // protected
    CommonPacker.prototype.suspendReliableMessage = function (rMsg, info) {};

    /**
     *  Add outgo message in a queue for waiting receiver's visa
     *
     * @param {InstantMessage} iMsg - outgo message
     * @param {{}} info             - error info
     */
    // protected
    CommonPacker.prototype.suspendInstantMessage = function (iMsg, info) {};

    //
    //  Checking
    //

    /**
     *  for checking whether user's ready
     */
    // protected
    CommonPacker.prototype.getVisaKey = function (user) {
        var facebook = this.getFacebook();
        return facebook.getPublicKeyForEncryption(user);
    };

    /**
     *  Check sender before verifying received message
     *
     * @param {ReliableMessage|dkd.protocol.Message} rMsg - network message
     * @return {boolean} false on verify key not found
     */
    // protected
    CommonPacker.prototype.checkSender = function (rMsg) {
        var sender = rMsg.getSender();
        // check sender's meta & document
        var visa = MessageUtils.getVisa(rMsg);
        if (visa) {
            // first handshake?
            return visa.getIdentifier().equals(sender);
        } else if (this.getVisaKey(sender)) {
            // sender is OK
            return true;
        }
        // sender not ready, suspend message for waiting document
        var error = {
            'message': 'verify key not found',
            'user': sender.toString()
        };
        this.suspendReliableMessage(rMsg, error);  // rMsg.put("error", error);
        return false;
    };

    /**
     *  Check receiver before encrypting message
     *
     * @param {InstantMessage|dkd.protocol.Message} iMsg - plain message
     * @return {boolean} false on encrypt key not found
     */
    // protected
    CommonPacker.prototype.checkReceiver = function (iMsg) {
        var receiver = iMsg.getReceiver();
        if (receiver.isBroadcast()) {
            // broadcast message
            return true;
        } else if (receiver.isGroup()) {
            // NOTICE: station will never send group message, so
            //         we don't need to check group info here; and
            //         if a client wants to send group message,
            //         that should be sent to a group bot first,
            //         and the bot will split it for all members.
            return false;
        } else if (this.getVisaKey(receiver)) {
            // receiver is OK
            return true;
        }
        // receiver not ready, suspend message for waiting document
        var error = {
            'message': 'encrypt key not found',
            'user': receiver.toString()
        };
        this.suspendInstantMessage(iMsg, error);  // iMsg.put("error", error);
        return false;
    };

    //
    //  Packing
    //

    // Override
    CommonPacker.prototype.encryptMessage = function (iMsg) {
        // make sure visa.key exists before encrypting message

        //
        //  Check FileContent
        //  ~~~~~~~~~~~~~~~~~
        //  You must upload file data before packing message.
        //
        var content = iMsg.getContent();
        if (Interface.conforms(content, FileContent) && content.getData()) {
            var sender = iMsg.getSender();
            var receiver = iMsg.getReceiver();
            var group = iMsg.getGroup();
            var error = 'You should upload file data before calling ' +
                'sendInstantMessage: ' + sender.toString() + ' -> ' + receiver.toString();
            if (group) {
                error += ' (' + group.toString() + ')';
            }
            Log.error(error);
            return false;
        }

        // the intermediate node(s) can only get the message's signature,
        // but cannot know the 'sn' because it cannot decrypt the content,
        // this is usually not a problem;
        // but sometimes we want to respond a receipt with original sn,
        // so I suggest to expose 'sn' here.
        iMsg.setValue('sn', content.getSerialNumber());

        // 1. check contact info
        // 2. check group members info
        if (this.checkReceiver(iMsg)) {
            // receiver is ready
        } else {
            Log.warning('receiver not ready', iMsg.getReceiver());
            return null;
        }
        return MessagePacker.prototype.encryptMessage.call(this, iMsg);
    };

    // Override
    CommonPacker.prototype.verifyMessage = function (rMsg) {
        // 1. check receiver/group with local user
        // 2. check sender's visa info
        if (this.checkSender(rMsg)) {
            // sender is ready
        } else {
            Log.warning('sender not ready', rMsg.getSender());
            return null;
        }
        return MessagePacker.prototype.verifyMessage.call(this, rMsg);
    };

    // Override
    CommonPacker.prototype.signMessage = function (sMsg) {
        if (Interface.conforms(sMsg, ReliableMessage)) {
            // already signed
            return sMsg;
        }
        return MessagePacker.prototype.signMessage.call(this, sMsg);
    };
