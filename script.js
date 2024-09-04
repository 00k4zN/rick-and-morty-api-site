const CACHE_KEY = 'rm-characters';

// Rastgele sayılar üreten fonksiyon
function getRandomNums({ max, total }) {
    const arr = [];
    const randomNum = () => Math.floor(Math.random() * max + 1);

    if (total === 1) {
        return randomNum();
    }

    while (arr.length < total) {
        const num = randomNum();
        if (arr.indexOf(num) > -1) {
            continue;
        }
        arr[arr.length] = num;
    }

    return arr;
}

// GraphQL sorgusunu oluşturan fonksiyon
function graphqlQuery(ids) {
    return {
        query: `
            query randomCharacters($ids: [ID!]!) {
                charactersByIds(ids: $ids) {
                    id
                    name
                    status
                    species
                    image
                    episode {
                        name
                        id
                    }
                    location {
                        name
                        id
                    }
                }
            }
        `,
        variables: { ids }
    };
}

// Rastgele karakterleri almak için kullanılan fonksiyon
async function getRandomCharacters({ total, siteUrl, info }) {
    const cardContainer = document.querySelector('.card-container');

    if (cardContainer) {
        cardContainer.innerHTML = '';

        if (sessionStorage.getItem(CACHE_KEY)) {
            const cachedCharacters = JSON.parse(sessionStorage.getItem(CACHE_KEY));
            displayCharacters(cachedCharacters.slice(0, total));
            return;
        }

        try {
            const res = await fetch(`${siteUrl}/graphql`, {
                method: 'POST',
                body: JSON.stringify(graphqlQuery(getRandomNums({ max: info.count, total }))),
                headers: {
                    'content-type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error('Network response was not ok');
            }

            const { data } = await res.json();
            const characters = data.charactersByIds.map((item) => ({
                ...item,
                url: `${siteUrl}/api/character/${item.id}`,
                episode: {
                    name: item.episode[0].name,
                    url: `${siteUrl}/api/episode/${item.episode[0].id}`,
                },
                location: {
                    name: item.location.name,
                    url: `${siteUrl}/api/location/${item.location.id}`,
                },
            }));

            sessionStorage.setItem(CACHE_KEY, JSON.stringify(characters));
            displayCharacters(characters.slice(0, total));
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    } else {
        console.error('Card container not found');
    }
}

// Karakterleri ekrana ekleme fonksiyonu
function displayCharacters(characters) {
    const cardContainer = document.querySelector('.card-container');

    if (cardContainer) {
        characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'card';

            // Karakterin durumu için class ismi belirleme
            const statusClass = character.status.toLowerCase(); // alive, dead, unknown

            card.innerHTML = `
                <img class="character-image" src="${character.image}" alt="${character.name}">
                <div class="character-info">
                    <div class="section">
                        <h2 class="character-name"><a href="name.html?id=${character.id}">${character.name}</a></h2>
                        <span class="status">
                            <span class="status-icon ${statusClass}"></span>
                            <span class="status-text">${character.status} - ${character.species}</span>
                        </span>
                    </div>
                    <div class="section">
                        <p class="character-location">Last known location: <a href="#" class="location-link" data-url="${character.location.url}">${character.location.name}</a></p>
                        <p class="character-origin">First seen in: <a href="#" class="episode-link" data-url="${character.episode.url}">${character.episode.name}</a></p>
                    </div>
                </div>
            `;
            cardContainer.appendChild(card);
        });
    } else {
        console.error('Card container not found');
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    const siteUrl = "https://rickandmortyapi.com";
    const info = { count: 826 }; 
    const totalCharacters = 6; 

    getRandomCharacters({ total: totalCharacters, siteUrl, info });

    const charactersLinkFooter = document.getElementById('characters-link-footer');
    const locationsLinkFooter = document.getElementById('locations-link-footer');
    const episodesLinkFooter = document.getElementById('episodes-link-footer');

    if (charactersLinkFooter) {
        charactersLinkFooter.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const response = await fetch('https://rickandmortyapi.com/api/character');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                localStorage.setItem('characterData', JSON.stringify(data));
                window.location.href = 'characters.html';
            } catch (error) {
                console.error('There has been a problem with your fetch operation:', error);
            }
        });
    } else {
        console.error('Characters link in footer not found');
    }

    if (locationsLinkFooter) {
        locationsLinkFooter.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const response = await fetch('https://rickandmortyapi.com/api/location');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                localStorage.setItem('locationData', JSON.stringify(data));
                window.location.href = 'locations.html';
            } catch (error) {
                console.error('There has been a problem with your fetch operation:', error);
            }
        });
    } else {
        console.error('Locations link in footer not found');
    }

    if (episodesLinkFooter) {
        episodesLinkFooter.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const response = await fetch('https://rickandmortyapi.com/api/episode');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                localStorage.setItem('episodeData', JSON.stringify(data));
                window.location.href = 'episodes.html';
            } catch (error) {
                console.error('There has been a problem with your fetch operation:', error);
            }
        });
    } else {
        console.error('Episodes link in footer not found');
    }

    // "Last known location" ve "First seen in" bağlantılarına tıklama olaylarının eklenmesi
    const cardContainer = document.querySelector('.card-container');
    if (cardContainer) {
        cardContainer.addEventListener('click', async (event) => {
            if (event.target.classList.contains('location-link') || event.target.classList.contains('episode-link')) {
                event.preventDefault();

                const url = event.target.getAttribute('data-url');
                const type = event.target.classList.contains('location-link') ? 'location' : 'episode';

                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();

                    // Veriyi saklayalım
                    localStorage.setItem(`${type}Data`, JSON.stringify(data));

                    // Veriyi gösterecek bir sayfaya yönlendirelim
                    window.location.href = `${type}.html`;
                } catch (error) {
                    console.error('There has been a problem with your fetch operation:', error);
                }
            }
        });
    } else {
        console.error('Card container not found');
    }
});
