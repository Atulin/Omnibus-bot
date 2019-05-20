const Eris = require('eris');
const http = require('http');
const express = require('express');
var fs = require('fs');
const axios = require('axios');
var schedule = require('node-schedule');


/// Manage settings
function getConf(key) {
  let data = fs.readFileSync( 'config.json')
  return JSON.parse(data)[key];
};

function setConf(key, value) {
  let data = fs.readFileSync( 'config.json')
  let d = JSON.parse(data);
  d[key] = value;
  let s = JSON.stringify(d);

  fs.writeFileSync("config.json", s); 
};

function addConfArrItem(key, value) {
  let data = fs.readFileSync( 'config.json')
  let d = JSON.parse(data);
  
  if(d[key].indexOf(value) === -1) {
      d[key].push(value);
  }
  
  let s = JSON.stringify(d);

  fs.writeFileSync("config.json", s); 
}

// Send quotes on schedule
var j = schedule.scheduleJob('0 0 0,4,8,12,16,20 ? * * *', function(){
  console.log('Quote sent');      // Quote command
      axios.get('https://sfnw.online/api/quotes.php')
        .then(response => {
          console.log(response.data.quote);
          console.log(response.data.author);
          bot.createMessage('207507139130949632', {
            embed: {
                description: '*' + response.data.quote + '*',
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
                footer: { // Footer text
                    text: '~ '+response.data.author
                }
            }
          });
        })
        .catch(error => {
          console.log(error);
        });  
});

// Keep the bot alive
// Alongside https://uptimerobot.com/

// const app = express();
// app.get("/", (request, response) => {
//   console.log(Date.now() + " Ping Received");
//   response.sendStatus(200);
// });
// app.listen(process.env.PORT);
// setInterval(() => {
//   http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
// }, 280000);
 
const bot = new Eris(process.env.DISCORD_BOT_TOKEN);
const role = getConf('role');
const subChannels = getConf('submission-channels');


bot.on('ready', () => {
  console.log('Ready!');
});
 
bot.on('messageCreate', (msg) => {
  
    if (msg.content === '!h'){
      
      // Help command
      bot.createMessage(msg.channel.id, {
        embed: {
            title: "Omnibus Bot Help", // Title of the embed
            color: 0x0000F0, // Color, either in hex (show), or a base-10 integer
            fields: [ // Array of field objects
                {
                    name: "!quote (!q)", // Field title
                    value: "Show a random, writing-related quote", // Field
                },
                {
                    name: "!sub (!s) [message]",
                    value: "Used for pinning monthly prompt submissions. Has to contain a Gdoc link!",
                },
                {
                    name: "!art (!a) [query] [amount]",
                    value: "Use for looking up lectures on sfnw.online. Query with more than 1 word needs to be enclosed in quotes. Amount is capped at 5.",
                }
            ]
        }
    });
    
    } else if (msg.content === '!quote' || msg.content === '!q') {

        msg.delete();
      
      // Quote command
      axios.get('https://sfnw.online/api/quotes.php')
        .then(response => {
          console.log(response.data.quote);
          console.log(response.data.author);
          bot.createMessage(msg.channel.id, {
            embed: {
                description: '*' + response.data.quote + '*',
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
                footer: { // Footer text
                    text: '~ '+response.data.author
                }
            }
          });
        })
        .catch(error => {
          console.log(error);
        });   
      
    } else if (msg.content.split(' ')[0] === '!art' || msg.content.split(' ')[0] === '!a'){
      
      let cmd = msg.content.match(/[^\s"]+|"([^"]*)"/gi);
      cmd.map(s => s.trim());
      
      var res = bot.createMessage(msg.channel.id, 'Just give me a second to find it for you :ok_hand:');
      
        axios.get('https://sfnw.online/api/articles.php?search=' + cmd[1]+'&limit=' + Math.min(5, parseInt(cmd[2])))
        .then(response => {
          let arr = response.data;
          
          let fields = [];
          var i;
          for(i = 0; i < arr.length; i++) {
            fields.push(
              {
                "name": arr[i].title,
                "value": ' ``🖋`` By **' + arr[i].author.name + '** in ' + arr[i].category.name + ': [Read here](https://sfnw.online/art/' + arr[i].id + ')',
              }
            )
          }
          
          
          bot.createMessage(msg.channel.id, {
            embed: {
                title: 'Here\'s your search results for "' + cmd[1].replace(/^\|+|\|+$/g, '') + '"',
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
                fields: fields
            }
          });
          
          res.then(response => {
            response.delete()
          });
        })
        .catch(error => {
          console.log(error);
        });   
      
    } else if ((msg.content.split(' ')[0] === '!sub' || msg.content.split(' ')[0] === '!s') && subChannels.indexOf(msg.channel.id) != -1) {
      
      // Submission command
      if (msg.content.includes('docs.google.com')) {
        bot.pinMessage(msg.channel.id, msg.id);
        bot.createMessage(msg.channel.id, 'Hey, <@&'+role+'>, a new submission has been pinned!');
      } else {
        bot.createMessage(msg.channel.id, 'Hey, <@'+msg.member.id+'>, you should include a Google Docs link!');
      }
      
    } else if(msg.member.permission.has('administrator')){
      
      // Init command
      if (msg.content.includes('!init')) {
      
        let m = msg.content.split(' ');

        if (m.length > 1) {

          let channel = m[1];
          let role = m[2];
          setConf('channel', channel);
          addConfArrItem('submission-channels', channel)
          setConf('role', role);

          bot.createMessage(msg.channel.id, 'Initialized on channel ' + channel + ' with role ' + role);  

        } else {
          bot.createMessage(msg.channel.id, 'Syntax is ``!init channel_id role_id``');  
        }
        
      }
      
    } else {
      
    }
});
 
bot.connect();