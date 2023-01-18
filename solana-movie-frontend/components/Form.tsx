import { FC } from "react";
import { Movie } from "../models/Movie";
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
	useToast,
} from "@chakra-ui/react";
import * as web3 from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

const MOVIE_REVIEW_PROGRAM_ID = "CenYq6bDRB7p73EjsPEpiYN7uveyPUTdXkDkgUduboaN";

export const Form: FC = () => {
	const [title, setTitle] = useState("");
	const [rating, setRating] = useState(0);
	const [message, setMessage] = useState("");

	const { connection } = useConnection();
	const { publicKey, sendTransaction } = useWallet();

	const toast = useToast();

	const handleSubmit = (event: any) => {
		event.preventDefault();
		const movie = new Movie(title, rating, message);
		handleTransactionSubmit(movie);
	};

	const handleTransactionSubmit = async (movie: Movie) => {
		if (!publicKey) {
			toast({
				title: "Public Key not found",
				description: "Please connect wallet",
				status: "error",
				duration: 2000,
				isClosable: true,
			});
		}

		const buffer = movie.serialize();
		const txn = new web3.Transaction();

		const [pda] = await web3.PublicKey.findProgramAddress(
			[publicKey.toBuffer(), new TextEncoder().encode(movie.title)],
			new web3.PublicKey(MOVIE_REVIEW_PROGRAM_ID)
		);

		const instruction = new web3.TransactionInstruction({
			keys: [
				{
					pubkey: publicKey,
					isSigner: true,
					isWritable: true,
				},
				{
					pubkey: pda,
					isSigner: false,
					isWritable: true,
				},
				{
					pubkey: web3.SystemProgram.programId,
					isSigner: false,
					isWritable: false,
				},
			],
			data: buffer,
			programId: new web3.PublicKey(MOVIE_REVIEW_PROGRAM_ID),
		});

		txn.add(instruction);

		try {
			let txid = await sendTransaction(txn, connection);
			console.log(
				`Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`
			);
		} catch (e) {
			toast({
				title: `${e}`,
				status: "error",
				isClosable: true,
				duration: 3000,
			});
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
						onChange={(event) => setMessage(event.currentTarget.value)}
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
				<Button width="full" mt={4} type="submit">
					Submit Review
				</Button>
			</form>
		</Box>
	);
};

