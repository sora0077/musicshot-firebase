import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as jwt from 'jsonwebtoken';
admin.initializeApp(functions.config().firebase)

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!")
})

const db = admin.firestore()

class JWTToken {
    private algorithm = 'ES256'
    constructor(readonly interval: number) {}

    create(secret: string, teamid: string, keyid: string): string {
        const iat = Math.floor(Date.now() / 1000)
        const exp = iat + this.interval
        const headers = { algorithm: this.algorithm, keyid }
        const payload = { iss: teamid, exp, iat }

        return jwt.sign(payload, secret, headers)
    }
}

const jwtToken = new JWTToken(14 * 24 * 60 * 60)

export const updateDeveloperToken = functions.firestore
    .document('users/{userId}')
    .onWrite(async event => {
        const userId = event.params && event.params.userId
        if (!userId) { return }

        const developerTokens = db.collection('developerTokens').doc(userId)
        const developerToken = await developerTokens.get()

        const generateDeveloperToken = async () => {
            const token = jwtToken.create(
                functions.config().applemusickit.privatekey,
                functions.config().applemusickit.teamid,
                functions.config().applemusickit.keyid
            )
            await developerTokens.set({
                token: token,
                updateAt: admin.firestore.FieldValue.serverTimestamp()
            })
        }

        const data = developerToken.data()
        if (developerToken.exists && data) {
            const now = new Date()
            const diff = (now.getTime() - data.updateAt.getTime()) / 1000
            if (diff > jwtToken.interval - 12 * 60 * 60) {
                await generateDeveloperToken()
            }
            return
        } else {
            await generateDeveloperToken()
        }
    })