import Discord, {
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { callChain } from "./langchain";
import crypto from "crypto";

const answers = ["🇦", "🇧", "🇨", "🇩"];

export const discordClient = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

discordClient.on(Events.MessageCreate, async function (message) {
  if (message.author.bot && message.embeds.length > 0) {
    for (const answer of answers) await message.react(answer);
    return;
  }

  if (!message.content) return;

  const question = message.content.replace(/<@[0-9]*>/, "").trim();
  const mcResults = (await callChain(question).then(
    (res) => res.text
  )) as string;

  console.log(mcResults);

  mcResults.split("\n").forEach((result) => {
    // Extract a multiple choice question and choices from the chain
    const [mcQuestionRaw, mcChoicesRaw, mcAnswerIndexRaw] =
      result.split("--- ea07b3b9 ---");

    // If any of the parts are missing, skip this result
    if (!mcQuestionRaw || !mcChoicesRaw || !mcAnswerIndexRaw) return;

    // Parse the multiple choice question and choices
    const mcQuestion = JSON.parse(mcQuestionRaw);
    const mcChoices = JSON.parse(mcChoicesRaw) as string[];
    const mcAnswerIndex = parseInt(mcAnswerIndexRaw);

    // Generate salt and hash
    const salt = Math.floor(Math.random() * 2 ** 32)
      .toString(16)
      .padStart(8, "0");
    const hash = crypto
      .createHash("sha-256")
      .update(salt + answers[mcAnswerIndex])
      .digest("hex")
      .slice(0, 8);

    // Generate embed
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .addFields({
        name: "Question",
        value: mcQuestion,
      })
      .addFields({
        name: "Choices",
        value: mcChoices
          .map((choice, i) => `${answers[i]} ${choice}`)
          .join("\n"),
      })
      .setFooter({ text: salt + ":" + hash });

    // Send embed
    message.channel.send({ embeds: [embed] });
  });
});

// Reaction events

discordClient.on(Events.MessageReactionAdd, async function (reaction, user) {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(console.error);

  const [salt, hash] = reaction.message.embeds[0].footer
    ? reaction.message.embeds[0].footer.text.split(":")
    : ["", ""];

  const answer = answers.find(
    (answer) =>
      crypto
        .createHash("sha-256")
        .update(salt + answer)
        .digest("hex")
        .slice(0, 8) === hash
  );

  if (answer === reaction.emoji.name) {
    const embed = EmbedBuilder.from(reaction.message.embeds[0]);
    const embedLength = reaction.message.embeds[0].fields.length;
    if (reaction.message.embeds[0].fields[embedLength - 1].name !== "Answer") {
      embed.addFields({
        name: "Answer",
        value: answer as string,
      });
      reaction.message.edit({ embeds: [embed] });
    }
  }
});

discordClient.on(Events.MessageReactionRemove, async function (reaction, user) {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(console.error);

  const [salt, hash] = reaction.message.embeds[0].footer
    ? reaction.message.embeds[0].footer.text.split(":")
    : ["", ""];

  const answer = answers.find(
    (answer) =>
      crypto
        .createHash("sha-256")
        .update(salt + answer)
        .digest("hex")
        .slice(0, 8) === hash
  );

  if (answer === reaction.emoji.name) {
    const embed = EmbedBuilder.from(reaction.message.embeds[0]);
    const embedLength = reaction.message.embeds[0].fields.length;
    if (reaction.message.embeds[0].fields[embedLength - 1].name === "Answer") {
      embed.spliceFields(-1, 1);
      reaction.message.edit({ embeds: [embed] });
    }
  }
});
