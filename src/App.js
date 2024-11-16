import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";

// Truncate function for long addresses
const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

// Helper function to fetch metadata from IPFS
const fetchNFTMetadata = async (tokenId) => {
  const url = `https://ftmholidaycelebration.mypinata.cloud/ipfs/Qme13uK25WAk8N4DmbGBvDYGPX7WtptWLUoRHdWHL4H2XL/${tokenId}.json`;
  try {
    const response = await fetch(url);
    const metadata = await response.json();
    return metadata.image; // Return the image URL from the metadata
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return ""; // Fallback in case of an error
  }
};

// Styled Container to evenly space the two columns
const ColumnContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  padding: 20px 0;
`;

// Styled Button Container to center-align buttons
const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center; /* Center-aligns the buttons */
  gap: 15px; /* Adds space between buttons */
  margin-top: 30px;
`;

// Styled NFT Card for better layout and spacing
const Card = styled.div`
  diplay: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  padding: 2px;
  border-radius: 8px;
  background-color: #f0f0f0;
  margin-bottom: 15px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  max-width: 150px;
`;

// Styled Button with fixed position for Connect Wallet
const StyledButton = styled.button`
  padding: 10px;
  border-radius: 50px;
  border: none;
  background-color: var(--secondary);
  font-weight: bold;
  color: var(--secondary-text);
  width: 150px;
  cursor: pointer;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  :hover {
    background-color: var(--accent);
  }
`;

// Styled Buttons for Approve, Wrap, and Unwrap actions
const ActionButton = styled.button`
  padding: 10px;
  border-radius: 50px;
  border: none;
  background-color: var(--secondary);
  font-weight: bold;
  color: var(--secondary-text);
  width: 150px;
  cursor: pointer;
  margin: 10px;
  :hover {
    background-color: var(--accent);
  }
`;

// Styled Container for NFT Grid (4 columns wide)
const NFTGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);  // 4 items wide
  gap: 20px;  // Space between the grid items
  justify-items: center;  // Center each item in its grid cell
  margin-bottom: 20px;
`;

const PaginationButton = styled.button`
  padding: 4px 8px;
  margin: 3px;
  border-radius: 3px;
  border: none;
  background-color: #ff00ff; /* Change to your desired background color */
  color: #fff; /* Change to your desired text color */
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #ff66ff; /* Hover color */
  }

  &:disabled {
    background-color: #ccc; /* Disabled state background color */
    color: #666; /* Disabled state text color */
    cursor: not-allowed;
  }
`;

const ITEMS_PER_PAGE = 25;  // Number of tokens to display per page

// Styled NFT Image
const NFTImage = styled.img`
  width: 100px;
  margin: 5px;
  margin-botton: 10px;
  border: ${({ selected }) => (selected ? "5px solid var(--accent)" : "none")};
  cursor: pointer;
