require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');
const fetch = (await import('node-fetch')).default;

// ---------- НАСТРОЙКИ ----------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;   // токен бота
const CLIENT_ID = process.env.CLIENT_ID;           // Application ID
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;     // ключ от DeepSeek

console.log('DEBUG CLIENT_ID:', CLIENT_ID);
console.log('DEBUG DEEPSEEK_KEY prefix:', DEEPSEEK_KEY ? DEEPSEEK_KEY.slice(0, 8) : 'NO KEY');

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ---------- СЛЭШ-КОМАНДЫ ----------
const commands = [
  new SlashCommandBuilder()
    .setName('request')
    .setDescription('Спросить ИИ (DeepSeek)')
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
    console.error('❌ Ошибка регистрации команд:', error.rawError ?? error);
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
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: question }],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('❌ DeepSeek HTTP error:', res.status, txt);
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const text =
      data.choices?.[0]?.message?.content?.slice(0, 4000) ||
      'ИИ не вернул текста.';

    const embed = new EmbedBuilder()
      .setTitle('🤖 Ответ DeepSeek')
      .setDescription(text)
      .setColor(0x00ff88);

    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error('❌ DeepSeek error:', e);
    await interaction.editReply('❌ Ошибка при обращении к ИИ (DeepSeek).');
  }
});

client.login(DISCORD_TOKEN);
