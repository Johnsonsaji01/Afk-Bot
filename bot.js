const mineflayer = require('mineflayer')
const Movements = require('mineflayer-pathfinder').Movements
const pathfinder = require('mineflayer-pathfinder').pathfinder
const { GoalBlock} = require('mineflayer-pathfinder').goals
const mineflayerViewer = require('prismarine-viewer').mineflayer

const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { GoalXZ } = require('mineflayer-pathfinder').goals

const bot = mineflayer.createBot({
  username: 'Bot'
})


const config = require('./settings.json');

function createBot () {
  const bot = mineflayer.createBot({
      username: config['bot-account']['username'],
      password: config['bot-account']['password'],
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version
  })

  bot.loadPlugin(pathfinder)
  const mcData = require('minecraft-data')(bot.version)
  const defaultMove = new Movements(bot, mcData)
  bot.settings.colorsEnabled = false

  bot.once("spawn", function(){
      console.log("\x1b[33m[BotLog] Bot joined to the server", '\x1b[0m')

      if(config.utils['auto-auth'].enabled){
        console.log("[INFO] Started auto-auth module")

          var password = config.utils['auto-auth'].password
          setTimeout(function() {
              bot.chat(`/register ${password} ${password}`)
              bot.chat(`/login ${password}`)
          }, 500);

          console.log(`[Auth] Authentification commands executed.`)
      }

      if(config.utils['chat-messages'].enabled){
        console.log("[INFO] Started chat-messages module")
        var messages = config.utils['chat-messages']['messages']

          if(config.utils['chat-messages'].repeat){
            var delay = config.utils['chat-messages']['repeat-delay']
            let i = 0

            let msg_timer = setInterval(() => {
                bot.chat(`${messages[i]}`)

                if(i+1 == messages.length){
                    i = 0
                } else i++
            }, delay * 1000)
          } else {
              messages.forEach(function(msg){
                  bot.chat(msg)
              })
        }
      }
      

      const pos = config.position

      if (config.position.enabled){
          console.log(`\x1b[32m[BotLog] Starting moving to target location (${pos.x}, ${pos.y}, ${pos.z})\x1b[0m`)
          bot.pathfinder.setMovements(defaultMove)
          bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z))
      }
      
      if(config.utils['anti-afk'].enabled){
        bot.setControlState('jump', true)
        if(config.utils['anti-afk'].sneak){
            bot.setControlState('sneak', true)
        }
      }
  })

  bot.loadPlugin(pathfinder)

bot.once('spawn', () => {
  mineflayerViewer(bot, { firstPerson: true, port: 3000 })

  const path = [bot.entity.position.clone()]
  bot.on('move', () => {
    if (path[path.length - 1].distanceTo(bot.entity.position) > 1) {
      path.push(bot.entity.position.clone())
      bot.viewer.drawLine('path', path)
    }
  })

  const mcData = require('minecraft-data')(bot.version)
  const defaultMove = new Movements(bot, mcData)
  bot.pathfinder.setMovements(defaultMove)
  bot.pathfinder.setGoal(new GoalXZ(1000, 0))
})

  bot.on("chat", function(username, message){
      if(config.utils['chat-log']){
          console.log(`[ChatLog] <${username}> ${message}`)
      }
  })

  bot.on("goal_reached", function(){
      console.log(`\x1b[32m[BotLog] Bot arrived to target location. ${bot.entity.position}\x1b[0m`)
  })

  bot.on("death", function(){
      console.log(`\x1b[33m[BotLog] Bot has been died and was respawned ${bot.entity.position}`, '\x1b[0m')
  })

  if(config.utils['auto-reconnect']){
      bot.on('end', function(){
        createBot()
      })
  }

  bot.on('kicked', (reason) => console.log('\x1b[33m',`[BotLog] Bot was kicked from the server. Reason: \n${reason}`, '\x1b[0m'))
  bot.on('error', err => console.log(`\x1b[31m[ERROR] ${err.message}`, '\x1b[0m'))

}

createBot()
