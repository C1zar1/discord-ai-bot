require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ←← ВСТАВЬ СВОЙ SERVER ID ЗДЕСЬ 👇
const GUILD_ID = '1454456845556121772'; // ← ТВОЙ SERVER ID!

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} готов!`);
  
  const commands = [{
    name: 'request',
    description: '🤖 Спроси ИИ',
    options: [{
      name: 'вопрос',
      description: 'Твой вопрос ИИ',
      type: 3,
      required: true
    }]
  }];
  
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    // МОМЕНТАЛЬНО для ТВОЕГО сервера!
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID), 
      commands
    );
    console.log(`✅ /request готова на сервере ${GUILD_ID}!`);
  } catch (e) {
    console.error('Команды:', e);
  }
});

client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand() || i.commandName !== 'request') return;
  
  const вопрос = i.options.getString('вопрос');
  
  const thinking = new EmbedBuilder()
    .setTitle('🤖 Думаю...')
    .setDescription(`\`${вопрос}\``)
    .setColor('#0099ff');
    
  await i.deferReply({ embeds: [thinking] });
  
  try {
    const result = await model.generateContent(вопрос);
    const ответ = result.response.text();
    
    const done = new EmbedBuilder()
      .setTitle('🤖 ИИ ответил!')
      .setDescription(ответ.slice(0, 4000))
      .setColor('#00ff88')
      .setFooter({ text: 'Gemini 1.5 Flash • Бесплатно' });
    
    await i.editReply({ embeds: [done] });
  } catch (e) {
    const error = new EmbedBuilder()
      .setTitle('❌ Ошибка')
      .setDescription('ИИ не отвечает. Проверь GEMINI_API_KEY.')
      .setColor('#ff0000');
    await i.editReply({ embeds: [error] });
  }
});

client.login(process.env.DISCORD_TOKEN);
