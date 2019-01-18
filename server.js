const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require("body-parser");
const request = require("request");
const md5 = require("md5");
const fs = require("fs")
const parse = require("csv-parse");
const token = '666177464:AAG8mro3tNOX_6LbFTNRtwX35Y1QYOdDbC0';
const bot = new TelegramBot(token, {polling: true});
const port = 3000;
const app = express();
var router = express.Router();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
const HashMap = require("hashmap");
const mongoClient = require("mongodb").MongoClient;
const urlMongoServer = "mongodb://localhost:27017/";
const nameDB = "mydb";
const defaultPeriod = 2 * 60 * 1000;
const minDuration = 30;
const maxTimeAlert = 3;
const defaultPercent = 0.3;
const timesInCreaseLimit = 4;
const serverPort = 9091;
const maxPermissionQueueSize = 1000;

var typePayments = new HashMap();
var csvPaymentTypePath = "./paymentType.csv";

fs.createReadStream(csvPaymentTypePath).pipe(parse({delimiter: ':'})).on('data', function (csvRow) {
    "use strict";
    var dataRow = csvRow.toString().split("\t");
    typePayments.set(dataRow[0], dataRow[1]);
}).on('end', function () {
    "use strict";
    console.log("End read CSV");
});

function updateClient(postData, uri, chatId, callBack) {
    "use strict";
    var clientServerOptions = {
        uri: 'http://' + uri,
        body: JSON.stringify(postData),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    request(clientServerOptions, function (err, response) {
        if (err || (response.statusCode < 200 && response.statusCode > 299)) {
            bot.sendMessage(chatId, "Có lỗi trong quá trình gửi tin! Vui lòng thử lại");
        } else {
            callBack(response);
        }
    });
}

function createDatabase() {
    "use strict";
    mongoClient.connect(urlMongoServer + nameDB, function (err, db) {
        "use strict";
        if (err) throw err;
        console.log("Database create!");
        db.close();
    });
}

var doNothing = function (err) {
};

function createCollection(nameCollection) {
    "use strict";
    nameCollection = String(nameCollection);
    mongoClient.connect(urlMongoServer, function (err, db) {
        if (err) throw err;
        var dbo = db.db(nameDB);
        if (dbo.collection(nameDB)) {
            console.log("COLLECTION IS EXIST!");
            db.close();
            return;
        }
        dbo.createCollection(nameCollection, {autoIndexId: false});
    });
}

function insertDataToCollection(nameCollection, obj) {
    "use strict";
    nameCollection = String(nameCollection);
    return new Promise((resolve, reject) => {
        mongoClient.connect(urlMongoServer, function (err, db) {
            if (err) reject(err);
            var dbo = db.db(nameDB);
            var promise2 = new Promise((resolve1, reject1) => {
                dbo.collection(nameCollection).insertOne(obj, function (err, res) {
                    if (err) reject1(err);
                    db.close();
                    resolve1(true);
                });
            });
            promise2.then((rs) => {
                resolve(rs);
            }, (error) => {
                reject(error);
            })

        });
    })
}

function insertManyDataToCollection(nameCollection, obj) {
    "use strict";
    nameCollection = String(nameCollection);
    return new Promise((resolve, reject) => {
        mongoClient.connect(urlMongoServer, function (err, db) {
            if (err) reject(err);
            var dbo = db.db(nameDB);
            var promise2 = new Promise((resolve1, reject1) => {
                dbo.collection(nameCollection).insertMany(obj, function (err, res) {
                    if (err) reject1(err);
                    db.close();
                    resolve1(true);
                });
            });
            promise2.then((rs) => {
                resolve(rs);
            }, (error) => {
                reject(error);
            })

        });
    })
}

function findDataReturnObjectFromCollection(nameCollection, obj) {
    "use strict";
    nameCollection = String(nameCollection);
    return new Promise((resolve, reject) => {
        mongoClient.connect(urlMongoServer, function (err, db) {
            if (err) throw err;
            var dbo = db.db(nameDB);
            var promise2 = new Promise((resolve2, reject2) => {
                dbo.collection(nameCollection).findOne(obj, function (err, result) {
                    if (err) throw reject2(err);
                    db.close();
                    resolve2(result);
                });
            });

            promise2.then((result2) => {
                resolve(result2);
            }, (errMsg) => reject(errMsg));
        });
    });
}

function findDataReturnArrayFromCollection(nameCollection, obj) {
    "use strict";
    nameCollection = String(nameCollection);
    return new Promise((resolve, reject) => {
        mongoClient.connect(urlMongoServer, function (err, db) {
            if (err) throw err;
            var dbo = db.db(nameDB);
            var promise2 = new Promise((resolve2, reject2) => {
                dbo.collection(nameCollection).find(obj).toArray(function (err, result) {
                    if (err) throw reject2(err);
                    db.close();
                    resolve2(result);
                });
            });

            promise2.then((result2) => {
                resolve(result2);
            }, (errMsg) => reject(errMsg));
        });
    });

}

function deleteDataFromCollection(nameCollection, obj) {
    "use strict";
    nameCollection = String(nameCollection);
    mongoClient.connect(urlMongoServer, function (err, db) {
        if (err) throw err;
        var dbo = db.db(nameDB);
        dbo.collection(nameCollection).deleteMany(obj, function (err, obj) {
            if (err) throw err;
            db.close();
        });
    });
}

function updateDataFromCollection(nameCollection, query, valueNew) {
    "use strict";
    nameCollection = String(nameCollection);
    mongoClient.connect(urlMongoServer, function (err, db) {
        if (err) throw err;
        var newValue = {$set: valueNew};
        var dbo = db.db(nameDB);
        dbo.collection(nameCollection).updateOne(query, newValue, function (err, res) {
            if (err) throw err;
            db.close();
        });
    });
}

function dropCollection(nameCollection) {
    "use strict";
    nameCollection = String(nameCollection);
    mongoClient.connect(urlMongoServer, function (err, db) {
        if (err) throw err;
        var dbo = db.db(nameDB);
        if (!dbo.collection(nameDB)) {
            console.log("COLLECTION IS NOT EXIST!");
            return;
        }
        dbo.collection(nameCollection).drop(function (err, delOK) {
            if (err) throw err;
            if (delOK) console.log("Collection " + nameCollection + " deleted!");
            db.close();
        });
    });
}

createDatabase();

function getIpWithNormalFormat(ipClient) {
    "use strict";
    var regex = /(\d)+\.(\d)+\.(\d)+\.(\d)+/gi;
    if (ipClient.match(regex)) {
        return ipClient.match(regex)[0];
    } else {
        return null;
    }
}
// END IP SESSION

var listGroupChatId = [];
var listEndPoint = [];

findDataReturnObjectFromCollection("GroupChatInfo", {}).then((result) => {
    if (result) {
        listGroupChatId = result.listGroupChatId;
        if (!listGroupChatId) {
            listGroupChatId = [];
            insertDataToCollection("GroupChatInfo", {listGroupChatId: listGroupChatId});
        }
    } else {
        listGroupChatId = [];
        insertDataToCollection("GroupChatInfo", {listGroupChatId: listGroupChatId});
    }
}, (errMsg) => {
    listGroupChatId = [];
    insertDataToCollection("GroupChatInfo", {listGroupChatId: listGroupChatId});
});

findDataReturnArrayFromCollection("EndPointInfo", {}).then((result) => {
    if (result) {
        result.forEach((item) => {
            var endPoint = item.endPoint;
            var idChat = item.groupId;
            if (endPoint) {
                findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((result4) => {
                    if (result4) {
                        var type = result4.type;
                        listEndPoint.push(endPoint);
                        addEndPoint(endPoint, idChat, type);
                    }
                }, doNothing);
            }
        });
    } else {
        console.log("DON'T HAVE ENDPOINT");
    }
}, doNothing);

function getObjectChoose(type, endPoint, chatId) {
    "use strict";
    switch (type) {
        case "CCU_AND_QUEUE":
            return new CcuAndQueue(endPoint, chatId);
        //case "QUEUE":
        //    return new Queue(endPoint, chatId);
        case "PAYMENT":
            return new Payment(endPoint, chatId);
        default:
            return null;
    }
}

function addEndPoint(endPoint, chatId, type) {
    "use strict";

    var objectChoose = getObjectChoose(type, endPoint, chatId);
    if (!objectChoose) {
        console.log("Have no in type");
    } else {
        objectChoose.initData(endPoint);

        console.log("Add new endPoint : " + endPoint + "|" + type);

        app.post('/' + endPoint, (req, res) => {
            "use strict";

            var ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.sokect.remoteAddress;

            var ipFormat = getIpWithNormalFormat(ip);

            var passcode = req.body.passcode;

            if (!passcode && !ipFormat) {
                res.send(false);
                return;
            }
            var data = req.body.data;
            var index = req.body.index;

            findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rsMsg) => {
                if (!rsMsg) {
                    insertDataToCollection(chatId + "_Ip", {ip: ipFormat}).then(doNothing, doNothing);
                }
            }, doNothing);

            findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((rs) => {
                if (rs) {
                    if (rs.passcode != passcode) {
                        res.send(false);
                    } else {
                        res.send(objectChoose.doCheckAlert(index, data));
                    }
                } else {
                    insertDataToCollection(chatId + "_Passcode", {passcode: passcode}).then(doNothing, doNothing);
                    res.send(objectChoose.doCheckAlert(index, data));
                }
            }, (err) => {
                insertDataToCollection(chatId + "_Passcode", {passcode: passcode}).then(doNothing, doNothing);
                res.send(objectChoose.doCheckAlert(index, data));
            });

        });
    }
}

