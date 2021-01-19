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
        //eventually create a way to set the variable in prefs.js to choose which wirelesskeyboard battery level to display;
        this.keyboardModel = "AnnePro";


        //find the keyboard we want to use. 
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


        /** set up a dbus proxy so we can listen to changes in this.keyboard.percentage and update accordinglingly */
        log("================================================================\nKEYBOARD BATTERY STATUS\n----------------------------------------------------------------");

        log("creating dbus proxy connection to the keyboard");

        this._kbProxy = new DBusProxy(Gio.DBus.system, 'org.freedesktop.UPower', this.keyboard.get_object_path(),
            (proxy, error) => {
                log("callback");
                if (error) {
                    log("uh oh something bad happened in the callback");
                    log(error.message);
                    return;
                }
                this._kbProxy.connect('g-properties-changed', this._sync.bind(this));
                this._sync()
            });

        log("================================================================");

    },

    _sync: function () {
        log("================================================================\nKEYBOARD BATTERY STATUS\n----------------------------------------------------------------");
        log("Syncing battery percentage");
        this.kbBatteryStatusText.set_text( this.keyboard.model + " " + this.keyboard.percentage + "%" );
        log("Device Power: " + this.keyboard.percentage + "%");
        log("================================================================\n\n")


    },

    /** find the keyboard specified by model */
    _findKeyboard: function () {
        log("================================================================\nKEYBOARD BATTERY STATUS\n----------------------------------------------------------------");
        log("Looking for Keyboard...");
        var client = UPower.Client.new_full(null);


        var devices = client.get_devices();
        for (let device of devices) {
            //log("Device: " + device.to_text());
            if (device.model.includes(this.keyboardModel)) {
                log("Found keyboard: " + device.model + ".");
                log("Device Power: " + device.percentage + "%");
                log("================================================================\n\n")
                return device;
            }
        }
        log("No Keyboards found");
        return null;
    },

    // /** Get Battery Percentage */
    // _getPercentage: function (device) {
    //     return device.percentage;
    // },

    // /** get the Model of the device */
    // _getModel: function (device) {
    //     return device.model;
    // },

    // /** Listen for changes to the battery percentage*/
    // _batteryListener: function () {

    // },

    // /** Listen for changes to battery charging status */
    // _chargingListener: function () {

    // },


})


function init() {
}

function enable() {
    log("enabling keyboard battery status");

    try {
        keybBatteryStatus = new KeyboardBatteryStatus();
        Main.panel._rightBox.insert_child_at_index(keybBatteryStatus.kbBatteryStatus, 1);
    } catch (err) {
        log("Uh Oh something went wrong enabling the extension");
        log(err);
    }
}

function disable() {
    log("disabling keyboard battery status");
    try {
        Main.panel._rightBox.remove_child(keybBatteryStatus.kbBatteryStatus);
    } catch (err) {
        log("Uh Oh something went wrong disabling the extension");
    }

}