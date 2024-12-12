const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("aeplaylist")
    .setDescription("Description for aeplaylist"),
  async execute(interaction) {
    await interaction.reply("Command aeplaylist executed!");
  },
};
