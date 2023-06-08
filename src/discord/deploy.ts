import { REST, Routes } from "discord.js";
import config from "../config";
import { commandPaths } from "./commands";

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.DISCORD_BOT_TOKEN);

const commands = commandPaths.map((file) =>
  require(file).default.data.toJSON()
);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data: any = await rest.put(
      Routes.applicationCommands(config.DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
