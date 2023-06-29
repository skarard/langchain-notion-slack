import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from ".";
import {
  NotionAPILoader,
  NotionAPIType,
} from "langchain/document_loaders/web/notionapi";
import config from "../../config";
import { Client } from "@notionhq/client";
import { addData, callParseChain } from "../../langchain";

const command: InteractionCommand = {
  data: new SlashCommandBuilder()
    .setName("add-data")
    .setDescription("Parses notion data with a view to add it to a database")
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
    )?.value as NotionAPIType;

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

    // await addData(docs);
    for (const doc of docs) {
      const result = await callParseChain(doc);

      if (result.text)
        await interaction.followUp({
          content: result.text,
          ephemeral: true,
        });
    }

    await interaction.followUp({
      content: `Completed extracting data from ${id}...`,
      ephemeral: true,
    });
  },
};

export default command;
