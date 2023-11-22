# ytmclient

A very basic YouTube Music API library.

If you were to look at npmjs.org, you would find a lot of libraries that are similiar. However, I could
not find one that was perfect for my use case, so I had fun tinkering around making a new one. Basically,
I encountered two problems with other libraries:

- I couldn't get them to work on platforms such as Netlify.
- They always wanted to return a complete list of playlists and tracks. While in general this
is desired, I wanted a way to give a progress bar to the client user, and being able to
fetch the data in chuncks allows me to do that.

This also gave me a chance to play with TypeScript which I haven't done much before.
I'm sure I did a lot wrong, but it's usable.

Usage:

Grab your cookie value from YouTube Music by using the Developer Console -> Network tab. 
Search for a request to the `browse` endpoint. Click on headers then scroll down until
you see the `Cookies:` string. It will be long. Just copy that and put it into the
`cookie` variable in the sample code below. You will also need to get your user number.
This is often "0" if you are signed in to only one Google account, but may be a higher
number if you are signed in to more than one Google account. To find your user number,
look for the `X-Goog-Authuser` header in the Developer Console.

```js
import { YtmClient } from "ytmclient";

async function run() {
        const cookie = "...insert cookie value here...";
        const user = "0"; // Change this to the value of the X-Goog-Authuser header in YouTube Music

        const videoId = "dUh1DSIsUOY";
     
        const ytma = new YtmClient(cookie, user);
        const song = await ytma.getSong(videoId);
        console.log(JSON.stringify(song, null, 2));
}

run();
```

Note, you technically only need the `__Secure-3PSID` and `__Secure-3PAPISI` cookie values, but it is 
safe to paste the entire string into the `cookie` variable.

References:

[Code Beautify](https://codebeautify.org/jsonviewer) helped me interpret the data that YouTube Music returns.

[sigma67/ytmusicapi](https://github.com/sigma67/ytmusicapi) is the original and canonical library for getting data.
ytmclient tries to mimic the API of this library as much as possible, with a few additions here and there.
If you want to add more functionality to this library, look to this repository to see how to do it.
