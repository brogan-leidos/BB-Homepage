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
      newCard = new Card(fetchData["name"], fetchData["scryfall_uri"], fetchData["image_uris"]["small"], fetchData["colors"], fetchData["type_line"], fetchData["oracle_text"]);
    });
  return newCard;
}

function generateTextArea(banListCards) {
  var textArea = document.getElementById("banListTextArea");
  var textFill = "";
  var categories = banListCards.map(a => a.category);
  categories = [...new Set(categories)];
  for(var j=0; j < categories.length; j++){
    var category = categories[j];
    textFill += `<div class="banCategory">
                    <div class="categoryHeader">${category}</div>
                    <div class="bannedItems">`;
    var categoryCards = banListCards.filter(a => a.category == category);
    for(var i=0; i< categoryCards.length; i++) {
      textFill += generateCardEntryHtml(categoryCards[i]);
    }
    textFill += "</div></div>"
  }
  textFill += ""
  textArea.innerHTML = textFill;
  createDeckCheckArea();
}

function createDeckCheckArea() {
  document.getElementById("deckCheckArea").style.display = "block";
  document.getElementById("deckCheckArea").addEventListener('change', (e) => {
    alert("deck area changed!")
  });
}

function generateCardEntryHtml(card) {
  var color = card.colors.length <= 1 ? card.colors.join("") : "gold";
  return `<div class="textItem ${color}">${card.name}
                     <div class="itemDetails">
                        <div class="pic">
                            <img src="${card.image_uri}">
                        </div>
                        <div class="type">
                          ${card.type_line}
                        </div>
                        <div class="desc">  
                          ${card.oracle_text}
                        </div>
                   </div></div>`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Card {
  constructor(name, scryfall_uri, image_uri, colors, type_line, oracle_text) {
    this.name = name;
    this.scryfall_uri = scryfall_uri;
    this.image_uri = image_uri;
    this.colors = colors;
    this.type_line = type_line;
    this.oracle_text = oracle_text;
    this.category = "";
  }
}
