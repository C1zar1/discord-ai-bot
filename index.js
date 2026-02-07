require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, Events } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

client.once(Events.ClientReady, () => {
  console.log(`✅ ${client.user.tag} запущен!`);
});

client.on(Events.InteractionCreate, async interaction => {
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
    console.error(err);
    await interaction.editReply('❌ Ошибка при обращении к ИИ.');
  }
});

client.login(process.env.DISCORD_TOKEN);
