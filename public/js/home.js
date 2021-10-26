document.addEventListener('DOMContentLoaded', setHistory);

function setHistory() {
    let historyInput = document.getElementById('searchHistoryInput');
    let history = document.getElementsByClassName('historyItem');

    console.log('loaded');
    console.log(history);

    if (history.length > 0) {
        var historyList = history[0].innerText + ";";

        for(let i = 1; i < history.length; i++) {
            historyList = historyList.concat(history[i].innerText, ";");
            console.log("history list: " + historyList);
        }

        historyInput.value = historyList;
    }

}