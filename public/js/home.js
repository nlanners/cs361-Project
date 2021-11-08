document.addEventListener('DOMContentLoaded', setHistory);


function setHistory() {
    const forms = document.getElementsByClassName('search_form');

    for (let h = 0; h < forms.length; h++) {
        forms[h].addEventListener('submit', searching);
    }


    let historyInput = document.getElementsByClassName('searchHistoryInput');
    let history = document.getElementsByClassName('historyItem');

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

function searching() {
    const submitButton = document.getElementById('submit');
    const loadingButton = document.createElement('button');
    let node = document.createElement('span');
    let textNode = document.createTextNode('  Searching...');

    submitButton.parentNode.replaceChild(loadingButton, submitButton);

    loadingButton.setAttribute('disabled', 'true');
    loadingButton.setAttribute('role', 'status');
    loadingButton.setAttribute('aria-hidden', 'true');
    loadingButton.setAttribute('class', 'btn btn-primary form-control')
    loadingButton.appendChild(node);
    node.setAttribute('class', 'spinner-border spinner-border-sm');
    node.setAttribute('role', 'status');
    node.setAttribute('aria-hidden', 'true');
    loadingButton.appendChild(textNode);

}