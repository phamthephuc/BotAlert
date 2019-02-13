/**
 * Created by phucpt3 on 1/22/2019.
 */
var db = require("./DBInteractive");
const doNothing = require("./Util").doNothing;
var bot = require("./../server").bot;
var typePayments = require("./../server").typePayments;
const defaultPeriod = 60 * 60 * 1000;

module.exports = class Payment {
    constructor(endPoint, chatId) {
        "use strict";
        this.endPoint = endPoint;
        this.chatId = chatId;
        this.seflInterval = null;
        this.lastTimeCheck = null;
        this.functionInterval = null;
    }

    getCrrTimeInMilis() {
        "use strict";
        return (new Date().getTime());
    }

    cleanAllData() {
        "use strict";
        db.deleteDataFromCollection("EndPointInfo", {endPoint: this.endPoint});
        db.dropCollection(this.endPoint + "_Data");
        db.deleteDataFromCollection("StatusInfo" , {endPoint: this.endPoint});
    }

    initData(endPoint) {
        "use strict";
        this.lastTimeCheck = this.getCrrTimeInMilis();
        this.functionInterval = function () {
            db.findDataReturnObjectFromCollection("StatusInfo", {endPoint: endPoint}).then((result) => {
                if (result && result.isActive) {
                    db.findDataReturnArrayFromCollection(endPoint + "_Data", {}).then((rs) => {
                        if (rs && rs.length > 0) {
                            rs.forEach((item) => {
                                var numPayment = item.numPayment;
                                if (numPayment <= 0) {
                                    bot.sendMessage(this.chatId, "ĐÃ QUÁ LÂU MÀ CHƯA THẤY CÓ PAYMENT Ở CHANEL " + typePayments.get(item.chanel));
                                }
                                db.updateDataFromCollection(endPoint + "_Data", {chanel: item.chanel}, {chanel: item.chanel, numPayment: 0});
                            })
                        }
                    }, doNothing);
                    this.lastTimeCheck = this.getCrrTimeInMilis();
                }
            }, doNothing);
        }.bind(this);

        db.findDataReturnObjectFromCollection("StatusInfo", {endPoint: endPoint}).then((result) => {
            if (!result) {
                db.insertDataToCollection("StatusInfo", {endPoint: endPoint, isActive: true}).then(doNothing, doNothing);
            }
        }, doNothing);

        db.findDataReturnArrayFromCollection(endPoint + "_Data", {}).then((rsMsg) => {
            if (!rsMsg || rsMsg.length == 0) {
                bot.sendMessage(this.chatId, "HIỆN TẠI CHƯA CÓ LOẠI PAYMENT NÀO ĐƯỢC CHỌN ĐỂ ALERT, VUI LÒNG THÊM!");
            }
            db.findDataReturnObjectFromCollection("EndPointInfo", {endPoint: endPoint}).then((result) => {
                if (result && result.period) {
                    var timeOut = result.period;
                    this.seflInterval = setInterval(this.functionInterval, timeOut, timeOut);
                } else {
                    db.insertDataToCollection("EndPointInfo", {endPoint: endPoint, period: defaultPeriod, groupId: this.chatId, type: "PAYMENT"}).then(doNothing, doNothing);
                    this.seflInterval = setInterval(this.functionInterval, defaultPeriod, defaultPeriod);
                }
            }, doNothing);
        }, doNothing);

    }

    doChangePeriod(newDuration) {
        "use strict";
        clearInterval(this.seflInterval);
        db.findDataReturnObjectFromCollection("EndPointInfo", {endPoint: this.endPoint}).then((result) => {
            if (result && result.period) {
                var period = result.period;
                var ownTime = period - (this.getCrrTimeInMilis() - this.lastTimeCheck);
                var functionTimeOut = function () {
                    this.functionInterval();
                    db.updateDataFromCollection("EndPointInfo", {endPoint: this.endPoint}, {period: newDuration});
                    this.seflInterval = setInterval(this.functionInterval, newDuration, newDuration);
                }.bind(this);
                this.seflInterval = setTimeout(functionTimeOut, ownTime);
            }
        }, doNothing());
    }

    doCheckAlert(index, chanel) {
        "use strict";
        db.findDataReturnObjectFromCollection(this.endPoint + "_Data", {chanel: chanel}).then((rs) => {
            if (rs) {
                var numPayment = rs.numPayment;
                db.updateDataFromCollection(this.endPoint + "_Data", {chanel: chanel}, {chanel: chanel, numPayment: numPayment + 1});
            } else {
                return false;
            }
        }, doNothing);
        return true;
    }

};