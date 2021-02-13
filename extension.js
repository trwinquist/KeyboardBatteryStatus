const Main = imports.ui.main;
const Lang = imports.lang;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const { St, Gio, Clutter, UPowerGlib: UPower } = imports.gi;

const xml = '<node>\
   <interface name="org.freedesktop.UPower.Device">\
      <property name="Type" type="u" access="read" />\
      <property name="State" type="u" access="read" />\
      <property name="Percentage" type="d" access="read" />\
      <property name="TimeToEmpty" type="x" access="read" />\
      <property name="TimeToFull" type="x" access="read" />\
      <property name="IsPresent" type="b" access="read" />\
      <property name="IconName" type="s" access="read" />\
   </interface>\
</node>';

const DBusProxy = Gio.DBusProxy.makeProxyWrapper(xml);

var keybBatteryStatus, dBusConnection;

const KeyboardBatteryStatus = new Lang.Class({
    Name: "KeyboardBatteryStatus",
    Extends: PanelMenu.Button,

    _init: function () {
        /** currently compatible with AnnePro2, set this.keyboardModel to model to use. */
        this.keyboardModel = "AnnePro2";

        this.keyboard = this._findKeyboard();

        this.kbBatteryStatus = new St.Bin({
            style_class: "panel-button",
        });
        this.kbBatteryStatusText = new St.Label({
            style_class: "keyboardBatteryPercentageText",
            text: this.keyboard.model + " " + this.keyboard.percentage + "%",
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.kbBatteryStatus.set_child(this.kbBatteryStatusText);


        this._kbProxy = new DBusProxy(Gio.DBus.system, 'org.freedesktop.UPower', this.keyboard.get_object_path(),
            (proxy, error) => {
                if (error) {
                    Log("Uh Oh, Something went wrong updating the percentage using the DBusProxy");
                    Log(error.message);
                    return;
                }
                this._kbProxy.connect('g-properties-changed', this._sync.bind(this));
                this._sync()
            });
    },

    _sync: function () {
        Log("Syncing battery percentage");
        this.kbBatteryStatusText.set_text( this.keyboard.model + " " + this.keyboard.percentage + "%" );
        Log("Device Power: " + this.keyboard.percentage + "%");
    },

    /** find the keyboard specified by model 
     *  next steps will include methods to find any keyboard, and choose which once to use. 
    */
    _findKeyboard: function () {

        Log("Looking for Keyboard...");
        var client = UPower.Client.new_full(null);
         var devices = client.get_devices();

        for (let device of devices) {
            //log("Device: " + device.to_text());
            if (device.model.includes(this.keyboardModel)) {
                Log("Found the following keyboard,");
                Log("Keyboard Model: " + device.model + ".");
                Log("Device Power: " + device.percentage + "%");
                return device;
            }
        }
        Log("No Keyboards found");
        return null;
    },
    
    /** show/hide the topbar button upon keyboard connect and disconnect repectively */
    _keyboardConnection : function() {
        /** create a proxy connection to listen to UPower devices */
        this.connectionsProxy = new DBusProxy(Gio.DBus.system, 'org.freedesktop.UPower', 
            (proxy,error)=>{
            Log('Connection Listener')
                if (error) {
                    Log("Something happened when creating the proxy to listen for the Keyboard connections: ");
                    Log(error.message);
                }
        });
        this.connections = this.connectionsProxy.get_connection();
        this.deviceAdded = this.connections.signal_subscribe('org.freedesktop.UPower','org.freedesktop.UPower','DeviceAdded',null, null,0,() => {
            Log('Keyboard Connected')
            this.keyboard = this._findKeyboard();
            // create new connection to the keyboard.
        });

        this.deviceRemoved = this.connections.sign_subscribe('org.freedesktop.UPower', 'org.freedesktop.UPower', 'DeviceRemoved', null, null, 0 ()=> {
            var currentKeyboard = this._findKeyboard();
            Log('A device has been removed...');
            if(currentKeyboard === null){
                Log("Current Keyboard has been disconnected");
                this.keyboard  = null;
                this._proxy = null;
                this.actor.hide();
            } else {
                Log("a different device has been disconnected, carry on!");
            }
        }

    },

    // Log : function (str) {
    //     log("[KeyboardBatteryStatus] " + str);
    // },

})
function Log(str) {
    log("[KeyboardBatteryStatus] " + str);
}

function init() {
}

function enable() {
    try {
        keybBatteryStatus = new KeyboardBatteryStatus();
        Main.panel._rightBox.insert_child_at_index(keybBatteryStatus.kbBatteryStatus, 1);
    } catch (err) {
        log("Uh Oh something went wrong enabling the extension");
        log(err);
    }
}

function disable() {
    try {
        Main.panel._rightBox.remove_child(keybBatteryStatus.kbBatteryStatus);
    } catch (err) {
        log("Uh Oh something went wrong disabling the extension");
        log()
    }
}