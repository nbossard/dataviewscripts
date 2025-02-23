// vim: set tabstop=2 shiftwidth=2 expandtab:
// Copyright : Nicolas BOSSARD 2024
// licence : MIT
//
// This script will download and parse the OSM XML data for a given node ID
// and display the name and the opening hours in the current dataview block.
//
// This source file is aimed to be executed in a dataviewjs block
// It should be called with blocks like following :
// ```dataviewjs
// await dv.view("scripts/loadosmdata", 'Château de Vaux-le-Vicomte')
// ```
// where 'Château de Vaux-le-Vicomte' is the name of the place to be loaded.


/**
 * Clean up place name by replacing special characters
 * @param {string} name The place name to clean
 * @returns {string} The cleaned place name
 */
function cleanPlaceName(name) {
  return name
    .replace(/_/g, ' ')  // Replace underscores with spaces
    .trim();             // Remove leading/trailing spaces
}

/**
 * Recherche les éléments OSM d'un lieu par son nom via l'API Overpass
 * @param {string} placeName Le nom du lieu à rechercher
 * @returns {Promise<Array<{type: string, id: number}>>} Un tableau des éléments OSM (type et ID) des lieux trouvés
 */
async function findOSMElementsByName(placeName) {
  const cleanedName = cleanPlaceName(placeName);
  const encodedName = encodeURIComponent(cleanedName);
  // sample url
  // https://overpass-api.de/api/interpreter?data=[out:json];(way[%22name%22=%22Ch%C3%A2teau%20de%20Vaux-le-Vicomte%22];node[%22name%22=%22Ch%C3%A2teau%20de%20Vaux-le-Vicomte%22];);out%20body;
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];(way["name"="${encodedName}"];node["name"="${encodedName}"];);out body;`;
  console.log ("overpassUrl : " + overpassUrl);

  const response = await fetch(overpassUrl);
  if (!response.ok) {
    throw new Error('Erreur lors de la recherche du lieu avec ' + overpassUrl);
  }

  const data = await response.json();
  if (data.elements.length === 0) {
    throw new Error(`Aucun lieu trouvé avec le nom : ${placeName}`);
  }

  return data.elements;
}

/**
 * Download and parse the OSM XML data for a given node ID
 * @param {string} parNodeType The openstreetmap type : "way" or "node"
  * @param {number} parNodeID The openstreetmap node ID of the place to be loaded. E.g. : 94436175
  * @returns {Promise<{name: string, openingHours: string, website: string, wikipedia: string, image: string, url: string}>} Parsed place data
 * @throws {Error} If the XML fetch or parsing fails
 */
async function downloadAndParseOSMXML(parNodeType, parNodeID) {
  const xmlUrl = "https://www.openstreetmap.org/api/0.6/" + parNodeType + "/" + parNodeID;
  console.log('XML to be downloaded is : ' + xmlUrl);

  const response = await fetch(xmlUrl);
  if (!response.ok) {
    throw new Error('Network response was not ok (for ID ' + parNodeID + ')');
  }

  const xmlData = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlData, "application/xml");

  const tags = xmlDoc.getElementsByTagName("tag");
  let name = '';
  let openingHours = '';
  let website = '';
  let wikipedia = '';
let image = '';
let url = '';

for (let tag of tags) {
  const key = tag.getAttribute("k");
  const value = tag.getAttribute("v");

  switch(key) {
    case "name": name = value; break;
    case "opening_hours": openingHours = value; break;
    case "website": website = value; break;
    case "wikipedia": wikipedia = value; break;
    case "image": image = value; break;
    case "url": url = value; break;
  }
}

return { name, openingHours, website, wikipedia, image, url };
}

/**
 * Display the place data in the current dataview
 * @param {{name: string, openingHours: string, website: string, wikipedia: string, image: string, url: string}} placeData The place data to display
 * @param {object} dv The dataview API object
 */
function displayPlaceData(placeData, dv) {
  const { name, openingHours, website, wikipedia, image, url } = placeData;

  console.log("Nom :", name);
  console.log("Heures d'ouverture :", openingHours);
  console.log("Website :", website);
  console.log("Wikipedia :", wikipedia);
  console.log("Image :", image);
  console.log("URL :", url);

  dv.paragraph(`Nom : ${name}`);

  if (openingHours) {
    dv.paragraph(`Heures d'ouverture : ${openingHours}`);
  }

  if (website) {
    dv.paragraph(`Website : <${website}>`);
  }

  if (url) {
    dv.paragraph(`URL : <${url}>`);
  }

  if (wikipedia) {
    const wikipediaLink = `https://fr.wikipedia.org/wiki/${wikipedia.split(':')[1]}`;
    const wikipediaLink2 = wikipediaLink.replace(/ /g, '%20');
    dv.paragraph(`Wikipedia : <${wikipediaLink2}>`);
  }

  if (image) {
    dv.paragraph(`Images : <${image}>`);
  }
}

/**
 * Format the place data in the current dataview
 * @param {{name: string, openingHours: string, website: string, wikipedia: string, image: string, url: string}} placeData The place data to display
 * @param {object} dv The dataview API object
 */
function formatPlaceData(placeData, dv) {
  const { name, openingHours, website, wikipedia, image, url } = placeData;
const result = [];

result.push(`Nom : ${name}`);

if (openingHours) {
  result.push(`Heures d'ouverture : ${openingHours}`);
}

if (website) {
  result.push(`Website : <${website}>`);
}

if (url) {
  result.push(`URL : <${url}>`);
}

if (wikipedia) {
  const wikipediaLink = `https://fr.wikipedia.org/wiki/${wikipedia.split(':')[1]}`;
  const wikipediaLink2 = wikipediaLink.replace(/ /g, '%20');
  result.push(`Wikipedia : <${wikipediaLink2}>`);
}

if (image) {
  result.push(`![${name}](${image})`);
}

return result;
}

/**
 * Point d'entrée principal du script
 * @param {string} placeName Le nom du lieu à rechercher
 */
async function main(placeName) {
  try {
    const elements = await findOSMElementsByName(placeName);

    // Collect all place data
    const allPlaceData = await Promise.all(
      elements.map(element => downloadAndParseOSMXML(element.type, element.id))
    );

    // Merge all place data into a single record
    const mergedPlaceData = allPlaceData.reduce((merged, current) => {
      return {
        name: merged.name || current.name,
        openingHours: merged.openingHours || current.openingHours,
        website: merged.website || current.website,
        wikipedia: merged.wikipedia || current.wikipedia,
        image: merged.image || current.image,
        url: merged.url || current.url
      };
    }, {});

    // Display the merged data
    displayPlaceData(mergedPlaceData, dv);

    // other solution for dataview publisher return the place data
    // return formatPlaceData(mergedPlaceData);

  } catch (error) {
    console.error('Erreur :', error);
    dv.paragraph(`💣 Erreur : ${error.message}`);
  }
}

// Remplacer l'appel direct par l'appel à main()
console.log(input)
main(input);
