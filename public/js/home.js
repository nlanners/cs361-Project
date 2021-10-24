document.addEventListener('DOMContentLoaded', setHistory);

function setHistory() {
    let historyInput = document.getElementById('searchHistoryInput');
    let historyList = "";
    let history = document.getElementsByClassName('historyItem');

    console.log('loaded');
    console.log(history);

    for(let i = 0; i < history.length; i++) {
        historyList = historyList.concat(history[i].innerText, ";");
        console.log(historyList);
    }

    historyInput.value = historyList;
}