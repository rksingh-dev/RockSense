document.addEventListener('DOMContentLoaded', () => {
    // ... (your existing code) ...

    let ws = null;
    const rockName = 'Granite'; // Replace with the currently displayed rock type

    function connectWebSocket() {
        const wsUrl = 'ws://your-server.com/rocks/realtime'; // Replace with your server URL
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connection opened.');
            // Send a message to the server to subscribe to updates for the rock type
            ws.send(JSON.stringify({ action: 'subscribe', rock: rockName }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received data:', data);
            updateRockData(data); // Call function to update UI with new data
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Handle errors (e.g., reconnect attempts)
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed.');
            // Handle connection closure (e.g., reconnect attempts)
        };
    }

    function updateRockData(data) {
        // Update your charts, text content, etc., based on the received `data`
        document.getElementById('description').textContent = data.description; 
        // ... (Update other elements like composition, properties, etc.)

        // Update Chart.js charts (if you are using them)
        if (charts.composition) {
            charts.composition.data.datasets[0].data = data.composition.values;
            charts.composition.update();
        }
        if (charts.properties) {
            charts.properties.data.datasets[0].data = data.properties.values;
            charts.properties.update();
        }
    }

    // Call connectWebSocket() to establish the WebSocket connection
    connectWebSocket();

    // ... (rest of your code) ...
});document.addEventListener('DOMContentLoaded', () => {
    // ... (rest of your code) ...

    async function fetchRockData(rockName) {
        // Replace with your actual API key
        const apiKey = 'YOUR_GEOSCI_API_KEY'; 
        const apiUrl = `https://www.geosci.xyz/api/v1/rocks/${rockName}?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            // Process and structure the data
            return {
                name: data.name,
                description: data.description,
                composition: {
                    labels: data.composition.minerals.map(mineral => mineral.name),
                    values: data.composition.minerals.map(mineral => mineral.percentage)
                },
                properties: {
                    labels: ['Hardness', 'Density', 'Strength', 'Porosity', 'Heat Resistance'], // Example properties
                    values: [data.hardness, data.density, data.strength, data.porosity, data.heat_resistance] // Replace with actual properties
                },
                locations: data.locations.map(location => location.name)
            };
        } catch (error) {
            throw new Error(`Error fetching rock data: ${error.message}`);
        }
    }

    // ... (rest of your code) ...
});document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('rock-search');
    const searchBtn = document.getElementById('search-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const analysisContainer = document.getElementById('analysis-container');
    const tags = document.querySelectorAll('.tag');

    let charts = {
        composition: null,
        properties: null
    };

    // Event Listeners
    searchBtn.addEventListener('click', () => handleSearch(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(searchInput.value);
    });

    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.dataset.rock;
            handleSearch(tag.dataset.rock);
        });
    });

    async function handleSearch(rockName) {
        if (!rockName.trim()) return;

        showLoading(true);
        try {
            const rockData = await fetchRockData(rockName);
            updateUI(rockData);
        } catch (error) {
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }

    async function fetchRockData(rockName) {
        const wikiApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&titles=${rockName}&exintro=1&explaintext=1&origin=*`;

        const response = await fetch(wikiApiUrl);
        const data = await response.json();
        const page = Object.values(data.query.pages)[0];

        if (page.missing) {
            throw new Error('Rock information not found');
        }

        // Process and structure the data
        return {
            name: rockName,
            description: page.extract,
            composition: generateCompositionData(rockName),
            properties: generatePropertiesData(rockName),
            locations: generateLocations(rockName)
        };
    }

    function updateUI(rockData) {
        // Update basic information
        document.getElementById('rock-type').textContent = rockData.name;
        document.getElementById('description').textContent = rockData.description;

        // Update charts
        updateCharts(rockData);

        // Update locations
        updateLocations(rockData.locations);

        // Show analysis container with animation
        analysisContainer.style.display = 'block';
        setTimeout(() => {
            analysisContainer.classList.add('visible');
        }, 100);
    }

    function updateCharts(rockData) {
        // Destroy existing charts
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });

        // Composition Chart
        const compositionCtx = document.getElementById('compositionChart').getContext('2d');
        charts.composition = new Chart(compositionCtx, {
            type: 'pie',
            data: {
                labels: rockData.composition.labels,
                datasets: [{
                    data: rockData.composition.values,
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ]
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: 'white' }
                    }
                }
            }
        });

        // Properties Chart
        const propertiesCtx = document.getElementById('propertiesChart').getContext('2d');
        charts.properties = new Chart(propertiesCtx, {
            type: 'radar',
            data: {
                labels: rockData.properties.labels,
                datasets: [{
                    label: 'Properties',
                    data: rockData.properties.values,
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    borderColor: 'rgba(139, 92, 246, 0.8)',
                    pointBackgroundColor: 'rgba(139, 92, 246, 0.8)'
                }]
            },
            options: {
                scales: {
                    r: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                }
            }
        });
    }

    function updateLocations(locations) {
        const locationList = document.getElementById('location-list');
        locationList.innerHTML = locations.map(location => `
            <div class="location-item">
                <img src="https://api.iconify.design/lucide:map-pin.svg" 
                     alt="Location" class="btn-icon">
                <span>${location}</span>
            </div>
        `).join('');
    }

    function showLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
        errorMessage.style.display = 'none';
        if (show) {
            analysisContainer.style.display = 'none';
            analysisContainer.classList.remove('visible');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        analysisContainer.style.display = 'none';
        analysisContainer.classList.remove('visible');
    }

    // Helper functions to generate sample data
    function generateCompositionData(rockName) {
        // Sample data - in a real app, this would come from an API
        const compositions = {
            'granite': {
                labels: ['Quartz', 'Feldspar', 'Mica', 'Other'],
                values: [30, 40, 20, 10]
            },
            'basalt': {
                labels: ['Plagioclase', 'Pyroxene', 'Olivine', 'Other'],
                values: [45, 35, 15, 5]
            },
            'limestone': {
                labels: ['Calcite', 'Aragonite', 'Dolomite', 'Other'],
                values: [70, 15, 10, 5]
            }
        };
        return compositions[rockName.toLowerCase()] || {
            labels: ['Component 1', 'Component 2', 'Component 3', 'Other'],
            values: [40, 30, 20, 10]
        };
    }

    function generatePropertiesData(rockName) {
        // Sample data - in a real app, this would come from an API
        const properties = {
            'granite': {
                labels: ['Hardness', 'Density', 'Strength', 'Porosity', 'Heat Resistance'],
                values: [7, 8, 9, 4, 8]
            },
            'basalt': {
                labels: ['Hardness', 'Density', 'Strength', 'Porosity', 'Heat Resistance'],
                values: [6, 9, 8, 3, 9]
            },
            'limestone': {
                labels: ['Hardness', 'Density', 'Strength', 'Porosity', 'Heat Resistance'],
                values: [4, 6, 5, 7, 4]
            }
        };
        return properties[rockName.toLowerCase()] || {
            labels: ['Hardness', 'Density', 'Strength', 'Porosity', 'Heat Resistance'],
            values: [5, 5, 5, 5, 5]
        };
    }

    function generateLocations(rockName) {
        // Sample data - in a real app, this would come from an API
        const locations = {
            'granite': [
                'Yosemite National Park, USA',
                'Scottish Highlands, UK',
                'Black Forest, Germany'
            ],
            'basalt': [
                'Giant\'s Causeway, Ireland',
                'Deccan Traps, India',
                'Hawaii Volcanoes, USA'
            ],
            'limestone': [
                'White Cliffs of Dover, UK',
                'Great Barrier Reef, Australia',
                'Carlsbad Caverns, USA'
            ]
        };
        return locations[rockName.toLowerCase()] || [
            'Location 1',
            'Location 2',
            'Location 3'
        ];
    }
});