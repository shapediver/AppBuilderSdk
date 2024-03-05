import React from "react";
import ReactDOM from "react-dom/client";
import AppBuilderBase from "AppBuilderBase";
import reportWebVitals from "reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

/** 
 * Note: Activate strict mode during development to detect potential bugs.
 * @see https://react.dev/reference/react/StrictMode
 */
const useStrictMode = false;

root.render(
	useStrictMode ? <React.StrictMode><AppBuilderBase/></React.StrictMode> : <AppBuilderBase/>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(r => console.debug("reportWebVitals", r));
