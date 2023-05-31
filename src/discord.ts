import Discord from "discord.js";
import { callChain } from "./langchain";

export const discordClient = new Discord.Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

discordClient.on("messageCreate", async function (message) {
  if (message.author.bot || !message.content) return;

  const question = message.content.replace(/<@[0-9]*>/, "").trim();
  await callChain(question, {
    name: message.author.username,
    userId: message.author.id,
  }).then((answer) => {
    // console.log(answer.text);
    message.reply(answer.text);
  });
});
