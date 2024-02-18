import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import axios from "axios";
import "dotenv/config";
import fs from "fs";
import path from "path";

const bot = new Telegraf(process.env.TOKEN);


bot.command("help", (ctx) => {
  ctx.reply("how can i help you");
});

bot.start((ctx) => {
  ctx.reply("welcome");
});

bot.on(message("text"), async (ctx) => {

  const url = ctx.update.message.text;
  const isValidUrl = url.startsWith("https://www.instagram.com/");
  if (!isValidUrl) {
    return ctx.reply("invalid url");
  }
  
  const options = {
    method: "GET",
    url: "https://instagram-media-downloader.p.rapidapi.com/rapid/post.php",
    params: {
      url: url,
    },
    headers: {
      "X-RapidAPI-Key": "5c845e0afbmshad04efb05f4cf5ep161576jsnfd86e565db9a",
      "X-RapidAPI-Host": "instagram-media-downloader.p.rapidapi.com",
    },
  };
  try {
    const response = await axios.request(options);
    const videourl = response.data.video;

    const loadingvideo = await axios.get(videourl, { responseType: "stream" });
    const videoFileName = `${Date.now()}.mp4`;

    const videoFile = fs.createWriteStream(path.join("public", videoFileName));
    loadingvideo.data.pipe(videoFile);

    videoFile.on("finish", () => {
      ctx.replyWithVideo({ source: path.join("public", videoFileName) });
      setTimeout(() => {
        fs.unlink(path.join("public", videoFileName), (err) => {
          if (err) {
            throw new err();
          }
        });
      }, 3000);
    });
  } catch (error) {
    console.error(error);
  }
});

bot.launch();
