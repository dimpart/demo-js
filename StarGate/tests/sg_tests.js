;

//
//  Test Cases
//
sg_tests = [];

var g_variables = {};


(function (sg, mk) {
    'use strict';

    var Class          = mk.type.Class;
    var Implementation = mk.type.Implementation;
    var Mixin          = mk.type.Mixin;
    var BaseObject     = mk.type.BaseObject;
    var Log     = sg.lnc.Log;
    var Logging = sg.lnc.Logging;

    Log.level = Log.DEBUG;
    Log.showTime = true;

    var impl = {
        run: function () {
            this.runLog();
            this.runLogging();
        },
        runLog: function () {
            Log.debug('debug info:', this);
            Log.info('log info:', this);
            Log.warning('warning info:', this);
            Log.error('error info:', this);
        },
        runLogging: function () {
            this.logDebug('debug info:', this);
            this.logInfo('log info:', this);
            this.logWarning('warning info:', this);
            this.logError('error info:', this);
        }
    };

    var SimpleClass = function (name) {
        this.__name = name;
    };
    Class(SimpleClass, null, null);
    Mixin(SimpleClass, Logging);
    Implementation(SimpleClass, impl);

    var BaseClass = function (name) {
        BaseObject.call(this);
        this.__name = name;
    };
    Class(BaseClass, BaseObject, null);
    Mixin(BaseClass, Logging);
    Implementation(BaseClass, impl);


    var test_log = function () {
        var runner1 = new SimpleClass('simple log');
        runner1.run();
        var runner2 = new BaseClass('base log');
        runner2.run();
    };
    sg_tests.push(test_log);

})(StarTrek, MONKEY);

(function (sg, st, sys) {
    'use strict';

    var Class             = sys.type.Class;
    var UTF8              = sys.format.UTF8;
    var InetSocketAddress = st.type.InetSocketAddress;
    var PorterDelegate    = st.port.PorterDelegate;
    var Log               = sg.lnc.Log;
    var ClientHub         = sg.ws.ClientHub;
    var WSClientGate      = sg.WSClientGate;

    var Client = function (remote, local) {
        Object.call(this);
        this.remoteAddress = remote;
        this.localAddress = local;
        var gate = new WSClientGate(this);
        var hub = new ClientHub(gate);
        gate.setHub(hub);
        this.gate = gate;
        this.hub = hub;
    };
    Class(Client, Object, [PorterDelegate], null);

    Client.prototype.start = function () {
        this.hub.connect(this.remoteAddress, this.localAddress);
        this.gate.start();
    };

    Client.prototype.stop = function () {
        this.gate.stop();
    };

    Client.prototype.send = function (data) {
        var ok = this.gate.sendMessage(data, this.remoteAddress, this.localAddress);
        Log.info('send message', ok);
    };

    //
    //  Docker Delegate
    //

    // Override
    Client.prototype.onPorterStatusChanged = function (previous, current, porter) {
        var remote = porter.getRemoteAddress();
        if (remote) remote = remote.toString();
        if (previous) previous = previous.toString();
        if (current) current = current.toString();
        Log.warning('!!! docker state changed: ', previous, current, remote);
    };

    // Override
    Client.prototype.onPorterReceived = function (arrival, porter) {
        var remote = porter.getRemoteAddress();
        if (remote) remote = remote.toString();
        var data = arrival.getPayload();
        var text = UTF8.decode(data);
        Log.warning('<<< docker received: ', data.length + ' bytes', text, remote);
    };

    // Override
    Client.prototype.onPorterSent = function (departure, porter) {
        // plain departure has no response,
        // we would not know whether the task is success here
        var remote = porter.getRemoteAddress();
        if (remote) remote = remote.toString();
        var data = departure.getPayload();
        Log.warning('>>> docker sent: ', data.length + ' bytes', remote);
    };

    // Override
    Client.prototype.onPorterFailed = function (error, departure, porter) {
        var remote = porter.getRemoteAddress();
        if (remote) remote = remote.toString();
        Log.error('!!! docker failed: ', error, departure, remote);
    };

    // Override
    Client.prototype.onPorterError = function (error, departure, porter) {
        var remote = porter.getRemoteAddress();
        if (remote) remote = remote.toString();
        Log.error('!!! docker error: ', error, departure, remote);
    };

    var test_connection = function () {

        // var host = '127.0.0.1';
        var host = '129.226.12.4';
        var port = 9394;

        var remote = new InetSocketAddress(host, port);

        var client = new Client(remote, null);
        client.start();

        g_variables['client'] = client;

        var text = 'PING';
        var data = sys.format.UTF8.encode(text);
        setTimeout(function () {
            client.send(data);
        }, 2000);
    };
    sg_tests.push(test_connection);

})(StarTrek, StarTrek, MONKEY);
