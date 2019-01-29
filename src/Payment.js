/**
 * Created by phucpt3 on 1/22/2019.
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

    getCrrTimeInMilis() {
        "use strict";
        return (new Date().getTime());
    }

    cleanAllData() {
        "use strict";
        db.deleteDataFromCollection("EndPointInfo", {groupId: this.chatId, endPoint: this.endPoint});
        db.dropCollection(this.endPoint);
        db.deleteDataFromCollection("PeriodInfo", {endPoint: this.endPoint});
        db.dropCollection("StatusInfo" , {endPoint: this.endPoint});
    }

    initData(endPoint) {
        "use strict";
        this.lastTimeCheck = this.getCrrTimeInMilis();
        this.functionInterval = function () {
            db.findDataReturnObjectFromCollection("StatusInfo", {endPoint: endPoint}).then((result) => {
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
                                db.updateDataFromCollection(endPoint, {chanel: item.chanel}, {chanel: item.chanel, numPayment: 0});
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

        db.findDataReturnObjectFromCollection("StatusInfo", {endPoint: endPoint}).then((result) => {
            if (!result) {
                db.insertDataToCollection("StatusInfo", {endPoint: endPoint, isActive: true}).then(doNothing, doNothing);
            }
        }, doNothing);

        db.findDataReturnArrayFromCollection(endPoint, {}).then((rsMsg) => {
            if (!rsMsg || rsMsg.length == 0) {
                bot.sendMessage(this.chatId, "HIỆN TẠI CHƯA CÓ LOẠI PAYMENT NÀO ĐƯỢC CHỌN ĐỂ ALERT, VUI LÒNG THÊM!");
            }
            db.findDataReturnObjectFromCollection("PeriodInfo", {endPoint: endPoint}).then((result) => {
                if (result) {
                    var timeOut = result.period;
                    this.seflInterval = setInterval(this.functionInterval, timeOut, timeOut);
                } else {
                    db.insertDataToCollection("PeriodInfo", {endPoint: endPoint, period: defaultPeriod}).then((ok1) => {
                        this.seflInterval = setInterval(this.functionInterval, defaultPeriod, defaultPeriod);
                    }, doNothing);
                }
            }, doNothing);
        }, doNothing);

    }

    doChangePeriod(newDuration) {
        "use strict";
        clearInterval(this.seflInterval);
        db.findDataReturnObjectFromCollection("PeriodInfo", {endPoint: this.endPoint}).then((result) => {
            if (result && result.period) {
                var period = result.period;
                var ownTime = period - (this.getCrrTimeInMilis() - this.lastTimeCheck);
                var functionTimeOut = function () {
                    this.functionInterval();
                    db.updateDataFromCollection("PeriodInfo", {endPoint: this.endPoint}, {period: newDuration});
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

};