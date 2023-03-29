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

References:

[Code Beautify](https://codebeautify.org/jsonviewer) helped me interpret the data that YouTube Music returns.

[sigma67/ytmusicapi](https://github.com/sigma67/ytmusicapi) is the original and canonical library for getting data.
ytmclient tries to mimic the API of this library as much as possible, with a few additions here and there.
If you want to add more functionality to this library, look to this repository to see how to do it.
