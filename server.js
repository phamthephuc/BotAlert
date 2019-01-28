const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require("body-parser");
const request = require("request");
const md5 = require("md5");
const fs = require("fs");
const parse = require("csv-parse");
const HashMap = require("hashmap");

var db = require("./src/DBInteractive");
const doNothing = require("./src/Util").doNothing;
const token = '666177464:AAG8mro3tNOX_6LbFTNRtwX35Y1QYOdDbC0';
//const token = '674200182:AAGdEA3ie3ZGbz2-UYsik7iVGL_bt2BusJw';
const bot = new TelegramBot(token, {polling: true});
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

db.dropCollection("aaaaaaaa");
module.exports = {bot, typePayments};

const port = 3000;
const app = express();
var router = express.Router();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var Ccu = require("./src/Ccu");
var Queue = require("./src/Queue");
var CcuAndQueue = require("./src/CcuAndQueue");
var Payment = require("./src/Payment");

const minDuration = 30;

const serverPort = 10091;

const defaultDurationCheckDie = 2 * 15 * 1000;

var hashPaymentEndPoint = new HashMap();

var hashIntervalPingServer = new HashMap();

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
            bot.sendMessage(chatId, "SERVER KHÔNG PHẢN HỒI. RẤT CÓ THỂ SERVER ĐANG CHẾT HOẶC NGỪNG HOẠT ĐỘNG");
        } else {
            callBack(response);
        }
    });
}

db.createDatabase();

function getIpWithNormalFormat(ipClient) {
    "use strict";
    var regex = /(\d)+\.(\d)+\.(\d)+\.(\d)+/gi;
    if (ipClient.match(regex)) {
        return ipClient.match(regex)[0];
    } else {
        return null;
    }
}

var listGroupChatId = [];
var listEndPoint = [];

db.findDataReturnObjectFromCollection("GroupChatInfo", {}).then((result) => {
    if (result) {
        listGroupChatId = result.listGroupChatId;
        if (!listGroupChatId) {
            listGroupChatId = [];
            db.insertDataToCollection("GroupChatInfo", {listGroupChatId: listGroupChatId});
        } else {
            listGroupChatId.forEach((item) => {
                "use strict";
                db.findDataReturnObjectFromCollection(item + "_Ip", {}).then((result1) => {
                    if(result1) {
                        var crrTime = getCrrTimeInMilis();
                        db.findDataReturnObjectFromCollection("LastTimeRequest", {groupId: item}).then((rst) => {
                            if(rst) {
                                var duration = rst.duration;
                                db.updateDataFromCollection("LastTimeRequest", {groupId: item}, {groupId: item, duration: duration, lastTime : crrTime});
                                var interval = setInterval(pingServer.bind(console, item), duration, duration);
                                hashIntervalPingServer.set(item, interval);
                            } else {
                                db.insertDataToCollection("LastTimeRequest", {groupId: item, lastTime : crrTime, duration: defaultDurationCheckDie}).then(doNothing, doNothing);
                                var interval = setInterval(pingServer.bind(console, item), defaultDurationCheckDie, defaultDurationCheckDie);
                                hashIntervalPingServer.set(item, interval);
                            }
                        }, doNothing);

                    }
                }, doNothing);
            });
        }
    } else {
        listGroupChatId = [];
        db.insertDataToCollection("GroupChatInfo", {listGroupChatId: listGroupChatId});
    }
}, (errMsg) => {
    listGroupChatId = [];
    db.insertDataToCollection("GroupChatInfo", {listGroupChatId: listGroupChatId});
});

