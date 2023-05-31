import express from "express";
import axios from "axios";
import config from "./config";
export const expressApp = express();

expressApp.get("/", async (request, response) => {
  const { code } = request.query;
  if (code) {
    try {
      const tokenResponseData = await axios(
        "https://discord.com/api/oauth2/token",
        {
          method: "POST",
          data: JSON.stringify({
            client_id: config.DISCORD_CLIENT_ID,
            client_secret: config.DISCORD_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: `http://localhost:${config.EXPRESS_PORT}`,
            scope: "messages.read bot identify dm_channels.read guilds",
          }),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const oauthData = tokenResponseData.data;
      console.log(oauthData);
    } catch (error) {
      console.error(error);
    }
  }

  return response.sendFile("index.html", { root: "." });
});
