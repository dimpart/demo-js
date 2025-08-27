'use strict';
// license: https://mit-license.org
//
//  Web Socket
//
//                               Written in 2022 by Moky <albert.moky@gmail.com>
//
// =============================================================================
// The MIT License (MIT)
//
// Copyright (c) 2022 Albert Moky
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

//! require 'socket.js'
//! require 'channel.js'

    sg.ws.ChannelPool = function () {
        AddressPairMap.call(this);
    };
    var ChannelPool = sg.ws.ChannelPool;

    Class(ChannelPool, AddressPairMap, null, {

        // Override
        set: function (remote, local, value) {
            // remove cached item
            var cached = AddressPairMap.prototype.remove.call(this, remote, local, value);
            // if (cached && cached !== value) {
            //     cached.close();
            // }
            AddressPairMap.prototype.set.call(this, remote, local, value);
            return cached;
        }

        // // Override
        // remove: function (remote, local, value) {
        //     var cached = AddressPairMap.prototype.remove.call(this, remote, local, value);
        //     if (cached && cached !== value) {
        //         cached.close();
        //     }
        //     if (value) {
        //         value.close();
        //     }
        //     return cached;
        // }
    })

    /**
     *  Stream Hub
     *
     * @param {ConnectionDelegate} gate
     */
    sg.ws.StreamHub = function (gate) {
        BaseHub.call(this, gate);
        this.__channelPool = this.createChannelPool();
    };
    var StreamHub = sg.ws.StreamHub;

    Class(StreamHub, BaseHub, null, null);

    // protected
    StreamHub.prototype.createChannelPool = function () {
        return new ChannelPool();
    };

    //
    //  Channel
    //

    /**
     *  Create channel with socket & addresses
     *
     * @param {SocketAddress} remote - remote address
     * @param {SocketAddress} local  - local address
     * @return {Channel} null on socket error
     */
    // protected
    StreamHub.prototype.createChannel = function (remote, local) {
        return new StreamChannel(remote, local);
    };

    // Override
    StreamHub.prototype.allChannels = function () {
        return this.__channelPool.items();
    };

    // Override
    StreamHub.prototype.removeChannel = function (remote, local, channel) {
        this.__channelPool.remove(remote, null, channel);
    };

    // protected
    StreamHub.prototype.getChannel = function (remote, local) {
        return this.__channelPool.get(remote, null);
    };

    // protected
    StreamHub.prototype.setChannel = function (remote, local, channel) {
        this.__channelPool.set(remote, null, channel);
    };

    //
    //  Connection
    //

    // Override
    StreamHub.prototype.removeConnection = function (remote, local, connection) {
        return BaseHub.prototype.removeConnection.call(this, remote, null, connection);
    };

    // Override
    StreamHub.prototype.getConnection = function (remote, local) {
        return BaseHub.prototype.getConnection.call(this, remote, null);
    };

    // Override
    StreamHub.prototype.setConnection = function (remote, local, connection) {
        return BaseHub.prototype.setConnection.call(this, remote, null, connection);
    };


    sg.ws.ClientHub = function (delegate) {
        StreamHub.call(this, delegate);
    };
    var ClientHub = sg.ws.ClientHub;

    Class(ClientHub, StreamHub, null, {

        // Override
        createConnection: function (remote, local) {
            var conn = new ActiveConnection(remote, local);
            conn.setDelegate(this.getDelegate());  // gate
            return conn;
        },

        //
        //  Open Socket Channel
        //

        // Override
        open: function (remote, local) {
            if (!remote) {
                throw new ReferenceError('remote address empty')
            }
            //
            //  0. pre-checking
            //
            var channel = this.getChannel(remote, local);
            if (channel) {
                // check local address
                if (!local) {
                    return channel;
                }
                var address = channel.getLocalAddress();
                if (!address || address.equals(local)) {
                    return channel;
                }
            }
            //
            //  1. create new channel & cache it
            //
            channel = this.createChannel(remote, local);
            if (!local) {
                local = channel.getLocalAddress();
            }
            // cache the channel
            var cached = this.setChannel(remote, local, channel);
            if (cached && cached !== channel) {
                cached.close();
            }
            //
            //  2. create socket for this channel
            //
            if (channel instanceof BaseChannel) {
                // initialize socket
                var sock = createWebSocketClient(remote, local);
                if (sock) {
                    // set socket for this channel
                    channel.setSocket(sock);
                } else {
                    Log.error('[WS] failed to prepare socket', remote, local);
                    this.removeChannel(remote, local, channel);
                    channel = null;
                }
            }
            return channel;
        }
    });

    var createWebSocketClient = function (remote, local) {
        var sock = new Socket();
        sock.configureBlocking(true);
        if (local) {
            sock.bind(local);
        }
        sock.connect(remote);
        sock.configureBlocking(false);
        return sock;
    };
