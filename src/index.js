const AMADEUS_API_KEY = 'pDiZ5LJn6vI3Q6lKcIFGtTxMjrYp4p8O';
const AMADEUS_API_SECRET = 'ChDwL9NxOGd3gYpX';
const UNSPLASH_API_KEY = 'lOKL7N8Q43oATbTiXEMoI2IsvZu_65DHu_3vI6HPgE4';
const FOURSQUARE_API_KEY = 'fsq35gg551iNDeCHN46d/0QMc0XkZkT6pB2aUo1rScAXG4k=';
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

let accessToken = '';

const style = document.createElement('style');
style.textContent = `
.loader {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
}

.loader-circle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: navy;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.8);
        opacity: 0.5;
    }
    50% {
        transform: scale(1.2);
        opacity: 1;
    }
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }
}
`;
document.head.appendChild(style);

async function getAccessToken() {
    try {
        const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`
        });
        const data = await response.json();
        if (data.access_token) {
            accessToken = data.access_token;
        } else {
            throw new Error('Failed to get access token');
        }
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

async function searchDestinations(query) {
    try {
        const response = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(query)}&subType=CITY,AIRPORT`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            return data.data.slice(0, 6).map(location => ({
                name: location.name,
                iataCode: location.iataCode,
                address: location.address,
                geoCode: location.geoCode,
                type: location.subType
            }));
        }
        
        return [];
    } catch (error) {
        console.error('Error searching destinations:', error);
        throw error;
    }
}

async function searchHotels(cityCode) {
    try {
        const response = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        if (data.data) {
            return data.data.slice(0, 6);
        }
        return [];
    } catch (error) {
        console.error('Error searching hotels:', error);
        throw error;
    }
}

