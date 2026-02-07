require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} готов!`);
  
  const commands = [{
    name: 'request',
    description: '🤖 Спроси ИИ',
    options: [{
      name: 'вопрос',
      description: 'Твой вопрос',
      type: 3,
      required: true
    }]
  }];
  
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), commands);
    console.log('✅ /request готова!');
  } catch (e) { console.error(e); }
});

client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand() || i.commandName !== 'request') return;
  
  const вопрос = i.options.getString('вопрос');
  await i.deferReply();
  
  try {
    const result = await model.generateContent(вопрос);
    const ответ = result.response.text();
    
    const embed = new EmbedBuilder()
      .setTitle('🤖 ИИ ответил')
      .setDescription(ответ.slice(0, 4000))
      .setColor('#00ff00');
    
    await i.editReply({ embeds: [embed] });
  } catch (e) {
    await i.editReply('❌ Ошибка ИИ');
    console.error(e);
  }
});

client.login(process.env.DISCORD_TOKEN);
