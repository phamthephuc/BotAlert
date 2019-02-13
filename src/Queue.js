/**
 * Created by phucpt3 on 1/22/2019.
 */
var db = require("./DBInteractive");
const doNothing = require("./Util").doNothing;
var bot = require("./../server").bot;

const timesInCreaseLimit = 4;
const maxPermissionQueueSize = 1000;

module.exports = class Queue {
    constructor(endPoint, chatId) {
        "use strict";
        this.endPoint = endPoint;
        this.chatId = chatId;
    }

    checkConditionAlert(crrValue, oldValue) {
        "use strict";
        return (crrValue > oldValue || (crrValue == oldValue && crrValue > maxPermissionQueueSize));
    }

    initData(endPoint) {
        "use strict";
        db.findDataReturnObjectFromCollection(endPoint + "_Data", {type: "SystemQueue"}).then((rs) => {
            if (!rs) {
                db.insertDataToCollection(endPoint + "_Data", {type: "SystemQueue", timesIncrease: 0, lastData: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        db.findDataReturnObjectFromCollection(endPoint + "_Data", {type: "OutGoingQueue"}).then((rs) => {
            if (!rs) {
                db.insertDataToCollection(endPoint + "_Data", {type: "OutGoingQueue", timesIncrease: 0, lastData: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        db.findDataReturnObjectFromCollection(endPoint + "_Data", {type: "ExtensionQueue"}).then((rs) => {
            if (!rs) {
                db.insertDataToCollection(endPoint + "_Data", {type: "ExtensionQueue", timesIncrease: 0, lastData: 0}).then(doNothing, doNothing);
            }
        }, doNothing);

    }

    doCheckAlert(index, data) {
        "use strict";
        if (!data) return false;
        var systemQueue = data.systemQueue;
        var outGoingQueue = data.outGoingQueue;
        var extensionQueue = data.extensionQueue;
        if (systemQueue == undefined || outGoingQueue == undefined || extensionQueue == undefined) {
            return false;
        }
        this.checkNeedAlert(systemQueue, outGoingQueue, extensionQueue, this.chatId, this.endPoint);
        return true;
    }

    stringAlert(type) {
        "use strict";
        return type + " ĐANG TĂNG LÊN LIÊN TỤC!";
    }

    checkNeedAlertWithType(chatId, type, endPoint, crrValue) {
        "use strict";
        db.findDataReturnObjectFromCollection(endPoint + "_Data", {type: type}).then((rs) => {
            if (rs) {
                var oldValue = rs.lastData;
                if (this.checkConditionAlert(crrValue, oldValue)) {
                    var timesIncrease = rs.timesIncrease;
                    if (timesIncrease >= timesInCreaseLimit) {
                        bot.sendMessage(chatId, this.stringAlert(type));
                    }
                    db.updateDataFromCollection(endPoint + "_Data", {type: type}, {
                        type: type,
                        timesIncrease: timesIncrease + 1,
                        lastData: crrValue
                    });
                } else {
                    db.updateDataFromCollection(endPoint + "_Data", {type: type}, {type: type, timesIncrease: 1, lastData: crrValue});
                }
            } else {
                db.insertDataToCollection(endPoint + "_Data", {type: type, timesIncrease: 1, lastData: crrValue}).then(doNothing, doNothing);
            }
        },doNothing);
    }

    cleanAllData() {
        "use strict";
        db.deleteDataFromCollection("EndPointInfo", {endPoint: this.endPoint});
    }

    checkNeedAlert(systemQueue, outGoingQueue, extensionQueue, chatId, endPoint) {
        "use strict";
        this.checkNeedAlertWithType(chatId, "SystemQueue", endPoint, systemQueue);
        this.checkNeedAlertWithType(chatId, "OutGoingQueue", endPoint, outGoingQueue);
        this.checkNeedAlertWithType(chatId, "ExtensionQueue", endPoint, extensionQueue);
        return true;
    }
};