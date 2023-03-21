import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import WalletContextProvider from "../context/WalletContextProvider";
import { WorkspaceProvider } from "../context/Anchor";

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<WalletContextProvider>
			<ChakraProvider>
				<WorkspaceProvider>
					<Component {...pageProps} />
				</WorkspaceProvider>
			</ChakraProvider>
		</WalletContextProvider>
	);
}

export default MyApp;

