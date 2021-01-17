const Main = imports.ui.main;
const Lang = imports.lang;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const { St, Gio, Clutter, UPowerGlib: UPower } = imports.gi;

var keybBatteryStatus;

const KeyboardBatteryStatus = new Lang.Class({
    Name: "KeyboardBatteryStatus",
    Extends: PanelMenu.Button,

    _init: function () {
        //eventually create a way to set the variable in prefs.js to choose which wirelesskeyboard battery level to display;
        this.keyboardModel = "AnnePro";


        //find the keyboard we want to use. 
        this.keyboard = this.findKeyboard();
        log("finished finding keyboard...");


        this.kbBatteryStatus = new St.Bin({
            style_class: "panel-button",
        });
        this.kbBatteryStatusText = new St.Label({
            style_class: "keyboardBatteryPercentageText",
            text: this.keyboard.model + " " + this.getPercentage(this.keyboard) + "%",
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.kbBatteryStatus.set_child(this.kbBatteryStatusText);
    },

    _sync: function () {
        log("syncing battery percentage");
        this.kbBatteryStatusText.text = this.keyboard.model + " " + this.getPercentage(this.keyboard) + "%";
    },

    findKeyboard: function () {
        log("Looking for Keyboard");
        var client = UPower.Client.new_full(null);
        log("created new client");

        var devices = client.get_devices();
        for (let device of devices) {
            log("Device: " + device.to_text());
            if (device.model.includes(this.keyboardModel)) {
                log("Found keyboard: " + device.model + ".");
                log("Device Power: " + device.percentage + "%");
                return device;
            }
        }
        log("No Keyboards found");
        return null;
    },

    getPercentage: function (device) {
        log("Battery Pecentage is " + device.percentage + "%.");
        var percentage = device.percentage;
        return device.percentage;
    },

})


function init() {

}


function enable() {
    log("enabling keyboard battery status");

    keybBatteryStatus = new KeyboardBatteryStatus();

    

    Main.panel._rightBox.insert_child_at_index(keybBatteryStatus.kbBatteryStatus, 1);
}

function disable() {
    log("disabling keyboard battery status");
    keybBatteryStatus.destroy();

}