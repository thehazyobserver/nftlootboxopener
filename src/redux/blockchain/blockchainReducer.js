const initialState = {
  loading: false,
  account: null,
  wrappingContract: null,  // To store the correct wrapping contract
  web3: null,
  errorMsg: "",  // General error message for the connection
  wrapErrorMsg: "",  // Specific error message for wrapping
  unwrapErrorMsg: "",  // Specific error message for unwrapping
  isWrapping: false,
  isUnwrapping: false,
  networkId: null,  // Added to track network ID, useful for ensuring correct network connection
};

const blockchainReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CONNECT_REQUEST":
      return {
        ...state,
        loading: true,
        errorMsg: "",  // Clear any previous connection errors
      };
      
    case "CONNECT_SUCCESS":
      return {
        ...state,
        loading: false,
        account: action.payload.account,
        wrappingContract: action.payload.wrappingContract,  // Storing the wrapping contract
        erc721Contract: action.payload.erc721Contract,     // Store erc721Contract
        web3: action.payload.web3,
        networkId: action.payload.networkId,  // Storing network ID to ensure correct network
        errorMsg: "",  // Clear error messages on success
      };
      
    case "CONNECT_FAILED":
      return {
        ...state,
        loading: false,
        account: null,  // Reset account if connection failed
        wrappingContract: null,  // Clear the contract if connection failed
        web3: null,  // Clear web3 on failure
        errorMsg: action.payload,  // Set the error message for connection failure
      };

    case "WRAP_REQUEST":
      return {
        ...state,
        isWrapping: true,
        wrapErrorMsg: "",  // Clear any previous wrapping errors
      };

    case "WRAP_SUCCESS":
      return {
        ...state,
        isWrapping: false,
        wrapErrorMsg: "",  // Clear wrapping errors on success
      };

    case "WRAP_FAILED":
      return {
        ...state,
        isWrapping: false,
        wrapErrorMsg: action.payload,  // Set wrapping error message on failure
      };

    case "UNWRAP_REQUEST":
      return {
        ...state,
        isUnwrapping: true,
        unwrapErrorMsg: "",  // Clear any previous unwrapping errors
      };

    case "UNWRAP_SUCCESS":
      return {
        ...state,
        isUnwrapping: false,
        unwrapErrorMsg: "",  // Clear unwrapping errors on success
      };

    case "UNWRAP_FAILED":
      return {
        ...state,
        isUnwrapping: false,
        unwrapErrorMsg: action.payload,  // Set unwrapping error message on failure
      };

    case "UPDATE_ACCOUNT":
      return {
        ...state,
        account: action.payload.account,
        errorMsg: "",  // Clear general error on account update
      };

    default:
      return state;
  }
};

export default blockchainReducer;
