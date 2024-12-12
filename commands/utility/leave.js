const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Description for leave"),
  async execute(interaction) {
    await interaction.reply("Command leave executed!");
  },
};