async function getHotelOffers(hotelId) {
    try {
        const response = await fetch(`https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        if (data.data && data.data[0] && data.data[0].offers) {
            return data.data[0].offers;
        }
        return [];
    } catch (error) {
        console.error('Error getting hotel offers:', error);
        throw error;
    }
}

async function getHotelImage(hotelName, cityName) {
    try {
        const query = `${hotelName} ${cityName} hotel`;
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_API_KEY}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].urls.regular;
        }
        return 'https://via.placeholder.com/300x200.png?text=No+Image+Available';
    } catch (error) {
        console.error('Error fetching hotel image:', error);
        return 'https://via.placeholder.com/300x200.png?text=No+Image+Available';
    }
}

async function searchRestaurants(latitude, longitude) {
    try {
        const response = await fetch(`https://api.foursquare.com/v3/places/search?query=restaurant&ll=${latitude},${longitude}&limit=6`, {
            headers: {
                'Authorization': FOURSQUARE_API_KEY,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error searching restaurants:', error);
        throw error;
    }
}

async function searchAttractions(latitude, longitude) {
    try {
        const response = await fetch(`https://api.foursquare.com/v3/places/search?query=attraction&ll=${latitude},${longitude}&limit=6`, {
            headers: {
                'Authorization': FOURSQUARE_API_KEY,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error searching attractions:', error);
        throw error;
    }
}

async function getRandomFact(cityName) {
    try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`);
        const data = await response.json();
        
        if (data.type === "disambiguation") {
            throw new Error("Disambiguation page");
        }

        const sentences = data.extract.split('. ').filter(sentence => sentence.length > 0);
        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)] + '.';

        return randomSentence;
    } catch (error) {
        console.error('Error fetching random fact:', error);
        return `${cityName} is a fascinating place with a rich history and culture.`;
    }
}

function displayRandomFact(fact, cityName) {
    return `
        <div class="bg-blue-100 rounded-lg shadow-lg p-6 mb-8">
            <h3 class="text-2xl sm:text-3xl font-bold text-center mb-4 text-blue-800">Random Fact about ${cityName}</h3>
            <p class="text-blue-900 text-center italic">"${fact}"</p>
        </div>
    `;
}

async function displayHotelList(hotels, cityName) {
    try {
        const hotelPromises = hotels.map(async (hotel) => {
            const imageUrl = await getHotelImage(hotel.name, cityName);
            const encodedHotelName = encodeURIComponent(hotel.name);
            const encodedCityName = encodeURIComponent(cityName);
            
            const bookingLinks = `
                <div class="mt-2 flex justify-between items-center">
                    <a href="https://www.booking.com/search.html?ss=${encodedHotelName}+${encodedCityName}" target="_blank" rel="noopener noreferrer" class="w-1/3 px-2">
                        <img src="../img/booking.png" alt="Booking.com" class="w-2">
                    </a>
                    <a href="https://www.hotels.com/search.do?q-destination=${encodedHotelName}+${encodedCityName}" target="_blank" rel="noopener noreferrer" class="w-1/3 px-2">
                        <img src="https://www.hotels.com/_dms/header/logo.svg?locale=en_GB&siteid=310000033&2&6f9ec7db" alt="Hotels.com" class="w-2">
                    </a>
                    <a href="https://www.expedia.com/Hotel-Search?destination=${encodedHotelName}+${encodedCityName}" target="_blank" rel="noopener noreferrer" class="w-1/3 px-2">
                        <img src="https://www.expedia.com/_dms/header/logo.svg?locale=en_US&siteid=1" alt="Expedia" class="w-2">
                    </a>
                </div>
            `;

            return `
                <div class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                    <img src="${imageUrl}" alt="${hotel.name}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="text-lg font-semibold mb-2 truncate">${hotel.name}</h3>
                        <button onclick="showHotelOffers('${hotel.hotelId}')" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">
                            View Offers
                        </button>
                        ${bookingLinks}
                    </div>
                </div>
            `;
        });

        const hotelListHTML = await Promise.all(hotelPromises);

        return `
            <section class="mb-12">
                <h3 class="text-2xl font-bold text-center mb-6">Hotels in ${cityName}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    ${hotelListHTML.join('')}
                </div>
            </section>
        `;
    } catch (error) {
        console.error('Error in displayHotelList:', error);
        return '<p class="text-center text-red-500 mb-8">An error occurred while displaying hotel results. Please try again.</p>';
    }
}

async function displayRestaurantList(restaurants, cityName) {
    try {
        const restaurantPromises = restaurants.map(async (restaurant) => {
            const imageUrl = await getHotelImage(restaurant.name, cityName);
            return `
                <div class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                    <img src="${imageUrl}" alt="${restaurant.name}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="text-lg font-semibold mb-2 truncate">${restaurant.name}</h3>
                        <p class="text-sm text-gray-600 mb-2 truncate">
                            ${restaurant.categories[0]?.name || 'N/A'}
                        </p>
                        <p class="text-sm text-gray-500 truncate">${restaurant.location.address || 'N/A'}</p>
                    </div>
                </div>
            `;
        });

        const restaurantListHTML = await Promise.all(restaurantPromises);

        return `
            <section class="mb-12">
                <h3 class="text-2xl font-bold text-center mb-6">Restaurants in ${cityName}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    ${restaurantListHTML.join('')}
                </div>
            </section>
        `;
    } catch (error) {
        console.error('Error in displayRestaurantList:', error);
        return '<p class="text-center text-red-500 mb-8">An error occurred while displaying restaurant results. Please try again.</p>';
    }
}

async function displayAttractionList(attractions, cityName) {
    try {
        const attractionPromises = attractions.map(async (attraction) => {
            const imageUrl = await getHotelImage(attraction.name, cityName);
            return `
                <div class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                    <img src="${imageUrl}" alt="${attraction.name}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="text-lg font-semibold mb-2 truncate">${attraction.name}</h3>
                        <p class="text-sm text-gray-600 mb-2 truncate">
                            ${attraction.categories[0]?.name || 'N/A'}
                        </p>
                        <p class="text-sm text-gray-500 truncate">${attraction.location.address || 'N/A'}</p>
                    </div>
                </div>
            `;
        });

        const attractionListHTML = await Promise.all(attractionPromises);

        return `
            <section class="mb-12">
                <h3 class="text-2xl font-bold text-center mb-6">Attractions in ${cityName}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    ${attractionListHTML.join('')}
                </div>
            </section>
        `;
    } catch (error) {
        console.error('Error in displayAttractionList:', error);
        return '<p class="text-center text-red-500 mb-8">An error occurred while displaying attraction results. Please try again.</p>';
    }
}

async function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        try {
            searchResults.innerHTML = `
                <div class="loader">
                    <div class="loader-circle"></div>
                </div>
            `;
            searchResults.classList.remove('hidden');

            await getAccessToken();
            const cityResults = await searchDestinations(query);
            if (cityResults.length > 0) {
                const cityData = cityResults[0];
                const { iataCode: cityCode, name: cityName, geoCode: { latitude, longitude } } = cityData;
                
                const [hotels, restaurants, attractions, randomFact] = await Promise.all([
                    searchHotels(cityCode),
                    searchRestaurants(latitude, longitude),
                    searchAttractions(latitude, longitude),
                    getRandomFact(cityName)
                ]);
                
                let resultsHTML = `
                    <div class="px-4 sm:px-6 lg:px-8">
                        <h2 class="text-3xl sm:text-4xl font-bold text-center mb-8">Discover ${cityName}</h2>
                        ${displayRandomFact(randomFact, cityName)}
                        ${await displayHotelList(hotels, cityName)}
                        ${await displayRestaurantList(restaurants, cityName)}
                        ${await displayAttractionList(attractions, cityName)}
                    </div>
                `;
                
                searchResults.innerHTML = resultsHTML;
            } else {
                searchResults.innerHTML = '<p class="text-center text-gray-500">No results found. Please try a different search.</p>';
            }
        } catch (error) {
            console.error('Error in handleSearch:', error);
            searchResults.innerHTML = '<p class="text-center text-red-500">An error occurred while fetching results. Please try again.</p>';
        }
    }
}

async function showHotelOffers(hotelId) {
    try {
        const offers = await getHotelOffers(hotelId);
        displayHotelOffers(offers);
    } catch (error) {
        console.error('Error in showHotelOffers:', error);
        searchResults.innerHTML = '<p class="text-center text-red-500">An error occurred while fetching hotel offers. Please try again.</p>';
    }
}

function displayHotelOffers(offers) {
    const offersHTML = offers.map(offer => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
            <div class="p-4 md:p-6">
                <h3 class="text-lg md:text-xl font-semibold mb-2 md:mb-3">Room: ${offer.room.type}</h3>
                <p class="text-sm md:text-base text-gray-600 mb-3 md:mb-4 leading-relaxed">
                    Price: ${offer.price.total} ${offer.price.currency}<br>
                    Guests: ${offer.guests.adults} Adults
                </p>
            </div>
        </div>
    `).join('');

    searchResults.innerHTML = `
        <div class="container mx-auto px-4 md:px-12">
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">Hotel Offers</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                ${offersHTML}
            </div>
        </div>
    `;
}

searchForm.addEventListener('submit', handleSearch);

function hideResults() {
    searchResults.classList.add('hidden');
}

window.addEventListener('load', hideResults);
