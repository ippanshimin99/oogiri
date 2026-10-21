import { registerScreen, navigate } from './router.js';
import { loadCards } from './cards-data.js';
import * as TitleScreen from './screens/TitleScreen.js';
import * as LocalSetupScreen from './screens/LocalSetupScreen.js';
import * as CpuSetupScreen from './screens/CpuSetupScreen.js';
import * as OnlineSetupScreen from './screens/OnlineSetupScreen.js';
import * as LobbyScreen from './screens/LobbyScreen.js';
import * as GameScreen from './screens/GameScreen.js';
import * as GameOverScreen from './screens/GameOverScreen.js';

async function init() {
  // Register all screens
  registerScreen('title',         TitleScreen);
  registerScreen('local-setup',   LocalSetupScreen);
  registerScreen('cpu-setup',     CpuSetupScreen);
  registerScreen('online-setup',  OnlineSetupScreen);
  registerScreen('lobby',         LobbyScreen);
  registerScreen('game',          GameScreen);
  registerScreen('gameover',      GameOverScreen);

  // Pre-load card data
  await loadCards();

  // Start at title
  navigate('title');
}

init().catch(console.error);
