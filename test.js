const tokens = require("./tokens.json");
const axios = require("axios");
const fs = require("fs");
const _ = require("lodash");
const textToPicture = require("text-to-picture");
const SpotifyWebApi = require("spotify-web-api-node");

const {
  top = 50,
  r: removeExisting = true,
  name: playlistName = "Best albums of 2019",
} = require("minimist")(process.argv.slice(2));

const clientId = "bf0a1f987e154a9ba81638e379e9ca15"; // Your client id
const clientSecret = "4e0abf1f3085472a9bc0d3c30cd0004d"; // Your secret
const redirectUri = "http://localhost:8888/callback"; // Your redirect uri

const sleep = () => new Promise(resolve => setTimeout(resolve, 100));

(async () => {
  try {
    // credentials are optional
    const spotifyApi = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri,
    });

    const { refresh_token, access_token } = tokens;

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    // Get the authenticated user
    const { body: me } = await spotifyApi.getMe();

    const {
      body: { items: playlists },
    } = await spotifyApi.getUserPlaylists();

    let playlist = playlists.find(({ name }) => name === playlistName);

    if (!playlist) {
      const { data } = await axios.post(
        `https://api.spotify.com/v1/users/${me.id}/playlists`,
        { name: playlistName },
        {
          headers: { Authorization: "Bearer " + access_token },
        }
      );

      playlist = data;
    }

    if (removeExisting) {
      let body = null;
      let tracks = [];

      while (!body || body.items.length === 100) {
        const res = await spotifyApi.getPlaylistTracks(playlist.id, {
          fields: "items",
          offset: tracks.length,
          limit: 100,
        });

        body = res.body;
        tracks = [...tracks, ...body.items];
      }

      console.log(`Removing ${tracks.length} tracks from playlist...`);

      const trackChunks = _.chunk(tracks, 100);

      for (let j = 0; j < trackChunks.length; j++) {
        const tracks = trackChunks[j].map(({ track: { uri } }) => ({ uri }));
        await spotifyApi.removeTracksFromPlaylist(playlist.id, tracks);
        await sleep();
      }
    }

    const albumList = fs
      .readFileSync("album-list.txt")
      .toString()
      .split("\n")
      .map(line => {
        const [sanitized] = line.replace(/\d+. /, "").split("(");
        const [artist, album] = sanitized.split(" - ").map(item => item.trim());
        return { artist, album };
      });

    // console.log("Generating playlist image...");

    // const imageBlob = await textToPicture.convert({
    //   text: playlistName,
    //   source: {
    //     width: 500,
    //     height: 500,
    //   },
    //   ext: "jpeg",
    // });

    // const imageUri = await imageBlob.getBase64();

    // // await spotifyApi.uploadCustomPlaylistCoverImage(
    // //   playlist.id,
    // //   imageUri,
    // // );

    // const { data } = await axios.put(
    //   `https://api.spotify.com/v1/playlists/${playlist.id}/images`,
    //   imageUri,
    //   {
    //     headers: { Authorization: "Bearer " + access_token, 'Content-Type': 'image/jpeg' },
    //   }
    // );

    console.log(`Adding top ${top} albums...`);

    for (let i = 0; i < albumList.length && i < top; i++) {
      const { artist: artistName, album: albumName } = albumList[i];

      const search = `album:${albumName} artist:${artistName}`;

      try {
        const {
          body,
          body: { albums },
        } = await spotifyApi.search(search, ["album"]);

        const [album] = await albums.items;

        if (!album) {
          console.log(`couldn't find album "${search}"`);
          continue;
        }

        const {
          body: { items: tracks },
        } = await spotifyApi.getAlbumTracks(album.id);

        await axios.post(
          `https://api.spotify.com/v1/playlists/${
            playlist.id
          }/tracks?uris=${tracks.map(({ uri }) => uri).join(",")}`,
          { name: "Best albums of 2019" },
          {
            headers: { Authorization: "Bearer " + access_token },
          }
        );

        // console.log(`done with "${albumName}"`);

        await sleep();
      } catch (e) {
        console.log(`error with "${albumName}"`);
        console.log(e);
      }
    }

    console.log("done");
  } catch (e) {
    console.error(e);
  }
})();
