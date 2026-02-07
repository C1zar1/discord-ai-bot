require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const commands = [
  new SlashCommandBuilder()
    .setName('request')
    .setDescription('Спросить ИИ')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Твой вопрос')
        .setRequired(true),
    ),
].map(c => c.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('⏳ Регистрирую ГЛОБАЛЬНЫЕ команды...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Глобальные команды зарегистрированы!');
  } catch (error) {
    console.error('❌ Ошибка регистрации команд:', error.rawError ?? error);
  }
}

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} запущен!`);
  await registerCommands();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'request') return;

  const question = interaction.options.getString('question');
  await interaction.deferReply();

  try {
    const result = await model.generateContent(question);
    const text = result.response.text().slice(0, 4000);

    const embed = new EmbedBuilder()
      .setTitle('🤖 Ответ ИИ')
      .setDescription(text)
      .setColor(0x00ff88);

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error('❌ Ошибка Gemini:', err);
    await interaction.editReply('❌ Ошибка при обращении к ИИ.');
  }
});

client.login(process.env.DISCORD_TOKEN);
