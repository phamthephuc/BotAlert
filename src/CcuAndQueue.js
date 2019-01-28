/**
 * Created by pc1 on 1/22/2019.
 */
var db = require("./DBInteractive");
const doNothing = require("./Util").doNothing;
var bot = require("./../server").bot;
var Ccu = require("./Ccu");
var Queue = require("./Queue");

module.exports = class CcuAndQueue {
    constructor(endPoint, chatId) {
        "use strict";
        this.ccu = new Ccu(endPoint, chatId);
        this.queue = new Queue(endPoint, chatId);
    }

    initData(endPoint) {
        "use strict";
        db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((result) => {
            if (!result) {
                db.insertDataToCollection(endPoint + "_Type", {type: "CCU_AND_QUEUE"}).then((success) => {
                    this.ccu.initData(endPoint);
                    this.queue.initData(endPoint);
                }, doNothing);
            }
        }, doNothing);

        db.findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((result) => {
            if (!result) {
                db.insertDataToCollection(endPoint + "_Status", {isActive: true}).then(doNothing, doNothing);
            }
        }, doNothing);
    }

    removeData() {
        "use strict";
        this.ccu.removeData();
        //this.queue.removeData();
    }

    doCheckAlertWithEndPoint(index, data, endPoint) {
        "use strict";
        db.findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((result) => {
            if (!result || !result.isActive) {
                console.log(endPoint + " ĐANG TRONG TRẠNG THÁI UNACTIVE");
            } else {
                var check1;
                if (data && data.ccu != undefined) {
                    check1 = this.ccu.doCheckAlert(index, data.ccu);
                }
                var check2 = this.queue.doCheckAlert(index, data);
                return (check1 && check2);
            }
        }, doNothing);
    }


    cleanAllData() {
        "use strict";
        this.ccu.cleanAllData();
        this.queue.cleanAllData();
    }

    doCheckAlert(index, data) {
        "use strict";
        var endPoint = this.ccu.endPoint;
        this.doCheckAlertWithEndPoint(index, data, endPoint);
    }
};