function pingServer(chatId) {
    "use strict";
    db.findDataReturnObjectFromCollection("LastTimeRequest", {groupId : chatId}).then((rs) => {
        if(rs) {
            var duration = rs.duration;
            var crrTime = getCrrTimeInMilis();
            var lastTimeCheck = rs.lastTime;
            if(lastTimeCheck + duration < crrTime) {
                bot.sendMessage(chatId, "SERVER ĐANG KHÔNG KHÔNG HOẠT ĐỘNG HOẶC CHƯA ĐƯỢC CONNECT VỚI BOT");
            } else {
                console.log("PING THÀNH CÔNG");
            }
        }

        //if(rs && rs.ip) {
        //    var ip = rs.ip;
        //    db.findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((rs1) => {
        //        if(rs1) {
        //            var passcode = rs1.passcode;
        //            updateClient({
        //                passcode: passcode
        //            }, ip + ":" + serverPort + "/ping", chatId, (response) => {
        //                "use strict";
        //                bot.sendMessage(chatId, "PING THÀNH CÔNG");
        //            });
        //        } else {
        //            bot.sendMessage(chatId, "CHƯA TỒN TẠI PASSCODE")
        //        }
        //    }, doNothing);
        //} else {
        //    bot.sendMessage(chatId, "CHƯA TỒN TẠI IP. CÓ THỂ THÊM BẰNG LỆNH '/changeIp ip'");
        //}
    }, doNothing);
}

