const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const bodyParser = require("body-parser");
const request = require("request");
const md5 = require("md5");
const token = '666177464:AAG8mro3tNOX_6LbFTNRtwX35Y1QYOdDbC0';
const bot = new TelegramBot(token, {polling: true});
const schedule = require('node-schedule');
const cron = require("node-cron");

const port = 3000;
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const mongoClient = require("mongodb").MongoClient;
const urlMongoServer = "mongodb://localhost:27017/";
//const urlMongoServer = "mongodb://phucpham9649:tthvtcx2@ds042698.mlab.com:42698/";
const nameDB = "mydb";
const defaultPeriod = 60 * 1000;

const minDuration = 30;

var delay = 10000;

const maxTimeAlert = 3;
const defaultPercent = 0.3;
const timesInCreaseLimit = 4;

const serverPort = 9090;

var date = new Date().getDay();
schedule.scheduleJob('0 0 * * *', () => {
    "use strict";
    date = (new Date()).getDate();
    console.log("BEGIN NEW DATE")
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
                dbo.collection(nameCollection).insert(obj, function (err, res) {
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
        dbo.collection(nameCollection).deleteOne(obj, function (err, obj) {
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

var listChatId = [];

var listChatURL = [];

findDataReturnObjectFromCollection("listChatId", {}).then((result) => {
    if (result) {
        listChatId = result.data;
        if (!listChatId) {
            listChatId = [];
            insertDataToCollection("listChatId", {data: listChatId});
        }
        doAfterGetListId();
    } else {
        listChatId = [];
        insertDataToCollection("listChatId", {data: listChatId});
        doAfterGetListId();
    }
}, (errMsg) => {
    listChatId = [];
    insertDataToCollection("listChatId", {data: listChatId});
    doAfterGetListId();
});

function doAfterGetListId() {
    findDataReturnObjectFromCollection("crrDate", {}).then((result) => {
        if (result) {
            date = result.date;
            //doIfBeginNewDay();
        } else {
            date = new Date().getDay();
            insertDataToCollection("crrDate", {date: date}).then(doNothing, (err) => {
                console.log("Can't not insert");
            })
        }
    }, (errMsg) => {
        date = new Date().getDay();
        insertDataToCollection("crrDate", {date: date}).then(doNothing, (err) => {
            console.log("Can't not insert");
        });
    });

    listChatId.forEach(function (element) {
        "use strict";
        findDataReturnArrayFromCollection("listURL", {chatId: element}).then((result) => {
            if (result) {
                result.forEach((item) => {
                    var url = item.data;
                    if (url) {
                        findDataReturnObjectFromCollection(url + "_TYPE", {}).then((result4) => {
                            if (result4) {
                                var type = result4.type;
                                listChatURL.push(url);
                                addURL(url, element, type);
                            }
                        }, doNothing);
                    }
                });
            } else {
                console.log("DON'T HAVE URL");
            }
        }, doNothing);
    });
}

function doIfBeginNewDay() {
    "use strict";
    var crrDate = new Date().getDay();
    if (crrDate != date) {
        date = crrDate;
        insertDataToCollection("crrDate", {date: crrDate}).then(doNothing, (err) => {
            console.log("Can't not insert");
        });
    }
}

function getObjectChoose(type, url, chatId) {
    "use strict";
    switch (type) {
        case "CCU_AND_QUEUE":
            return new CcuAndQueue(url, chatId);
        //case "QUEUE":
        //    return new Queue(url, chatId);
        case "PAYMENT":
            return new Payment(url, chatId);
    }
}

function addURL(url, chatId, type) {
    "use strict";

    var objectChoose = getObjectChoose(type, url, chatId);
    objectChoose.initData(url);

    app.post('/' + url, (req, res) => {
        "use strict";

        var ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.sokect.remoteAddress;

        var ipFormat = getIpWithNormalFormat(ip);

        var hashString = req.body.hashString;

        //if(!hashString || !ipFormat) {
        //    res.send(false);
        //    return;
        //}

        if (!hashString) {
            res.send(false);
            return;
        }

        //doIfBeginNewDay();
        var data = req.body.data;
        var index = req.body.index;

        findDataReturnObjectFromCollection(chatId + "_IP", {}).then((rsMsg) => {
            if (!rsMsg) {
                insertDataToCollection(chatId + "_IP", {ip: ipFormat}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(chatId + "_HASHSTRING", {}).then((rs) => {
            if (rs) {
                if (rs.hashString != hashString) {
                    res.send(false);
                } else {
                    res.send(objectChoose.doCheckAlert(index, data));
                }
            } else {
                insertDataToCollection(chatId + "_HASHSTRING", {hashString: hashString}).then(doNothing, doNothing);
                res.send(objectChoose.doCheckAlert(index, data));
            }
        }, (err) => {
            insertDataToCollection(chatId + "_HASHSTRING", {hashString: hashString}).then(doNothing, doNothing);
            res.send(objectChoose.doCheckAlert(index, data));
        });

    });
}

class Ccu {
    constructor(url, chatId) {
        "use strict";
        this.url = url;
        this.chatId = chatId;
    }

    initData(url) {
        "use strict";

        findDataReturnObjectFromCollection(url + "_week", {}).then((result) => {
            if (!result) {
                insertDataToCollection(url + "_week", {timesAlert: 0}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(url + "_yesterday", {}).then((result) => {
            if (!result) {
                insertDataToCollection(url + "_yesterday", {timesAlert: 0}).then(doNothing, doNothing);
            }
        }, doNothing);

        //findDataReturnObjectFromCollection(url + "_TYPE", {}).then((result) => {
        //    if(!result) {
        //        insertDataToCollection(url + "_TYPE", {type : "CCU"}).then((m) => {}, (e) => {});
        //    }
        //}, (errorMsg) => {});

        findDataReturnObjectFromCollection(url + "_PERCENT", {}).then((result) => {
            if (!result) {
                insertDataToCollection(url + "_PERCENT", {percent: defaultPercent}).then(doNothing, doNothing);
            }
        }, doNothing);

        findDataReturnObjectFromCollection(url + "_MAX_TIMES_ALERT_CONTINIOUS", {}).then((result) => {
            if (!result) {
                insertDataToCollection(url + "_MAX_TIMES_ALERT_CONTINIOUS", {maxTimeAlert: maxTimeAlert}).then(doNothing, doNothing);
            }
        }, doNothing);

        this.fakeDataCCU();
    }

    fakeDataCCU() {
        "use strict";
        var dataYesterday = [{index: 1620, date: 0, data: 1500}, {index: 1621, date: 0, data: 1}, {
            index: 1622,
            date: 0,
            data: 2
        }, {index: 1623, date: 0, data: 1500}, {index: 1624, date: 0, data: 1500}, {
            index: 1625,
            date: 0,
            data: 1500
        }, {index: 1626, date: 0, data: 1500}, {index: 1627, date: 0, data: 1}, {index: 1628, date: 0, data: 1500}];
        var dataYesterday1 = [{index: 1620, date: 1, data: 1500}, {index: 1621, date: 1, data: 1}, {
            index: 1622,
            date: 1,
            data: 2
        }, {index: 1623, date: 1, data: 1500}, {index: 1624, date: 1, data: 1500}, {
            index: 1625,
            date: 1,
            data: 1500
        }, {index: 1626, date: 1, data: 1500}, {index: 1627, date: 1, data: 1}, {index: 1628, date: 1, data: 1500}];
        var dataYesterday2 = [{index: 1620, date: 2, data: 1500}, {index: 1621, date: 2, data: 1}, {
            index: 1622,
            date: 2,
            data: 2
        }, {index: 1623, date: 2, data: 1500}, {index: 1624, date: 2, data: 1500}, {
            index: 1625,
            date: 2,
            data: 1500
        }, {index: 1626, date: 2, data: 1500}, {index: 1627, date: 2, data: 1}, {index: 1628, date: 2, data: 1500}];
        var dataYesterday3 = [{index: 1620, date: 3, data: 1500}, {index: 1621, date: 3, data: 1}, {
            index: 1622,
            date: 3,
            data: 2
        }, {index: 1623, date: 3, data: 1500}, {index: 1624, date: 3, data: 1500}, {
            index: 1625,
            date: 3,
            data: 1500
        }, {index: 1626, date: 3, data: 1500}, {index: 1627, date: 3, data: 1}, {index: 1628, date: 3, data: 1500}];
        var dataYesterday4 = [{index: 1620, date: 4, data: 1500}, {index: 1621, date: 4, data: 1}, {
            index: 1622,
            date: 4,
            data: 2
        }, {index: 1623, date: 4, data: 1500}, {index: 1624, date: 4, data: 1500}, {
            index: 1625,
            date: 4,
            data: 1500
        }, {index: 1626, date: 4, data: 1500}, {index: 1627, date: 4, data: 1}, {index: 1628, date: 4, data: 1500}];
        var dataYesterday5 = [{index: 1620, date: 5, data: 1500}, {index: 1621, date: 5, data: 1}, {
            index: 1622,
            date: 5,
            data: 2
        }, {index: 1623, date: 5, data: 1500}, {index: 1624, date: 5, data: 1500}, {
            index: 1625,
            date: 5,
            data: 1500
        }, {index: 1626, date: 5, data: 1500}, {index: 1627, date: 5, data: 1}, {index: 1628, date: 5, data: 1500}];
        var dataYesterday6 = [{index: 1620, date: 6, data: 1500}, {index: 1621, date: 6, data: 1}, {
            index: 1622,
            date: 6,
            data: 2
        }, {index: 1623, date: 6, data: 1500}, {index: 1624, date: 6, data: 1500}, {
            index: 1625,
            date: 6,
            data: 1500
        }, {index: 1626, date: 6, data: 1500}, {index: 1627, date: 6, data: 1}, {index: 1628, date: 6, data: 1500}];
        var listData = [];
        listData.push(dataYesterday);
        listData.push(dataYesterday1);
        listData.push(dataYesterday2);
        listData.push(dataYesterday3);
        listData.push(dataYesterday4);
        listData.push(dataYesterday5);
        listData.push(dataYesterday6);

        for (var i = 0; i <= 6; i++) {
            insertDataToCollection(this.url, listData[i]).then(doNothing, doNothing);
        }
    }

    checkConditionAlert(crrValue, oldValue, coefficient) {
        "use strict";
        return (crrValue < oldValue * coefficient);
    }

    doCheckAlert(index, data) {
        "use strict";
        try {
            data = parseInt(data);
            index = parseInt(index);
            var crrDate = new Date(index);

            index = parseInt((crrDate.getHours() * 3600 + crrDate.getMinutes() * 60 + crrDate.getSeconds()) / minDuration);
            console.log("parint index: " + index);
        } catch (err1) {
            return false;
        }

        console.log("CHECK WITH CCU");

        this.checkNeedAlert(index, data, this.chatId, this.url);
        return true;
    }

    stringAlert(crrValue, oldValue, isWeek) {
        "use strict";
        if (!isWeek) {
            return "CCU HIỆN TẠI THẤP HƠN HÔM QUA : " + (oldValue - crrValue);
        }

        return "CCU HIỆN TẠI THẤP HƠN TRUNG BÌNH 7 NGÀY QUA : " + (oldValue - crrValue);
    }

    checkNeedAlert(index, data, chatId, url) {
        "use strict";
        findDataReturnObjectFromCollection(url, {index: index, date: date}).then((rs) => {
            if (rs) {
                findDataReturnArrayFromCollection(url, {index: index}).then((resutl3) => {
                    var num = resutl3.length;
                    var sum = 0;
                    resutl3.forEach((item) => {
                        sum += item.data;
                    });

                    if (num > 0) {
                        var averageData = parseInt(sum / num);
                        findDataReturnObjectFromCollection(url + "_PERCENT", {}).then((rsMsg) => {
                            var percent = rsMsg.percent;
                            console.log("PERCENT : " + percent);
                            if (this.checkConditionAlert(data, averageData, percent)) {
                                findDataReturnObjectFromCollection(url + "_week", {}).then((rs) => {
                                    if (rs) {
                                        var timesAlert = rs.timesAlert;
                                        findDataReturnObjectFromCollection(url + "_MAX_TIMES_ALERT_CONTINIOUS", {}).then((result) => {
                                            if (result) {
                                                var maxTimeAlertOfURL = result.maxTimeAlert;
                                                if (timesAlert < maxTimeAlertOfURL) {
                                                    bot.sendMessage(chatId, this.stringAlert(data, averageData, true));
                                                    timesAlert += 1;
                                                    updateDataFromCollection(this.url + "_week", {}, {timesAlert: timesAlert});
                                                }
                                            } else {
                                                if (timesAlert < maxTimeAlert) {
                                                    bot.sendMessage(chatId, this.stringAlert(data, averageData, true));
                                                    timesAlert += 1;
                                                    updateDataFromCollection(this.url + "_week", {}, {timesAlert: timesAlert});
                                                    insertDataToCollection(url + "_MAX_TIMES_ALERT_CONTINIOUS", {maxTimeAlert: maxTimeAlert}).then(doNothing, doNothing);
                                                }
                                            }
                                        }, doNothing);

                                    }
                                }, (err) => {
                                    console.log("get TIME ALERT WEEK FAIL!");
                                });

                            } else {
                                updateDataFromCollection(url + "_week", {}, {timesAlert: 0});
                            }
                        }, doNothing);
                    }

                    updateDataFromCollection(url, {index: index, date: date}, {index: index, data: data, date: date});
                }, doNothing);

            } else {
                console.log("Data today in null");
                insertDataToCollection(url, {index: index, data: data, date: date}).then(doNothing, doNothing);
            }
        }, (errMsg) => {
            console.log("error in get data today");
        });

        var yesterday = getDayBefore(date);
        findDataReturnObjectFromCollection(url, {index: index, date: yesterday}).then((result2) => {
            if (result2) {
                var dataYesterday = result2.data;
                console.log("ccu yesterday :" + JSON.stringify(dataYesterday));
                if (dataYesterday) {
                    findDataReturnObjectFromCollection(url + "_PERCENT", {}).then((rsMsg) => {
                        var percent = rsMsg.percent;
                        if (this.checkConditionAlert(data, dataYesterday, percent)) {
                            findDataReturnObjectFromCollection(url + "_yesterday", {}).then((rs) => {
                                if (rs) {
                                    var timesAlert = rs.timesAlert;
                                    findDataReturnObjectFromCollection(url + "_MAX_TIMES_ALERT_CONTINIOUS", {}).then((result) => {
                                        if (result) {
                                            var maxTimeAlertOfURL = result.maxTimeAlert;
                                            if (timesAlert < maxTimeAlertOfURL) {
                                                bot.sendMessage(chatId, this.stringAlert(data, dataYesterday, false));
                                                timesAlert += 1;
                                                updateDataFromCollection(this.url + "_yesterday", {}, {timesAlert: timesAlert});
                                            }
                                        } else {
                                            if (timesAlert < maxTimeAlert) {
                                                bot.sendMessage(chatId, this.stringAlert(data, dataYesterday, false));
                                                timesAlert += 1;
                                                updateDataFromCollection(this.url + "_yesterday", {}, {timesAlert: timesAlert});
                                                insertDataToCollection(url + "_MAX_TIMES_ALERT_CONTINIOUS", {maxTimeAlert: maxTimeAlert}).then(doNothing, doNothing);
                                            }
                                        }
                                    }, doNothing);
                                }
                            }, (err) => {
                                console.log("get TIME ALERT YESTERDAY FAIL!");
                            });

                        } else {
                            updateDataFromCollection(url + "_yesterday", {}, {timesAlert: 0});
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
    constructor(url, chatId) {
        "use strict";
        this.url = url;
        this.chatId = chatId;
    }

    checkConditionAlert(crrValue, oldValue) {
        "use strict";
        return (crrValue > oldValue);
    }

    initData(url) {
        "use strict";
        findDataReturnObjectFromCollection(url, {type: "SystemQueue"}).then((rs) => {
            if (!rs) {
                insertDataToCollection(url, {type: "SystemQueue", timesIncrease: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        findDataReturnObjectFromCollection(url, {type: "OutGoingQueue"}).then((rs) => {
            if (!rs) {
                insertDataToCollection(url, {type: "OutGoingQueue", timesIncrease: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        findDataReturnObjectFromCollection(url, {type: "ExtensionQueue"}).then((rs) => {
            if (!rs) {
                insertDataToCollection(url, {type: "ExtensionQueue", timesIncrease: 0}).then(doNothing, doNothing);
            }
        }, doNothing);
        //findDataReturnObjectFromCollection(url + "_TYPE", {}).then((rs) => {
        //    if(!rs) {
        //        insertDataToCollection(url + "_TYPE", {type : "QUEUE"}).then((m) => {}, (e) => {});
        //    }
        //}, (e) => {});

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
        this.checkNeedAlert(systemQueue, outGoingQueue, extensionQueue, this.chatId, this.url);

        return true;
    }

    stringAlert(type) {
        "use strict";
        return type + " ĐANG TĂNG LÊN LIÊN TỤC!";
    }

    checkNeedAlertWithType(chatId, type, url, crrValue) {
        "use strict";
        findDataReturnObjectFromCollection(url + "_" + type, {}).then((rs) => {
            if (rs) {
                var oldValue = rs.data;

                if (this.checkConditionAlert(crrValue, oldValue)) {
                    findDataReturnObjectFromCollection(url, {type: type}).then((result) => {
                        if (result) {
                            var timesIncrease = result.timesIncrease;
                            if (timesIncrease >= timesInCreaseLimit) {
                                bot.sendMessage(chatId, this.stringAlert(type));
                            }
                            updateDataFromCollection(url, {type: type}, {type: type, timesIncrease: timesIncrease + 1});
                        } else {
                            insertDataToCollection(url, {type: type, timesIncrease: 1}).then(doNothing, doNothing);
                        }
                    }, doNothing);
                } else {
                    updateDataFromCollection(url, {type: type}, {type: type, timesIncrease: 1});
                }
                updateDataFromCollection(url + "_" + type, {}, {data: crrValue});
            } else {
                insertDataToCollection(url + "_" + type, {data: crrValue}).then(doNothing, doNothing);
            }
        }, (err) => {
            insertDataToCollection(url + "_" + type, {data: crrValue}).then(doNothing, doNothing);
        });
    }

    checkNeedAlert(systemQueue, outGoingQueue, extensionQueue, chatId, url) {
        "use strict";
        this.checkNeedAlertWithType(chatId, "SystemQueue", url, systemQueue);
        this.checkNeedAlertWithType(chatId, "OutGoingQueue", url, outGoingQueue);
        this.checkNeedAlertWithType(chatId, "ExtensionQueue", url, extensionQueue);
        return true;
    }
}

class CcuAndQueue {
    constructor(url, chatId) {
        "use strict";
        this.ccu = new Ccu(url, chatId);
        this.queue = new Queue(url, chatId);
    }

    initData(url) {
        "use strict";
        this.ccu.initData(url);
        this.queue.initData(url);
        findDataReturnObjectFromCollection(url + "_TYPE", {}).then((result) => {
            if (!result) {
                insertDataToCollection(url + "_TYPE", {type: "CCU_AND_QUEUE"}).then(doNothing, doNothing);
            }
        }, doNothing);
    }

    doCheckAlert(index, data) {
        "use strict";
        var check1;
        if (data && data.ccu != undefined) {
            check1 = this.ccu.doCheckAlert(index, data.ccu);
        }
        var check2 = this.queue.doCheckAlert(index, data);
        return (check1 && check2);
    }
}

class Payment {
    constructor(url, chatId) {
        "use strict";
        this.url = url;
        this.chatId = chatId;
    }

    initData(url) {
        "use strict";

        var seft = this;
        var functionTimeOut = function () {

            findDataReturnObjectFromCollection(url, {}).then((rs) => {
                if (rs) {
                    var numPayment = rs.numPayment;
                    if (numPayment <= 0) {
                        bot.sendMessage(seft.chatId, "ĐÃ QUÁ LÂU MÀ CHƯA THẤY CÓ PAYMENT! HUHU");
                    }

                    updateDataFromCollection(url, {}, {numPayment: 0});
                    findDataReturnObjectFromCollection(url + "_PERIOD", {}).then((result) => {
                        var timeOut = result.period;
                        setTimeout(functionTimeOut, timeOut);
                    }, doNothing);
                }
            }, doNothing);
        };

        findDataReturnObjectFromCollection(url + "_TYPE", {}).then((rs) => {
            if (!rs) {
                insertDataToCollection(url + "_TYPE", {type: "PAYMENT"}).then(doNothing, doNothing);
            }
        }, doNothing);


        findDataReturnObjectFromCollection(url, {}).then((rsMsg) => {
            if (rsMsg) {
                findDataReturnObjectFromCollection(url + "_PERIOD", {}).then((result) => {
                    if (result) {
                        var timeOut = result.period;
                        setTimeout(functionTimeOut, timeOut);
                    } else {
                        insertDataToCollection(url + "_PERIOD", {period: defaultPeriod}).then((ok1) => {
                            setTimeout(functionTimeOut, defaultPeriod);
                        }, doNothing);
                    }
                }, doNothing);
            } else {
                insertDataToCollection(url, {numPayment: 0}).then((ok) => {
                    insertDataToCollection(url + "_PERIOD", {period: defaultPeriod}).then((ok1) => {
                        setTimeout(functionTimeOut, defaultPeriod);
                    }, doNothing);
                }, doNothing);
            }
        }, doNothing);

    }

    doCheckAlert(index, data) {
        "use strict";
        findDataReturnObjectFromCollection(this.url, {}).then((rs) => {
            if (rs) {
                var numPayment = rs.numPayment;
                updateDataFromCollection(this.url, {}, {numPayment: numPayment + 1});
            } else {
                return false;
            }
        }, doNothing);
        return true;
    }

}

function testIsStart(chatId) {
    "use strict";
    return listChatId.includes(chatId);
}

function startChanel(chatId) {
    "use strict";
    if (!listChatId.includes(chatId)) {
        listChatId.push(chatId);
        updateDataFromCollection("listChatId", {}, {data: listChatId});
        return true;
    }
    return false;
}

bot.onText(/\/changePasscode (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    var newValue = match[1];
    newValue = md5(newValue);

    findDataReturnObjectFromCollection(chatId + "_IP", {}).then((rs2) => {
        if (rs2) {
            var ip = rs2.ip;
            findDataReturnObjectFromCollection(chatId + "_HASHSTRING", {}).then((rs3) => {
                if (rs3) {
                    var hashString = rs3.hashString;
                    updateClient({
                        hashString: hashString,
                        newHashString: newValue
                    }, ip + ":" + serverPort + "/hashString", chatId, (response) => {
                        "use strict";
                        updateDataFromCollection(chatId + "_HASHSTRING", {}, {hashString: newValue});
                        bot.sendMessage(chatId, "Cập nhật Passcode thành công");
                    });
                } else {
                    bot.sendMessage(chatId, "CHƯA NHẬN DIỆN ĐƯỢC SERVER");
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "CHƯA CÓ IP");
        }
    }, doNothing);

});

bot.onText(/\/changePeriod (.+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    var newValue = match[2];

    console.log(newValue);
    try {
        newValue = parseInt(newValue);
    } catch (e) {
        bot.sendMessage(chatId, "GỬI KHÔNG ĐÚNG ĐỊNH DẠNG");
        return;
    }

    if (newValue % minDuration != 0 || newValue <= 0) {
        bot.sendMessage(chatId, "PERIOD phải là số chia hết cho " + minDuration + "(s)");
        return;
    }
    var url = match[1];

    findDataReturnObjectFromCollection("listURL", {chatId: chatId, data: url}).then((rsMessage) => {
        "use strict";
        if (rsMessage) {
            findDataReturnObjectFromCollection(url + "_TYPE", {}).then((rs1) => {
                "use strict";
                if (rs1) {
                    switch (rs1.type) {
                        case "CCU_AND_QUEUE":
                            findDataReturnObjectFromCollection(chatId + "_IP", {}).then((rs2) => {
                                if (rs2) {
                                    var ip = rs2.ip;
                                    findDataReturnObjectFromCollection(chatId + "_HASHSTRING", {}).then((rs3) => {
                                        if (rs3) {
                                            var hashString = rs3.hashString;
                                            updateClient({
                                                hashString: hashString,
                                                duration: newValue
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
                            findDataReturnObjectFromCollection(url + "_PERIOD", {}).then((rs) => {
                                "use strict";
                                if (rs) {
                                    updateDataFromCollection(url + "_PERIOD", {}, {period: newValue * 1000});
                                    bot.sendMessage(chatId, "Cập nhật Period Thành công")
                                }
                            }, doNothing);
                            break;
                    }

                } else {
                    bot.sendMessage(chatId, "URL NÀY CHƯA ĐƯỢC KÍCH HOẠT");
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "URL NÀY KHÔNG CÓ TRONG CHANEL CỦA BẠN");
        }
    }, (errMessage) => {
        "use strict";

    });
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
    var url = match[1];

    findDataReturnObjectFromCollection("listURL", {chatId: chatId, data: url}).then((rsMessage) => {
        "use strict";
        if (rsMessage) {
            findDataReturnObjectFromCollection(url + "_TYPE", {}).then((rs1) => {
                "use strict";
                if (rs1) {
                    switch (rs1.type) {
                        case "CCU_AND_QUEUE":
                            updateDataFromCollection(url + "_PERCENT", {}, {percent: newValue});
                            bot.sendMessage(chatId, "THAY ĐỔI THÀNH CÔNG!");
                            break;
                        default :
                            bot.sendMessage(chatId, "URL BẠN NHẬP KHÔNG ÁP DỤNG CHO CCU!");
                            break;
                    }

                } else {
                    bot.sendMessage(chatId, "URL NÀY CHƯA ĐƯỢC KÍCH HOẠT");
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "URL NÀY KHÔNG CÓ TRONG CHANEL CỦA BẠN");
        }
    }, doNothing);
});

bot.onText(/\/changeContinious (.+) (.+)/, (msg, match) => {
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
    var url = match[1];

    findDataReturnObjectFromCollection("listURL", {chatId: chatId, data: url}).then((rsMessage) => {
        "use strict";
        if (rsMessage) {
            findDataReturnObjectFromCollection(url + "_TYPE", {}).then((rs1) => {
                "use strict";
                if (rs1) {
                    switch (rs1.type) {
                        case "CCU_AND_QUEUE":
                            updateDataFromCollection(url + "_MAX_TIMES_ALERT_CONTINIOUS", {}, {maxTimeAlert: newValue});
                            bot.sendMessage(chatId, "THAY ĐỔI THÀNH CÔNG!");
                            break;
                        default :
                            bot.sendMessage(chatId, "URL BẠN NHẬP KHÔNG ÁP DỤNG CHO CCU!");
                            break;
                    }

                } else {
                    bot.sendMessage(chatId, "URL NÀY CHƯA ĐƯỢC KÍCH HOẠT");
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "URL NÀY KHÔNG CÓ TRONG CHANEL CỦA BẠN");
        }
    }, doNothing);
});

bot.onText(/\/startBOT/, (msg) => {
    const chatId = msg.chat.id;
    var result = startChanel(chatId);

    const resp = (result == true) ? "Start Success" : "Already started";
    bot.sendMessage(chatId, resp);
});

bot.onText(/\/listEndPoint/, (msg) => {
    const chatId = msg.chat.id;
    findDataReturnArrayFromCollection("listURL", {chatId: chatId}).then((rs) => {
        "use strict";
        if (rs.length > 0) {
            rs.forEach((item) => {
                var result = "";
                var url = item.data;
                result += url;
                findDataReturnObjectFromCollection(url + "_TYPE", {}).then((rst) => {
                    if (rst) {
                        result += " | TYPE : " + rst.type;
                        findDataReturnObjectFromCollection(url + "_PERCENT", {}).then((rsMsg) => {
                            if (rsMsg) {
                                result += " | COEFFICIENT : " + rsMsg.percent;
                                bot.sendMessage(chatId, result);
                            }
                        }, doNothing);

                        findDataReturnObjectFromCollection(url + "_PERIOD", {}).then((rsMsg) => {
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
            bot.sendMessage(chatId, "BẠN CHƯA CÓ URL NÀO");
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

function checkExistURL(url) {
    "use strict";
    return listChatURL.includes(url);
}

bot.onText(/\/addEndPoint (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[1];

    if (!checkIsCorrectURL(url)) {
        bot.sendMessage(chatId, "DINH DANG URL CHUA DUNG!");
        return;
    }

    if (!testIsStart(chatId)) {
        bot.sendMessage(chatId, "CHANEL CHUA DUOC BAT DAU. VUI LONG NHAP 'startBOT'");
        return;
    }
    if (checkExistURL(url)) {
        bot.sendMessage(chatId, "URL NAY DA TON TAI!");
        return;
    }

    listChatURL.push(url);

    insertDataToCollection("listURL", {chatId: chatId, data: url}).then(doNothing, doNothing);

    bot.sendMessage(chatId, 'Vui lòng chọn loại!', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'CCU AND QUEUE',
                        callback_data: ('CCU_AND_QUEUE ' + url)
                    },
                    //{
                    //    text: 'QUEUE',
                    //    callback_data: ('QUEUE ' + url)
                    //},
                    {
                        text: 'PAYMENT',
                        callback_data: ('PAYMENT ' + url)
                    }
                ]
            ]
        }
    });
});

function checkIsCorrectURL(url) {
    "use strict";
    var regrex = /.*\s.*/g;
    return !url.match(regrex);
}

bot.on('sticker', (msg) => {
    "use strict";
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "👍");

});

bot.on('callback_query', query => {
    "use strict";
    const chatId = query.message.chat.id;

    var data = query.data.split(' ');
    var type = data[0];
    var url = data[1];


    console.log("type : " + type);
    console.log("url : " + url);

    findDataReturnObjectFromCollection(url + "_TYPE", {}).then((result) => {
        if (!result) {
            findDataReturnObjectFromCollection("listURL", {data: url}).then((rs) => {
                if (rs) {
                    var url = rs.data;
                    addURL(url, chatId, type);
                    bot.sendMessage(chatId, "ĐÃ SẴN SÀNG!");
                }

            }, (err) => {
                bot.sendMessage(chatId, "URL NÀY ĐÃ KÍCH HOẠT! VUI LÒNG CHỌN URL KHÁC");
            });
        } else {
            bot.sendMessage(chatId, "URL NÀY ĐÃ KÍCH HOẠT! VUI LÒNG CHỌN URL KHÁC");
        }
    }, doNothing);

});

app.listen(port, () => console.log("START APP SUCCESS"));