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

    /**
     *  Group Delegate
     *  ~~~~~~~~~~~~~~
     */
    app.group.GroupDelegate = function (facebook, messenger) {
        TwinsHelper.call(this, facebook, messenger);
        groupBotsManager.setMessenger(messenger);
    };
    var GroupDelegate = app.group.GroupDelegate;

    Class(GroupDelegate, TwinsHelper, [GroupDataSource], {

        buildGroupName: function (members) {
            var barrack = this.getFacebook();
            var text = barrack.getName(members[0]);
            var nickname;
            for (var i = 1; i < members.length; ++i) {
                nickname = barrack.getName(members[i]);
                if (!nickname || nickname.length === 0) {
                    continue;
                }
                text += ', ' + nickname;
                if (text.length > 32) {
                    return text.substring(0, 28) + ' ...';
                }
            }
            return text;
        },

        //
        //  Entity DataSource
        //

        // Override
        getMeta: function (identifier) {
            var barrack = this.getFacebook();
            return !barrack ? null : barrack.getMeta(identifier);
        },

        // Override
        getDocuments: function (identifier) {
            var barrack = this.getFacebook();
            return !barrack ? [] : barrack.getDocuments(identifier);
        },

        getBulletin: function (identifier) {
            var barrack = this.getFacebook();
            return !barrack ? null : barrack.getBulletin(identifier);
        },

        saveDocument: function (doc) {
            var barrack = this.getFacebook();
            return !barrack ? false : barrack.saveDocument(doc);
        },

        //
        //  Group DataSource
        //

        // Override
        getFounder: function (group) {
            var barrack = this.getFacebook();
            return !barrack ? null : barrack.getFounder(group);
        },

        // Override
        getOwner: function (group) {
            var barrack = this.getFacebook();
            return !barrack ? null : barrack.getOwner(group);
        },

        // Override
        getMembers: function (group) {
            var barrack = this.getFacebook();
            return !barrack ? [] : barrack.getMembers(group);
        },

        saveMembers: function (members, group) {
            var barrack = this.getFacebook();
            return !barrack ? false : barrack.saveMembers(members, group);
        },

        //
        //  Group Assistants
        //

        // Override
        getAssistants: function (group) {
            return groupBotsManager.getAssistants(group);
        },

        getFastestAssistant: function (group) {
            return groupBotsManager.getFastestAssistant(group);
        },

        setCommonAssistants: function (bots) {
            groupBotsManager.setCommonAssistants(bots);
        },

        updateRespondTime: function (content, envelope) {
            return groupBotsManager.updateRespondTime(content, envelope);
        },

        //
        //  Administrators
        //

        getAdministrators: function (group) {
            var barrack = this.getFacebook();
            return !barrack ? [] : barrack.getAdministrators(group);
        },

        saveAdministrators: function (admins, group) {
            var barrack = this.getFacebook();
            return !barrack ? false : barrack.saveAdministrators(admins, group);
        },

        //
        //  Membership
        //

        isFounder: function (user, group) {
            var founder = this.getFounder(group);
            if (founder) {
                return founder.equals(user);
            }
            // check member's public key with group's meta.key
            var gMeta = this.getMeta(group);
            var mMeta = this.getMeta(user);
            if (!gMeta || !mMeta) {
                Log.error('failed to get meta for group', group, user);
                return false;
            }
            return gMeta.matchPublicKey(mMeta.getPublicKey());
        },

        isOwner: function (user, group) {
            var owner = this.getOwner(group);
            if (owner) {
                return owner.equals(user);
            }
            if (EntityType.GROUP === group.getType()) {
                // this is a polylogue
                return this.isFounder(user, group);
            }
            Log.error('only polylogue so far', group);
            return false;
        },

        isMember: function (user, group) {
            var members = this.getMembers(group);
            if (!members || members.length === 0) {
                Log.error('group members not ready', group);
                return false;
            }
            for (var i = 0; i < members.length; ++i) {
                if (members[i].equals(user)) {
                    return true;
                }
            }
            return false;
        },

        isAdministrator: function (user, group) {
            var admins = this.getAdministrators(group);
            if (!admins || admins.length === 0) {
                Log.info('group admins not found', group);
                return false;
            }
            for (var i = 0; i < admins.length; ++i) {
                if (admins[i].equals(user)) {
                    return true;
                }
            }
            return false;
        },

        isAssistant: function (user, group) {
            var bots = this.getAssistants(group);
            if (!bots || bots.length === 0) {
                Log.info('group bots not found', group);
                return false;
            }
            for (var i = 0; i < bots.length; ++i) {
                if (bots[i].equals(user)) {
                    return true;
                }
            }
            return false;
        }

    });


    /**
     *  Triplets Helper
     *  ~~~~~~~~~~~~~~~
     *  facebook messenger, archivist
     */
    app.group.TripletsHelper = function (delegate) {
        BaseObject.call(this);
        this.__delegate = delegate;  // GroupDelegate
    };
    var TripletsHelper = app.group.TripletsHelper;

    Class(TripletsHelper, BaseObject, null, null);

    // protected
    TripletsHelper.prototype.getDelegate = function () {
        return this.__delegate;
    };
    // protected
    TripletsHelper.prototype.getFacebook = function () {
        var delegate = this.getDelegate();
        return delegate.getFacebook();
    };
    // protected
    TripletsHelper.prototype.getMessenger = function () {
        var delegate = this.getDelegate();
        return delegate.getMessenger();
    };
    // protected
    TripletsHelper.prototype.getArchivist = function () {
        var facebook = this.getFacebook();
        return !facebook ? null : facebook.getArchivist();
    };
    // protected
    TripletsHelper.prototype.getDatabase = function () {
        var archivist = this.getArchivist();
        return !archivist ? null : archivist.getDatabase();
    };

    /**
     *  Group Bots Manager
     *  ~~~~~~~~~~~~~~~~~~
     */
    // private
    app.group.GroupBotsManager = function () {
        Runner.call(this);
        this.__transceiver = null;     // CommonMessenger
        this.__commonAssistants = [];  // List<ID>
        this.__candidates = [];        // Set<ID>
        this.__respondTimes = {};      // ID => milliseconds
    };
    var GroupBotsManager = app.group.GroupBotsManager;

    Class(GroupBotsManager, Runner, null);

    GroupBotsManager.prototype.setMessenger = function (messenger) {
        this.__transceiver = messenger;
    };
    // private
    GroupBotsManager.prototype.getMessenger = function () {
        return this.__transceiver;
    };
    // private
    GroupBotsManager.prototype.getFacebook = function () {
        var messenger = this.getMessenger();
        return !messenger ? null : messenger.getFacebook();
    };

    /**
     *  When received receipt command from the bot
     *  update the speed of this bot.
     *
     * @param {dkd.protocol.ReceiptCommand} content
     * @param {dkd.protocol.Envelope} envelope
     * @return {boolean}
     */
    GroupBotsManager.prototype.updateRespondTime = function (content, envelope) {
        // var app = content.getValue('app');
        // if (!app) {
        //     app = content.getValue('app_id');
        //     if (app !== 'chat.dim.group.assistant') {
        //         return false;
        //     }
        // }
        // 1. check sender
        var sender = envelope.getSender();
        if (!EntityType.BOT === sender.getType()) {
            return false;
        }
        var origin = content.getOriginalEnvelope();
        var originalReceiver = !origin ? null : origin.getReceiver();
        if (!sender.equals(originalReceiver)) {
            // sender error
            return false;
        }
        // 2. check send time
        var time = !origin ? null : origin.getTime();
        if (!time) {
            // original time not found
            return false;
        }
        var duration = (new Date()).getTime() - time.getTime();
        if (duration <= 0) {
            // receipt time error
            return false;
        }
        // check duration
        var cached = this.__respondTimes[sender];
        if (cached && cached <= duration) {
            return false;
        }
        this.__respondTimes[sender] = duration;
        return true;
    };

    /**
     *  When received new config from current Service Provider,
     *  set common assistants of this SP.
     *
     * @param {ID[]} bots
     */
    GroupBotsManager.prototype.setCommonAssistants = function (bots) {
        addCandidateBots(this.__candidates, bots);
        this.__commonAssistants = bots;
    };

    var addCandidateBots = function (toSet, fromItems) {
        var item;
        for (var i = 0; i < fromItems.length; ++i) {
            item = fromItems[i];
            if (toSet.indexOf(item) <= 0) {
                toSet.push(item);
            }
        }
    };

    GroupBotsManager.prototype.getAssistants = function (group) {
        var facebook = this.getFacebook();
        var bots = !facebook ? null : facebook.getAssistants(group);
        if (!bots || bots.length === 0) {
            return this.__commonAssistants;
        }
        addCandidateBots(this.__candidates, bots);
        return bots;
    };

    GroupBotsManager.prototype.getFastestAssistant = function (group) {
        var bots = this.getAssistants(group);
        if (!bots || bots.length === 0) {
            Log.warning('group bots not found: ' + group.toString());
            return null;
        }
        var prime = null;   // ID
        var primeDuration;  // milliseconds
        var duration;       // milliseconds
        var ass;            // ID
        for (var i = 0; i < bots.length; ++i) {
            ass = bots[i];
            duration = this.__respondTimes[ass];
            if (!duration) {
                Log.info('group bot not respond yet, ignore it', ass, group);
                continue;
            } else if (!primeDuration) {
                // first responded bot
            } else if (primeDuration < duration) {
                Log.info('this bot is slower, skip it', ass, prime, group);
                continue;
            }
            prime = ass;
            primeDuration = duration;
        }
        if (!prime) {
            prime = bots[0];
            Log.info('no bot responded, take the first one', bots, group);
        } else {
            Log.info('got the fastest bot with respond time', primeDuration, prime, group);
        }
        return prime;
    };

    // Override
    GroupBotsManager.prototype.process = function () {
        var messenger = this.getMessenger();
        var facebook = this.getFacebook();
        if (!facebook || !messenger) {
            return false;
        }
        //
        //  1. check session
        //
        var session = messenger.getSession();
        if (session && session.getSessionKey() && session.isActive()) {
            // session is active
        } else {
            // not login yet
            return false;
        }
        //
        //  2. get visa
        //
        var visa;
        try {
            var me = facebook.getCurrentUser();
            visa = !me ? null : me.getVisa();
            if (!visa) {
                Log.error('failed to get visa', me);
                return false;
            }
        } catch (e) {
            Log.error('failed to get current user', e);
            return false;
        }
        //
        //  3. check candidates
        //
        var bots = this.__candidates;
        this.__candidates = {};
        var item;
        for (var i = 0; i < bots.length; ++i) {
            item = bots[i];
            if (this.__respondTimes[item]) {
                // no need to check again
                Log.info('group bot already responded', item);
                continue;
            }
            // no respond yet, try to push visa to the bot
            try {
                messenger.sendVisa(visa, item, false);
            } catch (e) {
                Log.error('failed to query assistant', item, e);
            }
        }
        return false;
    };

    var groupBotsManager = new GroupBotsManager();

    var threadForGroupBotsManager = new Thread(groupBotsManager);
    threadForGroupBotsManager.start();
