import Cryptr from "cryptr";

let cryptr: Cryptr | null = null;

function getCryptr() {
  if (!cryptr) {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error("ENCRYPTION_KEY environment variable is required");
    }
    cryptr = new Cryptr(key);
  }
  return cryptr;
}

export const encrypt = (text: string) => getCryptr().encrypt(text);
export const decrypt = (text: string) => getCryptr().decrypt(text);