'use strict';

//-------- namespace --------
if (typeof app.compat !== 'object') {
    app.compat = {};
}
if (typeof app.dbi !== 'object') {
    app.dbi = {};
}
// if (typeof app.digest !== 'object') {
//     app.digest = {};
// }
// if (typeof app.protocol !== 'object') {
//     app.protocol = {};
// }
if (typeof app.utils !== 'object') {
    app.utils = {};
}
if (typeof app.database !== 'object') {
    app.database = {};
}
if (typeof app.group !== 'object') {
    app.group = {};
}
if (typeof app.network !== 'object') {
    app.network = {};
}
if (typeof app.cpu !== 'object') {
    app.cpu = {};
}

//-------- requires --------
var Interface      = mk.type.Interface;
var Class          = mk.type.Class;
var Converter      = mk.type.Converter;
var Wrapper        = mk.type.Wrapper;
var Mapper         = mk.type.Mapper;
var Stringer       = mk.type.Stringer;
var IObject        = mk.type.Object;
var BaseObject     = mk.type.BaseObject;
var ConstantString = mk.type.ConstantString;
var Dictionary     = mk.type.Dictionary;
var Arrays         = mk.type.Arrays;
var HashSet        = mk.type.HashSet;
var Enum           = mk.type.Enum;
var StringCoder     = mk.format.StringCoder;
var UTF8            = mk.format.UTF8;
var ObjectCoder     = mk.format.ObjectCoder;
//var JSON          = mk.format.JSON;
var JSONMap         = mk.format.JSONMap;
var DataCoder       = mk.format.DataCoder;
var Base58          = mk.format.Base58;
var Base64          = mk.format.Base64;
var Hex             = mk.format.Hex;
var BaseDataWrapper = mk.format.BaseDataWrapper;
var BaseFileWrapper = mk.format.BaseFileWrapper;
var SHA256          = mk.digest.SHA256;
var RIPEMD160       = mk.digest.RIPEMD160;
var KECCAK256       = mk.digest.KECCAK256;
var TransportableData    = mk.protocol.TransportableData;
var PortableNetworkFile  = mk.protocol.PortableNetworkFile;
var SymmetricAlgorithms  = mk.protocol.SymmetricAlgorithms;
var AsymmetricAlgorithms = mk.protocol.AsymmetricAlgorithms;
var EncryptKey           = mk.protocol.EncryptKey;
var DecryptKey           = mk.protocol.DecryptKey;
var VerifyKey            = mk.protocol.VerifyKey;
var SymmetricKey         = mk.protocol.SymmetricKey;
var AsymmetricKey        = mk.protocol.AsymmetricKey;
var PublicKey            = mk.protocol.PublicKey;
var PrivateKey           = mk.protocol.PrivateKey;
var BaseSymmetricKey = mk.crypto.BaseSymmetricKey;
var BasePublicKey    = mk.crypto.BasePublicKey;
var BasePrivateKey   = mk.crypto.BasePrivateKey;

var EntityType      = mkm.protocol.EntityType;
var Address         = mkm.protocol.Address;
var ID              = mkm.protocol.ID;
var IDFactory       = mkm.protocol.ID.Factory;
var Meta            = mkm.protocol.Meta;
var MetaFactory     = mkm.protocol.Meta.Factory;
var Document        = mkm.protocol.Document;
var DocumentFactory = mkm.protocol.Document.Factory;
var Visa            = mkm.protocol.Visa;
var Bulletin        = mkm.protocol.Bulletin;
var MetaType        = mkm.protocol.MetaType;
var DocumentType    = mkm.protocol.DocumentType;
var Identifier         = mkm.mkm.Identifier;
var IdentifierFactory  = mkm.mkm.IdentifierFactory;
var BTCAddress         = mkm.mkm.BTCAddress;
var ETHAddress         = mkm.mkm.ETHAddress;
var BaseAddressFactory = mkm.mkm.BaseAddressFactory;
var BaseMeta           = mkm.mkm.BaseMeta;
var DefaultMeta        = mkm.mkm.DefaultMeta;
var BTCMeta            = mkm.mkm.BTCMeta;
var ETHMeta            = mkm.mkm.ETHMeta;
var BaseMetaFactory    = mkm.mkm.BaseMetaFactory;
var BaseDocument       = mkm.mkm.BaseDocument;
var BaseBulletin       = mkm.mkm.BaseBulletin;
var BaseVisa           = mkm.mkm.BaseVisa;
var Station            = mkm.mkm.Station;
var ServiceProvider    = mkm.mkm.ServiceProvider;
var MetaUtils          = mkm.mkm.MetaUtils;
var DocumentUtils      = mkm.mkm.DocumentUtils;
var Group              = mkm.mkm.Group;
var GroupDataSource    = mkm.mkm.Group.DataSource;
var MetaHelper              = mkm.ext.MetaHelper;
var DocumentHelper          = mkm.ext.DocumentHelper;
var SharedAccountExtensions = mkm.ext.SharedAccountExtensions;

