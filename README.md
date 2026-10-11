# Frozen Dice - Constitution Save Button

A Foundry VTT module that adds a button to roll Constitution saving throws for all player characters at once.

## Features

- **Scene Control Button**: Adds a button to the Scene Controls toolbar
- **Configurable DC**: Set the default saving throw DC in module settings
- **Multi-System Support**: Works with D&D5e, Pathfinder 2e, and other systems
- **GM Only**: Button is only usable by the Game Master
- **Keyboard Shortcut**: Optional Ctrl+Shift+C keybind
- **Chat Integration**: Results appear in chat with success/failure indicators

## Installation

### Manual Installation

1. Download or clone this repository
2. Create a folder named `frozen-dice` in your Foundry VTT `Data/modules/` directory
3. Copy the files into this folder:
   - `module.json`
   - `frozen-dice.js`
4. Start or restart Foundry VTT
5. Enable the "Frozen Dice" module in the Module Management menu

### Via Module Manager

1. Open Foundry VTT
2. Go to **Module Manager**
3. Click **Install Module**
4. Enter the manifest URL: `https://raw.githubusercontent.com/tobias/frozen-dice/main/module.json`
5. Click **Install**
6. Enable the module

## Configuration

After enabling the module, go to **Module Settings** and configure:

- **Default Constitution Save DC**: The DC to use for saves (default: 15)
- **Show Button to Players**: If enabled, all players see the button (only GM can use it)
- **Include NPCs**: Also roll saves for NPCs owned by the GM

## Usage

### Button Method

1. Look for the **Con Save All** button in the Scene Controls (shield icon with virus symbol)
2. Click the button
3. All player characters will automatically roll Constitution saves
4. Results appear in chat with green (success) or red (failure) indicators

### Keyboard Shortcut

Press **Ctrl+Shift+C** to quickly roll Con saves for all characters.

## Customization

### Changing the DC Programmatically

You can override the DC for specific rolls by modifying the `rollConSaveForAllCharacters` function or using the settings API:

```javascript
// Set DC to 20 for the next roll
game.settings.set('frozen-dice', 'conSaveDC', 20);
```

### Adding to Custom UI

The main function is exported and can be called from other modules:

```javascript
// From another module
Hooks.call('frozen-dice.rollConSaveForAllCharacters', { dc: 20 });
```

## Compatibility

- **Foundry VTT**: 11.x, 12.x
- **Systems**: D&D5e, Pathfinder 2e, and most other d20-based systems
- **Dependencies**: None

## Development

To test locally:

1. Link this folder to your Foundry data directory
2. Enable the module in Foundry
3. Open browser dev tools (F12) to see console output
4. Make changes and reload Foundry to test

## License

MIT License - Feel free to use, modify, and distribute.
