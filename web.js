var banListUrl = "https://cors-anywhere.herokuapp.com/https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=148092&id=1724101&response_type=list.json";


export default () => {        
  var banlist = fetchBanlist()

}

function fetchBanlist() {
  fetch(banListUrl, {mode: 'cors'})
    .then(response => response.json())
    .then(fetchData => {
      console.log(fetchData);
    });
  return;
}
