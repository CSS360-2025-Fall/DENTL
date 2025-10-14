export const name = "interactionCreate";
export const once = false;

export async function execute(interaction, client) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`No command module for /${interaction.commandName}`);
    return;
  }
  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    const msg = "❌ Something went wrong.";
    if (interaction.deferred || interaction.replied)
      await interaction.followUp({ content: msg, ephemeral: true });
    else await interaction.reply({ content: msg, ephemeral: true });
  }
}
