import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from ".";
import {
  NotionAPILoader,
  NotionAPIObject,
} from "langchain/document_loaders/web/notionapi";
import config from "../../config";
import { Client } from "@notionhq/client";
import { addData } from "../../langchain";

const command: InteractionCommand = {
  data: new SlashCommandBuilder()
    .setName("notion-add")
    .setDescription("Adds a notion database to the bot")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The notion type: page OR database")
        .setRequired(true)
        .setChoices(
          { name: "page", value: "page" },
          { name: "database", value: "database" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("The notion url or id")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const id = /(?<!=)[0-9a-f]{32}/.exec(
      interaction.options.data.find((option) => option.name === "id")
        ?.value as string
    )?.[0];

    const type = interaction.options.data.find(
      (option) => option.name === "type"
    )?.value as NotionAPIObject;

    if (!id) {
      await interaction.reply({
        content: `Invalid Id ${id}`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `Loading id ${id}...`,
      ephemeral: true,
    });

    const notion = new Client({ auth: config.NOTION_TOKEN });

    const loader = new NotionAPILoader({
      client: notion,
      id,
      type,
    });

    const docs = await loader.load().catch(console.log);

    if (docs === undefined) {
      await interaction.followUp({
        content: `Invalid object with id ${id}...`,
        ephemeral: true,
      });
      return;
    }

    await addData(docs);

    await interaction.followUp({
      content: `Imported id ${id}...`,
      ephemeral: true,
    });
  },
};

export default command;
