import { FC } from "react";
import { useState } from "react";
import {
	Box,
	Button,
	FormControl,
	FormLabel,
	Input,
	NumberDecrementStepper,
	NumberIncrementStepper,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	Textarea,
	Switch,
} from "@chakra-ui/react";
import * as anchor from "@project-serum/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWorkspace } from "../context/Anchor";

export const Form: FC = () => {
	const [title, setTitle] = useState("");
	const [rating, setRating] = useState(0);
	const [description, setDescription] = useState("");
	const [toggle, setToggle] = useState(true);

	const { connection } = useConnection();
	const { publicKey, sendTransaction } = useWallet();

	const workspace = useWorkspace();
	const program = workspace.program;

	const handleSubmit = async (event: any) => {
		event.preventDefault();

		if (!publicKey || !program) {
			alert("Please connect your wallet.");
			return;
		}

		const [mintPDA] = await anchor.web3.PublicKey.findProgramAddress(
			[Buffer.from("mint")],
			program.programId
		);

		const tokenAddress = await getAssociatedTokenAddress(mintPDA, publicKey);

		const txn = new anchor.web3.Transaction();

		if (toggle) {
			const ix = await program.methods
				.addMovieReview(title, description, rating)
				.accounts({
					tokenAccount: tokenAddress,
				})
				.instruction();

			txn.add(ix);
		} else {
			const ix = await program.methods
				.updateMovieReview(title, description, rating)
				.instruction();

			txn.add(ix);
		}

		try {
			let txid = await sendTransaction(txn, connection);
			alert(
				`Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`
			);
			console.log(
				`Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`
			);
		} catch (e) {
			console.log(JSON.stringify(e));
			alert(JSON.stringify(e));
		}
	};

	return (
		<Box
			p={4}
			display={{ md: "flex" }}
			maxWidth="32rem"
			borderWidth={1}
			margin={2}
			justifyContent="center">
			<form onSubmit={handleSubmit}>
				<FormControl isRequired>
					<FormLabel color="gray.200">Movie Title</FormLabel>
					<Input
						id="title"
						color="gray.400"
						onChange={(event) => setTitle(event.currentTarget.value)}
					/>
				</FormControl>
				<FormControl isRequired>
					<FormLabel color="gray.200">Add your review</FormLabel>
					<Textarea
						id="review"
						color="gray.400"
						onChange={(event) => setDescription(event.currentTarget.value)}
					/>
				</FormControl>
				<FormControl isRequired>
					<FormLabel color="gray.200">Rating</FormLabel>
					<NumberInput
						max={5}
						min={1}
						onChange={(valueString) => setRating(parseInt(valueString))}>
						<NumberInputField id="amount" color="gray.400" />
						<NumberInputStepper color="gray.400">
							<NumberIncrementStepper />
							<NumberDecrementStepper />
						</NumberInputStepper>
					</NumberInput>
				</FormControl>
				<FormControl display="center" alignItems="center">
					<FormLabel color="gray.100" mt={2}>
						Update
					</FormLabel>
					<Switch
						id="update"
						onChange={(event) => setToggle((prevCheck) => !prevCheck)}
					/>
				</FormControl>
				<Button width="full" mt={4} type="submit">
					Submit Review
				</Button>
			</form>
		</Box>
	);
};

