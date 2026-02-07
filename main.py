import os
import discord
from discord import app_commands
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)

intents = discord.Intents.default()
client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)

GUILD_ID = discord.Object(id=1454456845556121772)  # твой сервер ID


@client.event
async def on_ready():
    print(f"✅ {client.user} запущен")
    # синхронизация слэш-команд только для одного сервера (быстро)
    await tree.sync(guild=GUILD_ID)
    print("✅ /request синхронизирована")


@tree.command(name="request", description="Спросить ИИ", guild=GUILD_ID)
@app_commands.describe(question="Твой вопрос")
async def request(interaction: discord.Interaction, question: str):
    await interaction.response.defer(thinking=True)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        res = model.generate_content(question)
        text = res.text[:1900]

        await interaction.followup.send(f"🤖 **Ответ ИИ:**\n```{text}```")
    except Exception as e:
        print("AI error:", e)
        await interaction.followup.send("❌ Ошибка при обращении к ИИ.")


client.run(DISCORD_TOKEN)
