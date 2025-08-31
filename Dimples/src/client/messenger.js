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

//! require 'common/*.js'

    app.ClientMessenger = function (session, facebook, mdb) {
        CommonMessenger.call(this, session, facebook, mdb);
    };
    var ClientMessenger = app.ClientMessenger;

    Class(ClientMessenger, CommonMessenger, null, null);

        // Override
        ClientMessenger.prototype.deserializeMessage = function (data) {
            var msg = CommonMessenger.prototype.deserializeMessage.call(this, data);
            if (msg && this.checkMessageDuplicated(msg)) {
                msg = null;
            }
            return msg;
        };

        // protected
        ClientMessenger.prototype.checkMessageDuplicated = function (rMsg) {
            Log.warning('TODO: check duplicated message');
        };

        // Override
        ClientMessenger.prototype.processReliableMessage = function (rMsg) {
            var responses = CommonMessenger.prototype.processReliableMessage.call(this, rMsg);
            if (!responses || responses.length === 0) {
                if (this.needsReceipt(rMsg)) {
                    var res = this.buildReceipt(rMsg.getEnvelope());
                    if (res) {
                        responses = [res];
                    }
                }
            }
            return responses;
        };

        // protected
        ClientMessenger.prototype.buildReceipt = function (originalEnvelope) {
            var facebook = this.getFacebook();
            var user = !facebook ? null : facebook.getCurrentUser();
            if (!user) {
                Log.error('failed to get current user');
                return null;
            }
            var me = user.getIdentifier();
            var to = originalEnvelope.getSender();
            var text = 'Message received.';
            var res = ReceiptCommand.create(text, originalEnvelope, null);
            var env = Envelope.create(me, to, null);
            var iMsg = InstantMessage.create(env, res);
            var sMsg = this.encryptMessage(iMsg);
            if (!sMsg) {
                Log.error('failed to encrypt message', user, originalEnvelope.getSender());
                return null;
            }
            var rMsg = this.signMessage(sMsg);
            if (!rMsg) {
                Log.error('failed to sign message', user, originalEnvelope.getSender());
            }
            return rMsg;
        };

        // protected
        ClientMessenger.prototype.needsReceipt = function (rMsg) {
            if (ContentType.COMMAND === rMsg.getType()) {
                // filter for looping message (receipt for receipt)
                return false;
            }
            var sender = rMsg.getSender();
            // var receiver = rMsg.getReceiver();
            // if (EntityType.STATION.equals(receiver.getType()) || EntityType.BOT.equals(receiver.getType())) {
            //     if (EntityType.STATION.equals(sender.getType()) || EntityType.BOT.equals(sender.getType())) {
            //         // message between bots
            //         return false;
            //     }
            // }
            if (!EntityType.USER === sender.getType()/* && !EntityType.USER === receiver.getType()*/) {
                // message between bots
                return false;
            }
            // var facebook = this.getFacebook();
            // var user = !facebook ? null : facebook.getCurrentUser();
            // if (!user || !user.getIdentifier().equals(receiver)) {
            //     // forward message
            //     return true;
            // }
            // TODO: other condition?
            return true;
        };

        // Override
        ClientMessenger.prototype.sendInstantMessage = function (iMsg, priority) {
            var session = this.getSession();
            if (session && session.isReady()) {
                // OK, any message can go out
            } else {
                // not login yet
                var content = iMsg.getContent();
                if (!Interface.conforms(content, Command)) {
                    Log.warning('not handshake yet, suspend message', content, iMsg);
                    // TODO: suspend instant message
                    return null;
                } else if (content.getCmd() === Command.HANDSHAKE) {
                    // NOTICE: only handshake message can go out
                    iMsg.setValue('pass', 'handshaking');
                } else {
                    Log.warning('not handshake yet, drop command', content, iMsg);
                    // TODO: suspend instant message
                    return null;
                }
            }
            return CommonMessenger.prototype.sendInstantMessage.call(this, iMsg, priority);
        };

        // Override
        ClientMessenger.prototype.sendReliableMessage = function (rMsg, priority) {
            var passport = rMsg.removeValue('pass');
            var session = this.getSession();
            if (session && session.isReady()) {
                // OK, any message can go out
            } else if (passport === 'handshaking') {
                // not login yet, let the handshake message go out only
            } else {
                Log.error('not handshake yet, suspend message', rMsg);
                // TODO: suspend reliable message
                return false;
            }
            return CommonMessenger.prototype.sendReliableMessage.call(this, rMsg, priority);
        };

        /**
         *  Send handshake command to current station
         *
         * @param {string|null} sessionKey - respond session key
         */
        ClientMessenger.prototype.handshake = function (sessionKey) {
            var session = this.getSession();
            var station = session.getStation();
            var sid = station.getIdentifier();
            var content;
            if (sessionKey) {
                // handshake again
                content = HandshakeCommand.restart(sessionKey);
                this.sendContent(content, null, sid, -1);
            } else {
                // first handshake
                var facebook = this.getFacebook();
                var user = facebook.getCurrentUser();
                var me = user.getIdentifier();
                var meta = user.getMeta();
                var visa = user.getVisa();
                var env = Envelope.create(me, sid, null);
                content = HandshakeCommand.start();
                // send first handshake command as broadcast message
                content.setGroup(Station.EVERY);
                // create instant message with meta & visa
                var iMsg = InstantMessage.create(env, content);
                MessageUtils.setMeta(meta, iMsg);
                MessageUtils.setVisa(visa, iMsg);
                // iMsg.setMap('meta', meta);
                // iMsg.setMap('visa', visa);
                this.sendInstantMessage(iMsg, -1);
            }
        };

        /**
         *  Callback for handshake success
         */
        ClientMessenger.prototype.handshakeSuccess = function () {
            // change the flag of current session
            Log.info('handshake success, change session accepted');
            var session = this.getSession();
            session.setAccepted(true);
            // broadcast current documents after handshake success
            this.broadcastDocuments();
            // TODO: let a service bot to do this job
        };

        /**
         *  Broadcast meta & visa document to all stations
         */
        ClientMessenger.prototype.broadcastDocuments = function (updated) {
            var facebook = this.getFacebook();
            var user = !facebook ? null : facebook.getCurrentUser();
            var visa = !user ? null : user.getVisa();
            if (!visa) {
                Log.error('visa not found', user);
                return;
            }
            var checker = facebook.getEntityChecker();
            if (!checker) {
                Log.error('entity checker not found');
                return;
            }
            var me = user.getIdentifier();
            //
            //  send to all contacts
            //
            var contacts = facebook.getContacts(me);
            for (var i = 0; i < contacts.length; ++i) {
                checker.sendVisa(visa, contacts[i], updated);
            }
            //
            //  broadcast to 'everyone@everywhere'
            //
            checker.sendVisa(visa, ID.EVERYONE, updated);
        };

        /**
         *  Send login command to keep roaming
         */
        ClientMessenger.prototype.broadcastLogin = function (sender, userAgent) {
            var session = this.getSession();
            var station = session.getStation();
            // create login command
            var content = LoginCommand.create(sender);
            content.setAgent(userAgent);
            content.setStation(station);
            // broadcast to 'everyone@everywhere'
            this.sendContent(content, sender, ID.EVERYONE, 1);
        };

        /**
         *  Send report command to keep user online
         */
        ClientMessenger.prototype.reportOnline = function (sender) {
            var content = ReportCommand.create(ReportCommand.ONLINE);
            this.sendContent(content, sender, Station.ANY, 1);
        };

        /**
         *  Send report command to let user offline
         */
        ClientMessenger.prototype.reportOffline = function (sender) {
            var content = ReportCommand.create(ReportCommand.OFFLINE);
            this.sendContent(content, sender, Station.ANY, 1);
        };
