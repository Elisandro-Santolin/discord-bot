const { Client, Events, GatewayIntentBits, Collection, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ButtonStyle, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputAssertions, TextInputStyle, InteractionType} = require('discord.js')
const axios = require('axios');

// import variaveis ambiente dotenv
const dotenv = require('dotenv')
dotenv.config()
const { TOKEN } = process.env
const { JIRA_PROJECT_KEY } = process.env
const { JIRA_URL } = process.env
const { JIRA_USER_EMAIL } = process.env
const { JIRA_API_TOKEN } = process.env

// import commands
const fs = require('node:fs')
const path = require('node:path');
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

// client define tipo interacoes discord
const client = new Client({intents: 
    [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,

    ]
});

// client guarda colecao comandos 
client.commands = new Collection()

// loop valida novos comandos
for (const file of commandFiles){
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
    } else  {
        console.log(`Esse comando em ${filePath} está com 'data' ou 'execute ausentes'`)
    } 
}

// login bot
client.once(Events.ClientReady, client => {
	console.log(`Login realizado como ${client.user.tag}`)
});
client.login(TOKEN)

client.on(Events.InteractionCreate, async interaction =>{
    if (interaction.isStringSelectMenu()){
        const selectHelp = interaction.values[0]
        if (selectHelp === 'Comando create'){
        await interaction.reply({content: '📝 Documentação Create: https://armariosinteligentes.atlassian.net/wiki/spaces/SAI/pages/469598217/AI+BOT+Comando+card', ephemeral: true});
        }else if (selectHelp === 'Comando status'){
        await interaction.reply({content: '📊 Documentação Status: https://armariosinteligentes.atlassian.net/wiki/spaces/SAI/pages/470843399/AI+BOT+Comando+card+-+status', ephemeral: true});
        }

    }
    // valida os comandos encaminhados executando se encontrados
    if (!interaction.isChatInputCommand()) return
    const command = interaction.client.commands.get(interaction.commandName)
    if (!command) {
        console.error('Comando não localizado.');
        return
    }
    try {
        await command.execute(interaction)
    } 
    catch (error) {
        console.error(error)
        await interaction.reply('Houve um erro ao executar esse comando.');
    }
})

