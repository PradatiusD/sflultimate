# South Florida Ultimate

## Dependencies 

You will need:
- `git` : For collaborative software development
- `node` : For running the application ([v0.12.9](https://nodejs.org/en/blog/release/v0.12.9/) recommended)
- `mongo` : For the database of content
- `grunt` : For task automation
- `heroku toolbelt` : For deployment to the Heroku platform

Additionally you will require to install:
- [JSHint](http://jshint.com/install/) for javascript linting
- [Nodemon](https://github.com/remy/nodemon) for restarting the application on a server side file change while in development
- [Sass](http://sass-lang.com/install) to convert scss and sass files into css files.

## Installation process

This assumes you already have the project downloaded from git.

```bash
npm install # to install all Node.js modules required by the project package.json
mongod      # to start running mongo database (need to run on separate tab or run in background)
grunt serve # to run application on port 5000 (or 3000 if you have an older version).
```

You will need a separate `.env` file to be placed inside the project root directory for it to run successfully.  Contact the administrator to receive its contents.

## Helpful Links

- http://keystonejs.com/guide
- http://keystonejs.com/docs/getting-started/


## Example Schemas

To view the example schemas view [here](./models/Example-Schemas.md).