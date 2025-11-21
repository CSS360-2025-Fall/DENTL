import { InteractionResponseType } from "discord-interactions";
import { getBalance } from "../economy/db.js";
import { validateAndLockBet } from "../economy/bets.js";

export async function execute(interaction) {
    const ctx = interaction.context;
    const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

    
}
