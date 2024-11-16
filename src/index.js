import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import store from "./redux/store"; // Redux store import
import { Provider } from "react-redux"; // Import the Redux provider to wrap the app
import "./styles/reset.css"; // Global styles reset

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);

// Report performance metrics if needed
reportWebVitals();
