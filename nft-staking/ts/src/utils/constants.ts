import { Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";

const string = fs.readFileSync(
	"../target/deploy/solana_nft_staking_program-keypair.json",
	"utf8"
);

const pubKey = "6gFqDHP9bmG4ruCPcDHSTWs9VpyS424ubP4LzPH3DHg8";
const secret = Uint8Array.from(JSON.parse(string) as number[]);
const secretKey = Uint8Array.from(secret);

// export const PROGRAM_ID = Keypair.fromSecretKey(secretKey).publicKey;
export const PROGRAM_ID = new PublicKey(pubKey);

