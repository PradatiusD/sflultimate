# South Florida Ultimate

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

> **Note**: You will need a separate `.env` file to be placed inside the project root directory for it to run successfully.  Contact the administrator to receive its contents.


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
```

## Old Website

97.74.215.62
