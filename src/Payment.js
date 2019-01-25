/**
 * Created by pc1 on 1/22/2019.
 */
var db = require("./DBInteractive");
const doNothing = require("./Util").doNothing;
var bot = require("./../server").bot;
var typePayments = require("./../server").typePayments;
const defaultPeriod = 60 * 1000;

module.exports = class Payment {
    constructor(endPoint, chatId) {
        "use strict";
        this.endPoint = endPoint;
        this.chatId = chatId;
        this.seflInterval = null;
        this.lastTimeCheck = null;
        this.functionInterval = null;
    }

    //removeData() {
    //    "use strict";
    //    //db.dropCollection(this.endPoint);
    //    //db.dropCollection(this.endPoint + "_Type");
    //    //db.dropCollection(this.endPoint + "_Period");
    //}

    getCrrTimeInMilis() {
        "use strict";
        return (new Date().getTime());
    }

    cleanAllData() {
        "use strict";
        db.deleteDataFromCollection("EndPointInfo", {groupId: this.chatId, endPoint: this.endPoint});
        db.dropCollection(this.endPoint);
        db.dropCollection(this.endPoint + "_Period");
        db.dropCollection(this.endPoint + "_Status");
        db.dropCollection(this.endPoint + "_Type");
    }

    initData(endPoint) {
        "use strict";
        this.lastTimeCheck = this.getCrrTimeInMilis();
        this.functionInterval = function () {
            db.findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((result) => {
                if (!result || !result.isActive) {
                    console.log(endPoint + " ĐANG TRONG TRẠNG THÁI UNACTIVE");
                } else {
                    db.findDataReturnArrayFromCollection(endPoint, {}).then((rs) => {
                        if (rs && rs.length > 0) {
                            rs.forEach((item) => {
                                var numPayment = item.numPayment;
                                if (numPayment <= 0) {
                                    bot.sendMessage(this.chatId, "ĐÃ QUÁ LÂU MÀ CHƯA THẤY CÓ PAYMENT Ở CHANEL " + typePayments.get(item.chanel));
                                }
                                db.updateDataFromCollection(endPoint, {chanel: item.chanel}, {numPayment: 0});
                            })
                        }
                    }, doNothing);
                    this.lastTimeCheck = this.getCrrTimeInMilis();
                    console.log("LAST TIME : " + this.lastTimeCheck);
                }
            }, doNothing);
        }.bind(this);


        //findDataReturnObjectFromCollection(endPoint + "_LastTimeCheck", {}).then((rs) => {
        //    if (!rs) {
        //        insertDataToCollection(endPoint + "_LastTimeCheck", {time: getCrrTimeInMilis()}).then(doNothing, doNothing);
        //    } else {
        //        updateDataFromCollection(endPoint + "_LastTimeCheck",{}, {time: getCrrTimeInMilis()});
        //    }
        //}, doNothing);

        db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
            if (!rs) {
                db.insertDataToCollection(endPoint + "_Type", {type: "PAYMENT"}).then(doNothing, doNothing);
            }
        }, doNothing);

        db.findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((result) => {
            if (!result) {
                db.insertDataToCollection(endPoint + "_Status", {isActive: true}).then(doNothing, doNothing);
            }
        }, doNothing);

        db.findDataReturnArrayFromCollection(endPoint, {}).then((rsMsg) => {
            if (!rsMsg || rsMsg.length == 0) {
                bot.sendMessage(this.chatId, "HIỆN TẠI CHƯA CÓ LOẠI PAYMENT NÀO ĐƯỢC CHỌN ĐỂ ALERT, VUI LÒNG THÊM!");
            }
            db.findDataReturnObjectFromCollection(endPoint + "_Period", {}).then((result) => {
                if (result) {
                    var timeOut = result.period;
                    this.seflInterval = setInterval(this.functionInterval, timeOut, timeOut);
                } else {
                    db.insertDataToCollection(endPoint + "_Period", {period: defaultPeriod}).then((ok1) => {
                        this.seflInterval = setInterval(this.functionInterval, defaultPeriod, defaultPeriod);
                    }, doNothing);
                }
            }, doNothing);
        }, doNothing);

    }

    doChangePeriod(newDuration) {
        "use strict";
        clearInterval(this.seflInterval);
        db.findDataReturnObjectFromCollection(this.endPoint + "_Period", {}).then((result) => {
            if (result && result.period) {
                var period = result.period;
                var ownTime = period - (this.getCrrTimeInMilis() - this.lastTimeCheck);
                var functionTimeOut = function () {
                    this.functionInterval();
                    db.updateDataFromCollection(this.endPoint + "_Period", {}, {period: newDuration});
                    setInterval(this.functionInterval, newDuration, newDuration);
                }.bind(this);
                setTimeout(functionTimeOut, ownTime);
            }
        }, doNothing());
    }

    doCheckAlert(index, data) {
        "use strict";
        console.log("add Payment");
        db.findDataReturnObjectFromCollection(this.endPoint, {chanel: data}).then((rs) => {
            if (rs) {
                var numPayment = rs.numPayment;
                db.updateDataFromCollection(this.endPoint, {chanel: data}, {chanel: data, numPayment: numPayment + 1});
            } else {
                return false;
            }
        }, doNothing);
        return true;
    }

}