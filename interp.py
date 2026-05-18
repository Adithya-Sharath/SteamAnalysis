import numpy as np
import json
from sklearn.decomposition import PCA
from sklearn.preprocessing import normalize

game_weights = np.load('/home/shara/SteamAnalysis/data/game_weights.npy')
game_bias = np.load('/home/shara/SteamAnalysis/data/game_bias.npy')

with open('/home/shara/SteamAnalysis/data/game_lookup.json') as f:
    game_lookup = json.load(f)

with open('/home/shara/SteamAnalysis/data/model_game_vocab.json') as f:
    vocab = json.load(f)

game_names = [game_lookup.get(str(v), f'unknown_{v}') for v in vocab]
game_weights = game_weights[1:len(vocab)+1]
game_bias = game_bias[1:len(vocab)+1]
print(f'Aligned {len(game_names)} games')

indices = np.argsort(game_bias)
print('\n=== TOP 10 LOVED ===')
for i in indices[-10:][::-1]:
    print(f'  {game_names[i]}: {game_bias[i]:.4f}')

print('\n=== TOP 10 DISLIKED ===')
for i in indices[:10]:
    print(f'  {game_names[i]}: {game_bias[i]:.4f}')

norms = normalize(game_weights)

def most_similar(game_name, n=5):
    matches = [i for i, name in enumerate(game_names) if game_name.lower() in name.lower()]
    if not matches:
        print(f'  {game_name} not found'); return
    idx = matches[0]
    sims = norms @ norms[idx]
    top = np.argsort(sims)[-n-1:][::-1]
    print(f'\n=== SIMILAR TO: {game_names[idx]} ===')
    for i in top:
        if i != idx:
            print(f'  {game_names[i]}: {sims[i]:.4f}')

most_similar('Counter-Strike')
most_similar('Skyrim')
most_similar('Stardew Valley')
most_similar('Dota 2')
most_similar('Portal')

pca = PCA(n_components=2)
coords = pca.fit_transform(game_weights)
print(f'\nPCA variance explained: {pca.explained_variance_ratio_}')

pca_data = {
    str(i): {'x': float(coords[i,0]), 'y': float(coords[i,1]),
             'name': game_names[i], 'bias': float(game_bias[i])}
    for i in range(len(game_names))
}
with open('/home/shara/SteamAnalysis/data/pca_coords.json', 'w') as f:
    json.dump(pca_data, f)
print('PCA coords saved.')