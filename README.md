# Steam Analysis — Collaborative Filtering Recommender

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-4A90E2?style=flat-square)](https://adithya-sharath.github.io/SteamAnalysis/)
[![API](https://img.shields.io/badge/API-Hugging%20Face%20Spaces-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://aduguduu-steam-analysis.hf.space)
[![Model](https://img.shields.io/badge/Model-fastai%20collab-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)](https://docs.fast.ai/collab.html)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)

**41 million Steam reviews. One model. No genre labels.**

A latent factor collaborative filtering model trained on real Steam playtime data. It learns a 50-dimensional embedding for every game purely from who played what and for how long — no tags, no metadata, no curated labels. The result: Portal and Portal 2 score 0.76 cosine similarity. The model figured that out on its own.

**[→ Try the live demo](https://adithya-sharath.github.io/SteamAnalysis/)**

---

## Results

| Query | Top Match | Similarity |
|---|---|---|
| Portal | Portal 2 | 0.76 |
| Portal | Half-Life 2 | 0.55 |
| Portal | Half-Life 2: Episode One | 0.54 |
| CS:GO | — | weak (bias dominates) |

**CS:GO bias = +0.978** — the model says everyone overplays it relative to what their genre preference alone would predict. The similarity embedding is noisy because its userbase is too large and diverse to find a clean direction.

PCA of all 8,928 game embeddings shows clear genre clustering — shooters, strategy, indie, Valve titles — with no genre labels ever provided during training.

---

## Dataset

| Stat | Value |
|---|---|
| Raw Steam reviews (2024) | 41,000,000 |
| After filtering | 13,800,000 |
| Active users | 680,000 |
| Games in model | 8,928 |

**Filtering criteria:**
- Users with ≥ 10 reviews (removes bots and one-time reviewers)
- Games with ≥ 200 reviews (removes obscure titles with insufficient signal)

**Rating signal:** `log1p(playtime_hours)` — compresses the 0–5,000+ hour range into a 0–6.9 range. Without this, a user with 5,000 hours dominates the loss function.

---

## Model Architecture

```
Input: (user_idx, game_idx) pairs

user_idx ──► [User Embedding]  50-dim   ─┐
                                          ├── dot product ──► + user_bias + game_bias ──► predicted rating
game_idx ──► [Game Embedding]  50-dim   ─┘

Loss: MSELoss on log1p(hours)
Optimizer: fit_one_cycle, lr=5e-2, 10 epochs
Regularization: weight_decay=0.1
```

**Why weight decay matters:** Without `wd=0.1`, the model memorizes individual users and embeddings grow large and noisy. Adding weight decay keeps embedding norms small, forcing the model to find shared structure. PCA explained variance roughly doubled after adding it.

**Dot product prediction:** To estimate how much user A will play game B, take the dot product of their embedding vectors and add per-user and per-game bias terms. Simple, interpretable, and effective.

**Cosine similarity for game–game:** After training, normalize all game embeddings to unit length. Game–game similarity is then a dot product — O(1) per pair, O(n) to rank all games against a query.

---

## Project Structure

```
SteamAnalysis/
├── train.py          # Model training — fastai collab_learner, fit_one_cycle
├── extract.py        # Extract game embeddings + bias from trained .pkl
├── interp.py         # Cosine similarity queries, bias rankings, PCA export
├── plot.py           # PCA scatter plot with genre color labels
├── 01_eda.ipynb      # Exploratory data analysis
├── data/
│   ├── df_clean.csv              # Filtered (user_idx, game_idx, hours)
│   ├── game_lookup.json          # appid → game name mapping
│   ├── model_game_vocab.json     # Ordered vocab from training DataLoaders
│   ├── game_weights.npy          # (8928, 50) game embedding matrix
│   ├── game_bias.npy             # (8928,) per-game bias scores
│   └── pca_coords.json           # 2D PCA projection for scatter plot
├── steam_collab.pkl  # Exported fastai learner
└── frontend/         # Vite + vanilla JS — deployed to GitHub Pages
    ├── index.html
    └── src/
        ├── main.js   # API calls, autocomplete, Plotly scatter plot
        └── style.css
```

---

## API

Hosted on **Hugging Face Spaces** (FastAPI): `https://aduguduu-steam-analysis.hf.space`

| Endpoint | Description |
|---|---|
| `GET /games` | Full list of 8,928 game names (for autocomplete) |
| `GET /similar?game=Portal&n=8` | Top-n cosine similar games |
| `GET /bias?n=10` | Top-n most loved and most disliked games by bias score |
| `GET /pca` | 2D PCA coordinates for all games (for scatter plot) |

---

## How to Run

**Training** (requires data in `/home/shara/SteamAnalysis/data/`):

```bash
pip install fastai scikit-learn
python train.py          # trains model, saves steam_collab.pkl
python extract.py        # extracts game_weights.npy and game_bias.npy
python interp.py         # runs similarity queries, exports pca_coords.json
```

**Frontend (local dev):**

```bash
cd frontend
npm install
npm run dev
```

**Deploy frontend to GitHub Pages:**

```bash
cd frontend
npm run deploy
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Model | [fastai](https://docs.fast.ai/collab.html) `collab_learner` (PyTorch backend) |
| Embedding analysis | NumPy, scikit-learn PCA |
| API | FastAPI, deployed on Hugging Face Spaces |
| Frontend | Vanilla JS, Vite, Plotly.js |
| Hosting | GitHub Pages (frontend) · Hugging Face Spaces (API) |

---

## Limitations

**CS:GO similarity is weak.** Its userbase is so large and diverse that the embedding can't find a clean directional signal. The bias score is high (everyone plays it) but the similarity vector is noise.

**Dataset skews toward popular titles.** The ≥200 review filter means niche games, non-English titles, and recent releases are underrepresented or absent.

**Cold-start problem.** New games with few reviews have poor or missing embeddings. This is a fundamental limitation of collaborative filtering — the model can only recommend what it has seen enough of.

---

## Author

**Adithya Sharath Kumar**
- GitHub: [@Adithya-Sharath](https://github.com/Adithya-Sharath)
- Hugging Face: [aduguduu](https://huggingface.co/aduguduu)
- Live project: [adithya-sharath.github.io/SteamAnalysis](https://adithya-sharath.github.io/SteamAnalysis/)
