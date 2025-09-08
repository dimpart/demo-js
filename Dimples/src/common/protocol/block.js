'use strict';
// license: https://mit-license.org
//
//  DIMP : Decentralized Instant Messaging Protocol
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

//! require <dimp.js>

    /**
     *  Command message: {
     *      type : 0x88,
     *      sn   : 123,
     *
     *      command : "block",
     *      list    : []       // block-list
     *  }
     */
    dkd.protocol.BlockCommand = Interface(null, [Command]);
    var BlockCommand = dkd.protocol.BlockCommand;

    Command.BLOCK = 'block';

    /**
     *  Set blocking list
     *
     * @param {ID[]} list
     */
    BlockCommand.prototype.setBlockCList = function (list) {};
    BlockCommand.prototype.getBlockCList = function () {};

    //
    //  factory method
    //

    BlockCommand.fromList = function (contacts) {
        return new BaseBlockCommand(contacts);
    };


    /**
     *  Create block command
     *
     *  Usages:
     *      1. new BaseBlockCommand(map);
     *      2. new BaseBlockCommand(list);
     *      3. new BaseBlockCommand();
     */
    dkd.dkd.BaseBlockCommand = function () {
        var list = null;
        if (arguments.length === 0) {
            // new BaseBlockCommand();
            BaseCommand.call(this, Command.BLOCK)
        } else if (arguments[0] instanceof Array) {
            // new BaseBlockCommand(list);
            BaseCommand.call(this, Command.BLOCK)
            list = arguments[0]
        } else {
            // new BaseBlockCommand(map);
            BaseCommand.call(this, arguments[0]);
        }
        if (list) {
            this.setValue('list', ID.revert(list));
        }
        this.__list = list;
    };
    var BaseBlockCommand = dkd.dkd.BaseBlockCommand;

    Class(BaseBlockCommand, BaseCommand, [BlockCommand]);

    Implementation(BaseBlockCommand, {

        // Override
        setBlockCList: function (list) {
            this.__list = list;
            if (list/* && list.length > 0*/) {
                list = ID.revert(list);
            }
            this.setValue('list', list);
        },

        // Override
        getBlockCList: function () {
            if (this.__list === null) {
                var list = this.getValue('list');
                if (list/* && list.length > 0*/) {
                    this.__list = ID.convert(list);
                } else {
                    this.__list = [];
                }
            }
            return this.__list;
        }
    });
