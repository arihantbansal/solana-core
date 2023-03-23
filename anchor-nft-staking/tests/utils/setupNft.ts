import {
	bundlrStorage,
	keypairIdentity,
	Metaplex,
} from "@metaplex-foundation/js";
import { createMint, getAssociatedTokenAddress } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { AnchorNftStaking } from "../../target/types/anchor_nft_staking";

export const setupNft = async (
	program: anchor.Program<AnchorNftStaking>,
	payer: anchor.web3.Keypair
) => {
	const metaplex = Metaplex.make(program.provider.connection)
		.use(keypairIdentity(payer))
		.use(bundlrStorage());

	const nft = await metaplex.nfts().create({
		uri: "",
		name: "Test NFT",
		sellerFeeBasisPoints: 0,
	});

	console.log("NFT Metadata Pubkey: ", nft.metadataAddress.toBase58());
	console.log("NFT Token Address: ", nft.tokenAddress.toBase58());
	const [delegatedAuthPda] = await anchor.web3.PublicKey.findProgramAddress(
		[Buffer.from("authority")],
		program.programId
	);
	const [stakeStatePda] = await anchor.web3.PublicKey.findProgramAddress(
		[payer.publicKey.toBuffer(), nft.tokenAddress.toBuffer()],
		program.programId
	);

	console.log("Delegated Authority PDA: ", delegatedAuthPda.toBase58());
	console.log("Stake State PDA: ", stakeStatePda.toBase58());
	const [mintAuth] = await anchor.web3.PublicKey.findProgramAddress(
		[Buffer.from("mint")],
		program.programId
	);

	const mint = await createMint(
		program.provider.connection,
		payer,
		mintAuth,
		null,
		2
	);
	console.log("Mint Pubkey: ", mint.toBase58());

	const tokenAddress = await getAssociatedTokenAddress(mint, payer.publicKey);

	return {
		nft: nft,
		delegatedAuthPda: delegatedAuthPda,
		stakeStatePda: stakeStatePda,
		mint: mint,
		mintAuth: mintAuth,
		tokenAddress: tokenAddress,
	};
};