`;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    SHOW_BACKGROUND: true,
  });

  const [wrappingFee, setWrappingFee] = useState(null); 
  const [selectedUnwrappedTokens, setSelectedUnwrappedTokens] = useState([]);
  const [selectedWrappedTokens, setSelectedWrappedTokens] = useState([]);
  const [unwrappedImages, setUnwrappedImages] = useState({});
  const [wrappedImages, setWrappedImages] = useState({});

  const [currentUnwrappedPage, setCurrentUnwrappedPage] = useState(1);  // State for unwrapped page
  const [currentWrappedPage, setCurrentWrappedPage] = useState(1);  // State for wrapped page

  const totalUnwrappedPages = Math.ceil((data.erc721TokenIds?.length || 0) / ITEMS_PER_PAGE);  // Calculate total pages for unwrapped
  const totalWrappedPages = Math.ceil((data.wrappedTokenIds?.length || 0) / ITEMS_PER_PAGE);  // Calculate total pages for wrapped

  // Pagination functions
  const handleUnwrappedNext = () => {
    setCurrentUnwrappedPage((prevPage) => Math.min(prevPage + 1, totalUnwrappedPages));
  };

  const handleUnwrappedPrev = () => {
    setCurrentUnwrappedPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleWrappedNext = () => {
    setCurrentWrappedPage((prevPage) => Math.min(prevPage + 1, totalWrappedPages));
  };

  const handleWrappedPrev = () => {
    setCurrentWrappedPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  // Fetch config.json data
  const getConfig = async () => {
    try {
      const configResponse = await fetch("/config/config.json", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const config = await configResponse.json();
      SET_CONFIG(config);
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  // Fetch the wrapping fee from the contract
  const fetchWrappingFee = async () => {
    try {
      const fee = await blockchain.wrappingContract.methods.wrappingFee().call();
      setWrappingFee(fee);
    } catch (error) {
      console.error("Error fetching wrapping fee:", error);
    }
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    if (
      blockchain.account !== "" &&
      blockchain.erc721Contract !== null &&
      blockchain.wrappingContract !== null
    ) {
      dispatch(fetchData(blockchain.account));
      fetchWrappingFee(); 
    }
  }, [blockchain.account, blockchain.erc721Contract, blockchain.wrappingContract, dispatch]);

  useEffect(() => {
    // Fetch images for unwrapped tokens
    if (data && data.erc721TokenIds) {
      data.erc721TokenIds.forEach(async (tokenId) => {
        const imageUrl = await fetchNFTMetadata(tokenId);
        setUnwrappedImages((prev) => ({ ...prev, [tokenId]: imageUrl }));
      });
    }

    // Fetch images for wrapped tokens
    if (data && data.wrappedTokenIds) {
      data.wrappedTokenIds.forEach(async (tokenId) => {
        const imageUrl = await fetchNFTMetadata(tokenId);
        setWrappedImages((prev) => ({ ...prev, [tokenId]: imageUrl }));
      });
    }
  }, [data]);

  
  // Handle Approve All function for ERC721 contract
  const handleApproveAll = async () => {
    try {
      await blockchain.erc721Contract.methods
        .setApprovalForAll(blockchain.wrappingContract.options.address, true)
        .send({ from: blockchain.account });
      alert("All tokens approved for wrapping!");
    } catch (error) {
      console.error("Error approving all tokens:", error);
    }
  };

  
  // Handle selecting and unselecting NFT images
  const handleSelectToken = (tokenId, isWrapped) => {
    if (isWrapped) {
      setSelectedWrappedTokens((prev) =>
        prev.includes(tokenId) ? prev.filter((id) => id !== tokenId) : [...prev, tokenId]
      );
    } else {
      setSelectedUnwrappedTokens((prev) =>
        prev.includes(tokenId) ? prev.filter((id) => id !== tokenId) : [...prev, tokenId]
      );
    }
  };

  // Handle Wrap action
  const handleWrap = async () => {
    try {
      if (selectedUnwrappedTokens.length === 0) {
        alert("No tokens selected for wrapping.");
        return;
      }

      const totalWrapFee = wrappingFee * selectedUnwrappedTokens.length;
      if (isNaN(totalWrapFee) || totalWrapFee <= 0) {
        alert("Wrap fee is not valid.");
        return;
      }

      await blockchain.wrappingContract.methods
        .wrapSet(selectedUnwrappedTokens)
        .send({ from: blockchain.account, value: totalWrapFee });

      setSelectedUnwrappedTokens([]); 
      dispatch(fetchData(blockchain.account)); 
    } catch (error) {
      console.error("Error wrapping tokens:", error);
      alert("Error wrapping tokens. Please check the console for details.");
    }
  };

  // Handle Unwrap action
  const handleUnwrap = async () => {
    try {
      if (selectedWrappedTokens.length === 0) {
        alert("No tokens selected for unwrapping.");
        return;
      }

      await blockchain.wrappingContract.methods
        .unwrapSet(selectedWrappedTokens)
        .send({ from: blockchain.account });

      setSelectedWrappedTokens([]); 
      dispatch(fetchData(blockchain.account)); 
    } catch (error) {
      console.error("Error unwrapping tokens:", error);
    }
  };

  // Calculate the current page's token IDs
  const unwrappedTokensOnPage = data.erc721TokenIds?.slice(
    (currentUnwrappedPage - 1) * ITEMS_PER_PAGE,
    currentUnwrappedPage * ITEMS_PER_PAGE
  );

  const wrappedTokensOnPage = data.wrappedTokenIds?.slice(
    (currentWrappedPage - 1) * ITEMS_PER_PAGE,
    currentWrappedPage * ITEMS_PER_PAGE
  );

  return (
    <s.Screen>
      <s.Container
        flex={1}
        ai={"center"}
        style={{ padding: 24, backgroundColor: "var(--primary)" }}
        image={CONFIG.SHOW_BACKGROUND ? "/config/images/bg.png" : null}
      >
        <StyledButton
          onClick={() => {
            dispatch(connect(CONFIG));
          }}
        >
          {blockchain.account
            ? `Connected: ${truncate(blockchain.account, 15)}`
            : "Connect Wallet"}
        </StyledButton>

        <s.SpacerSmall />

        <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 50,
                fontWeight: "bold",
                color: "var(--accent-text)",
              }}
            >
              Wrap your $CONK Raffle Tickets into $TEST 404 Tokens
            </s.TextTitle>

        {blockchain.account === "" || blockchain.erc721Contract === null || blockchain.wrappingContract === null ? (
          <>
            <s.TextDescription
              style={{
                textAlign: "center",
                fontSize: 40,
                color: "var(--accent-text)",
              }}
            >
              Please connect your wallet
            </s.TextDescription>

  
          </>
        ) : (
          <>
            <s.TextDescription
              style={{
                textAlign: "center",
                fontSize: 25,
                color: "var(--accent-text)",
              }}
            >
              1. Click Approve All. 2. Select the tokens to wrap/unwrap. 3. Click Wrap/Unwrap button.
            </s.TextDescription>
            <ButtonsContainer>
              <ActionButton onClick={handleApproveAll}>Approve All</ActionButton>
              <ActionButton onClick={handleWrap}>Wrap Selected</ActionButton>
              <ActionButton onClick={handleUnwrap}>Unwrap Selected</ActionButton>
              </ButtonsContainer>

        
              <s.TextDescription
              style={{
                textAlign: "center",
                fontSize: 25,
                color: "var(--accent-text)",
              }}
            >
              10 $FTM/NFT fee to wrap into a $404 token
            </s.TextDescription>
            <s.TextDescription
              style={{
                textAlign: "center",
                fontSize: 25,
                color: "var(--accent-text)",
              }}
            >
             Trade on Spooky Swap and Paintswap 
            </s.TextDescription>
            <s.TextDescription
              style={{
                textAlign: "center",
                fontSize: 20,
                color: "var(--accent-text)",
                fontStyle: "italic",
              }}
            >
             This is an experiment in wrapping NFTs into 404s to help bring liquidity back to $FTM NFTS 
            </s.TextDescription>
            <s.TextDescription
              style={{
                textAlign: "center",
                fontSize: 20,
                color: "var(--accent-text)",
                fontStyle: "italic",
              }}
            >
             $TEST CA: 0x777Ef7bA47f2DcBb4c44907c39671e6cC4BB2ae1 - Raffle Ticket CA: 0x2E4278e29Dfc5998c8b1235fb933FD2AfCd9166b
            </s.TextDescription>
            <s.TextDescription
              style={{ textAlign: "center", color: "var(--primary-text)" }}
            >
              <a href={CONFIG.SCAN_LINK} target="_blank" rel="noreferrer">
                {truncate(CONFIG.CONTRACT_ADDRESS, 15)}
              </a>
            </s.TextDescription>
            <s.Container fd={"row"} jc={"space-around"}>
              {/* Unwrapped NFTs */}
              <s.Container>
                <s.TextTitle>Unwrapped $CONK Raffle Tickets</s.TextTitle>
                <NFTGrid>
                {unwrappedTokensOnPage?.map((tokenId) => (
                    <Card key={tokenId}>
                  <NFTImage
                    key={tokenId}
                    src={unwrappedImages[tokenId] || ""}
                    alt={`Unwrapped Token ${tokenId}`}
                    selected={selectedUnwrappedTokens.includes(tokenId)}
                    onClick={() => handleSelectToken(tokenId, false)}
                  />
                  </Card>
                ))}

                {/* Unwrapped Pagination */}
                <div>
                <PaginationButton onClick={handleUnwrappedPrev} disabled={currentUnwrappedPage === 1}>
                    Previous
                    </PaginationButton>
                  <span>{currentUnwrappedPage}</span>
                  <PaginationButton onClick={handleUnwrappedNext} disabled={currentUnwrappedPage >= totalUnwrappedPages}>
                    Next
                  </PaginationButton>
                </div>
                </NFTGrid>
              </s.Container>

              {/* Wrapped NFTs */}
              <s.Container>
                <s.TextTitle>Wrapped 404 $TEST TOKENS</s.TextTitle>
                <NFTGrid>
                {wrappedTokensOnPage?.map((tokenId) => (
                    <Card key={tokenId}>
                  <NFTImage
                    key={tokenId}
                    src={wrappedImages[tokenId] || ""}
                    alt={`Wrapped Token ${tokenId}`}
                    selected={selectedWrappedTokens.includes(tokenId)}
                    onClick={() => handleSelectToken(tokenId, true)}
                  />
                  </Card>
                ))}

                {/* Wrapped Pagination */}
                <div>
                <PaginationButton onClick={handleUnwrappedPrev} disabled={currentUnwrappedPage === 1}>
    Previous
  </PaginationButton>
  <span>{currentUnwrappedPage}</span>
  <PaginationButton onClick={handleUnwrappedNext} disabled={currentUnwrappedPage >= totalUnwrappedPages}>
    Next
  </PaginationButton>
                </div>
                </NFTGrid>
              </s.Container>
            </s.Container>
          </>
        )}
      </s.Container>
    </s.Screen>
  );
}

export default App;
