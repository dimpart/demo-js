'use strict';
// license: https://mit-license.org
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
     *  Extensions Loader
     *  ~~~~~~~~~~~~~~~~~
     */
    app.compat.CommonExtensionLoader = function () {
        ExtensionLoader.call(this);
    };
    var CommonExtensionLoader = app.compat.CommonExtensionLoader;

    Class(CommonExtensionLoader, ExtensionLoader, null, {

        /**
         *  Customized content factories
         */
        // Override
        registerCustomizedFactories: function () {

            // Application Customized
            this.setContentFactory(ContentType.CUSTOMIZED, 'customized', null, AppCustomizedContent);
            this.setContentFactory(ContentType.APPLICATION, 'application', null, AppCustomizedContent);

            // ExtensionLoader.prototype.registerCustomizedFactories.call(this);
        },

        // Override
        registerCommandFactories: function () {
            ExtensionLoader.prototype.registerCommandFactories.call(this);

            // // ANS
            // this.setCommandFactory(Command.ANS, null, BaseAnsCommand);

            // Handshake
            this.setCommandFactory(Command.HANDSHAKE, null, BaseHandshakeCommand);
            // Login
            this.setCommandFactory(Command.LOGIN, null, BaseLoginCommand);

            // Mute
            this.setCommandFactory(Command.MUTE, null, BaseMuteCommand);
            // Block
            this.setCommandFactory(Command.BLOCK, null, BaseBlockCommand);

            // Report: online, offline
            this.setCommandFactory(Command.REPORT, null, BaseReportCommand);
            this.setCommandFactory(Command.ONLINE, null, BaseReportCommand);
            this.setCommandFactory(Command.OFFLINE, null, BaseReportCommand);

            // Group command (deprecated)
            this.setCommandFactory(GroupCommand.QUERY, null, QueryGroupCommand);
        }

    });


    app.compat.CommonPluginLoader = function () {
        PluginLoader.call(this);
    };
    var CommonPluginLoader = app.compat.CommonPluginLoader;

    Class(CommonPluginLoader, PluginLoader, null, {

        // Override
        registerIDFactory: function () {
            ID.setFactory(new EntityIDFactory());
        },
        
        // Override
        registerAddressFactory: function () {
            Address.setFactory(new CompatibleAddressFactory());
        },
        
        // Override
        registerMetaFactories: function () {
            var mkm = new CompatibleMetaFactory(MetaType.MKM);
            var btc = new CompatibleMetaFactory(MetaType.BTC);
            var eth = new CompatibleMetaFactory(MetaType.ETH);

            Meta.setFactory('1', mkm);
            Meta.setFactory('2', btc);
            Meta.setFactory('4', eth);

            Meta.setFactory('mkm', mkm);
            Meta.setFactory('btc', btc);
            Meta.setFactory('eth', eth);

            Meta.setFactory('MKM', mkm);
            Meta.setFactory('BTC', btc);
            Meta.setFactory('ETH', eth);
        }
    });

    // TODO: replace [\n\r\t] for Base64 coder

    // TODO: set created time for RSA private/public keys

    // TODO: safe converter
