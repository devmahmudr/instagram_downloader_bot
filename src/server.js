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
  let videoId = ""


  const url = ctx.update.message.text;
  const isValidUrl = url.startsWith("https");
  if (!isValidUrl) {
    return ctx.reply("invalid url");
  }
  if (url.startsWith("https://www.instagram.com/")) {
    platform = "instagram";
    platformUrl = process.env.INSTAGRAM;
    apiHost = process.env.INSTAGRAM_HOST;
  } else if (url.startsWith("https://www.youtube.com/")) {
    platformUrl = process.env.YOUTUBE;
    apiHost = process.env.YOUTUBE_HOST;
    function getYouTubeVideoId(url) {
      const pattern =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(pattern);
      return match ? match[1] : null;
    }

     videoId = getYouTubeVideoId(url);
  }

  const options = {
    method: "GET",
    url: platformUrl,
    params: {
      url: url,
      id:videoId
    },
    headers: {
      "X-RapidAPI-Key": process.env.APIKEY,
      "X-RapidAPI-Host": apiHost,
    },
  };

  try {
    const response = await axios.request(options);
    let videourl;
    if (platform == "instagram") {
      videourl = response.data.video;
    } else {
      videourl = response.data.formats[1].url;
    }

    const videoFileName = `${Date.now()}.mp4`;

    const loadingvideo = await axios.get(videourl, { responseType: "stream" });
    const videoFile = fs.createWriteStream(path.join("public", videoFileName));

    loadingvideo.data.on("data", (chunk) => {
      videoFile.write(chunk);
    });

    loadingvideo.data.on("end", () => {
      videoFile.end();
    });

    loadingvideo.data.on("error", (err) => {
      console.error("Error downloading video:", err);
      ctx.reply("An error occurred while downloading the video.");
    });

    videoFile.on("finish", () => {
      ctx.replyWithVideo({ source: path.join("public", videoFileName) });
      setTimeout(() => {
        fs.unlink(path.join("public", videoFileName), (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          }
        });
      }, 3000);
    });
  } catch (error) {
    console.error("Error:", error);
    ctx.reply("An error occurred while processing your request.");
  }
});

bot.launch();
