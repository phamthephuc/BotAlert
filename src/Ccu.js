/**
 * Created by phucpt3 on 1/22/2019.
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

        db.findDataReturnObjectFromCollection("EndPointInfo", {endPoint: endPoint}).then((result) => {
            if(result) {
                if(!result.percent) {
                    db.updateDataFromCollection("EndPointInfo", {endPoint: endPoint}, {percent: defaultPercent});
                }
                if(!result.maxTimesAlertContinuous) {
                    db.updateDataFromCollection("EndPointInfo", {endPoint: endPoint}, {maxTimesAlertContinuous: maxTimeAlert});
                }
                db.updateDataFromCollection("EndPointInfo", {endPoint: endPoint}, {timeAlertContinuousWeek: 0, timeAlertContinuousYesterday: 0});
            } else {
                db.insertDataToCollection("EndPointInfo", {
                    groupId: this.chatId,
                    endPoint: endPoint,
                    type: "CCU_AND_QUEUE",
                    timeAlertContinuousWeek: 0,
                    timeAlertContinuousYesterday: 0,
                    percent: defaultPercent,
                    maxTimesAlertContinuous: maxTimeAlert
                })
            }

        }, doNothing);

        //db.findDataReturnObjectFromCollection(endPoint + "_Data", {}).then((result) => {
        //    if (!result) {
        //        this.fakeDataCCU();
        //    }
        //}, doNothing);
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
            db.insertManyDataToCollection(this.endPoint + "_Data", listData[i]).then(doNothing, doNothing);
        }
    }

    cleanAllData() {
        "use strict";
        db.deleteDataFromCollection("EndPointInfo", {endPoint: this.endPoint});
        db.dropCollection(this.endPoint + "_Data");
    }

    checkConditionAlert(crrValue, oldValue, coefficient) {
        "use strict";
        return (crrValue < oldValue * coefficient);
    }

    doCheckAlert(index, data) {
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

    checkNeedAlert(index, data, chatId, endPoint, dayOfWeek) {
        "use strict";
        db.findDataReturnObjectFromCollection("EndPointInfo", {endPoint: endPoint}).then((result) => {
            if(result) {
                var timeAlertContinuousWeek = result.timeAlertContinuousWeek;
                var timeAlertContinuousYesterday = result.timeAlertContinuousYesterday;
                var maxTimeAlertContinuous = result.maxTimesAlertContinuous;
                var percent = result.percent;

                db.findDataReturnObjectFromCollection(endPoint + "_Data", {index: index, dayOfWeek: dayOfWeek}).then((rs) => {
                    if (rs) {
                        db.findDataReturnArrayFromCollection(endPoint + "_Data", {index: index}).then((resutl3) => {
                            var num = resutl3.length;
                            var sum = 0;
                            resutl3.forEach((item) => {
                                sum += item.data;
                            });

                            if (num > 0) {
                                var averageData = parseInt(sum / num);

                                //console.error("DATA CRR: " + data + " " + averageData);

                                if(this.checkConditionAlert(data, averageData, percent)) {
                                    if(timeAlertContinuousWeek < maxTimeAlertContinuous) {
                                        bot.sendMessage(chatId, this.stringAlert(data, averageData, true));
                                        timeAlertContinuousWeek += 1;
                                        db.updateDataFromCollection("EndPointInfo", {endPoint: endPoint}, {timeAlertContinuousWeek: timeAlertContinuousWeek});
                                    }
                                } else {
                                    db.updateDataFromCollection("EndPointInfo", {endPoint: endPoint}, {timeAlertContinuousWeek: 0});
                                }
                            }

                            db.updateDataFromCollection(endPoint + "_Data", {index: index, dayOfWeek: dayOfWeek}, {
                                index: index,
                                data: data,
                                dayOfWeek: dayOfWeek
                            });
                        }, doNothing);

                    } else {
                        //console.log("Data today in null");
                        db.updateDataFromCollection("EndPointInfo", {endPoint: endPoint}, {timeAlertContinuousWeek: 0});
                        db.insertDataToCollection(endPoint + "_Data", {
                            index: index,
                            data: data,
                            dayOfWeek: dayOfWeek
                        }).then(doNothing, doNothing);
                    }
                }, doNothing);
                var yesterday = getDayBefore(dayOfWeek);
                db.findDataReturnObjectFromCollection(endPoint + "_Data", {index: index, dayOfWeek: yesterday}).then((result2) => {
                    if (result2) {
                        var dataYesterday = result2.data;
                        console.error("DATA CRR: " + data + " " + dataYesterday);
                        if(this.checkConditionAlert(data, dataYesterday, percent)) {
                            if(timeAlertContinuousYesterday < maxTimeAlertContinuous) {
                                bot.sendMessage(chatId, this.stringAlert(data, dataYesterday, false));
                                timeAlertContinuousYesterday += 1;
                                db.updateDataFromCollection("EndPointInfo", {endPoint: endPoint}, {timeAlertContinuousYesterday: timeAlertContinuousYesterday});
                            }
                        } else {
                            db.updateDataFromCollection("EndPointInfo", {endPoint: endPoint}, {timeAlertContinuousYesterday: 0});
                        }
                    } else {
                        db.updateDataFromCollection("EndPointInfo", {endPoint: endPoint}, {timeAlertContinuousYesterday: 0});
                    }
                }, doNothing);
            }
        }, doNothing);
    }
};
