const fs = require('node:fs');
const { Op } = require('sequelize');
const { Users, CurrencyShop } = require('./dbObjects.js');
const path = require('node:path');
const { Client, Intents, Collection, Events, ActivityType } = require('discord.js');
const { GatewayIntentBits } = require('discord-api-types/v9');
const { token } = require('./config.json');


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

async function addBalance(id, amount) {
	const user = currency.get(id);

	if (user) {
		user.balance += Number(amount);
		return user.save();
	}

	const newUser = await Users.create({ user_id: id, balance: amount });
	currency.set(id, newUser);

	return newUser;
}

function getBalance(id) {
	const user = currency.get(id);
	return user ? user.balance : 0;
}

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	// if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// ONLY CHAT COMMANDS
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'balance') {
		const target = interaction.options.getUser('user') ?? interaction.user;

		return interaction.reply(`${target.tag} has ${getBalance(target.id)}💰`);
	}
	else if (commandName === 'inventory') {
		const target = interaction.options.getUser('user') ?? interaction.user;
		const user = await Users.findOne({ where: { user_id: target.id } });
		const items = await user.getItems();
	
		if (!items.length) return interaction.reply(`${target.tag} has nothing!`);
	
		return interaction.reply(`${target.tag} currently has ${items.map(i => `${i.amount} ${i.item.name}`).join(', ')}`);}
		else if (commandName === 'transfer') {
			const currentAmount = getBalance(interaction.user.id);
			const transferAmount = interaction.options.getInteger('amount');
			const transferTarget = interaction.options.getUser('user');
		
			if (transferAmount > currentAmount) return interaction.reply(`Sorry ${interaction.user}, you only have ${currentAmount}.`);
			if (transferAmount <= 0) return interaction.reply(`Please enter an amount greater than zero, ${interaction.user}.`);
		
			addBalance(interaction.user.id, -transferAmount);
			addBalance(transferTarget.id, transferAmount);
		
			return interaction.reply(`Successfully transferred ${transferAmount}💰 to ${transferTarget.tag}. Your current balance is ${getBalance(interaction.user.id)}💰`);
		}
		else if (commandName === 'buy') {
			const itemName = interaction.options.getString('item');
			const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: itemName } } });
		
			if (!item) return interaction.reply(`That item doesn't exist.`);
			if (item.cost > getBalance(interaction.user.id)) {
				return interaction.reply(`You currently have ${getBalance(interaction.user.id)}, but the ${item.name} costs ${item.cost}!`);
			}
		
			const user = await Users.findOne({ where: { user_id: interaction.user.id } });
			addBalance(interaction.user.id, -item.cost);
			await user.addItem(item);
		
			return interaction.reply(`You've bought: ${item.name}.`);
		}
		else if (commandName === 'shop') {
			const items = await CurrencyShop.findAll();
			return interaction.reply(codeBlock(items.map(i => `${i.name}: ${i.cost}💰`).join('\n')));
		}
		else if (commandName === 'leaderboard') {
			return interaction.reply(
				codeBlock(
					currency.sort((a, b) => b.balance - a.balance)
						.filter(user => client.users.cache.has(user.user_id))
						.first(10)
						.map((user, position) => `(${position + 1}) ${(client.users.cache.get(user.user_id).tag)}: ${user.balance}💰`)
						.join('\n'),
				),
			);
		}
	});

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

    client.user.setActivity(' the SubAtomic Inc. Community needs!', { type: ActivityType.Listening });
});

client.once(Events.ClientReady, async () => {
	const storedBalances = await Users.findAll();
	storedBalances.forEach(b => currency.set(b.user_id, b));
});

// Log in to Discord with your client's token
client.login(token);
