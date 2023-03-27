const { SlashCommandBuilder } = require('discord.js');
// at the top of your file
const { EmbedBuilder } = require('discord.js');

// inside a command, event listener, etc.
const helpEmbed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle('')
	.setURL('')
	.setAuthor({ name: '', iconURL: '', url: '' })
	.setDescription('')
	.setThumbnail('')
	.addFields(
		{ name: '', value: '' },
		{ name: '\u200B', value: '\u200B' },
		{ name: '', value: '', inline: true },
		{ name: '', inline: true },
	)
	.addFields({ name: '', value: '', inline: true })
	.setImage('')
	.setTimestamp()
	.setFooter({ text: '', iconURL: '' });

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Direct Messages whoever sends this command!'),
	async execute(interaction) {
		await interaction.user.send({embeds: [helpEmbed]})
		interaction.reply('I have sent a DM containing information to you!')
	},
};