// listener interacoes com o bot /help
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isStringSelectMenu()) {
        const selectCard = interaction.values[0];
        if (selectCard === 'Create') {
            // estrutura modal create
            const modalCreate = new ModalBuilder()
                .setCustomId('createCardModal')
                .setTitle('Criar novo card');

            const summaryInput = new TextInputBuilder()
                .setCustomId('summaryInput')
                .setLabel('📋 Por favor, insira o resumo do card:')
                .setStyle(TextInputStyle.Short);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('descriptionInput')
                .setLabel('📋 Por favor, insira a descrição do card:')
                .setStyle(TextInputStyle.Paragraph);

            const summaryActionRow = new ActionRowBuilder().addComponents(summaryInput);
            const descriptionActionRow = new ActionRowBuilder().addComponents(descriptionInput);

            modalCreate.addComponents(summaryActionRow, descriptionActionRow);

            await interaction.showModal(modalCreate);

            const collectorModalCreate = interaction.channel.createMessageComponentCollector({
            filter: interactionModalCreate => interactionModalCreate.customId === 'createCardModal' && interactionModalCreate.user.id === interaction.user.id, time: 30000 });

            // encerra caso demora na entrada
            collectorModalCreate.on('end', collected => {
                if (collected.size === 0) {
                   interaction.followUp({ content: '🗳 O processo solicitado foi concluído com sucesso e a interação foi encerrada.', ephemeral: true });
                }
            });

        } else if (selectCard === 'Status') {
            // estrutural modal para RSUP
            const modalStatus = new ModalBuilder()
                .setCustomId('statusCardModal')
                .setTitle('Consultar Status do RSUP');

            const rsupInput = new TextInputBuilder()
                .setCustomId('rsupInput')
                .setLabel('📝 Por favor, insira o número RSUP:')
                .setStyle(TextInputStyle.Short);

            const rsupActionRow = new ActionRowBuilder().addComponents(rsupInput);

            modalStatus.addComponents(rsupActionRow);

            await interaction.showModal(modalStatus);

            const collectorModalStatus = interaction.channel.createMessageComponentCollector({
            filter: interactionModalStatus => interactionModalStatus.customId === 'statusCardModal' && interactionModalStatus.user.id === interaction.user.id, time: 30000 });

            // encerra caso demora na entrada
            collectorModalStatus.on('end', async (collected) => {
                try {
                    if (collected.size === 0) {
                        if (interaction && interaction.followUp) {
                            await interaction.followUp({
                                content: '🗳 O processo solicitado foi concluído com sucesso e a interação foi encerrada.', ephemeral: true });
                            console.log('Mensagem de acompanhamento enviada com sucesso.');
                        } else {
                            console.error('Interação ou método followUp não encontrado.');
                        }
                    } else {
                        console.log(`O coletor terminou com ${collected.size} itens coletados.`);
                    }
                } catch (error) {
                    console.error('Erro evento de término:', error);
                }
            });
        }
    }

     // interacao modal criar RSUP
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'createCardModal') {
        const summary = interaction.fields.getTextInputValue('summaryInput');
        const description = interaction.fields.getTextInputValue('descriptionInput');

        // cria dropdown prioridade
        const prioritySelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('selectPriority')
                    .setPlaceholder('❌ Nenhuma opção válida selecionada')
                    .addOptions([
                        { label: 'Highest', description: '📕 Tarefa de alta criticidade, será verificada imediatamente.', value: 'Highest' },
                        { label: 'High', description: '📙 Tarefa terá seu encerramento em até 24 horas.', value: 'High' },
                        { label: 'Medium', description: ' 📘Tarefa terá seu encerramento em até 48 horas.', value: 'Medium' },
                        { label: 'Low', description: '📗 Tarefa com pouca prioridade, será avalidado em até 3 dias.', value: 'Low' },
                        { label: 'Lowest', description: '📚 Tarefa ou sugestão de melhoria sem prioridade, será avaliado em até 7 dias.', value: 'Lowest' }
                    ])
            );

        // cria dropdown solicitante
        const requesterSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('selectRequester')
                    .setPlaceholder('❌ Nenhuma opção válida selecionada')
                    .addOptions([
                        { label: 'name', value: 'value' },
                        { label: 'name1', value: 'value1' },
			{ label: 'name2', value: 'value2' },
                    ])
            );

        // cria botoes confirmar/cancelar
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm')
                    .setLabel('Confirmar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Danger)
            );

        // espera entrada usuario prioridade/solcitante
        await interaction.reply({ content: '📍 Por favor, selecione a prioridade e o solicitante do card:', components: [prioritySelectMenu, requesterSelectMenu, actionRow], ephemeral: true });

        const collectorFilter = interactionUser => interactionUser.user.id === interaction.user.id;
        const componentCollector = interaction.channel.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 30000 });

        // variavel guarda prioridade/solicitante
        let priority, requester;

        // condicional valida preenchimento prioridade/solicitante atualiza as informacoes
        componentCollector.on('collect', async (collected) => {
            try {
                if (collected.customId === 'selectPriority') {
                    if (collected.values && collected.values.length > 0) {
                        priority = collected.values[0];
                        await collected.deferUpdate();
                        console.log(`Prioridade selecionada: ${priority}`);
                    } else {
                        console.error('Nenhum valor de prioridade selecionado.');
                    }
                } else if (collected.customId === 'selectRequester') {
                    if (collected.values && collected.values.length > 0) {
                        requester = collected.values[0];
                        await collected.deferUpdate();
                        console.log(`Solicitante selecionado: ${requester}`);
                    } else {
                        console.error('Nenhum valor selecionado para o solicitante.');
                    }
                }
            } catch (error) {
                console.error('Erro ao processar a seleção de prioridade ou solicitante:', error);
            }
        });

        // encerra caso demora na entrada prioridade/solicitante
        componentCollector.on('end', async (collected) => {
            try {
                // verifica collector sem coletar 
                if (collected.size === 0) {
                    // verifica interacao/metodo followUp existe
                    if (interaction && interaction.followUp) {
                        await interaction.followUp({ content: '🗳 O processo solicitado foi concluído com sucesso e a interação foi encerrada.', ephemeral: true });
                        console.log('Mensagem de acompanhamento enviada com sucesso.');
                    } else {
                        console.error('Interação ou método followUp não encontrado.');
                    }
                } else {
                    console.log(`O coletor terminou com ${collected.size} itens coletados. [${new Date().toISOString()}]`);
                }
            } catch (error) {
                console.error('Erro ao lidar com o evento de término:', error);
            }
        });

        const buttonCollector = interaction.channel.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.Button, time: 30000 });

        // variavel valida criada card 
        let issueCreated = false;

         // condicional interacao botao confirmar
        buttonCollector.on('collect', async buttonInteraction => {
            if (buttonInteraction.customId === 'confirm') {
                if (priority && requester) {
                    const issueData = {
                        fields: {
                            project: {
                                key: JIRA_PROJECT_KEY
                            },
                            summary: summary,
                            description: description,
                            priority: {
                                name: priority
                            },
                            issuetype: {
                                name: 'Task'
                            },
                            customfield_10091: {
                                value: requester
                            }
                        }
                    };
                    // metodo POST RSUP
                    axios.post(`${JIRA_URL}/rest/api/2/issue`, issueData, {
                        auth: {
                            username: JIRA_USER_EMAIL,
                            password: JIRA_API_TOKEN
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    // retorno sucesso
                    .then(response => {
                        issueCreated = true;
                        buttonCollector.stop(); // encerra interacao botao
                        return buttonInteraction.reply({ content: `✅ Card criado com sucesso: ${response.data.key}`, ephemeral: true });
                    })
                    // retorno erro
                    .catch(error => {
                        return buttonInteraction.reply({ content: `⛔ Erro ao criar card: ${error.message}`, ephemeral: true });
                    });
                } else {
                    await buttonInteraction.reply({ content: '📍 Por favor, selecione a prioridade e o solicitante antes de confirmar.', ephemeral: true });
                }
            } else if (buttonInteraction.customId === 'cancel') {
                await buttonInteraction.reply({ content: '❎ A criação do card foi cancelada.', ephemeral: true });
                buttonCollector.stop(); // encerra interacao botao
            }
        });
        
        // condicional interacao botao cancelar
        buttonCollector.on('end', async (collected) => {
            try {
                if (!issueCreated && collected.size === 0) {
                    if (interaction && interaction.followUp) {
                        await interaction.followUp({ content: '🗳 O processo solicitado foi concluído com sucesso e a interação foi encerrada.',ephemeral: true });
                        console.log('Mensagem de acompanhamento enviada com sucesso.');
                    } else {
                        console.error('Interação ou método followUp não encontrado.');
                    }
                } else if (collected.size > 0) {
                    console.log(`O coletor terminou com ${collected.size} itens coletados. Issue criada: ${issueCreated}. [${new Date().toISOString()}] `);
                } else {
                    console.log('Issue já criada antes do término do coletor.');
                }
            } catch (error) {
                console.error('Erro ao lidar com o evento de término:', error);
            }
        });
    }
    // interacao modal buscar status RSUP
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'statusCardModal') {
        const issueKey = interaction.fields.getTextInputValue('rsupInput');
    
        axios.get(`${JIRA_URL}/rest/api/2/issue/RSUP-${issueKey}`, {
            auth: {
                username: JIRA_USER_EMAIL,
                password: JIRA_API_TOKEN
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        // retorno sucesso
        .then(response => {
            // variavel aguarda informacoes RSUP metodo GET
            const issueData = response.data;
            const statusIssue = issueData.fields.status.name;
            const summaryIssue = issueData.fields.summary;
            const descriptionIssue = issueData.fields.description;
            const priorityIssue = issueData.fields.priority.name;
            const assigneeIssue = issueData.fields.assignee ? issueData.fields.assignee.displayName : 'Não atribuído'; // condicional ternario validando responsavel vinculado issue
            const requesterIssue = issueData.fields.customfield_10091 && issueData.fields.customfield_10091.value ? issueData.fields.customfield_10091.value : 'Não definido'; // condicional ternario validando solicitante vinculado issue
                            
        
            return interaction.reply({ content: `Resumo: ${summaryIssue}\nSolicitante: ${requesterIssue}\nPrioridade: ${priorityIssue}\nResponsável: ${assigneeIssue}\nDescrição: ${descriptionIssue}\nStatus: ${statusIssue}`, ephemeral: true });
        })
        .catch(error => {
            let errorMessage = 'Ocorreu um erro desconhecido. Por favor, tente novamente mais tarde.';
            if (error.response) {
                // erros especificos da API 
                switch (error.response.status) {
                    case 404:
                        errorMessage = 'Issue não encontrada. Por favor, verifique o RSUP informado.';
                        break;
                    case 401:
                    case 403:
                        errorMessage = 'Não autorizado para acessar este recurso. Por favor, verifique suas permissões.';
                        break;
                    default:
                        errorMessage = `Erro ao buscar a issue: ${error.response.status} ${error.response.statusText}`;
                }
            } else if (error.request) {
                errorMessage = 'Erro ao enviar a requisição para o servidor. Por favor, verifique sua conexão de rede.';
            } else {
                errorMessage = error.message;
            }
        
            console.error('Erro:', errorMessage);
            return interaction.reply({ content: `⛔ ${errorMessage}`, ephemeral: true })
            .catch(replyError => {
                console.error('Erro ao responder a interação:', replyError.message);
            });
        })
    }
})
