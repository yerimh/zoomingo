# Zoomingo API Documentation
The Zoomingo API provides a service which can be used to play a Zoom themed bingo game.

## Get statistics of the current game.
**Request Format:** /newGame endpoint with query parameters of `name` and `size`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns statistics about the current game

**Example Request:** /newGame?name=Britney&size=9

**Example Response:**
```json
{
  "game_id": 42,
  "player": {
    "id": 12,
    "name": "Britney",
    "board": [
      {"id": 15, "text": "abc"},
      // ...
    ]
  }
}
```

**Error Handling:**
- N/A

## Post the selected scenario to the database
**Request Format:** /selectScenarios endpoint with POST parameters of `game_id` and `scenario_id`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Given a valid scenario, adds the scenario to the list of selected scenarios and returns the game ID and scenario ID.

**Example Request:** /selectScenarios with POST parameters of `42` and `15`

**Example Response:**
```json
{
  "game_id": 42,
  "scenario_id": 15
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (json):
  - If a scenario that's not in the list of given scenarios is selected, return an error with the message: `Could not select scenario ID: <insert scenario ID>`

## Click Bingo to get the game result
**Request Format:** /bingo endpoint with POST parameter of `game_id`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Returns whether the player won the game or not.

**Example Request:** /bingo with POST parameter of `42`

**Example Response:**
```json
{
  "game_id": 42,
  "winner": "Britney"
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (json):
  - If there already is a winner, returns an error with the message: `Game has already been won.`

## Resume a game that's already in progress
**Request Format:** /resumeGame endpoint with query parameters `game_id` and `player_id`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Return the statistics of a game that's already in progress and a list of already selected scenarios.

**Example Request:** /resumeGame?game_id=42&player_id=12

**Example Response:**
```json
{
  "game_id": 42,
  "player": {
    "id": 12,
    "name": "Britney",
    "board": [
      {"id": 15, "text": "abc"},
      // ...
    ],
    "selected_scenarios": [
      15,
      1,
      // ...
    ]
  }
}
```

**Error Handling:**

- Possible 400 (invalid request) errors (json):
  - If passed a player_id that's not in game_state, returns an error with the message: `Cannot resume game: Player <id> was not part of game <id>`