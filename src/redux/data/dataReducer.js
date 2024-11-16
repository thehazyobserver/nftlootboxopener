const initialState = {
  loading: false,
  totalSupply: 0,
  erc721TokenIds: [],           // Unwrapped token IDs
  erc721TokenURIs: [],          // Unwrapped token URIs
  wrappedTokenIds: [],          // Wrapped token IDs
  wrappedTokenURIs: [],         // Wrapped token URIs
  cost: 0,                      // Optional cost, if needed
  error: false,
  errorMsg: "",
};

const dataReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CHECK_DATA_REQUEST":
      return {
        ...state,              // Keep current data while loading
        loading: true,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DATA_SUCCESS":
      return {
        ...state,              // Preserve existing data unless overwritten
        loading: false,
        totalSupply: action.payload.totalSupply,
        erc721TokenIds: action.payload.erc721TokenIds,           // Unwrapped token IDs
        erc721TokenURIs: action.payload.erc721TokenURIs,         // Unwrapped token URIs
        wrappedTokenIds: action.payload.wrappedTokenIds,         // Wrapped token IDs
        wrappedTokenURIs: action.payload.wrappedTokenURIs,       // Wrapped token URIs
        // Optional handling if 'cost' is provided:
        // cost: action.payload.cost || state.cost,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DATA_FAILED":
      return {
        ...state,              // Keep previous data in case of failure
        loading: false,
        error: true,
        errorMsg: action.payload,
      };
    default:
      return state;
  }
};

export default dataReducer;
