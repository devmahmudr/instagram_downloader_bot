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
  let platformUrl = "";
  let apiHost = "";
  let platform = "";

  const url = ctx.update.message.text;
  const isValidUrl = url.startsWith("https");
  if (!isValidUrl) {
    return ctx.reply("invalid url");
  }
  if (url.startsWith("https://www.instagram.com/")) {
    platform = "instagram";
    platformUrl = process.env.INSTAGRAM;
    apiHost = process.env.INSTAGRAM_HOST;
  } else if (url.startsWith("https://www.tiktok.com/")) {
    platformUrl = process.env.TIKTOK;
    apiHost = process.env.TIKTOK_HOST;
  }

  const options = {
    method: "GET",
    url: platformUrl,
    params: {
      url: url,
      hd: '1'
    },
    headers: {
      "X-RapidAPI-Key": "5c845e0afbmshad04efb05f4cf5ep161576jsnfd86e565db9a",
      "X-RapidAPI-Host": apiHost,
    },
  };
  try {
    const response = await axios.request(options);
    let videourl;
    if (platform == "instagram") {
      videourl = response.data.video;
    } else {
      videourl = response.data.play
    }
    console.log(videourl);

    const loadingvideo = await axios.get(videourl, { responseType: "stream" });
    const videoFileName = `${Date.now()}.mp4`;

    const videoFile = fs.createWriteStream(path.join("public", videoFileName));
    loadingvideo.data.pipe(videoFile);

    videoFile.on("finish", () => {
      ctx.replyWithVideo({ source: path.join("public", videoFileName) });
      setTimeout(() => {
        apiHost = "";
        platformUrl = "";
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
