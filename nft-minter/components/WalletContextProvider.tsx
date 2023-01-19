import { FC, ReactNode } from "react";
import {
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
	GlowWalletAdapter,
	PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";
require("@solana/wallet-adapter-react-ui/styles.css");

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const url = useMemo(() => clusterApiUrl("devnet"), []);
	const wallets = [new PhantomWalletAdapter(), new GlowWalletAdapter()];

	return (
		<ConnectionProvider endpoint={url}>
			<WalletProvider wallets={wallets}>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
};

export default WalletContextProvider;
