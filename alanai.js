intent('start', p => {
    p.play({command: 'start'})
    p.play("Starting game")
})

intent('leave', p => {
    p.play({command : 'leave'})
})

intent('(roll | throw) (dice | die)', p => {
    p.play({command: 'roll-dice'})
})

const endIntents = [
    '(end | finish)',
    '(end | finish | stop) turn',
]
intent(endIntents, p => {
    p.play({command: 'finish-turn'})
    p.play("Finising turn")
})

const buyProperty = [
    '(buy | purchase)',
    '(cop | buy | purchase) (property | card | place)'
]
intent(buyProperty, p => {
    p.play({command: 'buy-property'})
})

const viewBalance = [
    'balance',
    'what is my balance',
    'how much money',
    'how much money do i have'
]

intent(viewBalance, p => {
    p.play({command: 'view-balance'})
})

const viewPlayers = [
    'Switch to players',
    'player info',
    'What are the players'
]

intent(viewPlayers, p => {
    p.play({command: 'view-players'})
})

const viewGame = [
    'Switch to game',
    'View game data',
    'What is game data'
]
intent(viewGame, p => {
    p.play({command : 'view-game'})
})

const viewProps = [
    'View (properties | cards | place)',
    'What are my (properties | cards | place)',
    'Switch to (properties | cards | place)'
]

intent(viewProps, p => {
    p.play({command: 'view-properties'})
})

const viewLocation = [
    'What is my (location | position)',
    'Where am i',
    'Where am i located'
]

intent(viewLocation, p => {
    p.play({command: 'view-location'})
})

const buyHouse = [
    '(Buy | Put) house on $(C Mediterranean Avenue | Baltic Avenue | Oriental Avenue | Vermont Avenue | Connecticut Avenue | St Charles Place | States Avenue | Virginia Avenue | St James Place | Tennessee Avenue | New York Avenue | Kentucky Avenue | Indiana Avenue | Illinois Avenue | Atlantic Avenue | Ventnor Avenue | Marvin Gardens | Pacific Avenue | North Carolina Avenue | Pennsylvania Avenue | Park Place | Boardwalk)',
    'Upgrade $(C Mediterranean Avenue | Baltic Avenue | Oriental Avenue | Vermont Avenue | Connecticut Avenue | St Charles Place | States Avenue | Virginia Avenue | St James Place | Tennessee Avenue | New York Avenue | Kentucky Avenue | Indiana Avenue | Illinois Avenue | Atlantic Avenue | Ventnor Avenue | Marvin Gardens | Pacific Avenue | North Carolina Avenue | Pennsylvania Avenue | Park Place | Boardwalk)'
]

intent(buyHouse, p => {
    p.play({command: 'buy-house', property: p.C.value})
})

const info = [
    'How (many | much) $(T houses | rent | house cost | price) on (the | my) (property | card) $(C  Mediterranean Avenue | Baltic Avenue | Oriental Avenue | Vermont Avenue | Connecticut Avenue | St Charles Place | States Avenue | Virginia Avenue | St James Place | Tennessee Avenue | New York Avenue | Kentucky Avenue | Indiana Avenue | Illinois Avenue | Atlantic Avenue | Ventnor Avenue | Marvin Gardens | Pacific Avenue | North Carolina Avenue | Pennsylvania Avenue | Park Place | Boardwalk)',
    'What is the $(T houses | rent | house cost | price) (on | off) (the | my) (property | card) $(C  Mediterranean Avenue | Baltic Avenue | Oriental Avenue | Vermont Avenue | Connecticut Avenue | St Charles Place | States Avenue | Virginia Avenue | St James Place | Tennessee Avenue | New York Avenue | Kentucky Avenue | Indiana Avenue | Illinois Avenue | Atlantic Avenue | Ventnor Avenue | Marvin Gardens | Pacific Avenue | North Carolina Avenue | Pennsylvania Avenue | Park Place | Boardwalk)'
]

intent(info, p => {
    p.play({command: 'info',type: p.T.value, property: p.C.value})
})

const whoOwns = 'Who owns $(C Mediterranean Avenue | Baltic Avenue | Oriental Avenue | Vermont Avenue | Connecticut Avenue | St Charles Place | States Avenue | Virginia Avenue | St James Place | Tennessee Avenue | New York Avenue | Kentucky Avenue | Indiana Avenue | Illinois Avenue | Atlantic Avenue | Ventnor Avenue | Marvin Gardens | Pacific Avenue | North Carolina Avenue | Pennsylvania Avenue | Park Place | Boardwalk)'
   

intent(whoOwns, p => {
    p.play({command: 'who-owns', property: p.C.value})
})

const howFar = [
    'How far is $(C GO | Mediterranean Avenue | Community Chest | Baltic Avenue | Income Tax | Reading Railroad | Oriental Avenue | Chance | Vermont Avenue | Connecticut Avenue | Jail | St Charles Place | Electric Company | States Avenue | Virginia Avenue | Pennsylvania Railroad | St James Place | Community Chest | Tennessee Avenue | New York Avenue | Free Parking | Kentucky Avenue | Chance | Indiana Avenue | Illinois Avenue | B and O Railroad | Atlantic Avenue | Ventnor Avenue | Water Works | Marvin Gardens | Go To Jail | Pacific Avenue | North Carolina Avenue | Community Chest | Pennsylvania Avenue | Short Line | Chance | Park Place | Luxury Tax | Boardwalk)',
    'What do I need to (roll | get) (for | to land on)  $(C GO | Mediterranean Avenue | Community Chest | Baltic Avenue | Income Tax | Reading Railroad | Oriental Avenue | Chance | Vermont Avenue | Connecticut Avenue | Jail | St Charles Place | Electric Company | States Avenue | Virginia Avenue | Pennsylvania Railroad | St James Place | Community Chest | Tennessee Avenue | New York Avenue | Free Parking | Kentucky Avenue | Chance | Indiana Avenue | Illinois Avenue | B and O Railroad | Atlantic Avenue | Ventnor Avenue | Water Works | Marvin Gardens | Go To Jail | Pacific Avenue | North Carolina Avenue | Community Chest | Pennsylvania Avenue | Short Line | Chance | Park Place | Luxury Tax | Boardwalk)'
]

intent(howFar, p => {
    p.play({command: 'how-far', property: p.C.value})
})



projectAPI.general = function(p, param, callback) {
    p.play(param.data)
}