var InstantMessage         = dkd.protocol.InstantMessage;
var SecureMessage          = dkd.protocol.SecureMessage;
var ReliableMessage        = dkd.protocol.ReliableMessage;
var Envelope               = dkd.protocol.Envelope;
var Content                = dkd.protocol.Content;
var Command                = dkd.protocol.Command;
var ContentType            = dkd.protocol.ContentType;
var TextContent            = dkd.protocol.TextContent;
var ForwardContent         = dkd.protocol.ForwardContent;
var ArrayContent           = dkd.protocol.ArrayContent;
var FileContent            = dkd.protocol.FileContent;
var NameCard               = dkd.protocol.NameCard;
var CustomizedContent      = dkd.protocol.CustomizedContent;
var MetaCommand            = dkd.protocol.MetaCommand;
var DocumentCommand        = dkd.protocol.DocumentCommand;
var GroupCommand           = dkd.protocol.GroupCommand;
var ResetCommand           = dkd.protocol.ResetCommand;
var ResignCommand          = dkd.protocol.ResignCommand;
var ReceiptCommand         = dkd.protocol.ReceiptCommand;
var MessageEnvelope  = dkd.msg.MessageEnvelope;
var BaseMessage      = dkd.msg.BaseMessage;
var PlainMessage     = dkd.msg.PlainMessage;
var EncryptedMessage = dkd.msg.EncryptedMessage;
var NetworkMessage   = dkd.msg.NetworkMessage;
var BaseContent           = dkd.dkd.BaseContent;
var BaseTextContent       = dkd.dkd.BaseTextContent;
var BaseFileContent       = dkd.dkd.BaseFileContent;
var ImageFileContent      = dkd.dkd.ImageFileContent;
var AudioFileContent      = dkd.dkd.AudioFileContent;
var VideoFileContent      = dkd.dkd.VideoFileContent;
var WebPageContent        = dkd.dkd.WebPageContent;
var NameCardContent       = dkd.dkd.NameCardContent;
var BaseMoneyContent      = dkd.dkd.BaseMoneyContent;
var TransferMoneyContent  = dkd.dkd.TransferMoneyContent;
var ListContent           = dkd.dkd.ListContent;
var SecretContent         = dkd.dkd.SecretContent;
var AppCustomizedContent  = dkd.dkd.AppCustomizedContent;
var BaseCommand           = dkd.dkd.BaseCommand;
var BaseMetaCommand       = dkd.dkd.BaseMetaCommand;
var BaseDocumentCommand   = dkd.dkd.BaseDocumentCommand;
var BaseReceiptCommand    = dkd.dkd.BaseReceiptCommand;
var BaseHistoryCommand    = dkd.dkd.BaseHistoryCommand;
var BaseGroupCommand      = dkd.dkd.BaseGroupCommand;
var InviteGroupCommand    = dkd.dkd.InviteGroupCommand;
var ExpelGroupCommand     = dkd.dkd.ExpelGroupCommand;
var JoinGroupCommand      = dkd.dkd.JoinGroupCommand;
var QuitGroupCommand      = dkd.dkd.QuitGroupCommand;
// var QueryGroupCommand  = dkd.dkd.QueryGroupCommand;
var ResetGroupCommand     = dkd.dkd.ResetGroupCommand;
var HireGroupCommand      = dkd.dkd.HireGroupCommand;
var FireGroupCommand      = dkd.dkd.FireGroupCommand;
var ResignGroupCommand    = dkd.dkd.ResignGroupCommand;
var ContentHelper           = dkd.ext.ContentHelper;
var InstantMessageHelper    = dkd.ext.InstantMessageHelper;
var SecureMessageHelper     = dkd.ext.SecureMessageHelper;
var ReliableMessageHelper   = dkd.ext.ReliableMessageHelper;
var CommandHelper           = dkd.ext.CommandHelper;

var ExtensionLoader   = dimp.ext.ExtensionLoader;
var PluginLoader      = dimp.ext.PluginLoader;

var MessageUtils = sdk.msg.MessageUtils;
var CipherKeyDelegate = sdk.core.CipherKeyDelegate;
var MessageCompressor = sdk.core.MessageCompressor;
var MessageShortener  = sdk.core.MessageShortener;
var Archivist         = sdk.core.Archivist;
var Barrack           = sdk.core.Barrack;
var TwinsHelper      = sdk.TwinsHelper;
var Facebook         = sdk.Facebook;
var Messenger        = sdk.Messenger;
var MessagePacker    = sdk.MessagePacker;
var MessageProcessor = sdk.MessageProcessor;
var GeneralContentProcessorFactory = sdk.cpu.GeneralContentProcessorFactory;
var BaseContentProcessor           = sdk.cpu.BaseContentProcessor;
var BaseCommandProcessor           = sdk.cpu.BaseCommandProcessor;
var BaseContentProcessorCreator    = sdk.cpu.BaseContentProcessorCreator;

var Duration  = fsm.type.Duration;
var Processor = fsm.skywalker.Processor;
var Runner    = fsm.skywalker.Runner;
var Thread    = fsm.threading.Thread;
var Context        = fsm.Context;
var AutoMachine    = fsm.AutoMachine;
var BaseState      = fsm.BaseState;
var BaseTransition = fsm.BaseTransition;

var InetSocketAddress = st.type.InetSocketAddress;
var Departure         = st.port.Departure;
var PorterDelegate    = st.port.PorterDelegate;
var PorterStatus      = st.port.PorterStatus;
var BaseConnection    = st.socket.BaseConnection;
var StarPorter    = st.StarPorter;

var Storage   = sg.dos.LocalStorage;
var Log       = sg.lnc.Log;
var ClientHub = sg.ws.ClientHub;
var CommonGate     = sg.WSClientGate;
var PlainPorter    = sg.PlainPorter;
var PlainArrival   = sg.PlainArrival;
var PlainDeparture = sg.PlainDeparture;
