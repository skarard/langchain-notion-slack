import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from ".";
import {
  NotionWebLoader,
  NotionWebObject,
} from "langchain/document_loaders/web/notionweb";
import config from "../../config";
import { Client } from "@notionhq/client";

const command: InteractionCommand = {
  data: new SlashCommandBuilder()
    .setName("notion-add")
    .setDescription("Adds a notion database to the bot")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The notion type: block, page, database")
        .setRequired(true)
        .setChoices(
          { name: "block", value: "block" },
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
    )?.value as NotionWebObject;

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

    const loader = new NotionWebLoader({
      client: notion,
      id,
      type,
    });

    const docs = await loader.load().catch(async (err) => {
      console.log(err);
      await interaction.followUp({
        content: `Invalid object with id ${id}...`,
        ephemeral: true,
      });
      return undefined;
    });

    console.dir({ docs }, { depth: "infinity" });

    await interaction.followUp({
      content: `Imported id ${id}...`,
      ephemeral: true,
    });
  },
};

export default command;
