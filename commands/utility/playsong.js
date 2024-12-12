const { SlashCommandBuilder } = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  StreamType,
} = require("@discordjs/voice");
const play = require("play-dl");
const ytSearch = require("yt-search");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playsong")
    .setDescription("Plays the song requested")
    .addStringOption((option) =>
      option
        .setName("songtitle")
        .setDescription("The name of the song")
        .setRequired(true)
    ),

  async execute(interaction) {
    const songTitle = interaction.options.getString("songtitle");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply(
        "You need to be in a voice channel to execute this command!"
      );
    }

    if (
      !voiceChannel
        .permissionsFor(interaction.client.user)
        .has(
          PermissionsBitField.Flags.Connect | PermissionsBitField.Flags.Speak
        )
    ) {
      const errMsg =
        "I need permission to join and speak in your voice channel!";
      console.error(errMsg);
      return await interaction.reply(errMsg);
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false, // Ensure the bot is not deafened
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log("The bot has connected to the channel!");
    });

    connection.on("error", (error) => {
      console.error("Connection error:", error);
    });

    console.log("Joined voice channel:", voiceChannel.name);

    const player = createAudioPlayer();

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("Playback started");
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log("Playback finished");
      connection.destroy();
    });

    player.on("error", (error) => {
      console.error("Error playing audio:", error);
    });

    const videoFinder = async (query) => {
      const videoResult = await ytSearch(query);
      return videoResult.videos.length > 1 ? videoResult.videos[0] : null;
    };

    const video = await videoFinder(songTitle);

    if (video) {
      console.log("Found video:", video.url);

      try {
        const stream = await play.stream(video.url, {
          discordPlayerCompatibility: true, // Ensures compatibility with @discordjs/voice
          highWaterMark: 1 << 25, // Increase buffer size
        });

        console.log("Stream obtained:", stream);

        const resource = createAudioResource(stream.stream, {
          inputType: StreamType.WebmOpus,
        });

        player.play(resource);
        console.log("Audio resource created and player started");

        connection.subscribe(player);
        console.log("Player subscribed to connection");

        console.log("Playing:", video.title);
        await interaction.reply(`:thumbsup: Now Playing ***${video.title}***`);
      } catch (error) {
        console.error("Error fetching audio:", error);
        interaction.reply(
          "There was an error playing the video. Please try again later."
        );
      }
    } else {
      await interaction.reply("No video results found");
    }
  },
};
