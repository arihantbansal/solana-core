import { Box, Center, Spacer, Stack } from "@chakra-ui/react";
import type { NextPage } from "next";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import Disconnected from "@/components/Disconnected";
import Connected from "@/components/Connected";
import { useWallet } from "@solana/wallet-adapter-react";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
	const { connected } = useWallet();
	return (
		<div className={styles.container}>
			<Head>
				<title>Buildoors</title>
				<meta name="The NFT Collection for Buildoors" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<Box
				w="full"
				h="calc(100vh)"
				bgImage={"url(/home-background.svg)"}
				backgroundPosition="center">
				<Stack w="full" h="calc(100vh)" justify="center">
					<NavBar />
					<Spacer />
					<Center>{connected ? <Connected /> : <Disconnected />}</Center>
					<Spacer />

					<Center>
						<Box marginBottom={4} color="white">
							<a
								href="https://twitter.com/_arihantbansal"
								target="_blank"
								rel="noopener noreferrer">
								built by @_arihantbansal
							</a>
						</Box>
					</Center>
				</Stack>
			</Box>
		</div>
	);
};

export default Home;

