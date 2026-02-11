const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

const API_KEY = "330206f28353aafff42a4cc0f1064709"; // API key for OpenWeatherMap API

const createWeatherCard = (cityName, weatherItem, index) => {
    // Convert temperatures from Kelvin to Celsius
    const temp = (weatherItem.main.temp - 273.15).toFixed(1);
    const tempMax = (weatherItem.main.temp_max - 273.15).toFixed(1);
    const tempMin = (weatherItem.main.temp_min - 273.15).toFixed(1);
    const windSpeed = weatherItem.wind.speed.toFixed(1);
    const humidity = weatherItem.main.humidity;
    const feelsLike = (weatherItem.main.feels_like - 273.15).toFixed(1);
    const pressure = weatherItem.main.pressure;
    const description = weatherItem.weather[0].description;
    const icon = weatherItem.weather[0].icon;
    
    if(index === 0) { // HTML for the main weather card
        return `<div class="details">
                    <h2><i class="fas fa-city"></i> ${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <div class="weather-stats">
                        <div class="stat-item">
                            <i class="fas fa-temperature-high"></i>
                            <span>Temperature: ${temp}°C</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-temperature-arrow-up"></i>
                            <span>Max Temp: ${tempMax}°C</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-temperature-arrow-down"></i>
                            <span>Min Temp: ${tempMin}°C</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-heart"></i>
                            <span>Feels Like: ${feelsLike}°C</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-wind"></i>
                            <span>Wind: ${windSpeed} M/S</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-droplet"></i>
                            <span>Humidity: ${humidity}%</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-gauge"></i>
                            <span>Pressure: ${pressure} hPa</span>
                        </div>
                    </div>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="weather-icon">
                    <h6>${description}</h6>
                </div>`;
    } else { // HTML for the other five day forecast card
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="weather-icon">
                    <div class="card-stats">
                        <p><i class="fas fa-temperature-high"></i> Temp: ${temp}°C</p>
                        <p><i class="fas fa-temperature-arrow-up"></i> Max: ${tempMax}°C</p>
                        <p><i class="fas fa-temperature-arrow-down"></i> Min: ${tempMin}°C</p>
                        <p><i class="fas fa-wind"></i> Wind: ${windSpeed} M/S</p>
                        <p><i class="fas fa-droplet"></i> Humidity: ${humidity}%</p>
                    </div>
                </li>`;
    }
}

const showLoading = () => {
    currentWeatherDiv.innerHTML = `
        <div class="details" style="text-align: center; width: 100%;">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #fff;"></i>
            <h2 style="margin-top: 20px;">Loading weather data...</h2>
        </div>
    `;
    weatherCardsDiv.innerHTML = "";
}

const showError = (message) => {
    currentWeatherDiv.innerHTML = `
        <div class="details" style="text-align: center; width: 100%;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ffc107;"></i>
            <h2 style="margin-top: 20px; font-size: 1.5rem;">${message}</h2>
        </div>
    `;
    weatherCardsDiv.innerHTML = "";
}

const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    showLoading();

    fetch(WEATHER_API_URL).then(response => response.json()).then(data => {
        // Group forecasts by date and calculate daily max/min temperatures
        const dailyData = {};
        
        data.list.forEach(forecast => {
            const date = forecast.dt_txt.split(" ")[0];
            
            if (!dailyData[date]) {
                dailyData[date] = {
                    temps: [],
                    humidity: [],
                    windSpeed: [],
                    pressure: [],
                    weather: forecast.weather[0],
                    dt_txt: forecast.dt_txt
                };
            }
            
            dailyData[date].temps.push(forecast.main.temp);
            dailyData[date].humidity.push(forecast.main.humidity);
            dailyData[date].windSpeed.push(forecast.wind.speed);
            dailyData[date].pressure.push(forecast.main.pressure);
        });

        // Convert to array and calculate aggregates
        const fiveDaysForecast = Object.keys(dailyData).slice(0, 6).map(date => {
            const dayData = dailyData[date];
            return {
                dt_txt: dayData.dt_txt,
                date: date,
                weather: [dayData.weather],
                main: {
                    temp: dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length, // Average temp
                    temp_max: Math.max(...dayData.temps), // Real max temp for the day
                    temp_min: Math.min(...dayData.temps), // Real min temp for the day
                    humidity: Math.round(dayData.humidity.reduce((a, b) => a + b, 0) / dayData.humidity.length),
                    pressure: Math.round(dayData.pressure.reduce((a, b) => a + b, 0) / dayData.pressure.length),
                    feels_like: dayData.temps[0] // Use first available for feels_like
                },
                wind: {
                    speed: dayData.windSpeed.reduce((a, b) => a + b, 0) / dayData.windSpeed.length
                }
            };
        });

        // Clearing previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        // Creating weather cards and adding them to the DOM with animation
        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
                // Add fade-in animation
                setTimeout(() => {
                    currentWeatherDiv.style.opacity = '0';
                    currentWeatherDiv.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        currentWeatherDiv.style.transition = 'all 0.5s ease';
                        currentWeatherDiv.style.opacity = '1';
                        currentWeatherDiv.style.transform = 'scale(1)';
                    }, 10);
                }, 10);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
                // Add staggered animation to cards
                const cards = weatherCardsDiv.querySelectorAll('.card');
                cards.forEach((card, cardIndex) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.transition = 'all 0.5s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, cardIndex * 100);
                });
            }
        });        
    }).catch(() => {
        showError("An error occurred while fetching the weather forecast!");
    });
}

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") {
        showError("Please enter a city name!");
        return;
    }
    
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    // Add loading state to button
    searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    searchButton.disabled = true;
    
    // Get entered city coordinates (latitude, longitude, and name) from the API response
    fetch(API_URL).then(response => response.json()).then(data => {
        if (!data.length) {
            showError(`No coordinates found for ${cityName}`);
            searchButton.innerHTML = '<i class="fas fa-search"></i> Search Weather';
            searchButton.disabled = false;
            return;
        }
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
        
        // Reset button
        searchButton.innerHTML = '<i class="fas fa-search"></i> Search Weather';
        searchButton.disabled = false;
    }).catch(() => {
        showError("An error occurred while fetching the coordinates!");
        searchButton.innerHTML = '<i class="fas fa-search"></i> Search Weather';
        searchButton.disabled = false;
    });
}

const getUserCoordinates = () => {
    // Add loading state to button
    locationButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
    locationButton.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; // Get coordinates of user location
            // Get city name from coordinates using reverse geocoding API
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL).then(response => response.json()).then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
                
                // Reset button
                locationButton.innerHTML = '<i class="fas fa-location-crosshairs"></i> Use Current Location';
                locationButton.disabled = false;
            }).catch(() => {
                showError("An error occurred while fetching the city name!");
                locationButton.innerHTML = '<i class="fas fa-location-crosshairs"></i> Use Current Location';
                locationButton.disabled = false;
            });
        },
        error => { // Show alert if user denied the location permission
            let errorMessage = "Geolocation request error.";
            if (error.code === error.PERMISSION_DENIED) {
                errorMessage = "Location access denied. Please enable location permissions.";
            }
            showError(errorMessage);
            locationButton.innerHTML = '<i class="fas fa-location-crosshairs"></i> Use Current Location';
            locationButton.disabled = false;
        });
}

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add input validation feedback
cityInput.addEventListener('input', function() {
    if (this.value.trim() !== '') {
        this.style.borderColor = '#5372F0';
    } else {
        this.style.borderColor = '#e0e0e0';
    }
});

// Add enter key animation
cityInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        searchButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            searchButton.style.transform = 'scale(1)';
        }, 100);
    }
});

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

// Add initial animation to info cards
window.addEventListener('load', () => {
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, 1000 + (index * 150));
    });
});
