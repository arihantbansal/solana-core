import React, { useMemo } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import {
	GlowWalletAdapter,
	PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { AppProps } from "next/app";

require("@solana/wallet-adapter-react-ui/styles.css");
require("../styles/globals.css");
require("../styles/Home.module.css");

const App = ({ Component, pageProps }: AppProps) => {
	// Can be set to 'devnet', 'testnet', or 'mainnet-beta'
	const network = WalletAdapterNetwork.Devnet;

	// You can provide a custom RPC endpoint here
	const endpoint = useMemo(() => clusterApiUrl(network), [network]);

	const wallets = useMemo(
		() => [new PhantomWalletAdapter(), new GlowWalletAdapter()],
		[network]
	);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>
					<Component {...pageProps} />
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
};

export default App;

