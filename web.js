// Deckstats API doesn't return cors headers, so we use this site as a proxy
var banListUrl = "https://cors-anywhere.herokuapp.com/https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=148092&id=1724101&response_type=list.json";

var banListCards = [];

export default () => {
  prepareBanlist();
  console.log(banListCards);
  
}

async function prepareBanlist() {
  var banListJSON = await fetchBanlist();
  var banListDict = formatBanList(banListJSON["list"]);
  banListCards = await fetchCardsFromDict(banListDict);
}

async function fetchBanlist() {
  var data;
  await fetch(banListUrl)
    .then(response => response.json())
    .then(fetchData => {
      data = fetchData;
    });
  return data;
}

// Returns a dictionary formatted as {Category Title: [Cards in category]}
function formatBanList(banList) {
  var formattedList = {};
  var splitList = banList.split("\n");
  var category = "Default Category";
  for(var i=0; i < splitList.length; i++) {
    var categoryCheck = splitList[i].substr(0,2) == "//";
    if (categoryCheck) {
      category = splitList[i].substr(2);
      formattedList[category] = [];
    }
    else {
      formattedList[category].push(splitList[i].substr(2));
    }
  }
  return formattedList;
}

async function fetchCardsFromDict(banListDict) {
  var scryfallUrl = " https://api.scryfall.com/cards/named?exact=";
  var cardName = "";
  var cardList = []; 
  var keys = Object.keys(banListDict);
  
  for(var keyit=0; keyit < keys.length; keyit++) {
    var key = keys[keyit];
    for(var i=0; i < banListDict[key].length; i++) {
      cardName = banListDict[key][i];
      var newCard = await fetchCard(scryfallUrl, cardName);
      newCard.category = key;
      cardList.push(newCard);
      sleep(50);
    }
  }
  
  return cardList; 
}

function fetchCard(scryfallUrl, cardName) {
  cardName = cardName.replace(" ", "+");
  var newCard;
  await fetch(`${scryfallUrl}${cardName}`)
    .then(response => response.json())
    .then(fetchData => {
      newCard = new Card(fetchData["scryfall_uri"], fetchData["image_uris"]["png"], fetchData["colors"]);
    });
  return newCard;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Card {
  constructor(scryfall_uri, image_uri, colors) {
    this.scryfall_uri = scryfall_uri;
    this.image_uri = image_uri;
    this.colors = colors;
    this.category = "";
  }
}
