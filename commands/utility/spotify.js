const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sypalylist")
    .setDescription("Description for sypalylist"),
  async execute(interaction) {
    await interaction.reply("Command sypalylist executed!");
  },
};
