import React, { useState } from 'react';
import { getRecommendations } from './api';
import './RecommendationComponent.css';

const moodOptions = [
    "romance", "action", "revenge", "tragedy", "rebirth", "betrayal", "comedy", "drama"
];

export default function RecommendationComponent() {
    const [selectedMood, setSelectedMood] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchRecommendations = async () => {
        if (!selectedMood) return;
        setLoading(true);
        try {
            const recs = await getRecommendations([selectedMood]);
            setResults(recs);
        } catch (err) {
            console.error("Failed to fetch recommendations:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="recommendation-container">
            <h2>🎭 Get Manhwa Recommendations</h2>

            <div className="controls-section">
                <select 
                    className="mood-select"
                    onChange={(e) => setSelectedMood(e.target.value)} 
                    value={selectedMood}
                >
                    <option value="">Select a mood</option>
                    {moodOptions.map((mood) => (
                        <option key={mood} value={mood}>
                            {mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </option>
                    ))}
                </select>

                <button 
                    className="fetch-button"
                    onClick={fetchRecommendations}
                    disabled={!selectedMood || loading}
                >
                    {loading ? 'Loading...' : 'Fetch Recommendations'}
                </button>
            </div>

            {results.length > 0 ? (
                <div className="results-grid">
                    {results.map((manhwa, index) => (
                        <div key={index} className="result-card">
                            <h3>{manhwa.title}</h3>
                            <p><strong>Genres:</strong> {manhwa.genre?.join(', ')}</p>
                            <p><strong>Summary:</strong> {manhwa.summary}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-results">
                    {selectedMood ? 'No recommendations found for this mood.' : 'Select a mood to get recommendations.'}
                </div>
            )}
        </div>
    );
}
