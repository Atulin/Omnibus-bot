const Eris = require('eris');
const http = require('http');
const express = require('express');
var fs = require('fs');
const axios = require('axios');


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
  
    if (msg.content === '!help'){
      
      // Help command
      bot.createMessage(msg.channel.id, {
        embed: {
            title: "Omnibus Bot Help", // Title of the embed
            color: 0x0000F0, // Color, either in hex (show), or a base-10 integer
            fields: [ // Array of field objects
                {
                    name: "!quote", // Field title
                    value: "Show a random, writing-related quote", // Field
                    inline: true // Whether you want multiple fields in same line
                },
                {
                    name: "!sub [message]",
                    value: "Used for pinning monthly prompt submissions. Has to contain a Gdoc link!",
                    inline: true
                }
            ]
        }
    });
    
    } else if (msg.content === '!quote') {
      
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

      
      
    } else if (msg.content.includes('!sub') && subChannels.indexOf(msg.channel.id) != -1) {
      
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