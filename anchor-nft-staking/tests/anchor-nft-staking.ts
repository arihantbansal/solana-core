import { AnchorNftStaking } from "./../target/types/anchor_nft_staking";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { setupNft } from "./utils/setupNft";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { expect } from "chai";
import { getAccount } from "@solana/spl-token";

describe("anchor-nft-staking", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace
		.AnchorNftStaking as Program<AnchorNftStaking>;

	const wallet = anchor.workspace.AnchorNftStaking.provider.wallet;

	let delegatedAuthPda: anchor.web3.PublicKey;
	let stakeStatePda: anchor.web3.PublicKey;
	let nft: any;
	let mintAuth: anchor.web3.PublicKey;
	let mint: anchor.web3.PublicKey;
	let tokenAddress: anchor.web3.PublicKey;

	before(async () => {
		({ nft, delegatedAuthPda, stakeStatePda, mint, mintAuth, tokenAddress } =
			await setupNft(program, wallet.payer));
	});

	it("stake", async () => {
		await program.methods
			.stake()
			.accounts({
				nftTokenAccount: nft.tokenAddress,
				nftMint: nft.mintAddress,
				nftEdition: nft.masterEditionAddress,
				metadataProgram: METADATA_PROGRAM_ID,
			})
			.rpc();

		const account = await program.account.userStakeInfo.fetch(stakeStatePda);
		expect(account.stakeState === "Staked");
	});

	it("redeem", async () => {
		await program.methods
			.redeem()
			.accounts({
				nftTokenAccount: nft.tokenAddress,
				stakeMint: mint,
				userStakeAta: tokenAddress,
			})
			.rpc();

		const account = await program.account.userStakeInfo.fetch(stakeStatePda);
		expect(account.stakeState === "Unstaked");
		const tokenAccount = await getAccount(provider.connection, tokenAddress);
	});

	it("unstake", async () => {
		await program.methods
			.unstake()
			.accounts({
				nftTokenAccount: nft.tokenAddress,
				nftMint: nft.mintAddress,
				nftEdition: nft.masterEditionAddress,
				metadataProgram: METADATA_PROGRAM_ID,
				stakeMint: mint,
				userStakeAta: tokenAddress,
			})
			.rpc();

		const account = await program.account.userStakeInfo.fetch(stakeStatePda);
		expect(account.stakeState === "Unstaked");
	});
});

