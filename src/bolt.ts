import config from "./config";
import { App } from "@slack/bolt";
import { callChain } from "./langchain";

export const boltApp = new App({
  token: config.SLACK_BOT_TOKEN,
  appToken: config.SLACK_APP_TOKEN,
  socketMode: true,
});

boltApp.message(async ({ message, say }) => {
  if (
    (message.subtype === undefined || message.subtype === "bot_message") &&
    message.text
  ) {
    await callChain(message.text).then((answer) => say(answer));
  }
});
