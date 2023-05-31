import { boltApp } from "./bolt";
import { initData } from "./langchain";
import { discordClient } from "./discord";
import { expressApp } from "./express";
import config from "./config";

(async () => {
  // initData();
  // boltApp.start().then(() => console.log("[server] Bolt is running"));
  discordClient
    .login(config.DISCORD_BOT_TOKEN)
    .then((res) => console.log("[server] Discord is running"));
  // expressApp.listen(config.EXPRESS_PORT, () =>
  //   console.log("[server] Express is running")
  // );
})();
