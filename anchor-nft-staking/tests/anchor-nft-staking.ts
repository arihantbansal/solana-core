import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorNftStaking } from "../target/types/anchor_nft_staking";
import { setupNft } from "./utils/setupNft";

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

	it("Is initialized!", async () => {
		const tx = await program.methods.initialize().rpc();
		console.log("Your transaction signature", tx);
	});
});

