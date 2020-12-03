// Deckstats API doesn't return cors headers, so we use this site as a proxy
var banListUrl = "https://cors-anywhere.herokuapp.com/https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=148092&id=1724101&response_type=list.json";

var banListCards = [];

export default () => {
  prepareBanlist();
  assignEvents();
  
}

async function prepareBanlist() {
  var banListJSON = await fetchBanlist();
  var banListDict = formatBanList(banListJSON["list"]);
  generateTextArea(banListDict);
  banListCards = await fetchCardsFromDict(banListDict);
  generatePictureArea(banListCards);
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
      if (splitList[i].substr(2) != "") {
        formattedList[category].push(splitList[i].substr(2));
      }
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

async function fetchCard(scryfallUrl, cardName) {
  cardName = cardName.replace(" ", "+");
  var newCard;
  await fetch(`${scryfallUrl}${cardName}`)
    .then(response => response.json())
    .then(fetchData => {
      newCard = new Card(fetchData["name"], fetchData["scryfall_uri"], fetchData["image_uris"]["normal"], fetchData["colors"]);
    });
  return newCard;
}

function generateTextArea(banListDict) {
  var textArea = document.getElementById("banListTextArea");
  var textFill = "";
  var keys = Object.keys(banListDict);
  for(var j=0; j < keys.length; j++){
    var key = keys[j];
    textFill += `<div class="categoryHeader">${key}</div>`;
    var categoryCards = banListDict[key];
    for(var i=0; i< categoryCards.length; i++) {
      textFill += `<div class="textItem">${categoryCards[i]}</div>`;
    }
  }
  textArea.innerHTML = textFill;
}

function generateTextArea(banListCards) {
  var picArea = document.getElementById("banListPictureArea");
  var picFill = "";
  var bannedCards = banListCards.filter(a => a.category == "Banned");
  for(var i=0; i< bannedCards.length; i++) {
    var card = bannedCards[i];
    picFill += `<img src="${card.image_uri}">`    
  }
  picArea.innerHTML = picFill;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Card {
  constructor(name, scryfall_uri, image_uri, colors) {
    this.name = name;
    this.scryfall_uri = scryfall_uri;
    this.image_uri = image_uri;
    this.colors = colors;
    this.category = "";
  }
}
