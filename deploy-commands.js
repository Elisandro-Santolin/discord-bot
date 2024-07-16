const { REST, Routes } = require('discord.js');


// import variaveis ambiente dotenv
const dotenv = require('dotenv')
dotenv.config()
const { TOKEN } = process.env
const { CLIENT_ID } = process.env
const { GUILD_ID } = process.env

const fs = require('node:fs');
const path = require('node:path');

// caminho comandos (./commands)
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// inicializa array vazio
const commands = []

// percorre o array e faz push em caso de algum novo comando 
for (const file of commandFiles) { 
   const command = require(`./commands/${file}`)
   commands.push(command.data.toJSON());
}

// inicializa modulo REST
const rest = new REST({version: '10'}).setToken(TOKEN);

// atualiza de forma assinc os comandos no serviço discord
(async () => {
    try {
        console.log(`Atualizando ${commands.length} comandos...`);
    
// PUT para a API do discord para atualizar os comandos
        const data = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            {body: commands}
        )
            console.log('Novos comandos foram registrados.');
    }
    catch (error){
        console.error(error);
    }
})();