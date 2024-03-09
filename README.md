![SFL Ultimate Logo](public/images/logo-circled.png)

# South Florida Ultimate

[SFLUltimate.com](http://sflultimate.com) is a [Node.js KeystoneJS](http://keystonejs.com/docs/getting-started/) project running on MongoDB and hosted on Heroku aimed to ease player registration, maintain stats.

From a front-end perspective, this project utilizes Bootstrap 3 and SCSS as a CSS preprocessor, Jade as a templating engine, and a small amount of jQuery and AngularJs.

## Download This First 

You will need:
- `git`: For collaborative software development
- `node`: For running the application (check package.json for supported version), recommend using [`n`](https://github.com/tj/n) to switch between versions
- `mongo`: The database
- `grunt`: For task automation
- `heroku toolbelt`: For Heroku deployment 

Additionally, you will need to install:
- [JSHint](http://jshint.com/install/): Javascript lint tool.
- [Nodemon](https://github.com/remy/nodemon): Tool to restarting the application on a server side file change (while in development mode only)
- [Sass](http://sass-lang.com/install): Tool to convert scss and sass files into css files.

## To Install

This assumes you already have the project downloaded from git.

```bash
npm i # to install all Node.js modules required by the project package.json
brew services start mongod # to start mongodb deamon via Homebrew
grunt serve # to run application on port 5000 (or 3000 if you have an older version).
```

On running `grunt serve` successfully the application will now be able to be used on port 5000, at:

- [http://localhost:5000](http://localhost:5000)

> **Note**: You will need a separate `.env` file to be placed inside the project root directory for it to run successfully.  Contact the administrator to receive its contents. Additionally, to populate your database you will need the player data.

It will need to contain something like the following values:

```
BRAINTREE_ENV=
BRAINTREE_MERCHANT_ID=
BRAINTREE_PRIVATE_KEY=
BRAINTREE_PUBLIC_KEY=
CLOUDINARY_URL=
COOKIE_SECRET=
KEYSTONE_USERNAME=
KEYSTONE_PASSWORD=
MONGOLAB_URI=
DATABASE_DUMP_COMMAND=
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
S3_BUCKET=
S3_KEY=
S3_REGION=
S3_SECRET=
SMTP_PASSWORD=
SMTP_USER=
```


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
mongorestore  --uri "mongodb+srv://cluster0.kdjru.mongodb.net/sflultimate"  -u <user> -p <password> dump/sflultimate
```

## Importing Remote DB
```bash
mongodump -h ds039165.mongolab.com:39165 -d heroku_8xfcj7cs -u <user> -p <password>
mongo sflultimate --eval "db.dropDatabase()"
mongorestore --host 127.0.0.1 --port=27017 -d sflultimate dump/heroku_8xfcj7cs
```


## Older Website 

Thanks to[wayback machine](https://web.archive.org/web/20160110095115/http://sflultimate.com/).

To Do:

- Have league prices set at the database, not code level
- Have "X days left" on registration on registration time (set from database)
