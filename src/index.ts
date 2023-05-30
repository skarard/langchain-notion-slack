import { boltApp } from "./bolt";
import { initData } from "./langchain";

(async () => {
  boltApp.start().then(() => console.log("[server] Bolt is running"));
  // initData();
})();
