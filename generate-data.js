import fs from 'fs';
import path from 'path';

const cities = [
  { nameen: "Chennai", nameta: "சென்னை", lat: 13.0827, lon: 80.2707 },
  { nameen: "Madurai", nameta: "மதுரை", lat: 9.9252, lon: 78.1198 },
  { nameen: "Coimbatore", nameta: "கோயம்புத்தூர்", lat: 11.0168, lon: 76.9558 },
  { nameen: "Trichy", nameta: "திருச்சி", lat: 10.7905, lon: 78.7047 },
  { nameen: "Salem", nameta: "சேலம்", lat: 11.6643, lon: 78.1460 },
  { nameen: "Tirunelveli", nameta: "திருநெல்வேலி", lat: 8.7139, lon: 77.7567 },
  { nameen: "Erode", nameta: "ஈரோடு", lat: 11.3410, lon: 77.7172 },
  { nameen: "Ooty", nameta: "ஊட்டி", lat: 11.4102, lon: 76.6950 },
  { nameen: "Kanyakumari", nameta: "கன்னியாகுமரி", lat: 8.0883, lon: 77.5385 },
  { nameen: "Thanjavur", nameta: "தஞ்சாவூர்", lat: 10.7870, lon: 79.1378 }
];

const categories = [
  { en: "Temple", ta: "கோவில்", descen: "A spiritual and cultural temple site.", descta: "ஒரு ஆன்மீக மற்றும் கலாச்சார கோவில் தலம்." },
  { en: "Restaurant", ta: "உணவகம்", descen: "Popular eatery serving traditional cuisine.", descta: "பாரம்பரிய உணவுகளை வழங்கும் புகழ்பெற்ற உணவகம்." },
  { en: "Park", ta: "பூங்கா", descen: "Lush green space for relaxation and play.", descta: "ஓய்வெடுக்க மற்றும் விளையாட உதவும் பசுமையான பகுதி." },
  { en: "Landmark", ta: "சுற்றுலா தலம்", descen: "A historic spot popular with tourists.", descta: "சுற்றுலாப் பயணிகளிடையே புகழ்பெற்ற வரலாற்று சிறப்புமிக்க தலம்." },
  { en: "Hotel", ta: "விடுதி", descen: "Comfortable accommodation with local hospitality.", descta: "உள்ளூர் விருந்தோம்பலுடன் கூடிய தங்குமிடம்." },
  { en: "Market", ta: "சந்தை", descen: "Bustling local trade and shopping district.", descta: "விறுவிறுப்பான உள்ளூர் வர்த்தகம் மற்றும் ஷாப்பிங் பகுதி." }
];

const locations = [];
let idCounter = 1;

// 10 cities * 100 points per city = 1000 points.
cities.forEach(city => {
  for (let i = 1; i <= 100; i++) {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    // Random offsets up to ~0.08 degrees (approx 8-9 km radius)
    const latOffset = (Math.random() - 0.5) * 0.16;
    const lonOffset = (Math.random() - 0.5) * 0.16;
    const lat = Number((city.lat + latOffset).toFixed(5));
    const lon = Number((city.lon + lonOffset).toFixed(5));
    const rating = Number((3.5 + Math.random() * 1.5).toFixed(1));
    const picId = Math.floor(Math.random() * 80) + 10; // Picsum ID between 10 and 90

    locations.push({
      id: String(idCounter),
      name: `${city.nameen} ${cat.en} #${i} (${city.nameta} ${cat.ta} #${i})`,
      lat: lat,
      lon: lon,
      category: cat.en,
      description: `${cat.descen} Located in the regional hub of ${city.nameen}. (${cat.descta} இது ${city.nameta} பகுதியில் அமைந்துள்ளது).`,
      rating: rating,
      address: `Street No. ${i}, ${city.nameen}, Tamil Nadu, India`,
      imageUrl: `https://picsum.photos/id/${picId}/400/300`
    });
    idCounter++;
  }
});

fs.writeFileSync(
  path.join(process.cwd(), 'public', 'mock-data.json'),
  JSON.stringify(locations, null, 2),
  'utf-8'
);

console.log(`Successfully generated ${locations.length} location records in public/mock-data.json!`);
