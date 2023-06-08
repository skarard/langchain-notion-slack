import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from ".";

const command: InteractionCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Console logs the interaction and replies with Pong!'"),
  async execute(interaction: CommandInteraction) {
    console.log(interaction);
    await interaction.reply({ content: "Pong!", ephemeral: true });
  },
};

export default command;
