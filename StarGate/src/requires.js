'use strict';

//-------- namespace --------
if (typeof sg.dos !== 'object') {
    sg.dos = {};
}
if (typeof sg.lnc !== 'object') {
    sg.lnc = {};
}
if (typeof sg.ip !== 'object') {
    sg.ip = {};
}
if (typeof sg.ws !== 'object') {
    sg.ws = {};
}

//-------- requires --------
var Interface      = mk.type.Interface;
var Class          = mk.type.Class;
var Implementation = mk.type.Implementation;
var Mixin          = mk.type.Mixin;
var Converter      = mk.type.Converter;
var Mapper         = mk.type.Mapper;
var BaseObject     = mk.type.BaseObject;
var HashSet        = mk.type.HashSet;
var ConstantString = mk.type.ConstantString;
var UTF8    = mk.format.UTF8;
var JSONMap = mk.format.JSONMap;
var Base64  = mk.format.Base64;

var Duration = fsm.type.Duration;
var Runnable = fsm.skywalker.Runnable;
var Runner   = fsm.skywalker.Runner;
var Thread   = fsm.threading.Thread;

var AddressPairMap = st.type.AddressPairMap;
var SocketHelper   = st.net.SocketHelper;
var Departure      = st.port.Departure;
var SocketReader      = st.socket.SocketReader;
var SocketWriter      = st.socket.SocketWriter;
var ChannelController = st.socket.ChannelController;
var BaseChannel       = st.socket.BaseChannel;
var BaseHub           = st.socket.BaseHub;
var ActiveConnection  = st.socket.ActiveConnection;
var ArrivalShip   = st.ArrivalShip;
var DepartureShip = st.DepartureShip;
var StarPorter    = st.StarPorter;
var StarGate      = st.StarGate;
