![SFL Ultimate Logo](public/images/logo-circled.png)

# South Florida Ultimate

[SFLUltimate.com](http://sflultimate.com) is a [Node.js KeystoneJS](http://keystonejs.com/docs/getting-started/) project running on a MongoDB and hosted on Heroku aimed to ease player registration, maintain stats.

From a front-end perspective, this project utilizes Bootstrap 3 and SCSS as a CSS preprocessor, Jade as a templating engine, and a small amount of jQuery, though some components might later be built in Angular.

## Dependencies 

You will need:
- `git` : For collaborative software development
- `node` : For running the application ([v0.12.9](https://nodejs.org/en/blog/release/v0.12.9/) recommended)
- `mongo` : For the database of content
- `grunt` : For task automation
- `heroku toolbelt` : For deployment to the Heroku platform

Additionally you will require to install:
- [JSHint](http://jshint.com/install/): Javascript lint tool.
- [Nodemon](https://github.com/remy/nodemon): Tool to restarting the application on a server side file change (while in development mode only)
- [Sass](http://sass-lang.com/install): Tool to convert scss and sass files into css files.


#### For Windows Users

- You will need python.


## Installation process

This assumes you already have the project downloaded from git.

```bash
npm install # to install all Node.js modules required by the project package.json
mongod      # to start running mongo database (need to run on separate tab or run in background)
grunt serve # to run application on port 5000 (or 3000 if you have an older version).
```

On running `grunt serve` successfully the application will now be able to be used on port 5000, at:

- [http://localhost:5000](http://localhost:5000)

> **Note**: You will need a separate `.env` file to be placed inside the project root directory for it to run successfully.  Contact the administrator to receive its contents. Additionally, to populate your database you will need the player data.


## Keystone Links

This project utilizes the Keystone.js CMS system to organize the data schemas.

- http://keystonejs.com/guide
- http://keystonejs.com/docs/getting-started/


## Example Schemas

To view the example schemas view [here](./models/Example-Schemas.md).

## Braintree Testing

- [Reference](https://developers.braintreepayments.com/reference/general/testing/node)
- **Test Credit Card Number**: 4111111111111111

## Exporting DB

```bash
mongodump --host=127.0.0.1 --db sflultimate
mongorestore -h ds039165.mongolab.com:39165 -d heroku_8xfcj7cs  -u <user> -p <password> dump/sflultimate
```

## Importing Remote DB
```bash
mongodump -h ds039165.mongolab.com:39165 -d heroku_8xfcj7cs -u <user> -p <password>
mongo sflultimate --eval "db.dropDatabase()"
mongorestore --host 127.0.0.1 --port=27017 -d sflultimate dump/heroku_8xfcj7cs
```


## Older Website 

The [older website](https://web.archive.org/web/20160110095115/http://sflultimate.com/) can be viewed via the publicly accessible wayback machine at:

- https://web.archive.org/web/20160110095115/http://sflultimate.com/


- April 30th finals (Saturday @ Amelia Earhart)


If you want a contact, you can email sflultimate@gmail.com, or send a Facebook message to the South Florida Spring League.

The people now that are helping administer the League are Gary Saltzman (helps set up fields), Diane Loveridge (pick captains, create jerseys), Raymond John Powers (run the draft, help me with the website), myself (I code the website), Joe Lackey (helps distribute jerseys/stat sheets and answer any questions about leagues), and Elena (who does the most key accounting, organizational, and insurance work that no one typically sees).

We are also setting up the schedule right now, but games will be either at 7pm or at 9pm.

We talked briefly about storing stats before the draft. this is what I had jotted down in my initial notes that I think will be a good way to handle it:

Have a collection for stats containing these fields/object:
 player_id
game_id
league_id ?
scores
assists
defends
attendance ? (if we ever wanted to track if people were there but didn't get a point)
I would have there be an index/key on player_id and game_id individually so we can easily get all of the stats for a player on their player page, and also all the stats for a game on the game page. 

league_id would be useful to quickly get all of the stats for players in a current league as opposed to career without having to get the list of games in each league then go through and get all of the stats for all of the games, but I haven't really run through the best way to produce the leaderboards in terms of efficiency.

I have ideas for all of the various pages we could have for leagues/teams/games/players so I would like to have the data be somewhat setup for that, but obviously for the spring league we just need something that is up and running and functional.

Main ideas: League Page - have a list of current leagues, upcoming leagues, past leagues. An individual league page would have rankings, schedule, leaderboard (everything linkable)

Team Page - roster, schedule, stats for players on the team available

Game Page - Teams playing, score, stats for both sides (think any sport gamecast screen)
  Also with the ability for certain users to edit in order to input these items

Player Page - list of leagues played + team they were on + total stats for that league along with user information. Ability for the specific player to alter their info on this page and mark what information they want to be public/private

At some point we need to get my computer up and running with keystone, and I need to lend you my notebook with my ideas/sketches in it


```bash
cp ~/Downloads/2016\ Spring\ League\ Stats\ -\ Raw\ Data.csv ~/Documents/GitHub/sflultimate/public/stats.csv
rm ~/Downloads/2016\ Spring\ League\ Stats\ -\ Raw\ Data.csv
```
