const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, Component } = require('discord.js')

// cria dropdown de interacao (/help)
const doubt = new ActionRowBuilder()
    .addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select')
            .setPlaceholder('❌ Nenhuma opção válida selecionada')
            .addOptions({
                    label: 'Comando Create',
                    description: '📝 Como criar cards para o Setor de Desenvolvimento',
                    value: 'Comando create'
                },
                {
                    label: 'Comando Status',
                    description: '📊 Como acompanhar cards criados para o Setor de Desenvolvimento.',
                    value: 'Comando status'
                }
            )
    )

// cria e exporta do commando (/help)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Selecione essa opção para obter ajuda e esclarecer dúvidas.'),

    async execute(interaction) {
        await interaction.reply({content: 'Selecione uma das opções abaixo:', ephemeral: true, components: [doubt]})
    }
}