class Ccu {
    constructor(endPoint, chatId) {
        "use strict";
        this.endPoint = endPoint;
        this.chatId = chatId;
    }

    initData(endPoint) {
        "use strict";

        findDataReturnObjectFromCollection(endPoint + "_TimeAlertContinuousWeek", {}).then((result) => {
            if (!result) {
                insertDataToCollection(endPoint + "_TimeAlertContinuousWeek", {timesAlert: 0}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(endPoint + "_TimeAlertContinuousYesterday", {}).then((result) => {
            if (!result) {
                insertDataToCollection(endPoint + "_TimeAlertContinuousYesterday", {timesAlert: 0}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(endPoint + "_TYPE", {}).then((result) => {
            if(!result) {
                insertDataToCollection(endPoint + "_TYPE", {type : "CCU"}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(endPoint + "_Percent", {}).then((result) => {
            if (!result) {
                insertDataToCollection(endPoint + "_Percent", {percent: defaultPercent}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(endPoint + "_MaxTimesAlertContinuous", {}).then((result) => {
            if (!result) {
                insertDataToCollection(endPoint + "_MaxTimesAlertContinuous", {maxTimeAlert: maxTimeAlert}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(endPoint, {}).then((result) => {
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
            insertManyDataToCollection(this.endPoint, listData[i]).then(doNothing, doNothing);
        }
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

        console.log("CHECK WITH CCU");

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
        deleteDataFromCollection(this.endPoint, {});
        console.log("Remove Data Collection");
        //dropCollection(this.endPoint);
        //dropCollection(this.endPoint + "_Percent");
        //dropCollection(this.endPoint + "_MaxTimesAlertContinuous");
        //dropCollection(this.endPoint + "_TimeAlertContinuousWeek");
        //dropCollection(this.endPoint + "_TimeAlertContinuousYesterday");
        //dropCollection(this.endPoint + "_Type");
    }

    checkNeedAlert(index, data, chatId, endPoint, dayOfWeek) {
        "use strict";
        findDataReturnObjectFromCollection(endPoint, {index: index, dayOfWeek: dayOfWeek}).then((rs) => {
            if (rs) {
                findDataReturnArrayFromCollection(endPoint, {index: index}).then((resutl3) => {
                    var num = resutl3.length;
                    var sum = 0;
                    resutl3.forEach((item) => {
                        sum += item.data;
                    });

                    if (num > 0) {
                        var averageData = parseInt(sum / num);
                        findDataReturnObjectFromCollection(endPoint + "_Percent", {}).then((rsMsg) => {
                            var percent = rsMsg.percent;
                            console.log("PERCENT : " + percent);
                            if (this.checkConditionAlert(data, averageData, percent)) {
                                findDataReturnObjectFromCollection(endPoint + "_TimeAlertContinuousWeek", {}).then((rs) => {
                                    if (rs) {
                                        var timesAlert = rs.timesAlert;
                                        findDataReturnObjectFromCollection(endPoint + "_MaxTimesAlertContinuous", {}).then((result) => {
                                            if (result) {
                                                var maxTimeAlertOfEndPoint = result.maxTimeAlert;
                                                if (timesAlert < maxTimeAlertOfEndPoint) {
                                                    bot.sendMessage(chatId, this.stringAlert(data, averageData, true));
                                                    timesAlert += 1;
                                                    updateDataFromCollection(this.endPoint + "_TimeAlertContinuousWeek", {}, {timesAlert: timesAlert});
                                                }
                                            } else {
                                                if (timesAlert < maxTimeAlert) {
                                                    bot.sendMessage(chatId, this.stringAlert(data, averageData, true));
                                                    timesAlert += 1;
                                                    updateDataFromCollection(this.endPoint + "_TimeAlertContinuousWeek", {}, {timesAlert: timesAlert});
                                                    insertDataToCollection(endPoint + "_MaxTimesAlertContinuous", {maxTimeAlert: maxTimeAlert}).then(doNothing, doNothing);
                                                }
                                            }
                                        }, doNothing);

                                    }
                                }, (err) => {
                                    console.log("get TIME ALERT WEEK FAIL!");
                                });

                            } else {
                                updateDataFromCollection(endPoint + "_TimeAlertContinuousWeek", {}, {timesAlert: 0});
                            }
                        }, doNothing);
                    }

                    updateDataFromCollection(endPoint, {index: index, dayOfWeek: dayOfWeek}, {
                        index: index,
                        data: data,
                        dayOfWeek: dayOfWeek
                    });
                }, doNothing);

            } else {
                console.log("Data today in null");
                insertDataToCollection(endPoint, {
                    index: index,
                    data: data,
                    dayOfWeek: dayOfWeek
                }).then(doNothing, doNothing);
            }
        }, (errMsg) => {
            console.log("error in get data today");
        });

        var yesterday = getDayBefore(dayOfWeek);
        findDataReturnObjectFromCollection(endPoint, {index: index, dayOfWeek: yesterday}).then((result2) => {
            if (result2) {
                var dataYesterday = result2.data;
                console.log("ccu yesterday :" + JSON.stringify(dataYesterday));
                if (dataYesterday) {
                    findDataReturnObjectFromCollection(endPoint + "_Percent", {}).then((rsMsg) => {
                        var percent = rsMsg.percent;
                        if (this.checkConditionAlert(data, dataYesterday, percent)) {
                            findDataReturnObjectFromCollection(endPoint + "_TimeAlertContinuousYesterday", {}).then((rs) => {
                                if (rs) {
                                    var timesAlert = rs.timesAlert;
                                    findDataReturnObjectFromCollection(endPoint + "_MaxTimesAlertContinuous", {}).then((result) => {
                                        if (result) {
                                            var maxTimeAlertOfEndPoint = result.maxTimeAlert;
                                            if (timesAlert < maxTimeAlertOfEndPoint) {
                                                bot.sendMessage(chatId, this.stringAlert(data, dataYesterday, false));
                                                timesAlert += 1;
                                                updateDataFromCollection(this.endPoint + "_TimeAlertContinuousYesterday", {}, {timesAlert: timesAlert});
                                            }
                                        } else {
                                            if (timesAlert < maxTimeAlert) {
                                                bot.sendMessage(chatId, this.stringAlert(data, dataYesterday, false));
                                                timesAlert += 1;
                                                updateDataFromCollection(this.endPoint + "_TimeAlertContinuousYesterday", {}, {timesAlert: timesAlert});
                                                insertDataToCollection(endPoint + "_MaxTimesAlertContinuous", {maxTimeAlert: maxTimeAlert}).then(doNothing, doNothing);
                                            }
                                        }
                                    }, doNothing);
                                }
                            }, (err) => {
                                console.log("get TIME ALERT YESTERDAY FAIL!");
                            });

                        } else {
                            updateDataFromCollection(endPoint + "_TimeAlertContinuousYesterday", {}, {timesAlert: 0});
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
}

class Queue {
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
    //    dropCollection(this.endPoint);
    //    dropCollection(this.endPoint + "_ExtensionQueue");
    //    dropCollection(this.endPoint + "_OutGoingQueue");
    //    dropCollection(this.endPoint + "_ExtensionQueue");
    //    dropCollection(this.endPoint + "_Type");
    //}

    initData(endPoint) {
        "use strict";
        findDataReturnObjectFromCollection(endPoint, {type: "SystemQueue"}).then((rs) => {
            if (!rs) {
                insertDataToCollection(endPoint, {type: "SystemQueue", timesIncrease: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        findDataReturnObjectFromCollection(endPoint, {type: "OutGoingQueue"}).then((rs) => {
            if (!rs) {
                insertDataToCollection(endPoint, {type: "OutGoingQueue", timesIncrease: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        findDataReturnObjectFromCollection(endPoint, {type: "ExtensionQueue"}).then((rs) => {
            if (!rs) {
                insertDataToCollection(endPoint, {type: "ExtensionQueue", timesIncrease: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        findDataReturnObjectFromCollection(endPoint + "_TYPE", {}).then((rs) => {
            if(!rs) {
                insertDataToCollection(endPoint + "_TYPE", {type : "QUEUE"}).then(doNothing, doNothing);
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

        console.log("CHECK WITH QUEUE");
        this.checkNeedAlert(systemQueue, outGoingQueue, extensionQueue, this.chatId, this.endPoint);

        return true;
    }

    stringAlert(type) {
        "use strict";
        return type + " ĐANG TĂNG LÊN LIÊN TỤC!";
    }

    checkNeedAlertWithType(chatId, type, endPoint, crrValue) {
        "use strict";
        findDataReturnObjectFromCollection(endPoint + "_" + type, {}).then((rs) => {
            if (rs) {
                var oldValue = rs.data;

                if (this.checkConditionAlert(crrValue, oldValue)) {
                    findDataReturnObjectFromCollection(endPoint, {type: type}).then((result) => {
                        if (result) {
                            var timesIncrease = result.timesIncrease;
                            if (timesIncrease >= timesInCreaseLimit) {
                                bot.sendMessage(chatId, this.stringAlert(type));
                            }
                            updateDataFromCollection(endPoint, {type: type}, {
                                type: type,
                                timesIncrease: timesIncrease + 1
                            });
                        } else {
                            insertDataToCollection(endPoint, {type: type, timesIncrease: 1}).then(doNothing, doNothing);
                        }
                    }, doNothing);
                } else {
                    updateDataFromCollection(endPoint, {type: type}, {type: type, timesIncrease: 1});
                }
                updateDataFromCollection(endPoint + "_" + type, {}, {data: crrValue});
            } else {
                insertDataToCollection(endPoint + "_" + type, {data: crrValue}).then(doNothing, doNothing);
            }
        }, (err) => {
            insertDataToCollection(endPoint + "_" + type, {data: crrValue}).then(doNothing, doNothing);
        });
    }

    checkNeedAlert(systemQueue, outGoingQueue, extensionQueue, chatId, endPoint) {
        "use strict";
        this.checkNeedAlertWithType(chatId, "SystemQueue", endPoint, systemQueue);
        this.checkNeedAlertWithType(chatId, "OutGoingQueue", endPoint, outGoingQueue);
        this.checkNeedAlertWithType(chatId, "ExtensionQueue", endPoint, extensionQueue);
        return true;
    }
}

class CcuAndQueue {
    constructor(endPoint, chatId) {
        "use strict";
        this.ccu = new Ccu(endPoint, chatId);
        this.queue = new Queue(endPoint, chatId);
    }

    initData(endPoint) {
        "use strict";
        findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((result) => {
            if (!result) {
                insertDataToCollection(endPoint + "_Type", {type: "CCU_AND_QUEUE"}).then((success) => {
                    this.ccu.initData(endPoint);
                    this.queue.initData(endPoint);
                }, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((result) => {
            if (!result) {
                insertDataToCollection(endPoint + "_Status", {isActive: true}).then(doNothing, doNothing);
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
        findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((result) => {
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

    doCheckAlert(index, data) {
        "use strict";
        var endPoint = this.ccu.endPoint;
        this.doCheckAlertWithEndPoint(index, data, endPoint);
    }
}

//class Payment {
//    constructor(endPoint, chatId) {
//        "use strict";
//        this.endPoint = endPoint;
//        this.chatId = chatId;
//    }
//
//    initData(endPoint) {
//        "use strict";
//
//        var seft = this;
//        var functionTimeOut = function () {
//
//            findDataReturnObjectFromCollection(endPoint, {}).then((rs) => {
//                if (rs) {
//                    var numPayment = rs.numPayment;
//                    if (numPayment <= 0) {
//                        bot.sendMessage(seft.chatId, "ĐÃ QUÁ LÂU MÀ CHƯA THẤY CÓ PAYMENT! HUHU");
//                    }
//
//                    updateDataFromCollection(endPoint {}, {numPayment: 0});
//                    findDataReturnObjectFromCollection(endPoint + "_Period", {}).then((result) => {
//                        var timeOut = result.period;
//                        setTimeout(functionTimeOut, timeOut);
//                    }, doNothing);
//                }
//            }, doNothing);
//        };
//
//        findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
//            if (!rs) {
//                insertDataToCollection(endPoint + "_Type", {type: "PAYMENT"}).then(doNothing, doNothing);
//            }
//        }, doNothing);
//
//
//        findDataReturnObjectFromCollection(endPoint, {}).then((rsMsg) => {
//            if (rsMsg) {
//                findDataReturnObjectFromCollection(endPoint + "_Period", {}).then((result) => {
//                    if (result) {
//                        var timeOut = result.period;
//                        setTimeout(functionTimeOut, timeOut);
//                    } else {
//                        insertDataToCollection(endPoint + "_Period", {period: defaultPeriod}).then((ok1) => {
//                            setTimeout(functionTimeOut, defaultPeriod);
//                        }, doNothing);
//                    }
//                }, doNothing);
//            } else {
//                insertDataToCollection(endPoint, {numPayment: 0}).then((ok) => {
//                    insertDataToCollection(endPoint + "_Period", {period: defaultPeriod}).then((ok1) => {
//                        setTimeout(functionTimeOut, defaultPeriod);
//                    }, doNothing);
//                }, doNothing);
//            }
//        }, doNothing);
//
//    }
//
//    doCheckAlert(index, data) {
//        "use strict";
//        console.log("add Payment");
//        findDataReturnObjectFromCollection(this.endPoint, {}).then((rs) => {
//            if (rs) {
//                var numPayment = rs.numPayment;
//                updateDataFromCollection(this.endPoint, {}, {numPayment: numPayment + 1});
//            } else {
//                return false;
//            }
//        }, doNothing);
//        return true;
//    }
//
//}
class Payment {
    constructor(endPoint, chatId) {
        "use strict";
        this.endPoint = endPoint;
        this.chatId = chatId;
    }

    //removeData() {
    //    "use strict";
    //    //dropCollection(this.endPoint);
    //    //dropCollection(this.endPoint + "_Type");
    //    //dropCollection(this.endPoint + "_Period");
    //}

    initData(endPoint) {
        "use strict";

        var seft = this;
        var functionTimeOut = function () {

            findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((result) => {
                if (!result || !result.isActive) {
                    console.log(endPoint + " ĐANG TRONG TRẠNG THÁI UNACTIVE");
                } else {
                    findDataReturnArrayFromCollection(endPoint, {}).then((rs) => {
                        if (rs && rs.length > 0) {
                            rs.forEach((item) => {
                                var numPayment = item.numPayment;
                                if (numPayment <= 0) {
                                    bot.sendMessage(seft.chatId, "ĐÃ QUÁ LÂU MÀ CHƯA THẤY CÓ PAYMENT Ở CHANEL " + typePayments.get(item.chanel));
                                }
                                updateDataFromCollection(endPoint, {chanel: item.chanel}, {numPayment: 0});
                            })
                        }
                    }, doNothing);
                }
            }, doNothing);

            findDataReturnObjectFromCollection(endPoint + "_Period", {}).then((result) => {
                var timeOut = result.period;
                setTimeout(functionTimeOut, timeOut);
            }, doNothing);
        };

        findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
            if (!rs) {
                insertDataToCollection(endPoint + "_Type", {type: "PAYMENT"}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((result) => {
            if (!result) {
                insertDataToCollection(endPoint + "_Status", {isActive: true}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnArrayFromCollection(endPoint, {}).then((rsMsg) => {
            if (!rsMsg || rsMsg.length == 0) {
                bot.sendMessage(seft.chatId, "HIỆN TẠI CHƯA CÓ LOẠI PAYMENT NÀO ĐƯỢC CHỌN ĐỂ ALERT, VUI LÒNG THÊM!");
            }
            findDataReturnObjectFromCollection(endPoint + "_Period", {}).then((result) => {
                if (result) {
                    var timeOut = result.period;
                    setTimeout(functionTimeOut, timeOut);
                } else {
                    insertDataToCollection(endPoint + "_Period", {period: defaultPeriod}).then((ok1) => {
                        setTimeout(functionTimeOut, defaultPeriod);
                    }, doNothing);
                }
            }, doNothing);
        }, doNothing);

    }

    doCheckAlert(index, data) {
        "use strict";
        console.log("add Payment");
        findDataReturnObjectFromCollection(this.endPoint, {chanel: data}).then((rs) => {
            if (rs) {
                var numPayment = rs.numPayment;
                updateDataFromCollection(this.endPoint, {chanel: data}, {chanel: data, numPayment: numPayment + 1});
            } else {
                return false;
            }
        }, doNothing);
        return true;
    }

}

function testIsStart(chatId) {
    "use strict";
    return listGroupChatId.includes(chatId);
}

function startChanel(chatId) {
    "use strict";
    if (!listGroupChatId.includes(chatId)) {
        listGroupChatId.push(chatId);
        updateDataFromCollection("GroupChatInfo", {}, {listGroupChatId: listGroupChatId});
        return true;
    }
    return false;
}

bot.onText(/\/changePasscode (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    var newPasscode = match[1];
    newPasscode = md5(newPasscode);

    findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
        if (rs2) {
            var ip = rs2.ip;
            findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((rs3) => {
                if (rs3) {
                    var passcode = rs3.passcode;
                    updateClient({
                        passcode: passcode,
                        newPasscode: newPasscode
                    }, ip + ":" + serverPort + "/passcode", chatId, (response) => {
                        "use strict";
                        updateDataFromCollection(chatId + "_Passcode", {}, {passcode: newPasscode});
                        bot.sendMessage(chatId, "Cập nhật Passcode thành công");
                    });
                } else {
                    bot.sendMessage(chatId, "CHƯA NHẬN DIỆN ĐƯỢC SERVER");
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "CHƯA CÓ IP! CÓ THỂ THÊM IP SERVER BẰNG LỆNH '/addIp {ip}'");
        }
    }, doNothing);

});

bot.onText(/\/changeIp (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    var newIp = match[1];
    newIp = getIpWithNormalFormat(newIp);
    if (newIp == null) {
        bot.sendMessage(chatId, "IP BẠN NHẬP KHÔNG ĐÚNG ĐỊNH DẠNG");
        return;
    }

    findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
        if (rs2) {
            var ip = rs2.ip;
            updateDataFromCollection(chatId + "_Ip", {ip: ip}, {ip: newIp});
        } else {
            insertDataToCollection(chatId + "_Ip", {ip: newIp}).then(doNothing, doNothing);
        }
        bot.sendMessage(chatId, "THAY ĐỔI IP SERVER GAME THÀNH CÔNG");
    }, doNothing);

});

bot.onText(/\/changePeriod (.+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    var newValueDuration = match[2];

    console.log(newValueDuration);
    try {
        newValueDuration = parseInt(newValueDuration);
    } catch (e) {
        bot.sendMessage(chatId, "GỬI KHÔNG ĐÚNG ĐỊNH DẠNG");
        return;
    }

    if (newValueDuration % minDuration != 0 || newValueDuration <= 0) {
        bot.sendMessage(chatId, "PERIOD phải là số chia hết cho " + minDuration + "(s)");
        return;
    }

    var endPoint = match[1];

    findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((rsMessage) => {
        "use strict";
        if (rsMessage) {
            findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs1) => {
                "use strict";
                if (rs1) {
                    switch (rs1.type) {
                        case "CCU_AND_QUEUE":
                            findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
                                if (rs2) {
                                    var ip = rs2.ip;
                                    findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((rs3) => {
                                        if (rs3) {
                                            var passcode = rs3.passcode;
                                            updateClient({
                                                passcode: passcode,
                                                duration: newValueDuration
                                            }, ip + ":" + serverPort + "/duration", chatId, doNothing);
                                            bot.sendMessage(chatId, "Cập nhật Period Thành công")
                                        } else {
                                            bot.sendMessage(chatId, "CHƯA NHẬN DIỆN ĐƯỢC SERVER");
                                        }
                                    }, doNothing);
                                } else {
                                    bot.sendMessage(chatId, "CHƯA CÓ IP");
                                }
                            }, doNothing);
                            break;
                        case "PAYMENT":
                            findDataReturnObjectFromCollection(endPoint + "_Period", {}).then((rs) => {
                                "use strict";
                                if (rs) {
                                    updateDataFromCollection(endPoint + "_Period", {}, {period: newValueDuration * 1000});
                                    bot.sendMessage(chatId, "Cập nhật Period Thành công")
                                }
                            }, doNothing);
                            break;
                    }

                } else {
                    bot.sendMessage(chatId, "ENDPOINT NÀY CHƯA ĐƯỢC KÍCH HOẠT");
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "ENDPOINT NÀY KHÔNG CÓ TRONG CHANEL CỦA BẠN");
        }
    }, doNothing);
});

bot.onText(/\/changePercent (.+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    var newValue = match[2];

    console.log(newValue);
    try {
        newValue = parseFloat(newValue);
    } catch (e) {
        bot.sendMessage(chatId, "GỬI KHÔNG ĐÚNG ĐỊNH DẠNG");
        return;
    }

    if (newValue > 1 || newValue <= 0) {
        bot.sendMessage(chatId, "TỶ LỆ PHẢI NẰM TRONG KHOẢNG TỪ LỚN HƠN 0 ĐẾN NHỎ HƠN BẰNG 1");
        return;
    }
    var endPoint = match[1];

    findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((rsMessage) => {
        "use strict";
        if (rsMessage) {
            findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs1) => {
                "use strict";
                if (rs1) {
                    switch (rs1.type) {
                        case "CCU_AND_QUEUE":
                            updateDataFromCollection(endPoint + "_Percent", {}, {percent: newValue});
                            bot.sendMessage(chatId, "THAY ĐỔI THÀNH CÔNG!");
                            break;
                        default :
                            bot.sendMessage(chatId, "ENDPOINT BẠN NHẬP KHÔNG ÁP DỤNG CHO CCU!");
                            break;
                    }

                } else {
                    bot.sendMessage(chatId, "ENDPOINT NÀY CHƯA ĐƯỢC KÍCH HOẠT");
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "ENDPOINT NÀY KHÔNG CÓ TRONG CHANEL CỦA BẠN");
        }
    }, doNothing);
});

bot.onText(/\/changeMaxTimesContiniousAlert (.+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    var newValue = match[2];

    console.log(newValue);
    try {
        newValue = parseInt(newValue);
    } catch (e) {
        bot.sendMessage(chatId, "GỬI KHÔNG ĐÚNG ĐỊNH DẠNG");
        return;
    }

    if (newValue < 1) {
        bot.sendMessage(chatId, "GIÁ TRỊ SỐ LẦN THÔNG BÁO LIÊN TỤC LỚN NHẤT CẦN LÀ MỘT SỐ NGUYÊN LỚN HƠN 0");
        return;
    }
    var endPoint = match[1];

    findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((rsMessage) => {
        "use strict";
        if (rsMessage) {
            findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs1) => {
                "use strict";
                if (rs1) {
                    switch (rs1.type) {
                        case "CCU_AND_QUEUE":
                            updateDataFromCollection(endPoint + "_MaxTimesAlertContinuous", {}, {maxTimeAlert: newValue});
                            bot.sendMessage(chatId, "THAY ĐỔI THÀNH CÔNG!");
                            break;
                        default :
                            bot.sendMessage(chatId, "ENDPOINT BẠN NHẬP KHÔNG ÁP DỤNG CHO CCU!");
                            break;
                    }

                } else {
                    bot.sendMessage(chatId, "ENDPOINT NÀY CHƯA ĐƯỢC KÍCH HOẠT");
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "ENDPOINT NÀY KHÔNG CÓ TRONG CHANEL CỦA BẠN");
        }
    }, doNothing);
});

bot.onText(/\/startBot/, (msg) => {
    const chatId = msg.chat.id;
    var result = startChanel(chatId);

    const resp = (result == true) ? "Start Success" : "Already started";
    bot.sendMessage(chatId, resp);
});

bot.onText(/\/listEndPoint/, (msg) => {
    const chatId = msg.chat.id;
    findDataReturnArrayFromCollection("EndPointInfo", {groupId: chatId}).then((rs) => {
        "use strict";
        if (rs.length > 0) {
            rs.forEach((item) => {
                var result = "";
                var endPoint = item.endPoint;
                result += endPoint;
                findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rst) => {
                    if (rst) {
                        result += " | TYPE : " + rst.type;
                        findDataReturnObjectFromCollection(endPoint + "_Percent", {}).then((rsMsg) => {
                            if (rsMsg) {
                                result += " | COEFFICIENT : " + rsMsg.percent;
                                bot.sendMessage(chatId, result);
                            }
                        }, doNothing);

                        findDataReturnObjectFromCollection(endPoint + "_Period", {}).then((rsMsg) => {
                            if (rsMsg) {
                                var date = new Date(null);
                                date.setMilliseconds(rsMsg.period);
                                result += " | PERIOD : " + date.toISOString().substr(11, 8);
                                bot.sendMessage(chatId, result);
                            }
                        }, doNothing);
                    } else {
                        result += " : Chưa cập nhật type";
                        bot.sendMessage(chatId, result);
                    }
                }, (err) => {
                    console.log("GET TYPE LỖI!");
                });
            });
        } else {
            bot.sendMessage(chatId, "BẠN CHƯA CÓ ENDPOINT NÀO");
        }
    }, (err) => {
        "use strict";
        bot.sendMessage(chatId, "ĐANG XẢY RA SỰ CỐ! VUI LÒNG THỬ LẠI!");
    });
});

function getDayBefore(crrDay) {
    if (crrDay == 0) return 6;
    return crrDay - 1;
}

function getDayAfter(crrDay) {
    if (crrDay == 6) return 0;
    return crrDay + 1;
}

function checkExistEndPoint(endPoint) {
    "use strict";
    return listEndPoint.includes(endPoint);
}

bot.onText(/\/addEndPoint (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const endPoint = match[1];

    if (!checkIsCorrectFormatEndPoint(endPoint)) {
        bot.sendMessage(chatId, "DINH DANG ENDPOINT CHUA DUNG!");
        return;
    }

    if (!testIsStart(chatId)) {
        bot.sendMessage(chatId, "CHANEL CHUA DUOC BAT DAU. VUI LONG NHAP 'startBOT'");
        return;
    }
    if (checkExistEndPoint(endPoint)) {
        bot.sendMessage(chatId, "ENDPOINT NAY DA TON TAI!");
        return;
    }

    listEndPoint.push(endPoint);

    insertDataToCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then(doNothing, doNothing);

    bot.sendMessage(chatId, 'Vui lòng chọn loại!', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'CCU AND QUEUE',
                        callback_data: ('CCU_AND_QUEUE ' + endPoint)
                    },
                    //{
                    //    text: 'QUEUE',
                    //    callback_data: ('QUEUE ' + endPoint)
                    //},
                    {
                        text: 'PAYMENT',
                        callback_data: ('PAYMENT ' + endPoint)
                    }
                ]
            ]
        }
    });
});

bot.onText(/\/addChanelPayment (.+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const endPoint = match[1];
    const typePayment = match[2];
    console.log("come here");

    if (!checkIsCorrectFormatEndPoint(endPoint)) {
        bot.sendMessage(chatId, "ĐỊNH DẠNG ENDPOINT KHÔNG ĐÚNG!");
        return;
    }

    //if (!isNumber(typePayment)) {
    //    bot.sendMessage(chatId, "ID TYPE PAYMENT PHẢI LÀ 1 SỐ");
    //    return;
    //}

    findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((result) => {
        "use strict";
        if (!result) {
            bot.sendMessage(chatId, "ENDPOINT NÀY KHÔNG TỒN TẠI TRÊN CHANEL CỦA BẠN");
        } else {
            if (typePayments.has(typePayment)) {
                findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
                    if (rs && rs.type && rs.type == "PAYMENT") {
                        findDataReturnObjectFromCollection(endPoint, {chanel: typePayment})
                            .then((rs1) => {
                                if (!rs1) {
                                    doAddIdPaymentInServerGame(chatId, typePayment, endPoint);
                                } else {
                                    bot.sendMessage(chatId, "CHANEL PAYMENT ĐÃ TỒN TẠI");
                                }
                            }, doNothing);
                    } else {
                        bot.sendMessage(chatId, "ENDPOINT CỦA BẠN KHÔNG DÀNH CHO PAYMENT");
                    }
                }, doNothing);
            } else {
                bot.sendMessage(chatId, "LOẠI PAYMENT NÀY CHƯA ĐƯỢC HỔ TRỢ");
            }
        }
    }, doNothing);
});

bot.onText(/\/removeChanelPayment (.+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const endPoint = match[1];
    const typePayment = match[2];
    console.log("come here");

    if (!checkIsCorrectFormatEndPoint(endPoint)) {
        bot.sendMessage(chatId, "ĐỊNH DẠNG ENDPOINT KHÔNG ĐÚNG!");
        return;
    }

    //if (!isNumber(typePayment)) {
    //    bot.sendMessage(chatId, "ID TYPE PAYMENT PHẢI LÀ 1 SỐ");
    //    return;
    //}

    findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((result) => {
        "use strict";
        if (!result) {
            bot.sendMessage(chatId, "ENDPOINT NÀY KHÔNG TỒN TẠI TRÊN CHANEL CỦA BẠN");
        } else {
            if (typePayments.has(typePayment)) {
                findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
                    if (rs && rs.type && rs.type == "PAYMENT") {
                        findDataReturnObjectFromCollection(endPoint, {chanel: typePayment})
                            .then((rs1) => {
                                if (rs1) {
                                    doRemoveIdPaymentInServerGame(chatId, typePayment, endPoint);
                                } else {
                                    bot.sendMessage(chatId, "CHANEL PAYMENT CHƯA TỒN TẠI");
                                }
                            }, doNothing);
                    } else {
                        bot.sendMessage(chatId, "ENDPOINT CỦA BẠN KHÔNG DÀNH CHO PAYMENT");
                    }
                }, doNothing);
            } else {
                bot.sendMessage(chatId, "LOẠI PAYMENT NÀY CHƯA ĐƯỢC HỔ TRỢ");
            }
        }
    }, doNothing);
});

function doRemoveIdPaymentInServerGame(chatId, typePayment, endPoint) {
    "use strict";
    findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
        if (rs2) {
            var ip = rs2.ip;
            updateClient({
                paymentType: typePayment
            }, ip + ":" + serverPort + "/removePaymentType", chatId, (response) => {
                insertDataToCollection(endPoint, {
                    chanel: typePayment,
                    numPayment: 0
                }).then((rs) => {
                    bot.sendMessage(chatId, "Remove Chanel Payment Thành công");
                }, doNothing);
            });
        } else {
            bot.sendMessage(chatId, "CHƯA CÓ IP! CÓ THỂ THÊM IP SERVER BẰNG LỆNH '/addIp {ip}'");
        }
    }, doNothing);
}

function doAddIdPaymentInServerGame(chatId, typePayment, endPoint) {
    "use strict";
    findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
        if (rs2) {
            var ip = rs2.ip;
            updateClient({
                paymentType: typePayment
            }, ip + ":" + serverPort + "/addPaymentType", chatId, (response) => {
                insertDataToCollection(endPoint, {
                    chanel: typePayment,
                    numPayment: 0
                }).then((rs) => {
                    bot.sendMessage(chatId, "Thêm Chanel Payment Thành công");
                }, doNothing);
            });
        } else {
            bot.sendMessage(chatId, "CHƯA CÓ IP! CÓ THỂ THÊM IP SERVER BẰNG LỆNH '/addIp {ip}'");
        }
    }, doNothing);
}

function checkIsCorrectFormatEndPoint(endPoint) {
    "use strict";
    var regex = /.*\s.*/g;
    return !endPoint.match(regex);
}

bot.onText(/\/cheatPayment (.+)/, (msg, match) => {
    "use strict";
    const chatId = msg.chat.id;
    var paymentType = match[1];
    findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs) => {
        if(!rs) {
            bot.sendMessage(chatId, "CHƯA TỒN TẠI IP");
        } else {
            var ip = rs.ip;
            findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((result) => {
                if(!result) {
                    bot.sendMessage(chatId, "CHƯA TỒN TẠI PASSCODE");
                } else {
                    updateClient({passcode : result.passcode, chanel : paymentType}, ip + ":" + serverPort + "/addCoin", chatId, (response) => {
                        bot.sendMessage(chatId, "CHEAT THÀNH CÔNG!");
                    });
                }
            }, doNothing);
        }
    }, doNothing);
});


bot.onText(/\/cleanDataCcu (.+)/, (msg, match) => {
    "use strict";
    const chatId = msg.chat.id;
    var endPoint = match[1];
    findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
        if (!rs) {
            bot.sendMessage(chatId, "ENDPOINT BẠN VỪA NHẬP ĐANG KHÔNG ĐƯỢC SỬ DỤNG");
        } else {
            if (rs.type == "CCU_AND_QUEUE") {
                var objectChoose = new Ccu(endPoint, chatId);
                objectChoose.removeData();
                bot.sendMessage(chatId, "Clean Dữ liệu CCU Thành công");
            } else {
                bot.sendMessage(chatId, "ENDPOINT BẠN VỪA NHẬP KHÔNG DÀNH CHO CCU");
            }
        }
    }, doNothing);
});

bot.onText(/\/changeStatus (.+)/, (msg, match) => {
    "use strict";
    const chatId = msg.chat.id;
    var endPoint = match[1];
    findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((r) => {
        if (r) {
            var isActive = r.isActive;
            updateDataFromCollection(endPoint + "_Status", {isActive: isActive}, {isActive: !isActive});
            if (!isActive) {
                bot.sendMessage(chatId, "Active EndPoint Thành công");
            } else {
                bot.sendMessage(chatId, "Inactive EndPoint Thành công");
            }

        } else {
            bot.sendMessage(chatId, "EndPoint này đang không được sử dụng");
        }
    }, (e) => {
        bot.sendMessage(chatId, "LỖI KẾT NỐI DB");
    });
});

bot.on('callback_query', query => {
    "use strict";
    const chatId = query.message.chat.id;

    var data = query.data.split(' ');
    var type = data[0];
    var endPoint = data[1];


    console.log("type : " + type);
    console.log("endPoint : " + endPoint);

    findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((result) => {
        if (!result) {
            findDataReturnObjectFromCollection("EndPointInfo", {endPoint: endPoint}).then((rs) => {
                if (rs) {
                    var endPoint = rs.endPoint;
                    bot.sendMessage(chatId, "Đã Thêm EndPoint Thành Công!");
                    addEndPoint(endPoint, chatId, type);
                }

            }, (err) => {
                bot.sendMessage(chatId, "ENDPOINT NÀY ĐÃ KÍCH HOẠT! VUI LÒNG CHỌN ENDPOINT KHÁC");
            });
        } else {
            bot.sendMessage(chatId, "ENDPOINT NÀY ĐÃ KÍCH HOẠT! VUI LÒNG CHỌN ENDPOINT KHÁC");
        }
    }, doNothing);

});

function isNumber(str) {
    "use strict";
    var regex = /(\d)+/gi;
    return str.match(regex);
}
app.listen(port, () => console.log("START APP SUCCESS"));