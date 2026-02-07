require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// ВСТАВЬ СВОЙ SERVER ID:
const GUILD_ID = '1454456845556121772'; // твой сервер

const commands = [
  new SlashCommandBuilder()
    .setName('request')
    .setDescription('Спросить ИИ')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Твой вопрос')
        .setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ Обновляю команды...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Команды зарегистрированы!');
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
  }
})();
