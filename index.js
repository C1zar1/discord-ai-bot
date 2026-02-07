require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');
const { GoogleGenAI } = require('@google/genai'); // новый SDK

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Инициализация Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// СЛЭШ-КОМАНДЫ (глобально, уже работают у тебя)
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
    console.log('⏳ Регистрирую глобальные команды...');
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // актуальная модель [web:110][web:121]
      contents: question,
    });

    const text = response.text || 'ИИ не вернул текст.';

    const embed = new EmbedBuilder()
      .setTitle('🤖 Ответ ИИ')
      .setDescription(text.slice(0, 4000))
      .setColor(0x00ff88);

    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error('❌ Gemini error name:', e.name);
    console.error('❌ Gemini error message:', e.message);
    console.error('❌ Gemini error status:', e.status);
    await interaction.editReply('❌ Ошибка при обращении к ИИ. Проверь GEMINI_API_KEY или лимиты.');
  }
});

client.login(process.env.DISCORD_TOKEN);
