
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
grunt serve # to run application on port 5000 (or 3000 if you have an older version).
```

## Helpful Links

- http://keystonejs.com/guide
- http://keystonejs.com/docs/getting-started/

### Example Schema:  Team (Serious Trouble)

```js
{ 
    "_id" : ObjectId("535b2d9dec3e308d5e00008d"), 
    "avatar_content_type" : "image/png", 
    "avatar_file_name" : "Dalek.png", 
    "avatar_file_size" : NumberInt(161955), 
    "avatar_updated_at" : ISODate("2014-05-31T23:25:44.312+0000"), 
    "captains" : [
        ObjectId("4f91e8c0ec3e3052e0001366"), 
        ObjectId("4f91e8c5ec3e3052e0001ca6")
    ], 
    "league_id" : ObjectId("53435ae5ec3e30f17b000002"), 
    "league_rank" : NumberInt(24), 
    "losses" : NumberInt(21), 
    "name" : "Serious Trouble", 
    "players" : [
        ObjectId("4f91e8beec3e3052e000084a"), 
        ObjectId("4f91e8bfec3e3052e0000cbb"), 
        ObjectId("4f91e8c0ec3e3052e00010fc"), 
        ObjectId("4f91e8c0ec3e3052e00011d2"), 
        ObjectId("4f91e8c0ec3e3052e0001366"), 
        ObjectId("4f91e8c0ec3e3052e0001386"), 
        ObjectId("4f91e8c5ec3e3052e0001ca6"), 
        ObjectId("4fa01fa5406eb79e12000036"), 
        ObjectId("4fa02630406eb75775000017"), 
        ObjectId("5256ae0cec3e303c9700000a"), 
        ObjectId("52df5a4fec3e300263000003"), 
        ObjectId("53025ca6ec3e308b44000176"), 
        ObjectId("5345a191ec3e30f17b000038"), 
        ObjectId("534bf101ec3e302541000059"), 
        ObjectId("534d6a46ec3e3025410000a6"), 
        ObjectId("53599ea9ec3e308d5e000029"), 
        ObjectId("4f91e8c0ec3e3052e0001360"), 
        ObjectId("4f91e8c3ec3e3052e000194d"), 
        ObjectId("517fd612406eb7262600001d"), 
        ObjectId("512b9aae406eb7064300000e"), 
        ObjectId("535998c0ec3e308d5e000025"), 
        ObjectId("4f91e8bdec3e3052e00002e9")
    ], 
    "point_diff" : NumberInt(-117), 
    "reporters" : [
        ObjectId("4f91e8beec3e3052e000084a"), 
        ObjectId("4f91e8bfec3e3052e0000cbb")
    ], 
    "ties" : NumberInt(1), 
    "wins" : NumberInt(1)
}
```
User:
```js
{ 
    "_id" : ObjectId("4f91e8c0ec3e3052e0001366"), 
    "address" : "931 Woodridge Ct", 
    "alias" : "John", 
    "avatar_content_type" : "image/jpeg", 
    "avatar_file_name" : "090728-133755.jpg", 
    "avatar_file_size" : NumberInt(12397), 
    "avatar_updated_at" : ISODate("2013-06-27T14:53:00.401+0000"), 
    "birthdate" : "1984-09-20", 
    "city" : "Atlanta", 
    "email_address" : "rjohnpowers@gmail.com", 
    "firstname" : "R. John", 
    "gender" : "male", 
    "handedness" : "right", 
    "height" : NumberInt(73), 
    "hometown" : "Coral Springs, FL", 
    "lastname" : "Powers", 
    "middlename" : "", 
    "mysql_ids" : [
        NumberInt(3693)
    ], 
    "occupation" : "Graduate Student", 
    "password_digest" : "$2a$10$suePSTW8hdmly2c222blx.UgGFKB3NAOL7xK2QYe35JvKMJH0AFqm", 
    "permission_groups" : [
        "steering-committee", 
        "user", 
        "league-manager"
    ], 
    "phone" : {
        "phone" : "678-733-2404"
    }, 
    "postal_code" : "30339", 
    "privacy" : {
        "home" : "P", 
        "email" : "P", 
        "weight" : "N", 
        "birthdate" : "N", 
        "height" : "N"
    }, 
    "remember_me_cookie" : null, 
    "state" : "GA", 
    "teams" : [
        ObjectId("4f91e8c7ec3e3052ee0000e2"), 
        ObjectId("4f91e8c7ec3e3052ee0000e4"), 
        ObjectId("4f91e8c7ec3e3052ee000073"), 
        ObjectId("4f91e8c7ec3e3052ee0000d1"), 
        ObjectId("4f91e8c8ec3e3052ee000410"), 
        ObjectId("4f91e8c7ec3e3052ee000096"), 
        ObjectId("4f91e8c8ec3e3052ee0003cb"), 
        ObjectId("4f91e8c7ec3e3052ee0000d5"), 
        ObjectId("4f91e8c7ec3e3052ee000117"), 
        ObjectId("4f91e8c8ec3e3052ee0003e2"), 
        ObjectId("4f91e8c8ec3e3052ee00041f"), 
        ObjectId("4f91e8c7ec3e3052ee00009a"), 
        ObjectId("4f91e8c7ec3e3052ee00006f"), 
        ObjectId("4f91e8c7ec3e3052ee0000cb"), 
        ObjectId("4f91e8c7ec3e3052ee000080"), 
        ObjectId("4f91e8c7ec3e3052ee0000a2"), 
        ObjectId("4f91e8c8ec3e3052ee000434"), 
        ObjectId("4f91e8c8ec3e3052ee0003c2"), 
        ObjectId("4f91e8c7ec3e3052ee000113"), 
        ObjectId("4f91e8c7ec3e3052ee0000c2"), 
        ObjectId("4fcce1dbec3e304f2b0000e2"), 
        ObjectId("4fcce1dbec3e304f2b0000e4"), 
        ObjectId("4fcce1dbec3e304f2b000073"), 
        ObjectId("4fcce1dbec3e304f2b0000d1"), 
        ObjectId("4fcce1dcec3e304f2b000410"), 
        ObjectId("4fcce1dbec3e304f2b000096"), 
        ObjectId("4fcce1dcec3e304f2b0003cb"), 
        ObjectId("4fcce1dbec3e304f2b0000d5"), 
        ObjectId("4fcce1dbec3e304f2b000117"), 
        ObjectId("4fcce1dcec3e304f2b0003e2"), 
        ObjectId("4fcce1dcec3e304f2b00041f"), 
        ObjectId("4fcce1dbec3e304f2b00009a"), 
        ObjectId("4fcce1dbec3e304f2b00006f"), 
        ObjectId("4fcce1dbec3e304f2b0000cb"), 
        ObjectId("4fcce1dbec3e304f2b000080"), 
        ObjectId("4fcce1dbec3e304f2b0000a2"), 
        ObjectId("4fcce1dcec3e304f2b000434"), 
        ObjectId("4fcce1dcec3e304f2b0003c2"), 
        ObjectId("4fcce1dbec3e304f2b000113"), 
        ObjectId("4fcce1dbec3e304f2b0000c2"), 
        ObjectId("4fcd3524ec3e301411000012"), 
        ObjectId("50416112406eb76904000056"), 
        ObjectId("513e0d63406eb7a61f000014"), 
        ObjectId("515387c2406eb7167d000001"), 
        ObjectId("51a10dbc406eb74351000001"), 
        ObjectId("5227c75a406eb79c6ab590f9"), 
        ObjectId("522e74d5406eb72302ab73c9"), 
        ObjectId("5315d54bec3e30e543000002"), 
        ObjectId("53153b92ec3e30175b0001bc"), 
        ObjectId("535b2d9dec3e308d5e00008d")
    ], 
    "weight" : NumberInt(230)
}
```
### Example Schema:  League
```js
{ 
    "_id" : ObjectId("53435ae5ec3e30f17b000002"), 
    "age_division" : "adult", 
    "allow_pairs" : true, 
    "allow_self_rank" : true, 
    "commissioner_ids" : [
        ObjectId("4f91e8bfec3e3052e0001098")
    ], 
    "comped_group_ids" : [
        ObjectId("52dd9d45ec3e30c7c7000002"), 
        ObjectId("52dd9cd1ec3e30c7c7000001"), 
        ObjectId("52dd9ec5ec3e300263000002"), 
        ObjectId("52dd9e34ec3e300263000001")
    ], 
    "comped_player_ids" : [
        ObjectId("4f91e8beec3e3052e00005fd")
    ], 
    "core_options" : {
        "_id" : ObjectId("53435ae5ec3e30f17b000003"), 
        "female_limit" : NumberInt(7), 
        "female_rank_coefficient" : 1.0, 
        "female_rank_constant" : -3.0, 
        "male_limit" : NumberInt(10), 
        "male_rank_coefficient" : 1.0, 
        "male_rank_constant" : -2.0, 
        "rank_limit" : 50.0, 
        "type" : "core"
    }, 
    "created_at" : ISODate("2014-04-08T02:11:49.083+0000"), 
    "description" : "SUMMER LEAGUE!\r\n\r\nsee blog post for all the details.\r\n\r\nSUMMER LEAGUE!", 
    "end_date" : ISODate("2014-08-17T00:00:00.000+0000"), 
    "eos_champion_id" : ObjectId("535b2e60ec3e308d5e000099"), 
    "eos_tourney" : true, 
    "female_limit" : NumberInt(200), 
    "male_limit" : NumberInt(0), 
    "max_grank_age" : NumberInt(2), 
    "mst_champion_id" : ObjectId("535b2e60ec3e308d5e000099"), 
    "mst_tourney" : true, 
    "name" : "2014 Summer COED Ultimate", 
    "price" : NumberInt(95), 
    "registration_close" : ISODate("2014-05-27T00:00:00.000+0000"), 
    "registration_open" : ISODate("2014-04-23T00:00:00.000+0000"), 
    "season" : "summer", 
    "sport" : "ultimate", 
    "start_date" : ISODate("2014-06-03T00:00:00.000+0000"), 
    "updated_at" : ISODate("2014-08-25T22:27:00.032+0000")
}
```
### Example Schema:  Registration Entry
```js
{ 
    "_id" : ObjectId("534577cdec3e30f17b000015"), 
    "availability" : {
        "general" : "75%", 
        "attend_tourney_eos" : true
    }, 
    "comped" : true, 
    "g_rank" : 7.0, 
    "g_rank_result_id" : ObjectId("53594d70ec3e30cf37000158"), 
    "gender" : "female", 
    "league_id" : ObjectId("53435ae5ec3e30f17b000002"), 
    "notes" : "", 
    "paid" : false, 
    "payment_id" : "PAY-8TX48935SX266641NKNCXPTQ", 
    "payment_timestamps" : {
        "pending" : ISODate("2014-04-09T16:39:41.605+0000"), 
        "created" : ISODate("2014-04-09T16:39:42.957+0000"), 
        "authorized" : ISODate("2014-04-09T16:40:07.456+0000")
    }, 
    "paypal_responses" : [
        {
            "id" : "PAY-8TX48935SX266641NKNCXPTQ", 
            "create_time" : "2014-04-09T16:39:42+00:00", 
            "update_time" : "2014-04-09T16:39:42+00:00", 
            "intent" : "authorize", 
            "payer" : {
                "payment_method" : "paypal"
            }, 
            "transactions" : [
                {
                    "amount" : {
                        "currency" : "USD", 
                        "total" : "85.00", 
                        "details" : {
                            "subtotal" : "85.00"
                        }
                    }, 
                    "description" : "AFDC Registration Fee for 2014 Summer Ultimate. [534577cdec3e30f17b000015]", 
                    "related_resources" : [
                        {
                            "authorization" : {
                                "create_time" : "2014-04-09T16:39:42+00:00", 
                                "update_time" : "2014-04-09T16:39:42+00:00", 
                                "parent_payment" : "PAY-8TX48935SX266641NKNCXPTQ", 
                                "valid_until" : "2014-05-08T16:39:42Z", 
                                "links" : [
                                    {
                                        "href" : "https://api.paypal.com/v1/payments/payment/PAY-8TX48935SX266641NKNCXPTQ", 
                                        "rel" : "parent_payment", 
                                        "method" : "GET"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ], 
            "state" : "created", 
            "redirect_urls" : {
                "return_url" : "http://leagues.afdc.com/registrations/534577cdec3e30f17b000015/approved", 
                "cancel_url" : "http://leagues.afdc.com/registrations/534577cdec3e30f17b000015/cancelled"
            }, 
            "links" : [
                {
                    "href" : "https://api.paypal.com/v1/payments/payment/PAY-8TX48935SX266641NKNCXPTQ", 
                    "rel" : "self", 
                    "method" : "GET"
                }, 
                {
                    "href" : "https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-32644744DM2993921", 
                    "rel" : "approval_url", 
                    "method" : "REDIRECT"
                }, 
                {
                    "href" : "https://api.paypal.com/v1/payments/payment/PAY-8TX48935SX266641NKNCXPTQ/execute", 
                    "rel" : "execute", 
                    "method" : "POST"
                }
            ]
        }, 
        {
            "id" : "PAY-8TX48935SX266641NKNCXPTQ", 
            "create_time" : "2014-04-09T16:39:42+00:00", 
            "update_time" : "2014-04-09T16:40:07+00:00", 
            "intent" : "authorize", 
            "payer" : {
                "payment_method" : "paypal", 
                "payer_info" : {
                    "email" : "kirsten.shell@gmail.com", 
                    "first_name" : "Kirsten", 
                    "last_name" : "Shell", 
                    "payer_id" : "JYYESUVK5RTUG", 
                    "shipping_address" : {
                        "line1" : "1383 Glenwood Ave", 
                        "city" : "Atlanta", 
                        "country_code" : "US", 
                        "postal_code" : "30316", 
                        "state" : "GA"
                    }
                }
            }, 
            "transactions" : [
                {
                    "amount" : {
                        "currency" : "USD", 
                        "total" : "85.00", 
                        "details" : {
                            "subtotal" : "85.00"
                        }
                    }, 
                    "description" : "AFDC Registration Fee for 2014 Summer Ultimate. [534577cdec3e30f17b000015]", 
                    "related_resources" : [
                        {
                            "authorization" : {
                                "id" : "9BH271429V598383A", 
                                "create_time" : "2014-04-09T16:39:42+00:00", 
                                "update_time" : "2014-04-09T16:40:07+00:00", 
                                "amount" : {
                                    "currency" : "USD", 
                                    "total" : "85.00", 
                                    "details" : {
                                        "subtotal" : "85.00"
                                    }
                                }, 
                                "state" : "authorized", 
                                "parent_payment" : "PAY-8TX48935SX266641NKNCXPTQ", 
                                "valid_until" : "2014-05-08T16:39:42Z", 
                                "links" : [
                                    {
                                        "href" : "https://api.paypal.com/v1/payments/authorization/9BH271429V598383A", 
                                        "rel" : "self", 
                                        "method" : "GET"
                                    }, 
                                    {
                                        "href" : "https://api.paypal.com/v1/payments/authorization/9BH271429V598383A/capture", 
                                        "rel" : "capture", 
                                        "method" : "POST"
                                    }, 
                                    {
                                        "href" : "https://api.paypal.com/v1/payments/authorization/9BH271429V598383A/void", 
                                        "rel" : "void", 
                                        "method" : "POST"
                                    }, 
                                    {
                                        "href" : "https://api.paypal.com/v1/payments/authorization/9BH271429V598383A/reauthorize", 
                                        "rel" : "reauthorize", 
                                        "method" : "POST"
                                    }, 
                                    {
                                        "href" : "https://api.paypal.com/v1/payments/payment/PAY-8TX48935SX266641NKNCXPTQ", 
                                        "rel" : "parent_payment", 
                                        "method" : "GET"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ], 
            "state" : "approved", 
            "links" : [
                {
                    "href" : "https://api.paypal.com/v1/payments/payment/PAY-8TX48935SX266641NKNCXPTQ", 
                    "rel" : "self", 
                    "method" : "GET"
                }
            ]
        }
    ], 
    "player_strength" : "Runner", 
    "self_rank" : 7.0, 
    "signup_timestamp" : ISODate("2014-04-09T16:39:41.605+0000"), 
    "status" : "active", 
    "user_data" : {
        "birthdate" : "1983-06-03", 
        "firstname" : "Kirsten", 
        "middlename" : "", 
        "lastname" : "Shell", 
        "gender" : "female", 
        "height" : NumberInt(65), 
        "weight" : NumberInt(125)
    }, 
    "user_id" : ObjectId("4f91e8bfec3e3052e0000d36"), 
    "waiver_acceptance_date" : ISODate("2014-04-09T16:39:41.603+0000")
}
```
### Example Schema:  Games Collection (Random Serious Trouble Game)
```
{ 
    "_id" : ObjectId("53da5052ec3e30791b000050"), 
    "field" : "4a", 
    "fieldsite_id" : ObjectId("4f91e8d7ec3e3052f6000008"), 
    "game_time" : ISODate("2014-08-14T23:00:00.000+0000"), 
    "league_id" : ObjectId("53435ae5ec3e30f17b000002"), 
    "old_scores" : [

    ], 
    "scores" : {
        "reporter_id" : ObjectId("4f91e8beec3e3052e000084a"), 
        "report_time" : ISODate("2014-08-15T00:56:18.844+0000"), 
        "reporter_ip" : "70.193.135.152", 
        "rainout" : false, 
        "forfeit" : false, 
        "535b2d9dec3e308d5e00008d" : NumberInt(6), 
        "536a436dec3e30891d0000f5" : NumberInt(9)
    }, 
    "teams" : [
        ObjectId("535b2d9dec3e308d5e00008d"), 
        ObjectId("536a436dec3e30891d0000f5")
    ], 
    "winner" : ObjectId("536a436dec3e30891d0000f5")
}
```
