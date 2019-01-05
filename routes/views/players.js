const keystone = require('keystone');
const Player = keystone.list('HatterPlayer');

module.exports = function (req, res) {

    const query = Player.model.find();
    
    query.exec(function (err, players) {
        res.json(players);
    });
};
