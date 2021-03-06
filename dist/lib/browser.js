"use strict";
const dnssd = require('dnssd2');
const appletv_1 = require("./appletv");
class Browser {
    /**
     * Creates a new Browser
     * @param log  An optional function that takes a string to provide verbose logging.
     */
    constructor() {
        this.browser = dnssd.Browser(dnssd.tcp('mediaremotetv'));

        this.services = [];
        this.devices = [];
        let that = this;
        this.browser.on('serviceUp', function (service) {
            let device = new appletv_1.AppleTV(service);
            if (that.uniqueIdentifier && device.uid == that.uniqueIdentifier) {
                that.browser.stop();
                that.onComplete([device]);
            } else {
                if (that.devices.find(uuid => uuid == device.uid)) {
                    return;
                } else {
                    that.devices.push(device.uid);
                    that.services.push(device);
                }
            }
        });
    }
    /**
     * Scans for AppleTVs on the local network.
     * @param uniqueIdentifier  An optional identifier for the AppleTV to scan for. The AppleTV advertises this via Bonjour.
     * @param timeout  An optional timeout value (in seconds) to give up the search after.
     * @returns A promise that resolves to an array of AppleTV objects. If you provide a `uniqueIdentifier` the array is guaranteed to only contain one object.
     */
    scan(uniqueIdentifier, timeout) {
        this.services = [];
        this.uniqueIdentifier = uniqueIdentifier;
        this.browser.start();
        let that = this;
        let to = timeout == null ? 5 : timeout;
        return new Promise((resolve, reject) => {
            that.onComplete = resolve;
            that.onFailure = reject;
            setTimeout(() => {
                that.browser.stop();
                if (that.uniqueIdentifier) {
                    reject(new Error("Failed to locate specified AppleTV on the network"));
                } else {
                    resolve(that.services
                        .sort((a, b) => {
                            return a > b ? 1 : -1;
                        }));
                }
            }, to * 1000);
        });
    }
}
exports.Browser = Browser;