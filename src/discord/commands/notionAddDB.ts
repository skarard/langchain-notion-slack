import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from ".";

const command: InteractionCommand = {
  data: new SlashCommandBuilder()
    .setName("notion-add-db")
    .setDescription("Adds a notion database to the bot")
    .addStringOption((option) =>
      option
        .setName("database-id")
        .setDescription("The notion url or id")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    console.log(interaction.options.data);
    const databaseId = interaction.options.data.find(
      (option) => option.name === "database-id"
    )?.value as string;
    await interaction.reply({
      content: `databaseID: ${databaseId}`,
      ephemeral: true,
    });
  },
};

export default command;
