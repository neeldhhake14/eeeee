const KEY = "1c0bfc44a7bddcef25e97632e1d57cee"; // One Call 3.0 recommended
let unit = "metric"; // or "imperial"
let lastCoords = null;

document.addEventListener("DOMContentLoaded", () => {
  setupUnitToggle();
  setupSearch();
  // Try geolocation on first load
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      await loadByCoords(pos.coords.latitude, pos.coords.longitude);
    }, ()=>{});
  }
});

function setupUnitToggle(){
  const wrap = document.getElementById("unit-toggle");
  wrap.addEventListener("click", (e)=>{
    const btn = e.target.closest("button");
    if(!btn) return;
    unit = btn.dataset.unit;
    [...wrap.children].forEach(b=>b.classList.toggle("active", b===btn));
    if (lastCoords) loadByCoords(lastCoords.lat, lastCoords.lon); // refresh
  });
}

function setupSearch(){
  const form = document.getElementById("city-form");
  const input = document.getElementById("city-input");
  const locBtn = document.getElementById("loc-btn");
  const error = document.getElementById("error");

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    error.classList.add("hidden");
    try{
      const q = input.value.trim();
      const loc = await directGeocode(q);
      await loadByCoords(loc.lat, loc.lon, loc.name, loc.country, loc.state);
    }catch(err){
      error.textContent = err.message || "City not found";
      error.classList.remove("hidden");
    }
  });

  locBtn.addEventListener("click", ()=>{
    if (!navigator.geolocation) {
      error.textContent = "Geolocation not supported."; error.classList.remove("hidden"); return;
    }
    navigator.geolocation.getCurrentPosition(async pos=>{
      error.classList.add("hidden");
      await loadByCoords(pos.coords.latitude, pos.coords.longitude);
    }, ()=>{
      error.textContent = "Permission denied or unavailable."; error.classList.remove("hidden");
    });
  });
}

async function directGeocode(city){
  // OpenWeather Direct Geocoding API
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding error");
  const arr = await res.json();
  const f = arr[0];
  if (!f) throw new Error("City not found");
  return { lat: f.lat, lon: f.lon, name: f.name, country: f.country, state: f.state };
}

async function reverseGeocode(lat, lon){
  const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const arr = await res.json();
  return arr[0] || null;
}

async function loadByCoords(lat, lon, name=null, country=null, state=null){
  lastCoords = { lat, lon };
  // Fetch One Call 3.0
  const p1 = fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${KEY}&units=${unit}&exclude=minutely,alerts`).then(r=>r.json());
  const place = name ? {name, country, state} : await reverseGeocode(lat, lon);
  const data = await p1;

  renderCurrent(place, data.current);
  renderHourly(data.hourly?.slice(0,24) || []);
  renderDaily(data.daily?.slice(0,7) || []);
}

function renderCurrent(place, cur){
  const placeEl = document.getElementById("place");
  const descEl = document.getElementById("desc");
  const tempEl = document.getElementById("temp");
  const feelsEl = document.getElementById("feels");
  const windEl = document.getElementById("wind");
  const humEl  = document.getElementById("hum");

  const loc = place ? `${place.name}${place.state?`, ${place.state}`:""}, ${place.country}` : "—";
  placeEl.textContent = loc;
  const w = cur.weather?.[0];
  descEl.textContent = w ? `${capitalize(w.description)}` : "—";
  tempEl.textContent = `${Math.round(cur.temp)}°${unit==="metric"?"C":"F"}`;
  feelsEl.textContent = `Feels like ${Math.round(cur.feels_like)}°`;
  windEl.textContent = `Wind ${Math.round(cur.wind_speed)} ${unit==="metric"?"m/s":"mph"}`;
  humEl.textContent  = `Humidity ${cur.humidity}%`;
}

function renderHourly(hours){
  const spark = document.getElementById("hourly-spark");
  const grid = document.getElementById("hourly-list");
  const temps = hours.map(h=>h.temp);
  spark.innerHTML = window.Spark.sparkline(temps, 700, 40);
  grid.innerHTML = hours.map(h=>{
    const dt = new Date(h.dt*1000);
    const hh = dt.toLocaleTimeString([], {hour:"2-digit", minute:"2*_
