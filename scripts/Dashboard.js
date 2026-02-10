export function createDashboard(containerSelector) {
  const container = typeof containerSelector === 'string'
    ? document.querySelector(containerSelector)
    : containerSelector;

  if (!container) {
    throw new Error('Container not found for selector: ' + containerSelector);
  }

  container.style.display = 'block';
  container.style.width = '100%';

  // Wrapper to host the SVG
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '420px';
  wrapper.style.position = 'relative';
  container.innerHTML = '';
  container.appendChild(wrapper);

  // SVG element
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.style.width = '100%';
  svgEl.style.height = '100%';
  svgEl.style.display = 'block';
  wrapper.appendChild(svgEl);

  // Internal state
  const charts = new Map();
  const filters = [];
  const COLOR_PALETTE = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
  let colorIndex = 0;

  function pickColor() {
    return COLOR_PALETTE[colorIndex++ % COLOR_PALETTE.length];
  }

  function addChart(id, type, data) {
    if (!id) throw new Error('Chart id is required');
    const chart = {
      id,
      type: type || 'line',
      data: Array.isArray(data) ? data : [],
      color: pickColor()
    };
    charts.set(id, chart);
    render();
  }

  function updateChart(id, data) {
    const c = charts.get(id);
    if (!c) return;
    c.data = Array.isArray(data) ? data : [];
    render();
  }

  function addFilter(name, callback) {
    if (typeof name !== 'string') throw new Error('Filter name must be a string');
    if (typeof callback !== 'function') throw new Error('Filter callback must be a function');
    filters.push({ name, callback });
    render();
  }

  function render() {
    // Clear SVG
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    const primary = charts.values().next().value;
    if (!primary) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', (wrapper.clientWidth || 600) / 2);
      t.setAttribute('y', 80);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', '#666');
      t.textContent = 'No chart. Use addChart(id, type, data) to add a line chart.';
      svgEl.appendChild(t);
      return;
    }

    // Apply filters to the primary data while preserving order
    let data = primary.data ? primary.data.slice() : [];
    for (const f of filters) {
      if (typeof f.callback === 'function') {
        data = f.callback(data);
      }
    }

    if (!Array.isArray(data) || data.length === 0) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', (wrapper.clientWidth || 600) / 2);
      t.setAttribute('y', 80);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', '#666');
      t.textContent = 'No data to display';
      svgEl.appendChild(t);
      return;
    }

    // Layout calculations
    const width = Math.max(wrapper.clientWidth, 300);
    const height = wrapper.clientHeight || 420;
    svgEl.setAttribute('width', width);
    svgEl.setAttribute('height', height);
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const left = 40, right = 20, top = 20, bottom = 30;
    const plotW = width - left - right;
    const plotH = height - top - bottom;

    const ys = data.map(p => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const yRange = maxY - minY || 1;
    const n = data.length;

    const mapX = i => left + (n <= 1 ? 0.5 * plotW : (i / (n - 1)) * plotW);
    const mapY = y => height - bottom - ((y - minY) / yRange) * plotH;

    // Grid lines
    for (let g = 0; g <= 4; g++) {
      const gy = top + (g / 4) * plotH;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', left);
      line.setAttribute('y1', gy);
      line.setAttribute('x2', width - right);
      line.setAttribute('y2', gy);
      line.setAttribute('stroke', '#eee');
      line.setAttribute('stroke-width', '1');
      svgEl.appendChild(line);
    }

    // Axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', left);
    xAxis.setAttribute('y1', height - bottom);
    xAxis.setAttribute('x2', width - right);
    xAxis.setAttribute('y2', height - bottom);
    xAxis.setAttribute('stroke', '#999');
    xAxis.setAttribute('stroke-width', '1');
    svgEl.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', left);
    yAxis.setAttribute('y1', top);
    yAxis.setAttribute('x2', left);
    yAxis.setAttribute('y2', height - bottom);
    yAxis.setAttribute('stroke', '#999');
    yAxis.setAttribute('stroke-width', '1');
    svgEl.appendChild(yAxis);

    // Path for line
    const d = data.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(pt.y)}`).join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', primary.color || '#1f77b4');
    path.setAttribute('stroke-width', '2');
    svgEl.appendChild(path);

    // Data points
    data.forEach((pt, i) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', mapX(i));
      circle.setAttribute('cy', mapY(pt.y));
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', primary.color || '#1f77b4');
      svgEl.appendChild(circle);
    });

    // X labels
    data.forEach((pt, i) => {
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', mapX(i));
      lbl.setAttribute('y', height - 12);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('font-size', '10');
      lbl.setAttribute('fill', '#666');
      lbl.textContent = String(pt.x);
      svgEl.appendChild(lbl);
    });
  }

  // API
  return {
    addChart,
    updateChart,
    addFilter
  };
}