db.findDataReturnArrayFromCollection("EndPointInfo", {}).then((result) => {
    if (result) {
        result.forEach((item) => {
            var endPoint = item.endPoint;
            var idChat = item.groupId;
            if (endPoint) {
                db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((result4) => {
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

        if (type == "PAYMENT") {
            hashPaymentEndPoint.set(endPoint, objectChoose);
        }

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

            db.findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rsMsg) => {
                if (!rsMsg) {
                    db.insertDataToCollection(chatId + "_Ip", {ip: ipFormat}).then(doNothing, doNothing);
                    if(!hashIntervalPingServer.get(chatId)) {
                        var interval = setInterval(pingServer.bind(console, chatId), defaultDurationCheckDie, defaultDurationCheckDie);
                        hashIntervalPingServer.set(chatId, interval);
                    }
                }
            }, doNothing);

            db.findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((rs) => {
                if (rs) {
                    if (rs.passcode != passcode) {
                        res.send(false);
                    } else {
                        res.send(objectChoose.doCheckAlert(index, data));
                    }
                } else {
                    db.insertDataToCollection(chatId + "_Passcode", {passcode: passcode}).then(doNothing, doNothing);
                    res.send(objectChoose.doCheckAlert(index, data));
                }
            }, doNothing);

            var lastTimeHaveRequest = getCrrTimeInMilis();
            db.findDataReturnObjectFromCollection("LastTimeRequest", {groupId : chatId}).then((result) => {
                if(result) {
                    var duration = result.duration;
                    db.updateDataFromCollection("LastTimeRequest", {groupId: chatId}, {groupId : chatId, lastTime : lastTimeHaveRequest, duration : duration});
                } else {
                    db.insertDataToCollection("LastTimeRequest", {groupId : chatId, lastTime : lastTimeHaveRequest, duration : defaultDurationCheckDie});
                }
            }, doNothing);
        });
    }
}

function getCrrTimeInMilis() {
    "use strict";
    return (new Date().getTime());
}

function testIsStart(chatId) {
    "use strict";
    return listGroupChatId.includes(chatId);
}

function startChanel(chatId) {
    "use strict";
    if (!testIsStart(chatId)) {
        listGroupChatId.push(chatId);
        db.updateDataFromCollection("GroupChatInfo", {}, {listGroupChatId: listGroupChatId});
        db.insertDataToCollection(chatId + "_Passcode", {passcode : md5(token)}).then(doNothing, doNothing);
        return true;
    }
    return false;
}

bot.onText(/\/changePasscode (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    var newPasscode = match[1];
    newPasscode = md5(newPasscode);

    if(testIsStart(chatId)) {
        db.findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
            if (rs2) {
                var ip = rs2.ip;
                db.findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((rs3) => {
                    if (rs3) {
                        var passcode = rs3.passcode;
                        updateClient({
                            passcode: passcode,
                            newPasscode: newPasscode
                        }, ip + ":" + serverPort + "/passcode", chatId, (response) => {
                            "use strict";
                            db.updateDataFromCollection(chatId + "_Passcode", {}, {passcode: newPasscode});
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
    } else {
        bot.sendMessage(chatId, "KÊNH NÀY HIỆN TẠI CHƯA TỒN TẠI TRÊN HỆ THỐNG");
    }
});

bot.onText(/\/changeIp (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    var newIp = match[1];
    newIp = getIpWithNormalFormat(newIp);
    if (newIp == null) {
        bot.sendMessage(chatId, "IP BẠN NHẬP KHÔNG ĐÚNG ĐỊNH DẠNG");
        return;
    }

    if(testIsStart(chatId)) {
        db.findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
            if (rs2) {
                var ip = rs2.ip;
                db.updateDataFromCollection(chatId + "_Ip", {ip: ip}, {ip: newIp});
                if(hashIntervalPingServer.get(chatId)) {
                    var oldInterval = hashIntervalPingServer.get(chatId);
                    clearInterval(oldInterval);
                    var interval = setInterval(pingServer.bind(console, chatId), defaultDurationCheckDie, defaultDurationCheckDie);
                    hashIntervalPingServer.set(chatId, interval);
                }

            } else {
                db.insertDataToCollection(chatId + "_Ip", {ip: newIp}).then(doNothing, doNothing);
                if(!hashIntervalPingServer.get(chatId)) {
                    var interval = setInterval(pingServer.bind(console, chatId), defaultDurationCheckDie, defaultDurationCheckDie);
                    hashIntervalPingServer.set(chatId, interval);
                }
            }
            bot.sendMessage(chatId, "THAY ĐỔI IP SERVER GAME THÀNH CÔNG");
        }, doNothing);
    } else {
        bot.sendMessage(chatId, "KÊNH NÀY HIỆN TẠI CHƯA TỒN TẠI TRÊN HỆ THỐNG");
    }

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

    db.findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((rsMessage) => {
        "use strict";
        if (rsMessage) {
            db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs1) => {
                "use strict";
                if (rs1) {
                    switch (rs1.type) {
                        case "CCU_AND_QUEUE":
                            db.findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
                                if (rs2) {
                                    var ip = rs2.ip;
                                    db.findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((rs3) => {
                                        if (rs3) {
                                            var passcode = rs3.passcode;
                                            updateClient({
                                                passcode: passcode,
                                                duration: newValueDuration
                                            }, ip + ":" + serverPort + "/duration", chatId, (response) => {
                                                bot.sendMessage(chatId, "Cập nhật Period Thành công");
                                            });
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
                            db.findDataReturnObjectFromCollection(endPoint + "_Period", {}).then((rs) => {
                                "use strict";
                                if (rs) {
                                    var payment = hashPaymentEndPoint.get(endPoint);
                                    payment.doChangePeriod(newValueDuration * 1000);
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

    db.findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((rsMessage) => {
        "use strict";
        if (rsMessage) {
            db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs1) => {
                "use strict";
                if (rs1) {
                    switch (rs1.type) {
                        case "CCU_AND_QUEUE":
                            db.updateDataFromCollection(endPoint + "_Percent", {}, {percent: newValue});
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

    db.findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((rsMessage) => {
        "use strict";
        if (rsMessage) {
            db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs1) => {
                "use strict";
                if (rs1) {
                    switch (rs1.type) {
                        case "CCU_AND_QUEUE":
                            db.updateDataFromCollection(endPoint + "_MaxTimesAlertContinuous", {}, {maxTimeAlert: newValue});
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

    const resp = (result) ? "Start Success" : "Already started";
    bot.sendMessage(chatId, resp);
});

bot.onText(/\/listEndPoint/, (msg) => {
    const chatId = msg.chat.id;
    if(!testIsStart(chatId)) {
        bot.sendMessage(chatId, "GROUP CỦA BẠN CHƯA KÍCH HOẠT BOT");
        return;
    }
    db.findDataReturnArrayFromCollection("EndPointInfo", {groupId: chatId}).then((rs) => {
        "use strict";
        if (rs.length > 0) {
            rs.forEach((item) => {
                var result = "";
                var endPoint = item.endPoint;
                result += endPoint;
                db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rst) => {
                    if (rst) {
                        result += " | TYPE : " + rst.type;
                        db.findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((rsMsg2) => {
                            if (rsMsg2) {
                                result += " | IS_ACTIVE : " + rsMsg2.isActive;
                                db.findDataReturnObjectFromCollection(endPoint + "_Percent", {}).then((rsMsg) => {
                                    if (rsMsg) {
                                        result += " | COEFFICIENT : " + rsMsg.percent;
                                        bot.sendMessage(chatId, result);
                                    }
                                }, doNothing);

                                db.findDataReturnObjectFromCollection(endPoint + "_Period", {}).then((rsMsg) => {
                                    if (rsMsg) {
                                        var date = new Date(null);
                                        date.setMilliseconds(rsMsg.period);
                                        result += " | PERIOD : " + date.toISOString().substr(11, 8);
                                        bot.sendMessage(chatId, result);
                                    }
                                }, doNothing);
                            }
                        }, doNothing);

                    } else {
                        result += " : CHƯA CẬP NHẬT TYPE";
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

    db.insertDataToCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then(doNothing, doNothing);

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

    db.findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((result) => {
        "use strict";
        if (!result) {
            bot.sendMessage(chatId, "ENDPOINT NÀY KHÔNG TỒN TẠI TRÊN CHANEL CỦA BẠN");
        } else {
            if (typePayments.has(typePayment)) {
                db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
                    if (rs && rs.type && rs.type == "PAYMENT") {
                        db.findDataReturnObjectFromCollection(endPoint, {chanel: typePayment})
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

    db.findDataReturnObjectFromCollection("EndPointInfo", {groupId: chatId, endPoint: endPoint}).then((result) => {
        "use strict";
        if (!result) {
            bot.sendMessage(chatId, "ENDPOINT NÀY KHÔNG TỒN TẠI TRÊN CHANEL CỦA BẠN");
        } else {
            if (typePayments.has(typePayment)) {
                db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
                    if (rs && rs.type && rs.type == "PAYMENT") {
                        db.findDataReturnObjectFromCollection(endPoint, {chanel: typePayment})
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
    db.findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
        if (rs2) {
            var ip = rs2.ip;
            db.findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((rs1) => {
                if(rs1) {
                    updateClient({
                        paymentType: typePayment,
                        passcode: rs1.passcode
                    }, ip + ":" + serverPort + "/removePaymentType", chatId, (response) => {
                        db.deleteDataFromCollection(endPoint, {chanel : typePayment});
                        bot.sendMessage(chatId, "Remove Chanel Payment Thành công");
                    });
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "CHƯA CÓ IP! CÓ THỂ THÊM IP SERVER BẰNG LỆNH '/addIp {ip}'");
        }
    }, doNothing);
}

function doAddIdPaymentInServerGame(chatId, typePayment, endPoint) {
    "use strict";
    db.findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs2) => {
        if (rs2) {
            var ip = rs2.ip;
            db.findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((rs1) => {
                if(rs1) {
                    updateClient({
                        paymentType: typePayment,
                        passcode: rs1.passcode
                    }, ip + ":" + serverPort + "/addPaymentType", chatId, (response) => {
                        db.insertDataToCollection(endPoint, {
                            chanel: typePayment,
                            numPayment: 0
                        }).then((rs) => {
                            bot.sendMessage(chatId, "Thêm Chanel Payment Thành công");
                        }, doNothing);
                    });
                }
            }, doNothing);
        } else {
            bot.sendMessage(chatId, "CHƯA CÓ IP! CÓ THỂ THÊM IP SERVER BẰNG LỆNH '/changeIp {ip}'");
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
    db.findDataReturnObjectFromCollection(chatId + "_Ip", {}).then((rs) => {
        if (!rs) {
            bot.sendMessage(chatId, "CHƯA TỒN TẠI IP");
        } else {
            var ip = rs.ip;
            db.findDataReturnObjectFromCollection(chatId + "_Passcode", {}).then((result) => {
                if (!result) {
                    bot.sendMessage(chatId, "CHƯA TỒN TẠI PASSCODE");
                } else {
                    updateClient({
                        passcode: result.passcode,
                        chanel: paymentType
                    }, ip + ":" + serverPort + "/addCoin", chatId, (response) => {
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
    db.findDataReturnObjectFromCollection("EndPointInfo" , {endPoint : endPoint, groupId: chatId}).then((result) => {
        if(result) {
            db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
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
        } else {
            bot.sendMessage(chatId, "ENDPOINT NÀY KHÔNG CÓ TRONG CHANEL CỦA BẠN");
        }
    }, doNothing);
});

bot.onText(/\/changeStatus (.+)/, (msg, match) => {
    "use strict";
    const chatId = msg.chat.id;
    var endPoint = match[1];
    changeStatus(chatId, endPoint);
});

function changeStatus(chatId, endPoint, isRevert = true) {
    db.findDataReturnObjectFromCollection("EndPointInfo" , {endPoint : endPoint, groupId: chatId}).then((result) => {
        if(result) {
            db.findDataReturnObjectFromCollection(endPoint + "_Status", {}).then((r) => {
                if (r) {
                    var isActive = r.isActive;
                    var newValue = (isRevert)? (!isActive) : false;
                    db.updateDataFromCollection(endPoint + "_Status", {isActive: isActive}, {isActive: newValue});
                    if(isRevert) {
                        if (!isActive) {
                            bot.sendMessage(chatId, "Active EndPoint Thành công");
                        } else {
                            bot.sendMessage(chatId, "Inactive EndPoint Thành công");
                        }
                    }
                } else {
                    bot.sendMessage(chatId, "EndPoint này đang không được sử dụng");
                }
            }, (e) => {
                bot.sendMessage(chatId, "LỖI KẾT NỐI DB");
            });
        } else {
            bot.sendMessage(chatId, "ENDPOINT NÀY KHÔNG CÓ TRONG CHANEL CỦA BẠN");
        }
    }, doNothing);
}

bot.onText(/\/stop/, (msg, match) => {
    "use strict";
    const chatId = msg.chat.id;
    if(testIsStart(chatId)) {
        var intervalPing = hashIntervalPingServer.get(chatId);
        if(intervalPing) {
            clearInterval(intervalPing);
            hashIntervalPingServer.remove(chatId);
        }
        db.dropCollection(chatId + "_Passcode");
        db.dropCollection(chatId + "_Ip");
        db.findDataReturnArrayFromCollection("EndPointInfo", {groupId: chatId}).then((result) => {
            if(result && result.length > 0) {
                result.forEach((item) => {
                    var endPoint = item.endPoint;
                    db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((rs) => {
                        if(rs) {
                            var type = rs.type;
                            var objectChoose = getObjectChoose(type, endPoint, chatId);
                            objectChoose.cleanAllData();
                            if(type == "PAYMENT") {
                                if(hashPaymentEndPoint.get(endPoint)) {
                                    var payment = hashPaymentEndPoint.get(endPoint);
                                    clearInterval(payment.seflInterval);
                                    hashPaymentEndPoint.remove(endPoint);
                                }
                            }
                        }
                    }, doNothing);
                });
            }
        }, doNothing);
        listGroupChatId.remove(chatId);
        db.updateDataFromCollection("GroupChatInfo", {}, {listGroupChatId: listGroupChatId});
    } else {
        bot.sendMessage(chatId, "CHANEL NÀY CHƯA TỒN TẠI TRÊN HỆ THỐNG");
    }
});

Array.prototype.remove = function(element) {
    "use strict";
    var index = this.indexOf(element);
    if(index != -1) {
        this.splice(index, 1);
    }
};

bot.on('callback_query', query => {
    "use strict";
    const chatId = query.message.chat.id;

    var data = query.data.split(' ');
    var type = data[0];
    var endPoint = data[1];

    db.findDataReturnObjectFromCollection(endPoint + "_Type", {}).then((result) => {
        if (!result) {
            db.findDataReturnObjectFromCollection("EndPointInfo", {endPoint: endPoint}).then((rs) => {
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

