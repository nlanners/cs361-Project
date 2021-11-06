document.addEventListener('DOMContentLoaded', setHistory);

function setHistory() {
    let historyInput = document.getElementsByClassName('searchHistoryInput');
    let history = document.getElementsByClassName('historyItem');

    console.log('loaded');
    console.log(history);

    if (history.length > 0) {
        let historyList = history[0].value + ";";

        for(let i = 1; i < history.length; i++) {
            historyList = historyList.concat(history[i].value, ";");

        }
        for(let j = 0; j < historyInput.length; j++) {
            historyInput[j].value = historyList;
        }
    }

}