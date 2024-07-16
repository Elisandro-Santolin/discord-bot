const { SlashCommandBuilder } = require('discord.js')

// comando valida bot online
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Response AI BOT!'),

    async execute(interaction) {
        await interaction.reply({content: 'Pong! 🏓', ephemeral: true})
    }
}