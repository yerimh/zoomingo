/**
 * Yerim Heo
 * 12/3/2020
 * CSE 154 AF Wilson Tang
 * This is the "zoomingo.js" file of the Zoomingo final project,which defines the
 * behavior of the how the board is displayed and how the bingo game is played.
 */
"use strict";

(function() {

  // MODULE GLOBAL VARIABLES, CONSTANTS, AND HELPER FUNCTIONS CAN BE PLACED HERE

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * Checks local storage for IDs and initializes all buttons and drop-downs
   */
  function init() {
    checkLocalStorage();
    id('size-select').addEventListener('change', function() {
      showCards(parseInt(this.value));
    });
    id('new-game').addEventListener('click', newGame);
    id('reset').addEventListener('click', resetGame);
    id('bingo').addEventListener('click', bingo);
    id('resume').addEventListener('click', resumeGame);
  }

  /**
   * Checks the local storage and disables/enables the resume button
   */
  function checkLocalStorage() {
    if (window.localStorage.getItem('game_id') && window.localStorage.getItem('player_id')) {
      id('resume').disabled = false;
    } else {
      id('resume').disabled = true;
    }
  }

  /**
   * Shows the appropriate number of cards on the board
   * @param {number} num the size of the board (total number of cards)
   */
  function showCards(num) {
    id('board').innerHTML = '';
    for (let i = 0; i < num; i++) {
      let card = gen('div');
      card.classList.add('square');
      if (num === 9) {
        card.classList.add('three');
      } else if (num === 25) {
        card.classList.add('five');
      } else if (num === 49) {
        card.classList.add('seven');
      } else if (num === 81) {
        card.classList.add('nine');
      }
      let scen = gen('p');
      scen.classList.add('scenario');
      scen.addEventListener('click', selectScenario);
      card.appendChild(scen);
      id('board').appendChild(card);
    }
  }

  /**
   * Calls the API to make a new game
   */
  function newGame() {
    if (id('size-select').value === '0') {
      id('error').textContent = 'Error: Please select a board size.';
    } else if (!id('name').value) {
      id('error').textContent = 'Error: Please enter your name.';
    } else {
      id('error').textContent = '';
      id('name').disabled = true;
      id('new-game').disabled = true;
      id('size-select').disabled = true;
      fetch('/newGame?size=' + id('size-select').value + '&name=' + id('name').value)
        .then(checkStatus)
        .then(resp => resp.json())
        .then(showScenarios)
        .catch(handleError);
    }
  }

  /**
   * Shows the scenarios on the cards and saves game and player ID to local storage
   * @param {JSON} game the JSON response of the game statistics
   */
  function showScenarios(game) {
    showCards(game.player.board.length);
    let scenarios = game.player.board;
    let pTags = document.getElementsByClassName("scenario");
    if (scenarios.length < pTags.length) {
      id('error').textContent = 'Error: There are not enough scenarios.';
    } else {
      window.localStorage.setItem("game_id", game.game_id);
      window.localStorage.setItem("player_id", game.player.id);
      for (let i = 0; i < scenarios.length; i++) {
        pTags[i].innerText = scenarios[i].text;
        pTags[i].id = scenarios[i].id;
      }
    }
  }

  /**
   * Is called if a user clicks on a card and calls the API to add the selected scenario
   */
  function selectScenario() {
    let params = new FormData();
    params.append('game_id', window.localStorage.getItem('game_id'));
    params.append('scenario_id', this.id);
    fetch('/selectScenarios', {method: 'POST', body: params})
      .then(checkStatus)
      .then(resp => resp.json())
      .then(select)
      .catch(handleError);
  }

  /**
   * Changes the appearance of the selected card and makes it unclickable
   * @param {JSON} scenario the game ID and scenario ID of the selected scenario
   */
  function select(scenario) {
    id(scenario.scenario_id).classList.add("selected");
    id(scenario.scenario_id).removeEventListener('click', selectScenario);
  }

  /**
   * Calls the bingo API to see the game result
   */
  function bingo() {
    id('error').textContent = '';
    let params = new FormData();
    params.append('game_id', window.localStorage.getItem('game_id'));
    fetch('/bingo', {method: 'POST', body: params})
      .then(checkStatus)
      .then(resp => resp.json())
      .then(gameResult)
      .catch(handleError);
  }

  /**
   * Displays the appropriate message for the game result
   * @param {JSON} result the game result returned from the API
   */
  function gameResult(result) {
    if (!result.winner) {
      let msg = id('message');
      msg.textContent = 'Nobody\'s won yet.';
      setTimeout(function() {
        msg.textContent = '';
      }, 2000);
    } else {
      let squares = document.getElementsByClassName('scenario');
      for (let i = 0; i < squares.length; i++) {
        squares[i].removeEventListener('click', selectScenario);
      }
      let msg = id('message');
      msg.textContent = 'You won!!!';
      qs('section').appendChild(msg);
      id('name').disabled = false;
      id('new-game').disabled = false;
      id('size-select').disabled = false;
    }
  }

  /**
   * Calls the resume game API
   */
  function resumeGame() {
    id('error').textContent = '';
    id('name').disabled = true;
    id('new-game').disabled = true;
    id('size-select').disabled = true;
    fetch('/resumeGame?game_id=' + window.localStorage.getItem('game_id') + '&player_id=' +
    window.localStorage.getItem('player_id'))
      .then(checkStatus)
      .then(resp => resp.json())
      .then(showPrevious)
      .catch(handleError);
  }

  /**
   * Shows the existing game that was resumed at the state it was left at
   * @param {JSON} game the JSON response of the game statistics with already selected scenarios
   */
  function showPrevious(game) {
    showCards(game.player.board.length);
    showScenarios(game);
    let selected = game.player.selected_scenarios;
    for (let i = 0; i < selected.length; i++) {
      id(selected[i]).classList.add("selected");
      id(selected[i]).removeEventListener('click', selectScenario);
    }
    id('size-select').value = game.player.board.length;
  }

  /**
   * Resets the website and clears local storage
   */
  function resetGame() {
    id('new-game').disabled = false;
    id('size-select').disabled = false;
    id('name').disabled = false;
    id('resume').disabled = true;
    id('board').innerHTML = '';
    id('error').textContent = '';
    id('message').textContent = '';
    window.localStorage.clear();
  }

  /**
   * Makes sure the response we get is OK
   * @param {response} res the response from the API
   * @return {response} returns the response
   */
  async function checkStatus(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Displays an error if an error occurs in the API
   */
  function handleError() {
    id('error').textContent = 'Error: An unexpected error occurred. Please try again.';
  }

  /** ------------------------------ Helper Functions  ------------------------------ */

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

})();