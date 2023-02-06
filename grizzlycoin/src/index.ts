import { initializeKeypair } from "./initializeKeypair";
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

async function createMint(
	connection: web3.Connection,
	payer: web3.Keypair,
	mintAuthority: web3.PublicKey,
	freezeAuthority: web3.PublicKey,
	decimals: number
): Promise<web3.PublicKey> {
	const tokenMint = await token.createMint(
		connection,
		payer,
		mintAuthority,
		freezeAuthority,
		decimals
	);

	console.log(`The token mint address is ${tokenMint}`);
	console.log(
		`Token Mint: https://explorer.solana.com/address/${tokenMint}?cluster=devnet`
	);

	return tokenMint;
}

async function createTokenAccount(
	connection: web3.Connection,
	payer: web3.Keypair,
	mint: web3.PublicKey,
	owner: web3.PublicKey
): Promise<token.Account> {
	const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
		connection,
		payer,
		mint,
		owner
	);

	console.log(
		`Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
	);

	return tokenAccount;
}

async function mintTokens(
	connection: web3.Connection,
	payer: web3.Keypair,
	mint: web3.PublicKey,
	destination: web3.PublicKey,
	authority: web3.Keypair,
	amount: number
) {
	const mintInfo = await token.getMint(connection, mint);

	const txnSignature = await token.mintTo(
		connection,
		payer,
		mint,
		destination,
		authority,
		amount * 10 ** mintInfo.decimals
	);

	console.log(
		`Mint Token Txn: https://explorer.solana.com/tx/${txnSignature}?cluster=devnet`
	);
}

async function transferTokens(
	connection: web3.Connection,
	payer: web3.Keypair,
	source: web3.PublicKey,
	destination: web3.PublicKey,
	owner: web3.PublicKey,
	amount: number,
	mint: web3.PublicKey
) {
	const mintInfo = await token.getMint(connection, mint);

	const txnSignature = await token.transfer(
		connection,
		payer,
		source,
		destination,
		owner,
		amount * 10 ** mintInfo.decimals
	);

	console.log(
		`Transfer Txn: https://explorer.solana.com/tx/${txnSignature}?cluster=devnet`
	);
}

async function burnTokens(
	connection: web3.Connection,
	payer: web3.Keypair,
	account: web3.PublicKey,
	mint: web3.PublicKey,
	owner: web3.Keypair,
	amount: number
) {}

async function main() {
	const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
	const user = await initializeKeypair(connection);

	console.log("Public Key:", user.publicKey.toBase58());

	const mint = await createMint(
		connection,
		user,
		user.publicKey,
		user.publicKey,
		2
	);

	const tokenAccount = await createTokenAccount(
		connection,
		user,
		mint,
		user.publicKey
	);

	await mintTokens(connection, user, mint, tokenAccount.address, user, 100);
}

main()
	.then(() => {
		console.log("Finished successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.log(error);
		process.exit(1);
	});

