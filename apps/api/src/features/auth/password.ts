import {
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual,
} from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)
const keyLength = 64

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16)
    const hash = (await scrypt(password, salt, keyLength)) as Buffer

    return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`
}

export async function verifyPassword(
    password: string,
    encodedHash: string,
): Promise<boolean> {
    const [algorithm, encodedSalt, encodedKey] = encodedHash.split("$")

    if (algorithm !== "scrypt" || !encodedSalt || !encodedKey) {
        return false
    }

    const salt = Buffer.from(encodedSalt, "base64url")
    const expectedKey = Buffer.from(encodedKey, "base64url")
    const actualKey = (await scrypt(
        password,
        salt,
        expectedKey.length,
    )) as Buffer

    return timingSafeEqual(actualKey, expectedKey)
}
