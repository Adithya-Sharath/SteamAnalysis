import fastprogress
fastprogress.printing = False
from fastai.collab import *
from fastai.tabular.all import *
import pandas as pd
import numpy as np
import json

df = pd.read_csv('/home/shara/SteamAnalysis/data/df_clean.csv')
df['rating'] = np.log1p(df['hours'])
y_max = df['rating'].max()
print(f'y_range will be (0, {y_max:.2f})')

dls = CollabDataLoaders.from_df(
    df,
    user_name='user_idx',
    item_name='game_idx',
    rating_name='rating',
    valid_pct=0.1,
    bs=4096
)

learn = collab_learner(dls, n_factors=50, y_range=(0, y_max + 0.5))
learn.fit_one_cycle(10, 5e-2, wd=0.1)

game_vocab = dls.classes['game_idx']
with open('/home/shara/SteamAnalysis/data/model_game_vocab.json', 'w') as f:
    json.dump([int(x) for x in game_vocab if x != '#na#'], f)
print(f'Vocab saved: {len(game_vocab)} entries')

learn.export('/home/shara/SteamAnalysis/steam_collab.pkl')
print('Done. Model saved.')