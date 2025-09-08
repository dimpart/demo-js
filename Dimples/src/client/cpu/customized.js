'use strict';
// license: https://mit-license.org
//
//  DIM-SDK : Decentralized Instant Messaging Software Development Kit
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


    /**
     *  Customized Content Processing Unit
     *  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     *  Handle content for application customized
     */
    app.cpu.AppCustomizedProcessor = function (facebook, messenger) {
        CustomizedContentProcessor.call(this, facebook, messenger);
        this.__handlers = {};  // String => CustomizedContentHandler
    };
    var AppCustomizedProcessor = app.cpu.AppCustomizedProcessor;

    Class(AppCustomizedProcessor, CustomizedContentProcessor, null);

    AppCustomizedProcessor.prototype.setHandler = function (app, mod, handler) {
        this.__handlers[app + ':' + mod] = handler;
    };

    // protected
    AppCustomizedProcessor.prototype.getHandler = function (app, mod) {
        return this.__handlers[app + ':' + mod];
    };

    // Override
    AppCustomizedProcessor.prototype.filter = function (app, mod, content, rMsg) {
        var handler = this.getHandler(app, mod);
        if (handler) {
            return handler;
        }
        // default handler
        return CustomizedContentProcessor.prototype.filter.call(this, app, mod, content, rMsg);
    };


    /*  Command Transform:

        +===============================+===============================+
        |      Customized Content       |      Group Query Command      |
        +-------------------------------+-------------------------------+
        |   "type" : i2s(0xCC)          |   "type" : i2s(0x88)          |
        |   "sn"   : 123                |   "sn"   : 123                |
        |   "time" : 123.456            |   "time" : 123.456            |
        |   "app"  : "chat.dim.group"   |                               |
        |   "mod"  : "history"          |                               |
        |   "act"  : "query"            |                               |
        |                               |   "command"   : "query"       |
        |   "group"     : "{GROUP_ID}"  |   "group"     : "{GROUP_ID}"  |
        |   "last_time" : 0             |   "last_time" : 0             |
        +===============================+===============================+
     */
    app.cpu.GroupHistoryHandler = function (facebook, messenger) {
        BaseCustomizedHandler.call(this, facebook, messenger);
    };
    var GroupHistoryHandler = app.cpu.GroupHistoryHandler;

    Class(GroupHistoryHandler, BaseCustomizedHandler, null);

    // Override
    GroupHistoryHandler.prototype.handleAction = function (act, sender, content, rMsg) {
        if (content.getGroup() === null) {
            var text = 'Group command error.';
            return this.respondReceipt(text, rMsg.getEnvelope(), content, null);
        } else if (GroupHistory.ACT_QUERY === act) {
            return transformQueryCommand.call(this, content, rMsg);
        }
        return BaseCustomizedHandler.prototype.handleAction.call(this, act, sender, content, rMsg);
    };

    var transformQueryCommand = function (content, rMsg) {
        var transceiver = this.getMessenger();
        if (!transceiver) {
            return [];
        }
        var info = content.copyMap(false);
        info['type'] = ContentType.COMMAND;
        info['command'] = GroupCommand.QUERY;
        var query = Content.parse(info);
        if (Interface.conforms(query, QueryCommand)) {
            return transceiver.processContent(query, rMsg);
        }
        var text = 'Query command error.';
        return this.respondReceipt(text, rMsg.getEnvelope(), content, null);
    };
