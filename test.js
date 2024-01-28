// Usage: bun test.js
//
// Set cookie value to Cookie value on YouTube Music web page, either the browse or next endpoint
// You can also set it to an OAuth token

import { YtmClient } from "./index";

async function run() {
    const cookie = "...insert cookie value here...";
    const user = "0"; // Change this to the value of the X-Goog-Authuser header in YouTube Music

    const videoId = "dUh1DSIsUOY";

    const ytma = new YtmClient(cookie, user);
    try {
      const playlist = await ytma.getPlaylist("LM");
      console.log(JSON.stringify(playlist, null, 2));
    } catch (e) {
      console.error(e);
    }
}

run();
