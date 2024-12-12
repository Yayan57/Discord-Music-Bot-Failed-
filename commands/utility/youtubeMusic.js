const { SlashCommandBuilder } = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const axios = require("axios");

// Dictionary of encoded symbols and their replacements
const symbolMap = {
  "\\\\x27": "'",
  "\\\\x22": '"',
  "\\\\\\\\u0026": "&",
  "\\x5b": "[",
  "\\x5d": "]",
  "\\\\": "\\",
  "\\x7b": "{",
  "\\x7d": "}",
  "\\/": "/",
  "\\\\x5bClean\\\\x5d": "",
};

// Function to replace encoded symbols in text
function replaceSymbols(text) {
  let result = text;
  for (const [encoded, decoded] of Object.entries(symbolMap)) {
    const regex = new RegExp(encoded, "g");
    result = result.replace(regex, decoded);
  }
  return result;
}

// Function to fetch URL
async function getURL(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching url:", error);
  }
}

// Function to shuffle songs
function shuffleSongs(songs) {
  const shuffledSongs = shuffleArray(Object.entries(songs)).map(
    ([title, artist]) => `${title} - ${artist}`
  );
  return shuffledSongs;
}

// Function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to fetch YouTube playlist data
async function fetchYouTubePlaylist(url) {
  try {
    const html = await getURL(url);
    if (!html) {
      throw new Error("Invalid HTML content received");
    }
    const titlePattern = /\\x7b\\x22label\\x22:\\x22Play/g;
    const titles = html.split(titlePattern).slice(1);
    const songs = {};
    let playlistTitle = "";
    titles.forEach((title, index) => {
      const parts = title.split("-");
      if (parts.length >= 2) {
        let songTitle = replaceSymbols(
          parts[0].replace(/\\x22\\x7d\\x7d,.*/, "").trim()
        );
        let artistName = replaceSymbols(
          parts[1].replace(/\\x22\\x7d\\x7d,.*/, "").trim()
        );
        if (index === titles.length - 1) {
          playlistTitle = songTitle;
        } else {
          songs[songTitle] = artistName;
        }
      }
    });
    return { playlistTitle, songs };
  } catch (error) {
    console.error("Error fetching playlist data:", error);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ytplaylist")
    .setDescription("Fetch a YouTube Music playlist by URL")
    .addStringOption((option) =>
      option
        .setName("playlisturl")
        .setDescription("The URL of the YouTube Playlist")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("shuffleplaylist")
        .setDescription("If you want to shuffle the playlist")
        .setRequired(false)
    ),

  async execute(interaction) {
    const playlistURL = interaction.options.getString("playlisturl");
    const shuffle = interaction.options.getBoolean("shuffleplaylist") || false;
    const channel = interaction.channel;

    if (
      !channel
        .permissionsFor(interaction.client.user)
        .has(PermissionsBitField.Flags.SendMessages)
    ) {
      const errMsg = "I need permission to send messages in this channel!";
      console.error(errMsg);
      return await interaction.reply(errMsg);
    }

    try {
      const { playlistTitle, songs } = await fetchYouTubePlaylist(playlistURL);
      if (!songs || Object.keys(songs).length === 0) {
        return interaction.reply("No songs found in the playlist.");
      }

      if (shuffle) {
        const shuffledSongs = shuffleSongs(songs);
        console.log("Shuffled Songs:", shuffledSongs);
        await interaction.reply(`Playlist name: ${playlistTitle} (Shuffled)`);
      } else {
        console.log("Songs:", songs);
        await interaction.reply(`Playlist name: ${playlistTitle}`);
      }

      console.debug("Reply sent");

      // Implement logic to play songs in the voice channel
      // ...
    } catch (error) {
      console.error("Error occurred:", error);
      await interaction.reply("Failed to fetch playlist data.");
    }
  },
};
