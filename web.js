// Deckstats API doesn't return cors headers, so we use this site as a proxy
var banListUrl = "https://cors-anywhere.herokuapp.com/https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=148092&id=1724101&response_type=list.json";


export default () => {
  prepareBanlist();
  assignEvents();
  
}

async function prepareBanlist() {
  var banListJSON = await fetchBanlist();
  var banListDict = formatBanList(banListJSON["list"]);
  var banListCards = await fetchCardsFromDict(banListDict);
//   generatePictureArea(banListCards);
  generateTextArea(banListCards);
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

function generateTextArea(banListCards) {
  var textArea = document.getElementById("banListTextArea");
  var textFill = "";
  var categories = banListCards.map(a => a.category);
  for(var j=0; j < categories.length; j++){
    var category = categories[j];
    textFill += `<div class="banCategory">
                    <div class="categoryHeader">${category}</div>
                    <div class="bannedItems">`;
    var categoryCards = banListCards.filter(a => a.category == category);
    for(var i=0; i< categoryCards.length; i++) {
      var card = categoryCards[i];
      textFill += `<div class="textItem ${card.colors.join(" ")}">${card.name}</div>`;
    }
    textFill += "</div></div>"
  }
  textFill += "</div>"
  textArea.innerHTML = textFill;
}

// function generatePictureArea(banListCards) {
//   var picArea = document.getElementById("banListPictureArea");
//   var picFill = "";
//   var bannedCards = banListCards.filter(a => a.category == "Banned");
//   for(var i=0; i< bannedCards.length; i++) {
//     var card = bannedCards[i];
//     picFill += `<img src="${card.image_uri}">`    
//   }
//   picArea.innerHTML = picFill;
// }

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
