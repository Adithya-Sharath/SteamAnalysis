import numpy as np
import json
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

game_weights = np.load('/home/shara/SteamAnalysis/data/game_weights.npy')
game_bias = np.load('/home/shara/SteamAnalysis/data/game_bias.npy')

with open('/home/shara/SteamAnalysis/data/game_lookup.json') as f:
    game_lookup = json.load(f)
with open('/home/shara/SteamAnalysis/data/model_game_vocab.json') as f:
    vocab = json.load(f)

game_names = [game_lookup.get(str(v), f'unknown_{v}') for v in vocab]
game_weights = game_weights[1:len(vocab)+1]

pca = PCA(n_components=2)
coords = pca.fit_transform(game_weights)

# Genre-labeled games
labeled_games = {
    # Tactical shooters
    'Counter-Strike: Global Offensive': 'Shooter',
    'Tom Clancy\'s Rainbow Six® Siege': 'Shooter',
    'Team Fortress 2': 'Shooter',
    'Left 4 Dead 2': 'Shooter',
    'Payday 2': 'Shooter',
    'Warframe': 'Shooter',
    'Dead by Daylight': 'Shooter',

    # Open world / Action
    'Grand Theft Auto V': 'Open World',
    'Cyberpunk 2077': 'Open World',
    'The Witcher 3: Wild Hunt': 'Open World',
    'Elden Ring': 'Open World',
    'ARK: Survival Evolved': 'Open World',
    'Rust': 'Open World',

    # Valve / FPS narrative
    'Portal': 'Valve',
    'Portal 2': 'Valve',
    'Half-Life 2': 'Valve',
    'Garry\'s Mod': 'Valve',

    # Strategy
    'Hearts of Iron IV': 'Strategy',
    'Total War: WARHAMMER II': 'Strategy',
    'RimWorld': 'Strategy',
    'Dota 2': 'Strategy',

    # Indie / platformer
    'Stardew Valley': 'Indie',
    'Terraria': 'Indie',
    'Hollow Knight': 'Indie',
    'Celeste': 'Indie',
    'Hades': 'Indie',

    # MMO / Live service
    'FINAL FANTASY XIV Online': 'MMO',
}

colors = {
    'Shooter':    '#e74c3c',
    'Open World': '#e67e22',
    'Valve':      '#2ecc71',
    'Strategy':   '#3498db',
    'Indie':      '#9b59b6',
    'MMO':        '#1abc9c',
}

fig, ax = plt.subplots(figsize=(16, 11))

# Plot each genre group
plotted = {}
for game, genre in labeled_games.items():
    matches = [i for i, n in enumerate(game_names) if game.lower() == n.lower()]
    if not matches:
        continue
    idx = matches[0]
    x, y = coords[idx, 0], coords[idx, 1]
    label = genre if genre not in plotted else None
    ax.scatter(x, y, s=80, color=colors[genre], zorder=3, label=label, alpha=0.85)
    ax.annotate(game, (x, y), fontsize=7.5, ha='left', va='bottom',
                xytext=(5, 4), textcoords='offset points', color='#333333')
    plotted[genre] = True

ax.axhline(0, color='gray', linewidth=0.4, linestyle='--')
ax.axvline(0, color='gray', linewidth=0.4, linestyle='--')
ax.set_xlabel(f'PC1 ({pca.explained_variance_ratio_[0]*100:.1f}% variance) — solo/indie  ←→  live-service/multiplayer', fontsize=10)
ax.set_ylabel(f'PC2 ({pca.explained_variance_ratio_[1]*100:.1f}% variance)', fontsize=10)
ax.set_title('Steam game embeddings — PCA projection\nColors = genre (model never saw these labels)', fontsize=13)
ax.legend(title='Genre', fontsize=9, title_fontsize=9, loc='upper left')
ax.grid(True, alpha=0.15)

plt.tight_layout()
plt.savefig('/home/shara/SteamAnalysis/data/pca_plot.png', dpi=150)
plt.show()
print('Plot saved.')