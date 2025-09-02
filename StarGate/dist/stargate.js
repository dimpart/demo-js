/**
 *  StarGate (v2.0.0)
 *  (Interfaces for network connection)
 *
 * @author    moKy <albert.moky at gmail.com>
 * @date      Aug. 28, 2025
 * @copyright (c) 2020-2025 Albert Moky
 * @license   {@link https://mit-license.org | MIT License}
 */;
(function (sg, st, fsm, mk) {
    if (typeof sg.dos !== 'object') {
        sg.dos = {}
    }
    if (typeof sg.lnc !== 'object') {
        sg.lnc = {}
    }
    if (typeof sg.ip !== 'object') {
        sg.ip = {}
    }
    if (typeof sg.ws !== 'object') {
        sg.ws = {}
    }
    var Interface = mk.type.Interface;
    var Class = mk.type.Class;
    var Converter = mk.type.Converter;
    var Mapper = mk.type.Mapper;
    var BaseObject = mk.type.BaseObject;
    var HashSet = mk.type.HashSet;
    var ConstantString = mk.type.ConstantString;
    var UTF8 = mk.format.UTF8;
    var JSONMap = mk.format.JSONMap;
    var Base64 = mk.format.Base64;
    var Duration = fsm.type.Duration;
    var Runnable = fsm.skywalker.Runnable;
    var Runner = fsm.skywalker.Runner;
    var Thread = fsm.threading.Thread;
    var AddressPairMap = st.type.AddressPairMap;
    var SocketHelper = st.net.SocketHelper;
    var Departure = st.port.Departure;
    var SocketReader = st.socket.SocketReader;
    var SocketWriter = st.socket.SocketWriter;
    var ChannelController = st.socket.ChannelController;
    var BaseChannel = st.socket.BaseChannel;
    var BaseHub = st.socket.BaseHub;
    var ActiveConnection = st.socket.ActiveConnection;
    var ArrivalShip = st.ArrivalShip;
    var DepartureShip = st.DepartureShip;
    var StarPorter = st.StarPorter;
    var StarGate = st.StarGate;
    sg.dos.Storage = function (storage, prefix) {
        BaseObject.call(this);
        this.storage = storage;
        if (prefix) {
            this.ROOT = prefix
        } else {
            this.ROOT = 'dim'
        }
    };
    var Storage = sg.dos.Storage;
    Class(Storage, BaseObject, null, null);
    Storage.prototype.getItem = function (key) {
        return this.storage.getItem(key)
    };
    Storage.prototype.setItem = function (key, value) {
        this.storage.setItem(key, value)
    };
    Storage.prototype.removeItem = function (key) {
        this.storage.removeItem(key)
    };
    Storage.prototype.clear = function () {
        this.storage.clear()
    };
    Storage.prototype.getLength = function () {
        return this.storage.length
    };
    Storage.prototype.key = function (index) {
        return this.storage.key(index)
    };
    Storage.prototype.exists = function (path) {
        return !!this.getItem(this.ROOT + '.' + path)
    };
    Storage.prototype.loadText = function (path) {
        return this.getItem(this.ROOT + '.' + path)
    };
    Storage.prototype.loadData = function (path) {
        var base64 = this.loadText(path);
        if (!base64) {
            return null
        }
        return Base64.decode(base64)
    };
    Storage.prototype.loadJSON = function (path) {
        var json = this.loadText(path);
        if (!json) {
            return null
        }
        return JSONMap.decode(json)
    };
    Storage.prototype.remove = function (path) {
        this.removeItem(this.ROOT + '.' + path);
        return true
    };
    Storage.prototype.saveText = function (text, path) {
        if (text) {
            this.setItem(this.ROOT + '.' + path, text);
            return true
        } else {
            this.removeItem(this.ROOT + '.' + path);
            return false
        }
    };
    Storage.prototype.saveData = function (data, path) {
        var base64 = null;
        if (data) {
            base64 = Base64.encode(data)
        }
        return this.saveText(base64, path)
    };
    Storage.prototype.saveJSON = function (container, path) {
        var json = null;
        if (container) {
            json = JSONMap.encode(container)
        }
        return this.saveText(json, path)
    };
    sg.dos.LocalStorage = new Storage(window.localStorage, 'dim.fs');
    sg.dos.SessionStorage = new Storage(window.sessionStorage, 'dim.mem');
    var DEBUG_FLAG = 1 << 0;
    var INFO_FLAG = 1 << 1;
    var WARNING_FLAG = 1 << 2;
    var ERROR_FLAG = 1 << 3;
    sg.lnc.Log = {
        DEBUG: DEBUG_FLAG | INFO_FLAG | WARNING_FLAG | ERROR_FLAG,
        DEVELOP: INFO_FLAG | WARNING_FLAG | ERROR_FLAG,
        RELEASE: WARNING_FLAG | ERROR_FLAG,
        level: WARNING_FLAG | ERROR_FLAG,
        showTime: false,
        showCaller: false,
        logger: null,
        debug: function (msg) {
            var flag = this.level & DEBUG_FLAG;
            if (flag > 0) {
                this.logger.debug.apply(this.logger, arguments)
            }
        },
        info: function (msg) {
            var flag = this.level & INFO_FLAG;
            if (flag > 0) {
                this.logger.info.apply(this.logger, arguments)
            }
        },
        warning: function (msg) {
            var flag = this.level & WARNING_FLAG;
            if (flag > 0) {
                this.logger.warning.apply(this.logger, arguments)
            }
        },
        error: function (msg) {
            var flag = this.level & ERROR_FLAG;
            if (flag > 0) {
                this.logger.error.apply(this.logger, arguments)
            }
        }
    };
    var Log = sg.lnc.Log;
    sg.lnc.Logger = Interface(null, null);
    var Logger = sg.lnc.Logger;
    Logger.prototype.debug = function (msg) {
    };
    Logger.prototype.info = function (msg) {
    };
    Logger.prototype.warning = function (msg) {
    };
    Logger.prototype.error = function (msg) {
    };
    sg.lnc.DefaultLogger = function () {
        BaseObject.call(this)
    };
    var DefaultLogger = sg.lnc.DefaultLogger;
    Class(DefaultLogger, BaseObject, [Logger], {
        debug: function () {
            console.debug.apply(console, log_args(arguments))
        }, info: function () {
            console.info.apply(console, log_args(arguments))
        }, warning: function () {
            console.warn.apply(console, log_args(arguments))
        }, error: function () {
            console.error.apply(console, log_args(arguments))
        }
    });
    var log_args = function (args) {
        if (Log.showTime === false) {
            return args
        }
        var array = ['[' + current_time() + ']'];
        for (var i = 0; i < args.length; ++i) {
            array.push(args[i])
        }
        return array
    };
    var current_time = function () {
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth();
        var date = now.getDate();
        var hours = now.getHours();
        var minutes = now.getMinutes();
        var seconds = now.getSeconds();
        return year + '-' + two_digits(month + 1) + '-' + two_digits(date) + ' ' + two_digits(hours) + ':' + two_digits(minutes) + ':' + two_digits(seconds)
    };
    var two_digits = function (value) {
        if (value < 10) {
            return '0' + value
        } else {
            return '' + value
        }
    };
    Log.logger = new DefaultLogger();
    sg.lnc.Observer = Interface(null, null);
    var Observer = sg.lnc.Observer;
    Observer.prototype.onReceiveNotification = function (notification) {
    };
    sg.lnc.Notification = function (name, sender, userInfo) {
        BaseObject.call(this);
        this.__name = name;
        this.__sender = sender;
        this.__info = userInfo
    };
    var Notification = sg.lnc.Notification;
    Class(Notification, BaseObject, null, {
        toString: function () {
            var clazz = this.getClassName();
            return '<' + clazz + ' name="' + this.getName() + '>\n' + '\t<sender>' + this.getSender() + '</sender>\n' + '\t<info>' + this.getUserInfo() + '</info>\n' + '</' + clazz + '>'
        }
    });
    Notification.prototype.getName = function () {
        return this.__name
    };
    Notification.prototype.getSender = function () {
        return this.__sender
    };
    Notification.prototype.getUserInfo = function () {
        return this.__info
    };
    sg.lnc.BaseCenter = function () {
        BaseObject.call(this);
        this.__observers = {}
    };
    var BaseCenter = sg.lnc.BaseCenter;
    Class(BaseCenter, BaseObject, null, null);
    BaseCenter.prototype.addObserver = function (observer, name) {
        var listeners = this.__observers[name];
        if (!listeners) {
            listeners = new HashSet();
            this.__observers[name] = listeners
        }
        listeners.add(observer)
    };
    BaseCenter.prototype.removeObserver = function (observer, name) {
        var keys = !name ? Object.keys(this.__observers) : [name];
        for (var i = keys.length - 1; i >= 0; --i) {
            name = keys[i];
            var listeners = this.__observers[name];
            if (listeners) {
                listeners.remove(observer);
                if (listeners.isEmpty()) {
                    delete this.__observers[name]
                }
            }
        }
    };
    BaseCenter.prototype.postNotification = function (name, sender, userInfo) {
        var notification = new Notification(name, sender, userInfo);
        return this.post(notification)
    };
    BaseCenter.prototype.post = function (notification) {
        var listeners = this.__observers[notification.getName()];
        if (!listeners || listeners.isEmpty()) {
            return
        }
        var observers = listeners.toArray();
        var obs;
        for (var i = observers.length - 1; i >= 0; --i) {
            obs = observers[i];
            try {
                if (Interface.conforms(obs, Observer)) {
                    obs.onReceiveNotification(notification)
                } else if (typeof obs === 'function') {
                    obs.call(notification)
                } else {
                    Log.error('Notification observer error', obs, notification)
                }
            } catch (e) {
                Log.error('DefaultCenter::post() error', notification, obs, e)
            }
        }
    };
    sg.lnc.NotificationCenter = {
        addObserver: function (observer, name) {
            this.center.addObserver(observer, name)
        }, removeObserver: function (observer, name) {
            this.center.removeObserver(observer, name)
        }, postNotification: function (notification, sender, userInfo) {
            if (notification instanceof Notification) {
                this.center.post(notification)
            } else {
                this.center.postNotification(notification, sender, userInfo)
            }
        }, getInstance: function () {
            return this
        }, center: new BaseCenter()
    };
    var NotificationCenter = sg.lnc.NotificationCenter;
    sg.lnc.AsyncCenter = function () {
        BaseCenter.call(this);
        this.__notifications = [];
        this.__running = false;
        this.__thread = null
    };
    var AsyncCenter = sg.lnc.AsyncCenter;
    Class(AsyncCenter, BaseCenter, [Runnable], {
        postNotification: function (name, sender, userInfo) {
            var notification = new Notification(name, sender, userInfo);
            this.__notifications.push(notification)
        }, post: function (notification) {
            this.__notifications.push(notification)
        }, run: function () {
            while (this.isRunning()) {
                if (!this.process()) {
                    return true
                }
            }
            return false
        }, process: function () {
            var notification = this.__notifications.shift();
            if (notification) {
                BaseCenter.prototype.post.call(this, notification);
                return true
            } else {
                return false
            }
        }
    });
    AsyncCenter.prototype.start = function () {
        force_stop.call(this);
        this.__running = true;
        var thread = new Thread(this);
        thread.start();
        this.__thread = thread
    };
    AsyncCenter.prototype.stop = function () {
        force_stop.call(this)
    };
    var force_stop = function () {
        var thread = this.__thread;
        if (thread) {
            this.__thread = null;
            thread.stop()
        }
    };
    AsyncCenter.prototype.isRunning = function () {
        return this.__running
    };
    var parseDuration = function (duration, defaultValueInSeconds) {
        if (duration instanceof Duration) {
            return duration
        }
        var seconds = Converter.getFloat(duration, defaultValueInSeconds);
        return Duration.ofSeconds(seconds)
    };
    var parseDateTime = function (time) {
        var date = Converter.getDateTime(time, null);
        return date || new Date()
    };
    sg.lnc.CacheHolder = function (value, lifeSpan, now) {
        lifeSpan = parseDuration(lifeSpan, 128);
        now = parseDateTime(now);
        this.__value = value;
        this.__lifeSpan = lifeSpan;
        var period = lifeSpan.multiplies(2);
        this.__expired = lifeSpan.addTo(now);
        this.__deprecated = period.addTo(now)
    };
    var CacheHolder = sg.lnc.CacheHolder;
    CacheHolder.prototype.getValue = function () {
        return this.__value
    };
    CacheHolder.prototype.updateValue = function (value, now) {
        now = parseDateTime(now);
        this.__value = value;
        var lifeSpan = this.__lifeSpan;
        var period = lifeSpan.multiplies(2);
        this.__expired = lifeSpan.addTo(now);
        this.__deprecated = period.addTo(now)
    };
    CacheHolder.prototype.isAlive = function (now) {
        now = parseDateTime(now);
        return now.getTime() < this.__expired.getTime()
    };
    CacheHolder.prototype.isDeprecated = function (now) {
        now = parseDateTime(now);
        return now.getTime() > this.__deprecated.getTime()
    };
    CacheHolder.prototype.renewal = function (duration, now) {
        duration = parseDuration(duration, 128);
        now = parseDateTime(now);
        var lifeSpan = this.__lifeSpan;
        var period = lifeSpan.multiplies(2);
        this.__expired = duration.addTo(now);
        this.__deprecated = period.addTo(now)
    };
    sg.lnc.CachePair = function (value, holder) {
        this.value = value;
        this.holder = holder
    };
    var CachePair = sg.lnc.CachePair;
    sg.lnc.CachePool = function () {
        this.__holders = {}
    };
    var CachePool = sg.lnc.CachePool
    CachePool.prototype.getKeys = function () {
        return Object.keys(this.__holders)
    };
    CachePool.prototype.updateHolder = function (key, holder) {
        this.__holders[key] = holder;
        return holder
    };
    CachePool.prototype.updateValue = function (key, value, lifeSpan, now) {
        var holder = new CacheHolder(value, lifeSpan, now);
        return this.updateHolder(key, holder)
    };
    CachePool.prototype.erase = function (key, now) {
        var old = null;
        if (now) {
            old = this.fetch(key, now)
        }
        delete this.__holders[key];
        return old
    };
    CachePool.prototype.fetch = function (key, now) {
        var holder = this.__holders[key];
        if (!holder) {
            return null
        } else if (holder.isAlive(now)) {
            return new CachePair(holder.getValue(), holder)
        } else {
            return new CachePair(null, holder)
        }
    };
    CachePool.prototype.purge = function (now) {
        now = parseDateTime(now);
        var count = 0;
        var all_holders = this.__holders;
        Mapper.forEach(all_holders, function (key, holder) {
            if (!holder || holder.isDeprecated(now)) {
                delete all_holders[key];
                ++count
            }
            return false
        });
        return count
    };
    var CacheRunner = function (duration) {
        Runner.call(this);
        duration = parseDuration(duration, 300);
        this.__interval = duration;
        this.__expired = duration.addTo(new Date());
        this.__pools = {};
        this.__thread = new Thread(this)
    };
    Class(CacheRunner, Runner, null, null);
    CacheRunner.prototype.start = function () {
        this.__thread.start()
    };
    CacheRunner.prototype.stop = function () {
        this.__thread.stop()
    };
    CacheRunner.prototype.process = function () {
        var now = new Date();
        if (now.getTime() > this.__expired.getTime()) {
            this.__expired = this.__interval.addTo(now);
            try {
                var cnt = this.purge(now);
                if (cnt > 0) {
                    Log.info('CacheManager: ' + cnt + ' object(s) removed.')
                }
            } catch (e) {
                Log.error('CacheManager::run()', e)
            }
        }
        return false
    };
    CacheRunner.prototype.purge = function (now) {
        var count = 0;
        Mapper.forEach(this.__pools, function (name, pool) {
            if (pool) {
                count += pool.purge(now)
            }
            return false
        });
        return count
    };
    CacheRunner.prototype.getPool = function (name) {
        var pool = this.__pools[name];
        if (!pool) {
            pool = new CachePool();
            this.__pools[name] = pool
        }
        return pool
    };
    sg.lnc.CacheManager = {
        getPool: function (name) {
            this.getInstance();
            return this.cacheRunner.getPool(name)
        }, getInstance: function () {
            if (!this.cacheRunner) {
                this.cacheRunner = new CacheRunner();
                this.cacheRunner.start()
            }
            return this
        }, cacheRunner: null
    };
    var CacheManager = sg.lnc.CacheManager;
    sg.ip.Host = function (string, ip, port, data) {
        ConstantString.call(this, string);
        this.ip = ip;
        this.port = port;
        this.data = data
    };
    var Host = sg.ip.Host;
    Class(Host, ConstantString, null, null);
    Host.prototype.toArray = function (default_port) {
        var data = this.data;
        var port = this.port;
        var len = data.length;
        var array, index;
        if (!port || port === default_port) {
            array = new Uint8Array(len);
            for (index = 0; index < len; ++index) {
                array[index] = data[index]
            }
        } else {
            array = new Uint8Array(len + 2);
            for (index = 0; index < len; ++index) {
                array[index] = data[index]
            }
            array[len] = port >> 8;
            array[len + 1] = port & 0xFF
        }
        return array
    };
    sg.ip.IPv4 = function (ip, port, data) {
        if (data) {
            if (!ip) {
                ip = data[0] + '.' + data[1] + '.' + data[2] + '.' + data[3];
                if (data.length === 6) {
                    port = (data[4] << 8) | data[5]
                }
            }
        } else if (ip) {
            data = new Uint8Array(4);
            var array = ip.split('.');
            for (var index = 0; index < 4; ++index) {
                data[index] = parseInt(array[index], 10)
            }
        } else {
            throw new URIError('IP data empty: ' + data + ', ' + ip + ', ' + port);
        }
        var string;
        if (port === 0) {
            string = ip
        } else {
            string = ip + ':' + port
        }
        Host.call(this, string, ip, port, data)
    };
    var IPv4 = sg.ip.IPv4;
    Class(IPv4, Host, null, null);
    IPv4.patten = /^(\d{1,3}\.){3}\d{1,3}(:\d{1,5})?$/;
    IPv4.parse = function (host) {
        if (!this.patten.test(host)) {
            return null
        }
        var pair = host.split(':');
        var ip = pair[0], port = 0;
        if (pair.length === 2) {
            port = parseInt(pair[1])
        }
        return new IPv4(ip, port)
    };
    var parse_v4 = function (data, array) {
        var item, index = data.byteLength;
        for (var i = array.length - 1; i >= 0; --i) {
            item = array[i];
            data[--index] = item
        }
        return data
    };
    var parse_v6 = function (data, ip, count) {
        var array, item, index;
        var pos = ip.indexOf('::');
        if (pos < 0) {
            array = ip.split(':');
            index = -1;
            for (var i = 0; i < count; ++i) {
                item = parseInt(array[i], 16);
                data[++index] = item >> 8;
                data[++index] = item & 0xFF
            }
        } else {
            var left = ip.substring(0, pos).split(':');
            index = -1;
            for (var j = 0; j < left.length; ++j) {
                item = parseInt(left[j], 16);
                data[++index] = item >> 8;
                data[++index] = item & 0xFF
            }
            var right = ip.substring(pos + 2).split(':');
            index = count * 2;
            for (var k = right.length - 1; k >= 0; --k) {
                item = parseInt(right[k], 16);
                data[--index] = item & 0xFF;
                data[--index] = item >> 8
            }
        }
        return data
    };
    var hex_encode_ip_number = function (hi, lo) {
        if (hi > 0) {
            if (lo >= 16) {
                return Number(hi).toString(16) + Number(lo).toString(16)
            }
            return Number(hi).toString(16) + '0' + Number(lo).toString(16)
        } else {
            return Number(lo).toString(16)
        }
    };
    sg.ip.IPv6 = function (ip, port, data) {
        if (data) {
            if (!ip) {
                ip = hex_encode_ip_number(data[0], data[1]);
                for (var index = 2; index < 16; index += 2) {
                    ip += ':' + hex_encode_ip_number(data[index], data[index + 1])
                }
                ip = ip.replace(/:(0:){2,}/, '::');
                ip = ip.replace(/^(0::)/, '::');
                ip = ip.replace(/(::0)$/, '::');
                if (data.length === 18) {
                    port = (data[16] << 8) | data[17]
                }
            }
        } else if (ip) {
            data = new Uint8Array(16);
            var array = ip.split('.');
            if (array.length === 1) {
                data = parse_v6(data, ip, 8)
            } else if (array.length === 4) {
                var prefix = array[0];
                var pos = prefix.lastIndexOf(':');
                array[0] = prefix.substring(pos + 1);
                prefix = prefix.substring(0, pos);
                data = parse_v6(data, prefix, 6);
                data = parse_v4(data, array)
            } else {
                throw new URIError('IPv6 format error: ' + ip);
            }
        } else {
            throw new URIError('IP data empty: ' + data + ', ' + ip + ', ' + port);
        }
        var string;
        if (port === 0) {
            string = ip
        } else {
            string = '[' + ip + ']:' + port
        }
        Host.call(this, string, ip, port, data)
    };
    var IPv6 = sg.ip.IPv6;
    Class(IPv6, Host, null);
    IPv6.patten = /^\[?([0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}(]:\d{1,5})?$/;
    IPv6.patten_compat = /^\[?([0-9A-Fa-f]{0,4}:){2,6}(\d{1,3}.){3}\d{1,3}(]:\d{1,5})?$/;
    IPv6.parse = function (host) {
        if (!this.patten.test(host) && !this.patten_compat.test(host)) {
            return null
        }
        var ip, port;
        if (host.charAt(0) === '[') {
            var pos = host.indexOf(']');
            ip = host.substring(1, pos);
            port = parseInt(host.substring(pos + 2))
        } else {
            ip = host;
            port = 0
        }
        return new IPv6(ip, port)
    };
    var ws_connect = function (url, proxy) {
        var ws = new WebSocket(url);
        ws.onopen = function (ev) {
            proxy.onConnected()
        };
        ws.onclose = function (ev) {
            proxy.onClosed()
        };
        ws.onerror = function (ev) {
            var error = new Error('WebSocket error: ' + ev);
            proxy.onError(error)
        };
        ws.onmessage = function (ev) {
            var data = ev.data;
            if (!data || data.length === 0) {
                return
            } else if (typeof data === 'string') {
                data = UTF8.encode(data)
            } else if (data instanceof Uint8Array) {
            } else {
                data = new Uint8Array(data)
            }
            proxy.onReceived(data)
        };
        return ws
    };
    var build_ws_url = function (host, port) {
        if ('https' === window.location.protocol.split(':')[0]) {
            return 'wss://' + host + ':' + port
        } else {
            return 'ws://' + host + ':' + port
        }
    };
    sg.ws.Socket = function () {
        BaseObject.call(this);
        this.__packages = [];
        this.__connected = -1;
        this.__closed = -1;
        this.__host = null;
        this.__port = null;
        this.__ws = null;
        this.__remote = null;
        this.__local = null
    };
    var Socket = sg.ws.Socket;
    Class(Socket, BaseObject, null);
    Socket.prototype.getHost = function () {
        return this.__host
    };
    Socket.prototype.getPort = function () {
        return this.__port
    };
    Socket.prototype.onConnected = function () {
        this.__connected = true
    };
    Socket.prototype.onClosed = function () {
        this.__closed = true
    };
    Socket.prototype.onError = function (error) {
        this.__connected = false
    };
    Socket.prototype.onReceived = function (data) {
        this.__packages.push(data)
    };
    Socket.prototype.configureBlocking = function () {
    };
    Socket.prototype.isBlocking = function () {
        return false
    };
    Socket.prototype.isOpen = function () {
        return this.__closed === false
    };
    Socket.prototype.isConnected = function () {
        return this.__connected === true
    };
    Socket.prototype.isBound = function () {
        return this.__connected === true
    };
    Socket.prototype.isAlive = function () {
        return this.isOpen() && (this.isConnected() || this.isBound())
    };
    Socket.prototype.getRemoteAddress = function () {
        return this.__remote
    };
    Socket.prototype.getLocalAddress = function () {
        return this.__local
    };
    Socket.prototype.bind = function (local) {
        this.__local = local
    };
    Socket.prototype.connect = function (remote) {
        this.close();
        this.__closed = false;
        this.__connected = false;
        this.__remote = remote;
        this.__host = remote.getHost();
        this.__port = remote.getPort();
        var url = build_ws_url(this.__host, this.__port);
        this.__ws = ws_connect(url, this)
    };
    Socket.prototype.close = function () {
        if (this.__ws) {
            this.__ws.close();
            this.__ws = null
        }
    };
    Socket.prototype.read = function (maxLen) {
        if (this.__packages.length > 0) {
            return this.__packages.shift()
        } else {
            return null
        }
    };
    Socket.prototype.write = function (data) {
        this.__ws.send(data);
        return data.length
    };
    Socket.prototype.receive = function (maxLen) {
        var remote;
        var data = this.read(maxLen);
        if (data) {
            remote = this.getRemoteAddress()
        } else {
            remote = null
        }
        return [data, remote]
    };
    Socket.prototype.send = function (data, remote) {
        return this.write(data)
    };
    sg.ws.StreamChannelReader = function (channel) {
        ChannelController.call(this, channel)
    };
    var StreamChannelReader = sg.ws.StreamChannelReader;
    Class(StreamChannelReader, ChannelController, [SocketReader], {
        read: function (maxLen) {
            var sock = this.getSocket();
            if (sock && sock.isOpen()) {
                return SocketHelper.socketReceive(sock, maxLen)
            } else {
                throw new Error('Socket channel closed: ' + sock);
            }
        }, receive: function (maxLen) {
            var remote;
            var data = this.read(maxLen);
            if (data) {
                remote = this.getRemoteAddress()
            } else {
                remote = null
            }
            return [data, remote]
        }
    });
    sg.ws.StreamChannelWriter = function (channel) {
        ChannelController.call(this, channel)
    };
    var StreamChannelWriter = sg.ws.StreamChannelWriter;
    Class(StreamChannelWriter, ChannelController, [SocketWriter], {
        write: function (data) {
            var sock = this.getSocket();
            if (sock && sock.isOpen()) {
                return SocketHelper.socketSend(sock, data)
            } else {
                throw new Error('Socket channel closed: ' + sock);
            }
        }, send: function (data, target) {
            return this.write(data)
        }
    });
    sg.ws.StreamChannel = function (remote, local) {
        BaseChannel.call(this, remote, local)
    };
    var StreamChannel = sg.ws.StreamChannel;
    Class(StreamChannel, BaseChannel, null, {
        createReader: function () {
            return new StreamChannelReader(this)
        }, createWriter: function () {
            return new StreamChannelWriter(this)
        }
    });
    sg.ws.ChannelPool = function () {
        AddressPairMap.call(this)
    };
    var ChannelPool = sg.ws.ChannelPool;
    Class(ChannelPool, AddressPairMap, null, {
        set: function (remote, local, value) {
            var cached = AddressPairMap.prototype.remove.call(this, remote, local, value);
            AddressPairMap.prototype.set.call(this, remote, local, value);
            return cached
        }
    })
    sg.ws.StreamHub = function (gate) {
        BaseHub.call(this, gate);
        this.__channelPool = this.createChannelPool()
    };
    var StreamHub = sg.ws.StreamHub;
    Class(StreamHub, BaseHub, null, null);
    StreamHub.prototype.createChannelPool = function () {
        return new ChannelPool()
    };
    StreamHub.prototype.createChannel = function (remote, local) {
        return new StreamChannel(remote, local)
    };
    StreamHub.prototype.allChannels = function () {
        return this.__channelPool.items()
    };
    StreamHub.prototype.removeChannel = function (remote, local, channel) {
        this.__channelPool.remove(remote, null, channel)
    };
    StreamHub.prototype.getChannel = function (remote, local) {
        return this.__channelPool.get(remote, null)
    };
    StreamHub.prototype.setChannel = function (remote, local, channel) {
        this.__channelPool.set(remote, null, channel)
    };
    StreamHub.prototype.removeConnection = function (remote, local, connection) {
        return BaseHub.prototype.removeConnection.call(this, remote, null, connection)
    };
    StreamHub.prototype.getConnection = function (remote, local) {
        return BaseHub.prototype.getConnection.call(this, remote, null)
    };
    StreamHub.prototype.setConnection = function (remote, local, connection) {
        return BaseHub.prototype.setConnection.call(this, remote, null, connection)
    };
    sg.ws.ClientHub = function (delegate) {
        StreamHub.call(this, delegate)
    };
    var ClientHub = sg.ws.ClientHub;
    Class(ClientHub, StreamHub, null, {
        createConnection: function (remote, local) {
            var conn = new ActiveConnection(remote, local);
            conn.setDelegate(this.getDelegate());
            return conn
        }, open: function (remote, local) {
            if (!remote) {
                throw new ReferenceError('remote address empty')
            }
            var channel = this.getChannel(remote, local);
            if (channel) {
                if (!local) {
                    return channel
                }
                var address = channel.getLocalAddress();
                if (!address || address.equals(local)) {
                    return channel
                }
            }
            channel = this.createChannel(remote, local);
            if (!local) {
                local = channel.getLocalAddress()
            }
            var cached = this.setChannel(remote, local, channel);
            if (cached && cached !== channel) {
                cached.close()
            }
            if (channel instanceof BaseChannel) {
                var sock = createWebSocketClient(remote, local);
                if (sock) {
                    channel.setSocket(sock)
                } else {
                    Log.error('[WS] failed to prepare socket', remote, local);
                    this.removeChannel(remote, local, channel);
                    channel = null
                }
            }
            return channel
        }
    });
    var createWebSocketClient = function (remote, local) {
        var sock = new Socket();
        sock.configureBlocking(true);
        if (local) {
            sock.bind(local)
        }
        sock.connect(remote);
        sock.configureBlocking(false);
        return sock
    };
    sg.PlainArrival = function (data, now) {
        ArrivalShip.call(this, now);
        this.__data = data
    };
    var PlainArrival = sg.PlainArrival;
    Class(PlainArrival, ArrivalShip, null, null);
    PlainArrival.prototype.getPayload = function () {
        return this.__data
    };
    PlainArrival.prototype.getSN = function () {
        return null
    };
    PlainArrival.prototype.assemble = function (arrival) {
        return arrival
    };
    sg.PlainDeparture = function (data, prior) {
        if (!prior) {
            prior = 0
        }
        DepartureShip.call(this, prior, 1);
        this.__completed = data;
        this.__fragments = [data]
    };
    var PlainDeparture = sg.PlainDeparture;
    Class(PlainDeparture, DepartureShip, null, null);
    PlainDeparture.prototype.getPayload = function () {
        return this.__completed
    };
    PlainDeparture.prototype.getSN = function () {
        return null
    };
    PlainDeparture.prototype.getFragments = function () {
        return this.__fragments
    };
    PlainDeparture.prototype.checkResponse = function (arrival) {
        return false
    };
    PlainDeparture.prototype.isImportant = function (arrival) {
        return false
    };
    sg.PlainPorter = function (remote, local) {
        StarPorter.call(this, remote, local)
    };
    var PlainPorter = sg.PlainPorter;
    Class(PlainPorter, StarPorter, null, {
        createArrival: function (data) {
            return new PlainArrival(data, null)
        }, createDeparture: function (data, priority) {
            return new PlainDeparture(data, priority)
        }, getArrivals: function (data) {
            if (!data || data.length === 0) {
                return []
            }
            return [this.createArrival(data)]
        }, checkArrival: function (income) {
            var data = income.getPayload();
            if (data.length === 4) {
                init_bytes();
                if (bytes_equal(data, PING)) {
                    this.send(PONG, Departure.Priority.SLOWER.getValue());
                    return null
                } else if (bytes_equal(data, PONG) || bytes_equal(data, NOOP)) {
                    return null
                }
            }
            return income
        }, send: function (payload, priority) {
            var ship = this.createDeparture(payload, priority);
            return this.sendShip(ship)
        }, sendData: function (payload) {
            var priority = Departure.Priority.NORMAL.getValue();
            return this.send(payload, priority)
        }, heartbeat: function () {
            init_bytes();
            var priority = Departure.Priority.SLOWER.getValue();
            this.send(PING, priority)
        }
    });
    var bytes_equal = function (data1, data2) {
        if (data1.length !== data2.length) {
            return false
        }
        for (var i = data1.length - 1; i >= 0; --i) {
            if (data1[i] !== data2[i]) {
                return false
            }
        }
        return true
    };
    var init_bytes = function () {
        if (typeof PING === 'string') {
            PING = UTF8.encode(PING);
            PONG = UTF8.encode(PONG);
            NOOP = UTF8.encode(NOOP)
        }
    }
    var PING = 'PING';
    var PONG = 'PONG';
    var NOOP = 'NOOP';
    sg.BaseGate = function (keeper) {
        StarGate.call(this, keeper);
        this.__hub = null
    };
    var BaseGate = sg.BaseGate;
    Class(BaseGate, StarGate, null, {
        setHub: function (hub) {
            this.__hub = hub
        }, getHub: function () {
            return this.__hub
        }, removePorter: function (remote, local, porter) {
            return StarGate.prototype.removePorter.call(this, remote, null, porter)
        }, getPorter: function (remote, local) {
            return StarGate.prototype.getPorter.call(this, remote, null)
        }, setPorter: function (remote, local, porter) {
            return StarGate.prototype.setPorter.call(this, remote, null, porter)
        }, fetchPorter: function (remote, local) {
            var hub = this.getHub();
            if (!hub) {
                throw new ReferenceError('Gate hub not found');
            }
            var conn = hub.connect(remote, local);
            if (!conn) {
                return null
            }
            return this.dock(conn, true)
        }, sendResponse: function (payload, ship, remote, local) {
            var docker = this.getPorter(remote, local);
            if (!docker) {
                Log.error('docker not found', remote, local);
                return false
            } else if (!docker.isAlive()) {
                Log.error('docker not alive', remote, local);
                return false
            }
            return docker.sendData(payload)
        }, heartbeat: function (connection) {
            if (connection instanceof ActiveConnection) {
                StarGate.prototype.heartbeat.call(this, connection)
            }
        }
    });
    sg.AutoGate = function (delegate) {
        BaseGate.call(this, delegate);
        this.__running = false;
        this.__thread = new Thread(this)
    };
    var AutoGate = sg.AutoGate;
    Class(AutoGate, BaseGate, [Runnable], {
        isRunning: function () {
            return this.__running
        }, start: function () {
            this.__running = true;
            this.__thread.start()
        }, stop: function () {
            this.__running = false
        }, run: function () {
            if (!this.isRunning()) {
                return false
            }
            var busy = this.process();
            if (busy) {
                Log.debug('client busy', busy)
            }
            return true
        }, process: function () {
            var hub = this.getHub();
            try {
                var incoming = hub.process();
                var outgoing = BaseGate.prototype.process.call(this);
                return incoming || outgoing
            } catch (e) {
                Log.error('client process error', e)
            }
        }, getChannel: function (remote, local) {
            var hub = this.getHub();
            return hub.open(remote, local)
        }
    });
    sg.WSClientGate = function (delegate) {
        AutoGate.call(this, delegate)
    };
    var WSClientGate = sg.WSClientGate;
    Class(WSClientGate, AutoGate, null, {
        createPorter: function (remote, local) {
            var docker = new PlainPorter(remote, local);
            docker.setDelegate(this.getDelegate());
            return docker
        }, sendMessage: function (payload, remote, local) {
            var docker = this.fetchPorter(remote, local);
            if (!docker) {
                Log.error('docker not found', remote, local);
                return false
            } else if (!docker.isAlive()) {
                Log.error('docker not alive', remote, local);
                return false
            }
            return docker.sendData(payload)
        }
    })
})(StarTrek, StarTrek, FiniteStateMachine, MONKEY);
