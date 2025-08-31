'use strict';
// license: https://mit-license.org
//
//  Ming-Ke-Ming : Decentralized User Identity Authentication
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

    mkm.protocol.BroadcastUtils = {

        getGroupSeed: function (group_id) {
            var name = group_id.getName();
            if (name) {
                var len = name.length;
                if (len === 0) {
                    return null;
                } else if (name === 8 && name.toLowerCase() === 'everyone') {
                    return null;
                }
            }
            return name;
        },

        getBroadcastFounder: function (group_id) {
            var name = this.getGroupSeed(group_id);
            if (!name) {
                // Consensus: the founder of group 'everyone@everywhere'
                //            'Albert Moky'
                return ID.FOUNDER;
            } else {
                // DISCUSS: who should be the founder of group 'xxx@everywhere'?
                //          'anyone@anywhere', or 'xxx.founder@anywhere'
                return ID.parse(name + '.founder@anywhere');
            }
        },

        getBroadcastOwner  : function (group_id) {
            var name = this.getGroupSeed(group_id);
            if (!name) {
                // Consensus: the owner of group 'everyone@everywhere'
                //            'anyone@anywhere'
                return ID.ANYONE;
            } else {
                // DISCUSS: who should be the owner of group 'xxx@everywhere'?
                //          'anyone@anywhere', or 'xxx.owner@anywhere'
                return ID.parse(name + '.owner@anywhere');
            }
        },

        getBroadcastMembers: function (group_id) {
            var name = this.getGroupSeed(group_id);
            if (!name) {
                // Consensus: the member of group 'everyone@everywhere'
                //            'anyone@anywhere'
                return [ID.ANYONE];
            } else {
                // DISCUSS: who should be the member of group 'xxx@everywhere'?
                //          'anyone@anywhere', or 'xxx.member@anywhere'
                var owner = ID.parse(name + '.owner@anywhere');
                var member = ID.parse(name + '.member@anywhere');
                return [owner, member];
            }
        }
    };
    var BroadcastUtils = mkm.protocol.BroadcastUtils;
