/**
 * Created by phucpt3 on 1/22/2019.
 */
const mongoClient = require("mongodb").MongoClient;
const urlMongoServer = "mongodb://localhost:27017/";
const nameDB = "mydb";
const doNothing = require("./Util").doNothing;

function createDatabase() {
    "use strict";
    mongoClient.connect(urlMongoServer + nameDB, function (err, db) {
        "use strict";
        if (err) throw err;
        console.log("Database create!");
        db.close();
    });
}

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
        findDataReturnObjectFromCollection(nameCollection, {}).then((result) => {
            if(result) {
                var dbo = db.db(nameDB);
                try {
                    dbo.collection(nameCollection).drop(function (err, delOK) {
                        if (err) throw err;
                        if (delOK) console.log("Collection " + nameCollection + " deleted!");
                        db.close();
                    });
                } catch(err) {
                    console.log("HAVE SOME THING WRONG");
                }
            }
            //else {
            //    insertManyDataToCollection(nameCollection , {test : "ac"}).then((rs) => {
            //        var dbo = db.db(nameDB);
            //        try {
            //            dbo.collection(nameCollection).drop(function (err, delOK) {
            //                if (err) throw err;
            //                if (delOK) console.log("Collection " + nameCollection + " deleted!");
            //                db.close();
            //            });
            //        } catch(err) {
            //            console.log("HAVE SOME THING WRONG");
            //        }
            //    }, doNothing);
            //}
        }, doNothing);
    });

}

function checkIsExistCollection(nameCollection) {
    "use strict";
    nameCollection = String(nameCollection);
    return new Promise((resolve, reject) => {
        mongoClient.connect(urlMongoServer, function (err, db) {
            if (err) throw err;
            var dbo = db.db(nameDB);
            if (dbo.collection(nameDB)) {
                resolve(true);
            }
            return resolve(false);
        });
    });
}

module.exports = {
    createDatabase,
    createCollection,
    insertDataToCollection,
    insertManyDataToCollection,
    findDataReturnObjectFromCollection,
    findDataReturnArrayFromCollection,
    deleteDataFromCollection,
    updateDataFromCollection,
    dropCollection,
    checkIsExistCollection
};