var Discord = require("discord.js");
var request = require("request");
var express = require('express');
express().listen(process.env.PORT)
var fs = require("fs");
var http = require("http"); 
var Config = require(__dirname + "/config/config.json")
var client = new Discord.Client();
var Prefix = Config.prefix;
var BotToken = Config.token;
var OwnerId = "UR ID HERE"

client.on(`reconnecting`, async function () {
  
  console.log(`attempting to reconnect ... `)
  
});

client.on('error', e => console.error(e))

client.on("ready", async function() {
  
console.log(`logged in as ${client.user.tag}, Client ID: ${client.user.id}`)

});

client.on("message", async message => {

    const args = message.content.slice(Prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (message.content.indexOf(Prefix) !== 0) return;
    if (message.author.bot) return;
  
  
  if (command == "clone") {
   if (!message.guild) {
     if (!args[0]) return;
     var origguild = client.guilds.get(args[0]);
   } else {
     if (!args[0]) {var origguild = message.guild} else {var origguild = client.guilds.get(args[0])}
   }
     if (!origguild) return;

     var og = {
        name: origguild.name,
        icon: origguild.iconURL,
        channels: origguild.channels.array(),
        roles: origguild.roles.array(),
        emojis: origguild.emojis.array()
    }
           
            const newguild = await client.user.createGuild(og.name, "london");
    
            var c = await newguild.createChannel(`inv`)
            await c.createInvite().then(i => message.reply(`join in 10 seconds . . . \n${i.url}`))
              
            await setTimeout(async function() {
            await c.delete()
            }, 10000)
            
    
            await newguild.channels.find(c => c.type === "voice").delete()
            await newguild.channels.filter(c => c.type === 'category').map(c=>c.delete())
            await newguild.channels.forEach(c => {if (c.name == "general") c.delete()}) 
  
            await newguild.setIcon(og.icon)
       
            await message.channel.send(`Set icon for new guild`)
            
            await createRoles(message, og.roles, newguild)
     
            await message.channel.send(`Created ${origguild.roles.size} roles with their permissions`) 
     
            await createEmojis(message, og.emojis, newguild)
            
            await message.channel.send(`Created ${origguild.emojis.size} emojis`) 
     
            await createCategories(message, og.channels, newguild)
     
            await message.channel.send(`Created ${origguild.channels.filter(c => c.type == "category").size} category channels with permissions`) 
            
            await createChannels(message, og.channels, newguild)
            
            await message.channel.send(`Created ${origguild.channels.size - origguild.channels.filter(c => c.type == "category").size } text and voice channels with permissions`) 
     
            await moveCat(message, og.channels, newguild)
     
            await message.channel.send(`Organizing categories`) 
            
            await message.channel.send(`Setting channel permissions for ${origguild.channels.size} guild channels ...`) 
     
            await setPerms(message, og.channels, newguild)
          
            //await message.channel.send(`done! embedding some messages now . . .`)
            //UNCOMMENT THESE IF YOU WANT BOT TO CLONE SOME MESSAGES
            //await stealmsgs(message, og.channels, newguild)
             
            await message.channel.send(`done! now giving you ownership in the server`)
      
            await newguild.setOwner(message.author)
    
            await message.channel.send(`done.`)
    
      async function stealmsgs(message, channels, newguild) {    
      for (let i = 0; i < channels.length; i++) {
      if (channels[i].type == "text") {
      await send(channels[i])
      }  
      }
      }
  
      async function send(channel) {
      try { var x = await channel.fetchMessages({limit: 10}) } catch (e) {} //LIMIT IS THE AMOUNT OF MESSAGES TO CLONE FROM EACH CHANNEL. (MAX 100) MAKE SURE BOT HAS ADMIN PERMS IN SERVER ELSE IT WILL GET ERRORS
      x = x.array().reverse()
      for (let i = 0; i < x.length; i++) {  
      await newguild.channels.find(q => q.name == x[i].channel.name).createWebhook(x[i].author.username, x[i].author.avatarURL).then(async w => {       
      try { 
      await w.send(x[i].content) 
      await w.delete()
      } catch (e) {        
      await w.delete()
      } 
      })                          
      }
      await message.channel.send(`cloned ${x.length} messages from text channel ${channel}!`)   
      }
      
      async function createRoles(message, roles, newguild) {
  
      for (let i = 0; i < roles.length; i++) {
      await newguild.createRole({
      name: roles[i].name,
      color: roles[i].color,
      permissions: roles[i].permissions
      })}}

      async function createEmojis(message, emojis, newguild) {
   
      for (let i = 0; i < emojis.length; i++) {
      await newguild.createEmoji(emojis[i].url, emojis[i].name);              
      }}
  
      async function createCategories(message, channels, newguild)  {
      
      for (let i = 0; i < channels.length; i++){
      if (channels[i].type == "category")    {
      var y = await newguild.createChannel(channels[i].name, channels[i].type, channels[i].overwrites)   
      }
      }         
      }
     
      async function moveCat(message,channels,newguild) {

      for (let i = 0; i < channels.length; i++) {
      if (channels[i].type == "category")    {
      newguild.channels.find(q => q.name == channels[i].name).setPosition(origguild.channels.find(c => c.name == channels[i].name).calculatedPosition)
      } 
      }
      }
    
     
       async function createChannels(message, channels, newguild)    {
        for (let i = 0; i < channels.length; i++)                 {
        if (channels[i].type !== "category")                      {
           if (channels[i].parent)                                {
           var x = await newguild.createChannel(channels[i].name, channels[i].type, channels[i].overwrites)
           await x.setParent(newguild.channels.find(e => e.name == channels[i].parent.name)).id  
        } else {
           await newguild.createChannel(channels[i].name, channels[i].type, channels[i].overwrites)
        }
        }
        }
        }
   
          async function setPerms(message, channels, newguild) {
          channels.forEach(async c=> {
          if (c.type == "category") {
          var overwrites = await c.permissionOverwrites.map( permOver => {
          if (permOver.type !== "member") {
          return {
          id: newguild.roles.find(r => r.name == origguild.roles.find(r => r.id == permOver.id).name).id,
          allowed: permOver.allow,
          denied: permOver.deny,
          };
          } else {  
          return {id: permOver.id} 
          }
          });
          await newguild.channels.find(o => o.name == c.name).replacePermissionOverwrites({overwrites: overwrites})    
          }
            
          if (c.type == "text") {    
          var overwrites = await c.permissionOverwrites.map(permOver => {            
          if (permOver.type !== "member") { 
          return {               
          id: newguild.roles.find(r => r.name == origguild.roles.find(r => r.id == permOver.id).name).id,
          allowed: permOver.allow,
          denied: permOver.deny,
          };
          } else {
          return {id: permOver.id}       
          }
          });
          await newguild.channels.find(o => o.name == c.name).replacePermissionOverwrites({overwrites: overwrites})            
          }
            
          if (c.type == "voice") {    
          var overwrites = await c.permissionOverwrites.map(permOver => {            
          if (permOver.type !== "member") { 
          return {               
          id: newguild.roles.find(r => r.name == origguild.roles.find(r => r.id == permOver.id).name).id,
          allowed: permOver.allow,
          denied: permOver.deny,
          };
          } else {
          return {id: permOver.id}
          }
          });
          await newguild.channels.find(o => o.name == c.name).replacePermissionOverwrites({overwrites: overwrites})  
          }            
          });
          }
          }
  
});

client.on("debug", async info => {
  
  console.log(info)
  
})

client.login(BotToken).catch(console.error);
