// src/config/shop.js

// Category examples:
//  - "color": mutually exclusive name color roles
//  - "badge": mutually exclusive badge roles
//  - "misc": standalone, not mutually exclusive with others
//
// You can add as many items as you want here.
export const ShopItems = [
  {
    id: "red_name",
    name: "❤️ Red Name",
    cost: 10000,
    description: "Gives you a red-colored name role.",
    category: "color",
    roleId: "1446302701087359148",
  },
  {
    id: "green_name",
    name: "💚 Green Name",
    cost: 10000,
    description: "Gives you a green-colored name role.",
    category: "color",
    roleId: "1447824845277630494",
  },
  {
    id: "blue_name",
    name: "💙 Blue Name",
    cost: 10000,
    description: "Gives you a blue-colored name role.",
    category: "color",
    roleId: "1447824814864597004",
  },
  {
    id: "gold_name",
    name: "⭐ Gold",
    cost: 50000,
    description: "Gives you a gold-colored name role.",
    category: "color",
    roleId: "1447825066598338601",
  },
  // Example of another category that *isn't* mutually exclusive with "color"
  {
    id: "high_roller",
    name: "⭐ High Roller",
    cost: 50000,
    description: "Gives you access to the high rollers channel.",
    category: "hr",
    roleId: "1447825528190009364",
  },
];

// Convenience helpers (optional)
export function getItemById(id) {
  return ShopItems.find((i) => i.id === id);
}

export function getItemsByCategory(category) {
  return ShopItems.filter((i) => i.category === category);
}
