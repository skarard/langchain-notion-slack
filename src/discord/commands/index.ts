import fs from "node:fs";
import path from "node:path";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export type InteractionCommand = {
  data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: CommandInteraction) => Promise<void>;
};

export const commandPaths = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file !== "index.ts" &&
      file.endsWith(".ts") &&
      (require(path.join(__dirname, file)) satisfies InteractionCommand)
  )
  .map((file) => path.join(__dirname, file));
