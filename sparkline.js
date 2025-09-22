// Lightweight SVG sparkline
function sparkline(values = [], width = 600, height = 40) {
  if (!values.length) return "";
  const min = Math.min(...values), max = Math.max(...values);
  const norm = v => max === min ? 0.5 : (v-min)/(max-min);
  const pts = values.map((v,i)=>{
    const x = (i/(values.length-1)) * (width-2) + 1;
    const y = height - (norm(v)*(height-6) + 3);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <polyline fill="none" stroke="#60a5fa" stroke-width="2" points="${pts}"/>
  </svg>`;
}
window.Spark = { sparkline };
