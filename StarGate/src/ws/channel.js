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

//! require 'requires.js'

    /**
     *  Stream Channel Reader
     *  ~~~~~~~~~~~~~~~~~~~~~
     *
     * @param {Channel} channel
     */
    sg.ws.StreamChannelReader = function (channel) {
        ChannelController.call(this, channel);
    };
    var StreamChannelReader = sg.ws.StreamChannelReader;

    Class(StreamChannelReader, ChannelController, [SocketReader], {

        // Override
        read: function (maxLen) {
            var sock = this.getSocket();
            if (sock && sock.isOpen()) {
                return SocketHelper.socketReceive(sock, maxLen);
            } else {
                throw new Error('Socket channel closed: ' + sock);
            }
        },

        // Override
        receive: function (maxLen) {
            var remote;
            var data = this.read(maxLen);
            if (data) {
                remote = this.getRemoteAddress();
            } else {
                remote = null;
            }
            return [data, remote];
        }
    });


    /**
     *  Stream Channel Writer
     *  ~~~~~~~~~~~~~~~~~~~~~
     *
     * @param {Channel} channel
     */
    sg.ws.StreamChannelWriter = function (channel) {
        ChannelController.call(this, channel);
    };
    var StreamChannelWriter = sg.ws.StreamChannelWriter;

    Class(StreamChannelWriter, ChannelController, [SocketWriter], {

        // Override
        write: function (data) {
            var sock = this.getSocket();
            if (sock && sock.isOpen()) {
                return SocketHelper.socketSend(sock, data);
            } else {
                throw new Error('Socket channel closed: ' + sock);
            }
        },

        // Override
        send: function (data, target) {
            // TCP channel will be always connected,
            // so the target address must be the remote address
            return this.write(data);
        }
    });

    /**
     *  Stream Channel
     *  ~~~~~~~~~~~~~~
     *
     * @param {SocketAddress} remote - remote address
     * @param {SocketAddress} local  - local address
     */
    sg.ws.StreamChannel = function (remote, local) {
        BaseChannel.call(this, remote, local);
    };
    var StreamChannel = sg.ws.StreamChannel;

    Class(StreamChannel, BaseChannel, null, {

        // Override
        createReader: function () {
            return new StreamChannelReader(this);
        },

        // Override
        createWriter: function () {
            return new StreamChannelWriter(this);
        }
    });
