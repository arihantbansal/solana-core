import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { CounterAnchor } from "../target/types/counter_anchor";

describe("counter-anchor", () => {
	const provider = anchor.AnchorProvider.env();

	anchor.setProvider(provider);

	const program = anchor.workspace.CounterAnchor as Program<CounterAnchor>;

	const counter = anchor.web3.Keypair.generate();

	it("Is initialized!", async () => {
		const tx = await program.methods
			.initialize()
			.accounts({ counter: counter.publicKey })
			.signers([counter])
			.rpc();
		console.log("Your transaction signature", tx);

		const account = await program.account["counter"].fetch(counter.publicKey);
		expect(account.count.toNumber() === 0);
	});

	it("Is incremented!", async () => {
		const tx = await program.methods
			.initialize()
			.accounts({ counter: counter.publicKey, user: provider.wallet.publicKey })
			.rpc();
		console.log("Your transaction signature", tx);

		const account = await program.account["counter"].fetch(counter.publicKey);
		expect(account.count.toNumber() === 1);
	});

	it("Is decremented!", async () => {
		const tx = await program.methods
			.initialize()
			.accounts({ counter: counter.publicKey, user: provider.wallet.publicKey })
			.rpc();
		console.log("Your transaction signature", tx);

		const account = await program.account["counter"].fetch(counter.publicKey);
		expect(account.count.toNumber() === 0);
	});
});

