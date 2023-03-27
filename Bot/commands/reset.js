const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription('Stops and shutsdown the bot.'),
	async execute(interaction) {
		await interaction.reply('Shutting down. Goodnight.');
        if (interaction.user.id === 'ADD YOUR OWN USER ID') {
			console.log('Process Terminated.')
            process.exit();
        }
	},
};
