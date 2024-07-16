const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, Component } = require('discord.js')

// cria dropdown de interacao (/card)
const issue = new ActionRowBuilder()
    .addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select')
            .setPlaceholder('❌ Nenhuma opção válida selecionada')
            .addOptions({
                    label: 'Create',
                    description: '📝 Crie um novo card de tarefa no Jira.',
                    value: 'Create'
                },
                {
                    label: 'Status',
                    description: '📊 Verifique o andamento de um card no Jira.',
                    value: 'Status'
                }
            )
    )

// cria e exporta o commando (/card)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('card')
        .setDescription('Use este comando para criar um novo card ou verificar o andamento de um card no Jira.'),

    async execute(interaction) {
        await interaction.reply({content: 'Selecione uma das opções abaixo:', ephemeral: true, components: [issue] })

    }
}