const userLocationInput = document.getElementById("userLocation");
const converterSelect = document.getElementById("converter");
const weatherIconDiv = document.querySelector(".weather-icon");
const temperatureText = document.querySelector(".temperature");
const feelsLikeText = document.querySelector(".feels-like");
const descriptionText = document.querySelector(".description");
const dateText = document.querySelector(".date");
const cityText = document.querySelector(".city");

const humidityValue = document.getElementById("humidity-value");
const windValue = document.getElementById("wind-value");
const sunriseValue = document.getElementById("sunrise-value");
const sunsetValue = document.getElementById("sunset-value");
const cloudsValue = document.getElementById("clouds-value");
const pressureValue = document.getElementById("pressure-value");

const forecastContainer = document.querySelector(".forecast");

const API_KEY = "5d649c5c147004c7a9e2b651b32f1580";

function formatTemperature(temp, unit) {
    if (unit === 'metric') {
        return Math.round(temp) + "°C";
    } else {
        return Math.round(temp) + "°F";
    }
}

function formatWindSpeed(speed, unit) {
    let value = speed;
    let speedUnit = "m/s";

    if (unit === 'imperial') {
        value = speed * 2.237;
        speedUnit = "mph";
    }
    return value.toFixed(1) + " " + speedUnit;
}

function capitalizeWords(str) {
    const words = str.split(' ');
    const capitalizedWords = words.map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return capitalizedWords.join(' ');
}

function findUserLocation() {
    const cityName = userLocationInput.value.trim();
    const unit = converterSelect.value;

    if (!cityName) {
        alert("Please enter a city name to search!");
        clearWeatherData();
        return;
    }

    const CURRENT_WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=${unit}`;
    const FORECAST_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=${unit}`;

    fetch(CURRENT_WEATHER_URL)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || "City not found or API error.");
                });
            }
            return response.json();
        })
        .then(data => {
            const iconCode = data.weather[0].icon;
            const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const currentDateTime = new Date();
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedCurrentDate = currentDateTime.toLocaleDateString(undefined, dateOptions);

            weatherIconDiv.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@4x.png" alt="Weather Icon">`;
            temperatureText.textContent = formatTemperature(data.main.temp, unit);
            feelsLikeText.textContent = `Feels Like: ${formatTemperature(data.main.feels_like, unit)}`;
            descriptionText.textContent = capitalizeWords(data.weather[0].description);
            cityText.textContent = `${data.name}, ${data.sys.country}`;
            dateText.textContent = formattedCurrentDate;

            humidityValue.textContent = `${data.main.humidity}%`;
            windValue.textContent = formatWindSpeed(data.wind.speed, unit);
            sunriseValue.textContent = sunriseTime;
            sunsetValue.textContent = sunsetTime;
            cloudsValue.textContent = `${data.clouds.all}%`;
            pressureValue.textContent = `${data.main.pressure} hPa`;
        })
        .catch(error => {
            console.error("Error fetching current weather data:", error);
            alert("Error: " + error.message + " Please try again.");
            clearWeatherData();
        });

    fetch(FORECAST_URL)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || "Forecast data not available.");
                });
            }
            return response.json();
        })
        .then(forecastData => {
            if (forecastData.cod !== "200") {
                throw new Error(forecastData.message || "Forecast data not available.");
            }

            forecastContainer.innerHTML = "";

            const dailyForecasts = new Map();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let count = 0;
            for (const entry of forecastData.list) {
                const forecastDate = new Date(entry.dt_txt);
                forecastDate.setHours(0, 0, 0, 0);

                if (forecastDate.getTime() > today.getTime() && count < 5) {
                    const dateKey = forecastDate.toDateString();
                    if (!dailyForecasts.has(dateKey)) {
                        dailyForecasts.set(dateKey, entry);
                        count++;
                    }
                }
            }
            
            if (dailyForecasts.size === 0) {
                forecastContainer.innerHTML = "<p class='no-data-message'>No future forecast data available.</p>";
            } else {
                dailyForecasts.forEach(entry => {
                    forecastContainer.innerHTML += `
                        <div>
                            <p><strong>${new Date(entry.dt_txt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong></p>
                            <img src="https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png" alt="${entry.weather[0].description}"/>
                            <p>${capitalizeWords(entry.weather[0].description)}</p>
                            <p>${formatTemperature(entry.main.temp, unit)}</p>
                        </div>
                    `;
                });
            }
        })
        .catch(error => {
            console.error("Error fetching forecast data:", error);
            alert("Error fetching forecast: " + error.message + " Please try again.");
            forecastContainer.innerHTML = "<p class='error-message'>Error loading forecast data.</p>";
        });
}

function clearWeatherData() {
    weatherIconDiv.innerHTML = "";
    temperatureText.textContent = "--°C";
    feelsLikeText.textContent = "Feels Like: --°C";
    descriptionText.textContent = "--";
    cityText.textContent = "Search a city to see weather";
    dateText.textContent = "--";

    humidityValue.textContent = "--%";
    windValue.textContent = "-- m/s";
    sunriseValue.textContent = "--";
    sunsetValue.textContent = "--";
    cloudsValue.textContent = "--%";
    pressureValue.textContent = "-- hPa";

    forecastContainer.innerHTML = "<p class='no-data-message'>Forecast data will appear here.</p>";
}

window.onload = () => {
    clearWeatherData();

    userLocationInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            findUserLocation();
        }
    });

    converterSelect.addEventListener('change', () => {
        if (userLocationInput.value.trim() !== '') {
            findUserLocation();
        }
    });
};