import {
	AnchorProvider,
	Idl,
	Program,
	setProvider,
} from "@project-serum/anchor";
import { createContext, useContext } from "react";
import { MovieReview, IDL } from "./movie_review";
import { Connection, PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import MockWallet from "./MockWallet";

const WorkspaceContext = createContext({});
const programId = new PublicKey("BouTUP7a3MZLtXqMAm1NrkJSKwAjmid8abqiNjUyBJSr"); // 7iTggggVhJfZmP2qSUtmAdvU46uGshgXQaWAetcv7gwo

interface WorkSpace {
	connection?: Connection;
	provider?: AnchorProvider;
	program?: Program<MovieReview>;
}

const WorkspaceProvider = ({ children }: any) => {
	const wallet = useAnchorWallet() || MockWallet;
	const { connection } = useConnection();

	const provider = new AnchorProvider(connection, wallet, {});
	setProvider(provider);

	const program = new Program(IDL as Idl, programId);
	const workspace = {
		connection,
		provider,
		program,
	};

	return (
		<WorkspaceContext.Provider value={workspace}>
			{children}
		</WorkspaceContext.Provider>
	);
};

const useWorkspace = (): WorkSpace => {
	return useContext(WorkspaceContext);
};

export { WorkspaceProvider, useWorkspace };
