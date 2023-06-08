import express from "express";
import axios from "axios";
import config from "./config";
export const expressApp = express();

expressApp.get("/", async (request, response) => {
  const { code } = request.query;
  if (code) {
    try {
      const tokenResponse = await axios(
        "https://discord.com/api/oauth2/token",
        {
          method: "POST",
          data: {
            client_id: config.DISCORD_CLIENT_ID,
            client_secret: config.DISCORD_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: `http://localhost:${config.EXPRESS_PORT}`,
            scope: "bot identify guilds application.commands",
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.json({ code, tokenResponseData: tokenResponse.data });
    } catch (error) {
      console.error(error);
      return response.json({ code, error: "no token response data" });
    }
  }

  return response.json({ code, error: "no code" });
});
