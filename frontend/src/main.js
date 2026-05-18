import './style.css'

const API = 'https://aduguduu-steam-analysis.hf.space'
let allGames = []
let pcaLoaded = false
let biasLoaded = false

/* ── IntersectionObserver for scroll animations ── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        revealObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.12 }
)

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el)
})

/* ── Stat card counters ── */
function animateCount(el) {
  const target = parseInt(el.dataset.target, 10)
  const divisor = parseFloat(el.dataset.divisor) || 1
  const suffix = el.dataset.suffix || ''
  const duration = 1400
  const start = performance.now()

  function step(now) {
    const progress = Math.min((now - start) / duration, 1)
    // ease-out
    const eased = 1 - Math.pow(1 - progress, 3)
    const value = target * eased / divisor
    el.textContent = value.toFixed(divisor >= 1000000 ? 1 : 0) + suffix
    if (progress < 1) requestAnimationFrame(step)
    else el.textContent = (target / divisor).toFixed(divisor >= 1000000 ? 1 : 0) + suffix
  }
  requestAnimationFrame(step)
}

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const num = entry.target.querySelector('.stat-num')
        if (num && !num.dataset.counted) {
          num.dataset.counted = 'true'
          animateCount(num)
        }
        statObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.3 }
)

document.querySelectorAll('.stat-card').forEach(card => statObserver.observe(card))

/* ── Bias section ── */
async function loadBias() {
  if (biasLoaded) return
  biasLoaded = true

  try {
    const data = await fetch(`${API}/bias?n=10`).then(r => r.json())

    const lovedMax = Math.max(...data.loved.map(g => g.bias))
    document.getElementById('loved-list').innerHTML = data.loved.map((g, i) => `
      <div class="bias-item">
        <span class="bias-rank">${i + 1}</span>
        <span class="bias-name">${g.name}</span>
        <div class="bias-bar-wrap">
          <div class="bias-bar-bg">
            <div class="bias-bar-fill loved-fill" data-width="${(g.bias / lovedMax * 100).toFixed(1)}%"></div>
          </div>
        </div>
        <span class="bias-score-label">+${g.bias.toFixed(3)}</span>
      </div>`).join('')

    const dislikedMax = Math.max(...data.disliked.map(g => Math.abs(g.bias)))
    document.getElementById('disliked-list').innerHTML = data.disliked.map((g, i) => `
      <div class="bias-item">
        <span class="bias-rank">${i + 1}</span>
        <span class="bias-name">${g.name}</span>
        <div class="bias-bar-wrap">
          <div class="bias-bar-bg">
            <div class="bias-bar-fill disliked-fill" data-width="${(Math.abs(g.bias) / dislikedMax * 100).toFixed(1)}%"></div>
          </div>
        </div>
        <span class="bias-score-label">${g.bias.toFixed(3)}</span>
      </div>`).join('')

    // animate bars after a tick so DOM is painted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('.bias-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.width
        })
      })
    })
  } catch (e) {
    document.getElementById('loved-list').innerHTML = '<p style="color:var(--steel-blue)">Could not load data.</p>'
    document.getElementById('disliked-list').innerHTML = '<p style="color:var(--steel-blue)">Could not load data.</p>'
  }
}

const biasObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadBias()
      biasObserver.disconnect()
    }
  },
  { threshold: 0.05 }
)
biasObserver.observe(document.getElementById('learned'))

/* ── PCA scatter plot ── */
async function loadPCA() {
  if (pcaLoaded) return
  pcaLoaded = true

  try {
    const data = await fetch(`${API}/pca`).then(r => r.json())
    const x    = data.map(g => g.x)
    const y    = data.map(g => g.y)
    const text = data.map(g => g.name)
    const bias = data.map(g => g.bias)

    Plotly.newPlot('pca-plot', [{
      x, y, text,
      mode: 'markers',
      marker: {
        size: 4,
        color: bias,
        colorscale: 'RdYlGn',
        showscale: true,
        colorbar: { title: 'Bias', thickness: 14, tickfont: { family: 'Inter', size: 13 } }
      },
      hovertemplate: '<b>%{text}</b><br>bias: %{marker.color:.3f}<extra></extra>'
    }], {
      paper_bgcolor: '#FFFFE3',
      plot_bgcolor:  '#FFFFE3',
      font: { family: 'Inter', color: '#4A4A4A', size: 13 },
      xaxis: { title: 'PC1', gridcolor: '#CBCBCB', zerolinecolor: '#CBCBCB' },
      yaxis: { title: 'PC2', gridcolor: '#CBCBCB', zerolinecolor: '#CBCBCB' },
      margin: { t: 16, r: 16, b: 52, l: 52 }
    }, { responsive: true })
  } catch (e) {
    document.getElementById('pca-plot').innerHTML =
      '<div class="pca-loading">Failed to load embedding map.</div>'
  }
}

const pcaObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadPCA()
      pcaObserver.disconnect()
    }
  },
  { threshold: 0.05 }
)
pcaObserver.observe(document.getElementById('demo'))

/* ── Game search autocomplete ── */
async function loadGames() {
  try {
    allGames = await fetch(`${API}/games`).then(r => r.json())
  } catch (e) {
    console.error('Failed to load game list', e)
  }
}

const searchInput = document.getElementById('search-input')
const suggestionsBox = document.getElementById('suggestions')

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim()
  if (q.length < 2) { suggestionsBox.classList.add('hidden'); return }

  const matches = allGames.filter(g => g.name.toLowerCase().includes(q)).slice(0, 8)
  if (!matches.length) { suggestionsBox.classList.add('hidden'); return }

  suggestionsBox.innerHTML = matches.map(g =>
    `<div class="suggestion-item" data-name="${escapeAttr(g.name)}">${escapeHtml(g.name)}</div>`
  ).join('')
  suggestionsBox.classList.remove('hidden')
})

suggestionsBox.addEventListener('click', e => {
  const item = e.target.closest('.suggestion-item')
  if (!item) return
  selectGame(item.dataset.name)
})

document.addEventListener('click', e => {
  if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
    suggestionsBox.classList.add('hidden')
  }
})

async function selectGame(name) {
  searchInput.value = name
  suggestionsBox.classList.add('hidden')

  const resultsEl = document.getElementById('similar-results')
  resultsEl.innerHTML = '<p class="demo-hint">Finding similar games…</p>'

  try {
    const data = await fetch(`${API}/similar?game=${encodeURIComponent(name)}&n=8`).then(r => r.json())
    if (data.error) {
      resultsEl.innerHTML = `<p class="demo-hint">${escapeHtml(data.error)}</p>`
      return
    }

    resultsEl.innerHTML = data.results.map(r => `
      <div class="result-card">
        <div class="result-header">
          <div class="result-name">${escapeHtml(r.name)}</div>
          <div class="result-score">${(r.score * 100).toFixed(1)}%</div>
        </div>
        <div class="result-bar-bg">
          <div class="result-bar" data-width="${(r.score * 100).toFixed(1)}%"></div>
        </div>
      </div>`).join('')

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('.result-bar').forEach(bar => {
          bar.style.width = bar.dataset.width
        })
      })
    })
  } catch (e) {
    resultsEl.innerHTML = '<p class="demo-hint">API error — try again.</p>'
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
function escapeAttr(str) {
  return str.replace(/"/g, '&quot;')
}

loadGames()
