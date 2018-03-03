"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
admin.initializeApp(functions.config().firebase);
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});
const db = admin.firestore();
function setupToken(expiration) {
    const algorithm = 'ES256';
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiration;
    return function createToken(secret, teamid, keyid) {
        const headers = { algorithm, keyid };
        const payload = { iss: teamid, exp, iat };
        return jwt.sign(payload, secret, headers);
    };
}
const jwtToken = setupToken(24 * 60 * 60);
exports.updateDeveloperToken = functions.firestore
    .document('users/{userId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () {
    const userId = event.params && event.params.userId;
    if (!userId) {
        return;
    }
    const developerTokens = db.collection('developerTokens').doc(userId);
    const developerToken = yield developerTokens.get();
    const generateDeveloperToken = () => __awaiter(this, void 0, void 0, function* () {
        const token = jwtToken(functions.config().applemusickit.privatekey, functions.config().applemusickit.teamid, functions.config().applemusickit.keyid);
        yield developerTokens.set({
            token: token,
            updateAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    const data = developerToken.data();
    if (developerToken.exists && data) {
        const now = new Date();
        const diff = (now.getTime() - data.updateAt.getTime()) / (1000 * 60);
        if (diff > 10) {
            yield generateDeveloperToken();
        }
        return;
    }
    else {
        yield generateDeveloperToken();
    }
}));
//# sourceMappingURL=index.js.map