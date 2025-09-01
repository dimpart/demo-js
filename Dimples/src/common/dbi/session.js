'use strict';
// license: https://mit-license.org
//
//  DBI : Database Interface
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

//! require <dimsdk.js>

    app.dbi.ProviderInfo = function (pid, chosen) {
        this.__identifier = pid;
        this.__chosen = chosen;
    };
    var ProviderInfo = app.dbi.ProviderInfo;

    Class(ProviderInfo, null, null);

    ProviderInfo.prototype.getIdentifier = function () {
        return this.__identifier;
    };

    ProviderInfo.prototype.getChosen = function () {
        return this.__chosen;
    };
    ProviderInfo.prototype.setChosen = function (chosen) {
        this.__chosen = chosen;
    };

    // default service provider
    ProviderInfo.GSP = new Identifier('gsp@everywhere', 'gsp', Address.EVERYWHERE, null);

    //
    //  Conveniences
    //

    ProviderInfo.convert = function (array) {
        var providers = [];  // List<ProviderInfo>
        var identifier;      // ID
        var chosen;          // boolean
        var item;
        for (var i = 0; i < array.length; ++i) {
            item = array[i];
            identifier = ID.parse(item['did']);
            chosen = Converter.getInt(item['chosen'], 0);
            if (!identifier) {
                // SP ID error
                continue;
            }
            providers.push(new ProviderInfo(identifier, chosen));
        }
        return providers;
    };

    ProviderInfo.revert = function (providers) {
        var array = [];
        var info;
        for (var i = 0; i < providers.length; ++i) {
            info = providers[i];
            array.push({
                'did': info.getIdentifier().toString(),
                'chosen': info.getChosen()
            });
        }
        return array;
    };


    /**
     *  Session DBI
     *  ~~~~~~~~~~~
     */
    app.dbi.ProviderDBI = Interface(null, null);
    var ProviderDBI = app.dbi.ProviderDBI;

    /**
     *  Get all providers
     *
     * @return {ProviderInfo[]} provider list (ID, chosen)
     */
    ProviderDBI.prototype.allProviders = function () {};

    /**
     *  Add provider info
     *
     * @param {ID} identifier  - sp ID
     * @param {boolean} chosen - whether current sp
     * @return {boolean} false on failed
     */
    ProviderDBI.prototype.addProvider = function (identifier, chosen) {};

    /**
     *  Update provider info
     *
     * @param {ID} identifier  - sp ID
     * @param {boolean} chosen - whether current sp
     * @return {boolean} false on failed
     */
    ProviderDBI.prototype.updateProvider = function (identifier, chosen) {};

    /**
     *  Remove provider info
     *
     * @param {ID} identifier  - sp ID
     * @return {boolean} false on failed
     */
    ProviderDBI.prototype.removeProvider = function (identifier) {};


    app.dbi.StationInfo = function (sid, chosen, host, port, provider) {
        this.__identifier = sid;
        this.__chosen = chosen;
        this.__host = host;
        this.__port = port;
        this.__provider = provider;
    };
    var StationInfo = app.dbi.StationInfo;

    Class(StationInfo, null, null);

    StationInfo.prototype.getIdentifier = function () {
        return this.__identifier;
    };

    StationInfo.prototype.getChosen = function () {
        return this.__chosen;
    };
    StationInfo.prototype.setChosen = function (chosen) {
        this.__chosen = chosen;
    };

    StationInfo.prototype.getHost = function () {
        return this.__host;
    };
    StationInfo.prototype.getPort = function () {
        return this.__port;
    };

    StationInfo.prototype.getProvider = function () {
        return this.__provider;
    };

    //
    //  Conveniences
    //

    StationInfo.convert = function (array) {
        var stations = [];  // List<StationInfo>
        var sid;            // ID
        var chosen;         // boolean
        var host;           // String
        var port;           // int
        var provider;       // ID
        var item;
        for (var i = 0; i < array.length; ++i) {
            item = array[i];
            sid = ID.parse(item['did']);
            chosen = Converter.getInt(item['chosen'], 0);
            host = Converter.getString(item['host'], null);
            port = Converter.getInt(item['port'], 0);
            provider = ID.parse(item['provider']);
            if (!host || port === 0/* || !provider*/) {
                // station socket error
                continue;
            }
            stations.push(new StationInfo(sid, chosen, host, port, provider));
        }
        return stations;
    };

    StationInfo.revert = function (stations) {
        var array = [];
        var info;
        for (var i = 0; i < stations.length; ++i) {
            info = stations[i];
            array.push({
                'did': info.getIdentifier().toString(),
                'chosen': info.getChosen(),
                'host': info.getHost(),
                'port': info.getPort(),
                'provider': info.getProvider().toString()
            });
        }
        return array;
    };

    /**
     *  Session DBI
     *  ~~~~~~~~~~~
     */
    app.dbi.StationDBI = Interface(null, null);
    var StationDBI = app.dbi.StationDBI;

    /**
     *  Get all stations of this sp
     *
     * @param {ID} provider - sp ID (default is 'gsp@everywhere')
     * @return {StationInfo[]} station list ((host, port), sp, chosen)
     */
    StationDBI.prototype.allStations = function (provider) {};

    /**
     *  Add station info with sp ID
     *
     * @param {ID} sid         - station ID
     * @param {boolean} chosen - whether current station
     * @param {String} host    - station IP
     * @param {uint} port      - station port
     * @param {ID} provider    - sp ID
     * @return {boolean} false on failed
     */
    StationDBI.prototype.addStation = function (sid, chosen, host, port, provider) {};

    /**
     * Update station info
     *
     * @param {ID} sid         - station ID
     * @param {boolean} chosen - whether current station
     * @param {String} host    - station IP
     * @param {uint} port      - station port
     * @param {ID} provider    - sp ID
     * @return {boolean} false on failed
     */
    StationDBI.prototype.updateStation = function (sid, chosen, host, port, provider) {};

    /**
     * Remove this station
     *
     * @param {String} host    - station IP
     * @param {uint} port      - station port
     * @param {ID} provider    - sp ID
     * @return {boolean} false on failed
     */
    StationDBI.prototype.removeStation = function (host, port, provider) {};

    /**
     *  Remove all station of the sp
     *
     * @param {ID} provider    - sp ID
     * @return {boolean} false on failed
     */
    StationDBI.prototype.removeStations = function (provider) {};


    /**
     *  Session DBI
     *  ~~~~~~~~~~~
     */
    app.dbi.LoginDBI = Interface(null, null);
    var LoginDBI = app.dbi.LoginDBI;

    /**
     *  Get login command and its message
     *
     * @param {ID} user - user ID
     * @return {[LoginCommand,ReliableMessage]}
     */
    LoginDBI.prototype.getLoginCommandMessage = function (user) {};

    /**
     *  Save login command and its message
     *
     * @param {ID} user                 - sender ID
     * @param {LoginCommand} content    - login command
     * @param {ReliableMessage} message - network message
     * @return {boolean} false on error
     */
    LoginDBI.prototype.saveLoginCommandMessage = function (user, content, message) {};


    /**
     *  Session DBI
     *  ~~~~~~~~~~~
     */
    app.dbi.SessionDBI = Interface(null, [
        LoginDBI,
        ProviderDBI,
        StationDBI
    ]);
    var SessionDBI = app.dbi.SessionDBI;
