import store from "../store";

// Action creators for fetch requests
const fetchDataRequest = () => {
  return {
    type: "CHECK_DATA_REQUEST",
  };
};

const fetchDataSuccess = (payload) => {
  return {
    type: "CHECK_DATA_SUCCESS",
    payload: payload,
  };
};

const fetchDataFailed = (payload) => {
  return {
    type: "CHECK_DATA_FAILED",
    payload: payload,
  };
};

// Helper function to fetch token URIs
const fetchTokenURIs = async (contract, tokenIds) => {
  try {
    const tokenURIs = await Promise.all(
      tokenIds.map(async (tokenId) => {
        const uri = await contract.methods.tokenURI(tokenId).call();
        return uri || `URI not available for tokenId: ${tokenId}`;  // Fallback if URI is not available
      })
    );
    return tokenURIs;
  } catch (error) {
    console.error("Error fetching token URIs:", error);
    return [];  // Return an empty array if there's an issue
  }
};

// Fetch token data (unwrapped and wrapped)
export const fetchData = (account) => {
  return async (dispatch, getState) => {
    dispatch(fetchDataRequest());

    try {
      const { blockchain } = getState();  // Access blockchain state
      const { erc721Contract, wrappingContract } = blockchain;

      // Check if contracts are initialized before making calls
      if (!erc721Contract || !wrappingContract) {
        console.error("Contracts are not initialized.");
        throw new Error("Contracts are not initialized.");
      }

      // Fetch the total supply of wrapped tokens
      const totalSupply = await wrappingContract.methods.totalSupply().call();
      console.log("Total supply of wrapped tokens:", totalSupply);

      // Fetch the user's ERC721 tokens (unwrapped tokens)
      const erc721Balance = await erc721Contract.methods.balanceOf(account).call();
      const erc721TokenIds = [];
      for (let i = 0; i < erc721Balance; i++) {
        const tokenId = await erc721Contract.methods.tokenOfOwnerByIndex(account, i).call();
        erc721TokenIds.push(tokenId);
      }
      console.log("Fetched ERC721 tokens:", erc721TokenIds);

      const erc721TokenURIs = erc721TokenIds.length > 0 
        ? await fetchTokenURIs(erc721Contract, erc721TokenIds) 
        : [];

  // Fetch the user's wrapped tokens from the wrapping contract
const wrappedTokenIds = await wrappingContract.methods.tokensOfOwner(account).call(); // Fetch tokensOfOwner here once
console.log("Fetched wrapped tokens:", wrappedTokenIds);  // Log the token IDs to verify

const wrappedTokenURIs = wrappedTokenIds.length > 0 
  ? await fetchTokenURIs(wrappingContract, wrappedTokenIds) 
  : [];


      // Dispatch the fetched data to the state, handle empty or null cases
      dispatch(
        fetchDataSuccess({
          totalSupply,  // Total wrapped token supply
          erc721TokenIds,  // Unwrapped token IDs
          erc721TokenURIs,  // Unwrapped token URIs
          wrappedTokenIds,  // Wrapped token IDs
          wrappedTokenURIs,  // Wrapped token URIs
        })
      );
    } catch (err) {
      console.error("Error fetching data from blockchain:", err);
      dispatch(fetchDataFailed("Could not load data from the contract."));
    }
  };
};
