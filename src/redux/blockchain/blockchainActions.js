import Web3 from "web3";
import { fetchData } from "../data/dataActions";
import erc404Abi from "./abis/erc404Abi.json"; // Wrapping contract ABI
import erc721Abi from "./abis/erc721Abi.json"; // ERC721 contract ABI

// Action Types
export const CONNECT_REQUEST = "CONNECT_REQUEST";
export const CONNECT_SUCCESS = "CONNECT_SUCCESS";
export const CONNECT_FAILED = "CONNECT_FAILED";
export const WRAP_SUCCESS = "WRAP_SUCCESS";
export const WRAP_FAILED = "WRAP_FAILED";
export const UNWRAP_SUCCESS = "UNWRAP_SUCCESS";
export const UNWRAP_FAILED = "UNWRAP_FAILED";

// Connect to the blockchain
export const connect = (CONFIG) => {  // Now accepting CONFIG explicitly
  return async (dispatch) => {
    dispatch({ type: CONNECT_REQUEST });

    if (!CONFIG) {
      console.error("CONFIG data is missing.");
      dispatch({
        type: CONNECT_FAILED,
        payload: "Configuration data is missing.",
      });
      return;
    }

    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const networkId = await window.ethereum.request({
          method: "net_version",
        });

        // Check if connected to the correct network
        if (networkId === CONFIG.NETWORK.ID.toString()) {
              // Debugging - log ABIs and contract addresses
              console.log("Wrapping ABI:", erc404Abi);
              console.log("ERC721 ABI:", erc721Abi);
              console.log("Contract Address:", CONFIG.CONTRACT_ADDRESS);
              console.log("ERC721 Contract Address:", CONFIG.ERC721_CONTRACT_ADDRESS);
          // Initialize the Wrapping and ERC721 contracts
          const wrappingContract = new web3.eth.Contract(
            erc404Abi,
            CONFIG.CONTRACT_ADDRESS // Wrapping contract address from config
          );

          const erc721Contract = new web3.eth.Contract(
            erc721Abi,
            CONFIG.ERC721_CONTRACT_ADDRESS // ERC721 contract address from config
          );

          // Log to ensure contracts are initialized correctly
          console.log("Wrapping Contract Initialized:", wrappingContract);
          console.log("ERC721 Contract Initialized:", erc721Contract);

          // Dispatch connection success
          dispatch({
            type: CONNECT_SUCCESS,
            payload: {
              account: accounts[0],
              web3,
              wrappingContract,
              erc721Contract,
              networkId,
            },
          });

          // Fetch additional data after successful connection
          dispatch(fetchData(accounts[0]));
        } else {
          console.error("Wrong network. Please switch to the correct network.");
          dispatch({
            type: CONNECT_FAILED,
            payload: `Please connect to the ${CONFIG.NETWORK.NAME} Mainnet.`,
          });
        }
      } catch (err) {
        console.error("Failed to connect to the blockchain:", err);
        dispatch({
          type: CONNECT_FAILED,
          payload: "Failed to connect to the blockchain.",
        });
      }
    } else {
      console.error("MetaMask or other Web3 wallet not detected.");
      dispatch({
        type: CONNECT_FAILED,
        payload: "Please install a Web3 wallet like MetaMask.",
      });
    }
  };
};

// Approve all NFTs for wrapping
export const approveAll = (account, nftContract) => {
  return async (dispatch) => {
    try {
      await nftContract.methods
        .setApprovalForAll("0x777Ef7bA47f2DcBb4c44907c39671e6cC4BB2ae1", true)
        .send({ from: account });

      console.log("Approval granted for all NFTs.");
    } catch (err) {
      console.error("Failed to approve NFTs:", err);
    }
  };
};

// Approve a single NFT
export const approveNFT = (account, nftContract, tokenId) => {
  return async (dispatch) => {
    try {
      await nftContract.methods
        .approve("0x777Ef7bA47f2DcBb4c44907c39671e6cC4BB2ae1", tokenId)
        .send({ from: account });

      console.log(`Approval granted for token ${tokenId}.`);
    } catch (err) {
      console.error("Failed to approve NFT:", err);
    }
  };
};

// Wrap selected tokens
export const wrapTokens = (tokenIds) => {
  return async (dispatch, getState) => {
    const state = getState();
    const { account, web3, wrappingContract } = state.blockchain;
    const CONFIG = state.config || state.blockchain.config;

    if (!account || !web3 || !wrappingContract) {
      return alert("Please connect your wallet first.");
    }

    try {
      const wrappingFee = web3.utils.toWei(
        String(CONFIG.WRAP_FEE * tokenIds.length),
        "ether"
      );

      const gasLimit = CONFIG.GAS_LIMIT_PER_WRAP || CONFIG.GAS_LIMIT;

      await wrappingContract.methods
        .wrapSet(tokenIds)
        .send({
          from: account,
          value: wrappingFee, // User pays the wrapping fee in FTM
          gasLimit, // Adjust gas limit if necessary
        });

      console.log("Tokens wrapped successfully.");
      dispatch({
        type: WRAP_SUCCESS,
        payload: "Tokens wrapped successfully.",
      });

      // Fetch updated data
      dispatch(fetchData(account));
    } catch (err) {
      console.error("Wrapping failed:", err);
      dispatch({
        type: WRAP_FAILED,
        payload: "Failed to wrap tokens.",
      });
    }
  };
};

// Unwrap selected tokens
export const unwrapTokens = (tokenIds) => {
  return async (dispatch, getState) => {
    const state = getState();
    const { account, web3, wrappingContract } = state.blockchain;
    const CONFIG = state.config || state.blockchain.config;

    if (!account || !web3 || !wrappingContract) {
      return alert("Please connect your wallet first.");
    }

    try {
      const gasLimit = CONFIG.GAS_LIMIT_PER_UNWRAP || CONFIG.GAS_LIMIT;

      await wrappingContract.methods
        .unwrapSet(tokenIds)
        .send({
          from: account,
          gasLimit, // Adjust gas limit if necessary
        });

      console.log("Tokens unwrapped successfully.");
      dispatch({
        type: UNWRAP_SUCCESS,
        payload: "Tokens unwrapped successfully.",
      });

      // Fetch updated data
      dispatch(fetchData(account));
    } catch (err) {
      console.error("Unwrapping failed:", err);
      dispatch({
        type: UNWRAP_FAILED,
        payload: "Failed to unwrap tokens.",
      });
    }
  };
};
