import fastprogress
fastprogress.printing = False
from fastai.learner import load_learner
from fastai.collab import *
import numpy as np

learn = load_learner('/home/shara/SteamAnalysis/steam_collab.pkl')

game_weights = learn.model.i_weight.weight.data.cpu().numpy()
game_bias = learn.model.i_bias.weight.data.cpu().numpy().squeeze()

np.save('/home/shara/SteamAnalysis/data/game_weights.npy', game_weights)
np.save('/home/shara/SteamAnalysis/data/game_bias.npy', game_bias)

print(f"game_weights shape: {game_weights.shape}")
print(f"game_bias shape: {game_bias.shape}")
print("Embeddings saved.")
