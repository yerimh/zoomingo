/**
 * Yerim Heo
 * 12/3/2020
 * CSE 154 AF Wilson Tang
 * This is the "app.js" file of the Zoomingo website. It handles the backend data management
 * of the games and players and scenarios.
 */

'use strict';

const express = require('express');
const multer = require('multer');
const app = express();
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");

// for application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true})); // built-in middleware
// for application/json
app.use(express.json()); // built-in middleware
// for multipart/form-data (required with FormData)
app.use(multer().none()); // requires the "multer" module

app.get('/newGame', async function(req, res) {
  let name = req.query['name'];
  let size = req.query['size'];
  const db = await getDBConnection();
  try {
    let player = await db.get("SELECT * FROM players WHERE name = '" + name + "';");
    if (!player) {
      await db.run("INSERT INTO players (name) VALUES (?);", [name]);
      player = await db.get("SELECT * FROM players WHERE name = '" + name + "';");
    }
    let gameRows = await db.run("INSERT INTO games (winner) VALUES (?);", []);
    await db.run("INSERT INTO game_state (game_id, player_id, given_scenario_ids, " +
    "selected_scenario_ids) VALUES (?, ?, ?, ?);", [gameRows.lastID, player.id, "[]", "[]"]);
    let board = await db.all("SELECT * FROM scenarios WHERE NOT id = 1 ORDER BY RANDOM() LIMIT " +
    (size - 1) + ";");
    board.splice(Math.floor(size / 2), 0, await db.get("SELECT * FROM scenarios WHERE id = 1;"));
    let id = [];
    for (let i = 0; i < board.length; i++) {
      id[i] = board[i].id;
    }
    await db.run("UPDATE game_state SET given_scenario_ids = '[" + id.join() +
    "]' WHERE game_id = " + gameRows.lastID + ";");
    res.json({
      "game_id": gameRows.lastID,
      "player": {"id": player.id, "name": name, "board": board}
    });
  } catch (error) {
    res.status(500).send("An error occurred on the server. Try again later.");
  }
});

app.post('/selectScenarios', async function(req, res) {
  let game = req.body['game_id'];
  let scenario = req.body['scenario_id'];
  const db = await getDBConnection();
  try {
    let scenarios = await db.get("SELECT given_scenario_ids, selected_scenario_ids " +
    "FROM game_state WHERE game_id = " + game + ";");
    let givenArr = JSON.parse(scenarios.given_scenario_ids);
    let selectedArr = JSON.parse(scenarios.selected_scenario_ids);
    if (givenArr.includes(parseInt(scenario)) && !selectedArr.includes(parseInt(scenario))) {
      selectedArr.push(parseInt(scenario));
      let newSelected = JSON.stringify(selectedArr);
      await db.run("UPDATE game_state SET selected_scenario_ids = '" + newSelected +
      "' WHERE game_id = " + game + ";");
      res.json({
        "game_id": parseInt(game),
        "scenario_id": scenario
      });
    } else if (!givenArr.includes(scenario)) {
      res.status(400).json({
        "error": "Could not select scenario ID: " + scenario
      });
    }
  } catch (error) {
    res.status(500).send("An error occurred on the server. Try again later.");
  }
});

app.post('/bingo', async function(req, res) {
  let game = req.body['game_id'];
  const db = await getDBConnection();
  try {
    let games = await db.get("SELECT winner FROM games WHERE id = " + game + ";");
    if (!games.winner) {
      let board = await db.get("SELECT * FROM game_state WHERE game_id = " + game + ";");
      let selected = JSON.parse(board.selected_scenario_ids);
      let given = JSON.parse(board.given_scenario_ids);
      let playerName = await db.get("SELECT name FROM players WHERE id = " +
      board.player_id + ";");
      let winner = playerName.name;
      if (selected.length >= Math.sqrt(given.length)) {
        await db.run("UPDATE games SET winner = " + board.player_id + ";");
      } else {
        winner = null;
      }
      res.json({
        "game_id": board.game_id,
        "winner": winner
      });
    } else {
      res.status(400).json({
        "error": "Game has already been won."
      });
    }
  } catch (error) {
    res.status(500).send("An error occurred on the server. Try again later.");
  }
});

app.get('/resumeGame', async function(req, res) {
  let gameID = req.query['game_id'];
  let playerID = req.query['player_id'];
  const db = await getDBConnection();
  try {
    let playerExists = await db.get("SELECT player_id FROM game_state WHERE player_id = " +
    playerID + ";");
    if (!playerExists) {
      res.status(400).json({
        "error": "Cannot resume game: Player " + playerID + " was not part of game " + gameID
      });
    } else {
      let rows = await db.get("SELECT * FROM game_state INNER JOIN players " +
      "ON game_state.player_id = players.id WHERE game_state.game_id = " + gameID + ";");
      let board = [];
      let rowsJson = JSON.parse(rows.given_scenario_ids);
      for (let i = 0; i < rowsJson.length; i++) {
        let scen = await db.get("SELECT * FROM scenarios WHERE id = " + rowsJson[i] + ";");
        board.push(scen);
      }
      res.json({
        "game_id": rows.game_id,
        "player": {"id": rows.id, "name": rows.name, "board": board,
          "selected_scenarios": JSON.parse(rows.selected_scenario_ids)}
      });
    }
  } catch (error) {
    res.status(500).send("An error occurred on the server. Try again later.");
  }
});

/**
 * Gets the connection to the Yipper database
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'zoomingo.db',
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || 8080;
app.listen(PORT);