/**
 * Created by pc1 on 1/22/2019.
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

    //removeData() {
    //    "use strict";
    //    db.dropCollection(this.endPoint);
    //    db.dropCollection(this.endPoint + "_ExtensionQueue");
    //    db.dropCollection(this.endPoint + "_OutGoingQueue");
    //    db.dropCollection(this.endPoint + "_ExtensionQueue");
    //    db.dropCollection(this.endPoint + "_Type");
    //}

    initData(endPoint) {
        "use strict";
        db.findDataReturnObjectFromCollection(endPoint, {type: "SystemQueue"}).then((rs) => {
            if (!rs) {
                db.insertDataToCollection(endPoint, {type: "SystemQueue", timesIncrease: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        db.findDataReturnObjectFromCollection(endPoint, {type: "OutGoingQueue"}).then((rs) => {
            if (!rs) {
                db.insertDataToCollection(endPoint, {type: "OutGoingQueue", timesIncrease: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        db.findDataReturnObjectFromCollection(endPoint, {type: "ExtensionQueue"}).then((rs) => {
            if (!rs) {
                db.insertDataToCollection(endPoint, {type: "ExtensionQueue", timesIncrease: 0}).then(doNothing, doNothing);
            }
        }, doNothing);

        //db.findDataReturnObjectFromCollection(endPoint + "_TYPE", {}).then((rs) => {
        //    if (!rs) {
        //        db.insertDataToCollection(endPoint + "_TYPE", {type: "QUEUE"}).then(doNothing, doNothing);
        //    }
        //}, doNothing);

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

        console.log("CHECK WITH QUEUE : " + JSON.stringify(data));
        this.checkNeedAlert(systemQueue, outGoingQueue, extensionQueue, this.chatId, this.endPoint);

        return true;
    }

    stringAlert(type) {
        "use strict";
        return type + " ĐANG TĂNG LÊN LIÊN TỤC!";
    }

    checkNeedAlertWithType(chatId, type, endPoint, crrValue) {
        "use strict";
        db.findDataReturnObjectFromCollection(endPoint + "_" + type, {}).then((rs) => {
            if (rs) {
                var oldValue = rs.data;

                if (this.checkConditionAlert(crrValue, oldValue)) {
                    db.findDataReturnObjectFromCollection(endPoint, {type: type}).then((result) => {
                        if (result) {
                            var timesIncrease = result.timesIncrease;
                            if (timesIncrease >= timesInCreaseLimit) {
                                bot.sendMessage(chatId, this.stringAlert(type));
                            }
                            db.updateDataFromCollection(endPoint, {type: type}, {
                                type: type,
                                timesIncrease: timesIncrease + 1
                            });
                        } else {
                            db.insertDataToCollection(endPoint, {type: type, timesIncrease: 1}).then(doNothing, doNothing);
                        }
                    }, doNothing);
                } else {
                    db.updateDataFromCollection(endPoint, {type: type}, {type: type, timesIncrease: 1});
                }
                db.updateDataFromCollection(endPoint + "_" + type, {}, {data: crrValue});
            } else {
                db.insertDataToCollection(endPoint + "_" + type, {data: crrValue}).then(doNothing, doNothing);
            }
        }, (err) => {
            db.insertDataToCollection(endPoint + "_" + type, {data: crrValue}).then(doNothing, doNothing);
        });
    }

    cleanAllData() {
        "use strict";
        db.deleteDataFromCollection("EndPointInfo", {groupId: this.chatId, endPoint: this.endPoint});
        db.dropCollection(this.endPoint + "_Status");
        db.dropCollection(this.endPoint + "_ExtensionQueue");
        db.dropCollection(this.endPoint + "_OutGoingQueue");
        db.dropCollection(this.endPoint + "_SystemQueue");
    }

    checkNeedAlert(systemQueue, outGoingQueue, extensionQueue, chatId, endPoint) {
        "use strict";
        this.checkNeedAlertWithType(chatId, "SystemQueue", endPoint, systemQueue);
        this.checkNeedAlertWithType(chatId, "OutGoingQueue", endPoint, outGoingQueue);
        this.checkNeedAlertWithType(chatId, "ExtensionQueue", endPoint, extensionQueue);
        return true;
    }
};