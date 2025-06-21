import React, { useState } from 'react';
import { getRecommendations } from './api';

const moodOptions = [
    "romance", "action", "revenge", "tragedy", "rebirth", "betrayal", "comedy", "drama"
];

export default function RecommendationComponent() {
    const [selectedMood, setSelectedMood] = useState('');
    const [results, setResults] = useState([]);

    const fetchRecommendations = async () => {
        if (!selectedMood) return;
        try {
            const recs = await getRecommendations([selectedMood]);
            setResults(recs);
        } catch (err) {
            console.error("Failed to fetch recommendations:", err);
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            <h2>🎭 Get Manhwa Recommendations</h2>

            <select onChange={(e) => setSelectedMood(e.target.value)} value={selectedMood}>
                <option value="">Select a mood</option>
                {moodOptions.map((mood) => (
                    <option key={mood} value={mood}>
                        {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </option>
                ))}
            </select>

            <button onClick={fetchRecommendations} style={{ marginLeft: '1rem' }}>
                Fetch
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                {results.map((manhwa, index) => (
                    <div key={index} style={{ border: '1px solid #ccc', borderRadius: '10px', padding: '1rem', backgroundColor: '#fafafa' }}>
                        <h3>{manhwa.title}</h3>
                        <p><strong>Genres:</strong> {manhwa.genre?.join(', ')}</p>
                        <p><strong>Summary:</strong> {manhwa.summary}</p>
                    </div>
                ))}

            </div>
        </div>
    );
}
