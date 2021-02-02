'use strict';

// API key
const key = '8f90a523857e6bd1c1a5c4378b3daa52';

// Converts a Date object to an object of date parts
const dateParts = (options, date = undefined) => (
    new Intl.DateTimeFormat('en-US', options).formatToParts(date).reduce(
        (carry, item) => ({...carry, [item.type]: item.value}),
        {}
    )
);

// Returns an ordinal for a number: "th", "st", "nr" or "rd"
const getOrdinal = number => {
    if (number >= 11 && number <= 19) return 'th';

    const unity = number % 10;

    switch (unity) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
    }

    return 'th';
};

const locationElement = document.querySelector('.location');
const zipCodeButton = document.querySelector('.zip-code__button');

// Calls the OpenWeatherMap API and displays the results
const displayWeather = async (options = {}) => {
    const parentElement = document.querySelector('.weather__entries');

    parentElement.innerHTML = '';
    locationElement.textContent = '';
    zipCodeButton.textContent = 'Not Here?';

    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?${new URLSearchParams({
        appId: key,
        cnt: 8,
        units: 'imperial',
        ...options
    })}`;

    let response;

    try {
        response = await fetch(apiUrl);

        if (!response.ok) throw new Error('API request failed');
    } catch {
        locationElement.textContent = 'invalid ZIP code';
        zipCodeButton.textContent = 'Please Try Again';
        return;
    }

    const {city: {name: locationName}, list: weatherEntries} = await response.json();
    const template = document.getElementById('weather-template');

    parentElement.innerHTML = '';
    locationElement.textContent = locationName;

    // Iterating through the received weather entries
    for (const {dt: timestamp, main: {temp: temperature}, weather: [{icon, description}]} of weatherEntries) {
        const entryElement = template.content.cloneNode(true);
        const iconElement = entryElement.querySelector('.weather__icon');

        // Using dateParts() to natively get 12-hour time format
        const {hour, dayPeriod} = dateParts(
            {hour: 'numeric', hour12: true},
            new Date(timestamp * 1000)
        );

        entryElement.querySelector('.weather__hour').textContent = `${hour}${dayPeriod[0].toLowerCase()}`;
        entryElement.querySelector('.weather__temperature').textContent = `${Math.round(temperature)}°`;
        iconElement.src = `images/${icon}.svg`;
        iconElement.alt = description;

        parentElement.appendChild(entryElement);
    }
};

// Getting current date
const today = dateParts({year: 'numeric', month: 'long', day: 'numeric'});

// Displaying current date
const currentDate = `${today.month} ${today.day}${getOrdinal(today.day)}, ${today.year}`;
document.querySelector('.date').textContent = currentDate;

document.querySelector('.zip-form').addEventListener('submit', event => {
    event.preventDefault();
    const zipCode = new FormData(event.target).get('zip-code');
    displayWeather({zip: zipCode});
});

document.querySelector('.zip-code__button').addEventListener('click', () => {
    document.querySelector('.zip-form').elements['zip-code'].select();
});

// Getting user's position
navigator.geolocation.getCurrentPosition(
    // Displaying weather on success
    ({coords: {latitude, longitude}}) => displayWeather({lat: latitude, lon: longitude}),

    // Handling unknown position (usually caused by no permission) in a nice way
    () => {
        locationElement.textContent = 'Planet Earth';
        zipCodeButton.textContent = 'Please Enter ZIP Code Below';
        document.querySelector('.zip-form').elements['zip-code'].select();
    }
);
