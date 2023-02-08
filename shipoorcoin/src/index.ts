import { initializeKeypair } from "./initializeKeypair";
import * as web3 from "@solana/web3.js";
import {
	Metaplex,
	keypairIdentity,
	bundlrStorage,
	toMetaplexFile,
} from "@metaplex-foundation/js";
import {
	DataV2,
	createCreateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import * as fs from "fs";
import {
	Account,
	createAssociatedTokenAccountInstruction,
	createInitializeMintInstruction,
	createMintToInstruction,
	getAccount,
	getAssociatedTokenAddress,
	getMinimumBalanceForRentExemptAccount,
	MINT_SIZE,
	TokenAccountNotFoundError,
	TokenInvalidAccountOwnerError,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const tokenName = "ShipoorCoin";
const description = "For the shipoors, by the shipoors";
const symbol = "SHPR";
const decimals = 2;
const amount = 1;

async function main() {
	const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
	const user = await initializeKeypair(connection);

	console.log("PublicKey:", user.publicKey.toBase58());

	const mintKeypair = web3.Keypair.generate();
	const lamports = await getMinimumBalanceForRentExemptAccount(connection);

	const metaplex = Metaplex.make(connection)
		.use(keypairIdentity(user))
		.use(
			bundlrStorage({
				address: "https://devnet.bundlr.network",
				providerUrl: "https://api.devnet.solana.com",
				timeout: 60000,
			})
		);

	const metadataPDA = metaplex
		.nfts()
		.pdas()
		.metadata({ mint: mintKeypair.publicKey });

	const tokenATA = await getAssociatedTokenAddress(
		mintKeypair.publicKey,
		user.publicKey
	);

	const buffer = fs.readFileSync("assets/ship.png");

	const file = toMetaplexFile(buffer, "ship.png");

	const imageUri = await metaplex.storage().upload(file);
	console.log(`Image URI: ${imageUri}`);

	const { uri } = await metaplex.nfts().uploadMetadata({
		name: tokenName,
		description: description,
		image: imageUri,
	});

	console.log(`Metadata URI: ${uri}`);

	const tokenMetadata = {
		name: tokenName,
		symbol: symbol,
		uri: uri,
		sellerFeeBasisPoints: 0,
		creators: null,
		collection: null,
		uses: null,
	} as DataV2;

	const txn = new web3.Transaction().add(
		web3.SystemProgram.createAccount({
			fromPubkey: user.publicKey,
			newAccountPubkey: mintKeypair.publicKey,
			space: MINT_SIZE,
			lamports,
			programId: TOKEN_PROGRAM_ID,
		}),
		createInitializeMintInstruction(
			mintKeypair.publicKey,
			decimals,
			user.publicKey,
			user.publicKey,
			TOKEN_PROGRAM_ID
		),
		createCreateMetadataAccountV2Instruction(
			{
				metadata: metadataPDA,
				mint: mintKeypair.publicKey,
				mintAuthority: user.publicKey,
				payer: user.publicKey,
				updateAuthority: user.publicKey,
			},
			{
				createMetadataAccountArgsV2: {
					data: tokenMetadata,
					isMutable: true,
				},
			}
		)
	);

	let account: Account;

	try {
		account = await getAccount(connection, tokenATA);
	} catch (error: unknown) {
		if (
			error instanceof TokenAccountNotFoundError ||
			error instanceof TokenInvalidAccountOwnerError
		) {
			try {
				txn.add(
					createAssociatedTokenAccountInstruction(
						user.publicKey,
						tokenATA,
						user.publicKey,
						mintKeypair.publicKey
					)
				);
			} catch (error: unknown) {}
		} else {
			throw error;
		}
	}

	txn.add(
		createMintToInstruction(
			mintKeypair.publicKey,
			tokenATA,
			user.publicKey,
			amount * Math.pow(10, decimals)
		)
	);

	const txnSignature = await web3.sendAndConfirmTransaction(connection, txn, [
		user,
		mintKeypair,
	]);

	console.log(
		`Transaction: https://explorer.solana.com/tx/${txnSignature}?cluster=devnet`
	);
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

