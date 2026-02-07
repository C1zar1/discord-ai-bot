require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

// ---------- НАСТРОЙКИ ----------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CLIENT_ID = process.env.CLIENT_ID; // Application ID из Dev Portal

console.log('DEBUG CLIENT_ID:', CLIENT_ID);
console.log('DEBUG GEMINI_API_KEY prefix:', GEMINI_API_KEY ? GEMINI_API_KEY.slice(0, 10) : 'NO KEY');

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ---------- СЛЭШ-КОМАНДЫ ----------
const commands = [
  new SlashCommandBuilder()
    .setName('request')
    .setDescription('Спросить ИИ Gemini')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Твой вопрос')
        .setRequired(true),
    ),
].map(c => c.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  try {
    console.log('⏳ Регистрирую ГЛОБАЛЬНЫЕ команды...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Глобальные команды зарегистрированы!');
  } catch (error) {
    console.error('❌ Ошибка регистрации команд:');
    console.error(error.rawError ?? error);
  }
}

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} запущен!`);
  await registerCommands();
});

// ---------- ОБРАБОТКА /request ----------
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'request') return;

  const question = interaction.options.getString('question');
  console.log('⚡ /request:', question);

  await interaction.deferReply();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // актуальная лёгкая модель
      contents: [
        {
          role: 'user',
          parts: [{ text: question }],
        },
      ],
    });

    const text = response.text || 'ИИ не вернул текст.';

    const embed = new EmbedBuilder()
      .setTitle('🤖 Ответ ИИ')
      .setDescription(text.slice(0, 4000))
      .setColor(0x00ff88);

    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error('❌ Gemini error NAME:', e.name);
    console.error('❌ Gemini error MESSAGE:', e.message);
    console.error('❌ Gemini error STATUS:', e.status);
    console.error('❌ Gemini error FULL:', e);

    await interaction.editReply('❌ Ошибка при обращении к ИИ. Проверь GEMINI_API_KEY или лимиты.');
  }
});

client.login(DISCORD_TOKEN);
