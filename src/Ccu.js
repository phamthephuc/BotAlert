/**
 * Created by pc1 on 1/22/2019.
 */
var db = require("./DBInteractive");
const doNothing = require("./Util").doNothing;
var getDayBefore = require("./Util").getDayBefore;
var bot = require("./../server").bot;

const maxTimeAlert = 3;
const defaultPercent = 0.3;
const minDuration = 30;
module.exports = class Ccu {
    constructor(endPoint, chatId) {
        "use strict";
        this.endPoint = endPoint;
        this.chatId = chatId;
    }

    initData(endPoint) {
        "use strict";

        db.findDataReturnObjectFromCollection(endPoint + "_TimeAlertContinuousWeek", {}).then((result) => {
            if (!result) {
                db.insertDataToCollection(endPoint + "_TimeAlertContinuousWeek", {timesAlert: 0}).then(doNothing, doNothing);
            }
        }, doNothing);

        db.findDataReturnObjectFromCollection(endPoint + "_TimeAlertContinuousYesterday", {}).then((result) => {
            if (!result) {
                db.insertDataToCollection(endPoint + "_TimeAlertContinuousYesterday", {timesAlert: 0}).then(doNothing, doNothing);
            }
        }, doNothing);

        //db.findDataReturnObjectFromCollection(endPoint + "_TYPE", {}).then((result) => {
        //    if (!result) {
        //        db.insertDataToCollection(endPoint + "_TYPE", {type: "CCU"}).then(doNothing, doNothing);
        //    }
        //}, doNothing);

        db.findDataReturnObjectFromCollection(endPoint + "_Percent", {}).then((result) => {
            if (!result) {
                db.insertDataToCollection(endPoint + "_Percent", {percent: defaultPercent}).then(doNothing, doNothing);
            }
        }, doNothing);

        db.findDataReturnObjectFromCollection(endPoint + "_MaxTimesAlertContinuous", {}).then((result) => {
            if (!result) {
                db.insertDataToCollection(endPoint + "_MaxTimesAlertContinuous", {maxTimeAlert: maxTimeAlert}).then(doNothing, doNothing);
            }
        }, doNothing);

        db.findDataReturnObjectFromCollection(endPoint, {}).then((result) => {
            if (!result) {
                this.fakeDataCCU();
            }
        }, doNothing);
    }

    fakeDataCCU() {
        "use strict";
        var dataYesterday = [{index: 1710, dayOfWeek: 0, data: 1500}, {index: 1711, dayOfWeek: 0, data: 1}, {
            index: 1712,
            dayOfWeek: 0,
            data: 2
        }, {index: 1713, dayOfWeek: 0, data: 1500}, {index: 1714, dayOfWeek: 0, data: 1500}, {
            index: 1715,
            dayOfWeek: 0,
            data: 1500
        }, {index: 1716, dayOfWeek: 0, data: 1500}, {index: 1717, dayOfWeek: 0, data: 1}, {
            index: 1718,
            dayOfWeek: 0,
            data: 1500
        }];
        var dataYesterday1 = [{index: 1710, dayOfWeek: 1, data: 1500}, {index: 1711, dayOfWeek: 1, data: 1}, {
            index: 1712,
            dayOfWeek: 1,
            data: 2
        }, {index: 1713, dayOfWeek: 1, data: 1500}, {index: 1714, dayOfWeek: 1, data: 1500}, {
            index: 1715,
            dayOfWeek: 1,
            data: 1500
        }, {index: 1716, dayOfWeek: 1, data: 1500}, {index: 1717, dayOfWeek: 1, data: 1}, {
            index: 1718,
            dayOfWeek: 1,
            data: 1500
        }];
        var dataYesterday2 = [{index: 1710, dayOfWeek: 2, data: 1500}, {index: 1711, dayOfWeek: 2, data: 1}, {
            index: 1712,
            dayOfWeek: 2,
            data: 2
        }, {index: 1713, dayOfWeek: 2, data: 1500}, {index: 1714, dayOfWeek: 2, data: 1500}, {
            index: 1715,
            dayOfWeek: 2,
            data: 1500
        }, {index: 1716, dayOfWeek: 2, data: 1500}, {index: 1717, dayOfWeek: 2, data: 1}, {
            index: 1718,
            dayOfWeek: 2,
            data: 1500
        }];
        var dataYesterday3 = [{index: 1710, dayOfWeek: 3, data: 1500}, {index: 1711, dayOfWeek: 3, data: 1}, {
            index: 1712,
            dayOfWeek: 3,
            data: 2
        }, {index: 1713, dayOfWeek: 3, data: 1500}, {index: 1714, dayOfWeek: 3, data: 1500}, {
            index: 1715,
            dayOfWeek: 3,
            data: 1500
        }, {index: 1716, dayOfWeek: 3, data: 1500}, {index: 1717, dayOfWeek: 3, data: 1}, {
            index: 1718,
            dayOfWeek: 3,
            data: 1500
        }];
        var dataYesterday4 = [{index: 1710, dayOfWeek: 4, data: 1500}, {index: 1711, dayOfWeek: 4, data: 1}, {
            index: 1712,
            dayOfWeek: 4,
            data: 2
        }, {index: 1713, dayOfWeek: 4, data: 1500}, {index: 1714, dayOfWeek: 4, data: 1500}, {
            index: 1715,
            dayOfWeek: 4,
            data: 1500
        }, {index: 1716, dayOfWeek: 4, data: 1500}, {index: 1717, dayOfWeek: 4, data: 1}, {
            index: 1718,
            dayOfWeek: 4,
            data: 1500
        }];
        var dataYesterday5 = [{index: 1710, dayOfWeek: 5, data: 1500}, {index: 1711, dayOfWeek: 5, data: 1}, {
            index: 1712,
            dayOfWeek: 5,
            data: 2
        }, {index: 1713, dayOfWeek: 5, data: 1500}, {index: 1714, dayOfWeek: 5, data: 1500}, {
            index: 1715,
            dayOfWeek: 5,
            data: 1500
        }, {index: 1716, dayOfWeek: 5, data: 1500}, {index: 1717, dayOfWeek: 5, data: 1}, {
            index: 1718,
            dayOfWeek: 5,
            data: 1500
        }];
        var dataYesterday6 = [{index: 1710, dayOfWeek: 6, data: 1500}, {index: 1711, dayOfWeek: 6, data: 1}, {
            index: 1712,
            dayOfWeek: 6,
            data: 2
        }, {index: 1713, dayOfWeek: 6, data: 1500}, {index: 1714, dayOfWeek: 6, data: 1500}, {
            index: 1715,
            dayOfWeek: 6,
            data: 1500
        }, {index: 1716, dayOfWeek: 6, data: 1500}, {index: 1717, dayOfWeek: 6, data: 1}, {
            index: 1718,
            dayOfWeek: 6,
            data: 1500
        }];
        var listData = [];
        listData.push(dataYesterday);
        listData.push(dataYesterday1);
        listData.push(dataYesterday2);
        listData.push(dataYesterday3);
        listData.push(dataYesterday4);
        listData.push(dataYesterday5);
        listData.push(dataYesterday6);

        for (var i = 0; i <= 6; i++) {
            db.insertManyDataToCollection(this.endPoint, listData[i]).then(doNothing, doNothing);
        }
    }

    cleanAllData() {
        "use strict";
        db.deleteDataFromCollection("EndPointInfo", {groupId: this.chatId, endPoint: this.endPoint});
        db.dropCollection(this.endPoint);
        db.dropCollection(this.endPoint + "_Percent");
        db.dropCollection(this.endPoint + "_Type");
        db.dropCollection(this.endPoint + "_MaxTimesAlertContinuous");
        db.dropCollection(this.endPoint + "_TimeAlertContinuousWeek");
        db.dropCollection(this.endPoint + "_TimeAlertContinuousYesterday");
    }

    checkConditionAlert(crrValue, oldValue, coefficient) {
        "use strict";
        return (crrValue < oldValue * coefficient);
    }

    doCheckAlert(index, data) {
        console.log("CHECK WITH CCU : " + JSON.stringify(data));
        "use strict";
        var dayOfWeek;
        try {
            data = parseInt(data);
            index = parseInt(index);
            var crrDate = new Date(index);

            index = parseInt((crrDate.getHours() * 3600 + crrDate.getMinutes() * 60 + crrDate.getSeconds()) / minDuration);
            dayOfWeek = crrDate.getDay();
        } catch (err1) {
            return false;
        }



        this.checkNeedAlert(index, data, this.chatId, this.endPoint, dayOfWeek);
        return true;
    }

    stringAlert(crrValue, oldValue, isWeek) {
        "use strict";
        if (!isWeek) {
            return "CCU HIỆN TẠI THẤP HƠN HÔM QUA : " + (oldValue - crrValue);
        }
        return "CCU HIỆN TẠI THẤP HƠN TRUNG BÌNH 7 NGÀY QUA : " + (oldValue - crrValue);
    }

    removeData() {
        "use strict";
        db.deleteDataFromCollection(this.endPoint, {});
        console.log("Remove Data Collection");
        //db.dropCollection(this.endPoint);
        //db.dropCollection(this.endPoint + "_Percent");
        //db.dropCollection(this.endPoint + "_MaxTimesAlertContinuous");
        //db.dropCollection(this.endPoint + "_TimeAlertContinuousWeek");
        //db.dropCollection(this.endPoint + "_TimeAlertContinuousYesterday");
        //db.dropCollection(this.endPoint + "_Type");
    }

    checkNeedAlert(index, data, chatId, endPoint, dayOfWeek) {
        "use strict";
        db.findDataReturnObjectFromCollection(endPoint, {index: index, dayOfWeek: dayOfWeek}).then((rs) => {
            if (rs) {
                db.findDataReturnArrayFromCollection(endPoint, {index: index}).then((resutl3) => {
                    var num = resutl3.length;
                    var sum = 0;
                    resutl3.forEach((item) => {
                        sum += item.data;
                    });

                    if (num > 0) {
                        var averageData = parseInt(sum / num);
                        db.findDataReturnObjectFromCollection(endPoint + "_Percent", {}).then((rsMsg) => {
                            var percent = rsMsg.percent;
                            console.log("PERCENT : " + percent);
                            if (this.checkConditionAlert(data, averageData, percent)) {
                                db.findDataReturnObjectFromCollection(endPoint + "_TimeAlertContinuousWeek", {}).then((rs) => {
                                    if (rs) {
                                        var timesAlert = rs.timesAlert;
                                        db.findDataReturnObjectFromCollection(endPoint + "_MaxTimesAlertContinuous", {}).then((result) => {
                                            if (result) {
                                                var maxTimeAlertOfEndPoint = result.maxTimeAlert;
                                                if (timesAlert < maxTimeAlertOfEndPoint) {
                                                    bot.sendMessage(chatId, this.stringAlert(data, averageData, true));
                                                    timesAlert += 1;
                                                    db.updateDataFromCollection(this.endPoint + "_TimeAlertContinuousWeek", {}, {timesAlert: timesAlert});
                                                }
                                            } else {
                                                if (timesAlert < maxTimeAlert) {
                                                    bot.sendMessage(chatId, this.stringAlert(data, averageData, true));
                                                    timesAlert += 1;
                                                    db.updateDataFromCollection(this.endPoint + "_TimeAlertContinuousWeek", {}, {timesAlert: timesAlert});
                                                    db.insertDataToCollection(endPoint + "_MaxTimesAlertContinuous", {maxTimeAlert: maxTimeAlert}).then(doNothing, doNothing);
                                                }
                                            }
                                        }, doNothing);

                                    }
                                }, (err) => {
                                    console.log("get TIME ALERT WEEK FAIL!");
                                });

                            } else {
                                db.updateDataFromCollection(endPoint + "_TimeAlertContinuousWeek", {}, {timesAlert: 0});
                            }
                        }, doNothing);
                    }

                    db.updateDataFromCollection(endPoint, {index: index, dayOfWeek: dayOfWeek}, {
                        index: index,
                        data: data,
                        dayOfWeek: dayOfWeek
                    });
                }, doNothing);

            } else {
                console.log("Data today in null");
                db.insertDataToCollection(endPoint, {
                    index: index,
                    data: data,
                    dayOfWeek: dayOfWeek
                }).then(doNothing, doNothing);
            }
        }, (errMsg) => {
            console.log("error in get data today");
        });

        var yesterday = getDayBefore(dayOfWeek);
        db.findDataReturnObjectFromCollection(endPoint, {index: index, dayOfWeek: yesterday}).then((result2) => {
            if (result2) {
                var dataYesterday = result2.data;
                console.log("ccu yesterday :" + JSON.stringify(dataYesterday));
                if (dataYesterday) {
                    db.findDataReturnObjectFromCollection(endPoint + "_Percent", {}).then((rsMsg) => {
                        var percent = rsMsg.percent;
                        if (this.checkConditionAlert(data, dataYesterday, percent)) {
                            db.findDataReturnObjectFromCollection(endPoint + "_TimeAlertContinuousYesterday", {}).then((rs) => {
                                if (rs) {
                                    var timesAlert = rs.timesAlert;
                                    db.findDataReturnObjectFromCollection(endPoint + "_MaxTimesAlertContinuous", {}).then((result) => {
                                        if (result) {
                                            var maxTimeAlertOfEndPoint = result.maxTimeAlert;
                                            if (timesAlert < maxTimeAlertOfEndPoint) {
                                                bot.sendMessage(chatId, this.stringAlert(data, dataYesterday, false));
                                                timesAlert += 1;
                                                db.updateDataFromCollection(this.endPoint + "_TimeAlertContinuousYesterday", {}, {timesAlert: timesAlert});
                                            }
                                        } else {
                                            if (timesAlert < maxTimeAlert) {
                                                bot.sendMessage(chatId, this.stringAlert(data, dataYesterday, false));
                                                timesAlert += 1;
                                                db.updateDataFromCollection(this.endPoint + "_TimeAlertContinuousYesterday", {}, {timesAlert: timesAlert});
                                                db.insertDataToCollection(endPoint + "_MaxTimesAlertContinuous", {maxTimeAlert: maxTimeAlert}).then(doNothing, doNothing);
                                            }
                                        }
                                    }, doNothing);
                                }
                            }, (err) => {
                                console.log("get TIME ALERT YESTERDAY FAIL!");
                            });

                        } else {
                            db.updateDataFromCollection(endPoint + "_TimeAlertContinuousYesterday", {}, {timesAlert: 0});
                        }
                    }, doNothing);
                }
            } else {
                console.log("have no ccu yesterday!");
            }
        }, (err2) => {
            console.log("GET DATA YESTERDAY ERROR");
        });
    }
};
