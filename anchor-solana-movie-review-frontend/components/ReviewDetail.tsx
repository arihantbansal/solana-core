import {
	Button,
	Input,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	ModalBody,
	Stack,
	FormControl,
} from "@chakra-ui/react";
import { FC, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { CommentList } from "./CommentList";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWorkspace } from "../context/Anchor";

interface ReviewDetailProps {
	isOpen: boolean;
	onClose: any;
	movie: any;
}

export const ReviewDetail: FC<ReviewDetailProps> = ({
	isOpen,
	onClose,
	movie,
}: ReviewDetailProps) => {
	const [comment, setComment] = useState("");
	const { connection } = useConnection();
	const { publicKey, sendTransaction } = useWallet();
	const { program } = useWorkspace();

	const handleSubmit = async (event: any) => {
		event.preventDefault();

		if (!publicKey || !program) {
			alert("Please connect wallet.");
			return;
		}

		const movieReview = new anchor.web3.PublicKey(movie.publicKey);

		const [movieReviewCounterPda] =
			await anchor.web3.PublicKey.findProgramAddress(
				[Buffer.from("counter"), movieReview.toBuffer()],
				program.programId
			);

		const [mintPda] = await anchor.web3.PublicKey.findProgramAddress(
			[Buffer.from("mint")],
			program.programId
		);

		const tokenAddress = await getAssociatedTokenAddress(mintPda, publicKey);

		const txn = new anchor.web3.Transaction();

		const ix = await program.methods
			.addComment(comment)
			.accounts({
				movieReview: movieReview,
				movieCommentCounter: movieReviewCounterPda,
				tokenAccount: tokenAddress,
			})
			.instruction();

		txn.add(ix);

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
		<div>
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader
						textTransform="uppercase"
						textAlign={{ base: "center", md: "center" }}>
						{movie.account.title}
					</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<Stack textAlign={{ base: "center", md: "center" }}>
							<p>{movie.account.description}</p>
							<form onSubmit={handleSubmit}>
								<FormControl isRequired>
									<Input
										id="title"
										color="black"
										onChange={(event) => setComment(event.currentTarget.value)}
										placeholder="Submit a comment..."
									/>
								</FormControl>
								<Button width="full" mt={4} type="submit">
									Send
								</Button>
							</form>
							<CommentList movie={movie} />
						</Stack>
					</ModalBody>
				</ModalContent>
			</Modal>
		</div>
	);
};

