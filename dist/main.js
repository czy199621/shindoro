import { mountApp } from "./App.js";
const app = document.querySelector("#app");
if (!app) {
    throw new Error("Missing #app root element.");
}
mountApp(app);
