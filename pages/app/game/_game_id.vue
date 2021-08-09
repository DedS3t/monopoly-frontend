<template>
    <div>

        <div v-if="!game.started" >
            <button @click="speak = !speak">
                <i v-if="speak" class="fas fa-volume-up text-2xl"></i>
                <i v-else class="fas fa-volume-mute text-2xl"></i>
            </button>    
            <div class="center-top text-center">
                <h1 class="font-bold text-6xl">Code: <button @click="copyToClipboard(game_id)" class="tooltip"><span class="tooltiptext text-sm">{{ tooltip }}</span>{{ game_id }}</button></h1>
                <button class="tooltip text-2xl text-blue-400 no-text-dec" @click="copyToClipboard(getLink())"><span class="tooltiptext text-sm">{{ tooltip }}</span>Copy Shareable Link</button>
                <h1 class="text-5xl">Players: {{ players }}</h1>
                <div class="mt-5">
                    <button @click="start" class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2 from-green-600 to-green-400 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110">Start</button>
                    <button @click="leave" class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2  from-blue-600 to-blue-400 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110">Leave</button>
                </div>
            </div>
            
        </div>

        <div v-else class="center" style="z-index: 100">
            <div class="tab">
                <button class="tablinks" @click="activeTab=0">Game</button>
                <button class="tablinks" @click="activeTab=1">Properties</button>
                <button class="tablinks" @click="activeTab=2">Players</button>
                <button class="tablink" @click="activeTab=3">Info</button>
            </div>

            <!-- Game Data -->
            <div v-if="activeTab == 0" class="tabcontent">
                <h1 class="text-xl">You have: <span class="text-green-700 font-bold ">${{ currentBalance() }}</span></h1>
        
                <h1 class="text-xl">Position: <span class="font-bold">{{ getCard(currentPosition()).name }}</span></h1>
                <div v-if="game.turn" class="">
                    <h1 class="text-xl">Turn: <span class="font-bold">{{ game.data[game.turn].Username }}</span> <span v-if="game.turn == user_id">(You)</span></h1>
                    <div v-if="game.turn == user_id">
                        <div v-if="isInJail()">
                            <h1 class="text-red-700">You are in jail</h1>
                            <button @click="payOutOfJail">Pay $50 to get out</button>
                        </div> 
                        <div v-if="game.roll">
                            <i :class="getClass(game.roll['dice1'])" class="inline-block text-6xl"></i>
                            <i :class="getClass(game.roll['dice2'])" class="inline-block text-6xl ml-2"></i>
                        </div> 
                        <button v-if="!game.hasRolled" @click="rollDice" class="button">Roll <i class="fas fa-dice"></i></button>
                        <p><button v-if="game.hasRolled" @click="finishTurn" class="button">Finish turn</button></p>
                    </div>
                    <div v-else>
                        <h1 class="text-lg text-gray-500 mt-1">Waiting for your turn...</h1>
                    </div>
                </div>
                

            </div>

            <!-- Properties -->
            <div class="tabcontent" v-if="activeTab == 1">
                <div class="float-left w-1/4">
                    <button v-for="property in getProperties()" class="w-11/12 m-auto border-1 p-1 border-gray-600" :style="'border-color: ' + getPropertyInfo(property).group + '; color: ' + getPropertyInfo(property).group" :key="property.Name" @click="activeProperty = getPropertyInfo(property); print(getPropertyInfo(property))">
                        {{ property.Name }}
                    </button> 
                </div> 
                <div class="float-right w-3/4">
                    <div v-if="getProperties().length == 0">
                        Currently have zero properties
                    </div>
                    <div v-if="activeProperty">
                        <h1>Price: {{ activeProperty.price }}</h1>
                        <h1>Rent: {{ calculateRent(activeProperty.posistion, activeProperty.houses) }}</h1>
                        <h1>Houses: {{ activeProperty.houses }}</h1>

                        <button class="button" v-if="activeProperty.mortgaged" @click="buyBack">Buy Back (${{ activeProperty.price }})</button>
                        <button class="button" v-if="!activeProperty.mortgaged" @click="mortgage">Mortgage (${{ activeProperty.mortgage }})</button>

                        <button v-if="activeProperty.housecost" class="button" @click="buyHouse(activeProperty.posistion)">Buy House (${{ activeProperty.housecost }})</button>
                    </div> 
                </div> 

            </div>

            <!-- Players --> 
            <div class="tabcontent" v-if="activeTab == 2">
                <table>
                    <tr>
                        <th>Player</th>
                        <th>Balance</th>
                        <th>Color</th>
                        <th>Position</th>
                    </tr>
                    <tr v-for="player in getPlayers()" :key="player"> <!-- TODO export to components -->
                        <td>{{ game.data[player].Username }} <p v-if="player == user_id"> (You)</p></td>
                        <td>{{ game.data[player].Balance }}</td>
                        <td><div class="circle" :style="'background-color:' + game.data[player].Color"></div></td>
                        <td>{{ getCard(game.data[player].Pos).name }}</td>
                    </tr> 
                </table>
            </div>  

            <!-- Info -->
            <div class="tabcontent" v-if="activeTab == 3">
                <h1>Game: {{ game_id }}</h1>
                <h1>Players: {{ players }}</h1>
                <button @click="speak = !speak">
                    <i v-if="speak" class="fas fa-volume-up text-2xl"></i>
                    <i v-else class="fas fa-volume-mute text-2xl"></i>
                </button>
            </div>

        </div>

        <canvas ref="canvas" id="canvas" class="center"></canvas>
        <div class="alan-btn"></div>

    </div>
</template>

<script>
import io from 'socket.io-client'
import board from '../../../components/Board'
const directions = {BOTTOM: 0, LEFT: 1, TOP: 2, RIGHT: 3} // directions enum


export default {
    async asyncData({ params }) {
        const game_id = params.game_id;
        return { game_id };
    },
    data(){
        return {
            socket: io('https://d1ztc1ie1xi2la.cloudfront.net'),
            game_id: this.game_id,
            players: 0,
            connected: false,
            user_id: null,
            speak: false,
            activeTab: 0,
            activeProperty: null,
            openPrompt: null,
            tooltip: "Copy to Clipboard",
            waiting: false,
            rejoin: false,
            game: {
                started: false,
                hasRolled: false,
                roll: null,
                turn: null, 
                turnInfo: {},
                data: {},
                notifications: [],
            },
            canvas: {
                canvas: null,
                board: null,
                w: 0,
                h: 0,
                startW: 0,
                startH: 0,
                size: 100,
                users: [],
            },
            spamProtection: {
                start: false, 
            }
            
        }
    },
    mounted(){
        var c = document.getElementById("canvas");
        this.canvas.canvas = c;
        this.canvas.board = c.getContext('2d');
        this.canvas.w = canvas.width * (11 /13);
        this.canvas.h = canvas.height * (11 / 13);
        this.canvas.startW = (canvas.width / 13)
        this.canvas.startH = (canvas.height / 13);
        this.canvas.board.fillStyle = "#000000"
    },
    async created(){

        await this.VerifyRoom();

        alertify.set('notifier','position', 'top-center');
        window.onbeforeunload = (e) => {
            this.leave()
        }
        console.log("emmiting join room")

        this.socket.on("error-message", (info) => {
            this.speakMessage("general", info)
            this.addNoti(info, "danger")
        });

        this.socket.on("failed", () => {
            console.log("FAILED ====");
            this.$router.push("/app/")
        })
        // let user_id = (await this.$axios.get("https://d3jenk3g2s9tcm.cloudfront.net/user/cur")).data
        let user_id = this.$auth.user;
        this.user_id = user_id;

        
        this.socket.emit('join-game', JSON.stringify({"game_id": this.game_id, "user_id": user_id}))


        this.socket.on('joined-game', (message) => {
            console.log(message)
            this.players = parseInt(message)
            this.connected = true;
        });

        this.socket.on('player-join', () => {
            console.log("Player joined")
            this.addNoti("Player Joined", "info")
            this.players += 1;
            this.waiting = false;
        });


        this.socket.on('player-left', () =>{
            console.log("player left")
            this.addNoti("Player Left", "info")
            this.players -= 1;
            this.waiting = false;
        })
        

        setTimeout(() => {
            if(!this.connected && !this.rejoin){
                this.$router.push("/app/")
            }
        }, 5000)
        

        // alan ai stuff

        this.alanBtnInstance = alanBtn({
            key: "bfdc8a46d259d388244cfe8a0cbd27662e956eca572e1d8b807a3e2338fdd0dc/stage",
            onCommand: (commandData) => {
                if (commandData.command === "start") {
                    this.start();
                }else if(commandData.command === "leave") {
                    this.leave();
                }else if(commandData.command === "roll-dice") {
                    this.rollDice();
                }else if(commandData.command === "finish-turn") {
                    this.finishTurn();
                }else if(commandData.command === "buy-property") {
                    this.openPrompt.close();
                    this.openPrompt = null;
                    this.buyProperty();
                }else if(commandData.command === "view-balance"){
                    this.speakMessage("general", `Your balance is: ${this.game.data[this.user_id].Balance}`, true)
                }else if(commandData.command === "view-players"){   
                    // switch to players tab
                    this.activeTab = 2;
                }else if(commandData.command === "view-game"){
                    // switch to game tab
                    this.activeTab = 0;
                }else if(commandData.command === "view-properties"){
                    // switch to property tab
                    this.activeTab = 1;
                }else if(commandData.commnad === "view-location"){
                    // tell location
                    this.speakMessage("general", `You are at ${board[this.game.data[this.user_id].Pos.toString()].name}`, true)
                }else if(commandData.command === "buy-house"){
                    // buy house on property
                    this.buyHouse(this.getPropertyByName(commandData.property).posistion);
                }else if(commandData.command === "info"){
                    // get various info on properties
                    let type = this.prepareText(commandData.type);
                    let card = commandData.property.trim();
                    let response = "Invalid Property";

                    switch(type){
                        case "houses": 
                            let houses = this.getHouses(this.getPropertyByName(card))
                            if(houses != -1)  response = `${commandData.property} has ${houses} houses`
                            break;
                        case "rent":
                            let rent = this.getPropertyByName(card).rent;
                            if(rent)response = `${commandData.property} has ${rent} rent`
                            break;
                        case "price":
                            let price = this.getPropertyByName(card).price;
                            if(price) response = `${commandData.property} costs ${price}`
                            break;
                        case "housecost":
                            let housecost = this.getPropertyByName(card).housecost;
                            if(housecost) response = `${commandData.property}'s house cost is ${housecost}`
                            break;
                    }

                    this.speakMessage("general", response, true);

                }else if(commandData.command === "who-owns"){
                    // who owns a certain card
                    let card = commandData.property.trim();
                    let user = this.whoOwns(this.getPropertyByName(card))
                    
                    if(user == "") this.speakMessage("general","Property doesn't have an owner", true)
                    else this.speakMessage("general", `${this.game.data[user].Username} owns ${commandData.property}`, true)

                }else if(commandData.command === "how-far"){
                    // how far is the nearest card
                    let card = commandData.property.trim();
                    let closest = this.findClosest(card);

                    if(closest && closest != Infinity) this.speakMessage("general", `${card} is ${closest} away`, true)
                    else this.speakMessage("general", "Unable to find property", true)

                }
            },
            rootEl: document.getElementById("alan-btn"),
        });

        this.socket.on('rejoined', (info) => {
            console.log(`REJOINING WITH ${info}`);
            let jsonRes = JSON.parse(info)
            this.game.data = jsonRes["data"];
            this.game.turn = jsonRes["turn"];
            this.game.started = true;

            this.loadGameStart()
        });

        this.socket.on("game-start", (info) => { 
            let jsonRes = JSON.parse(info)
            console.log(jsonRes)
            this.game.data = jsonRes;
            this.game.started = true;
            this.players = Object.keys(jsonRes).length
            console.log("Game starting");
           
            this.loadGameStart()
        });
        
    },
    beforeDestroy(){
        this.leave();
    },
    methods:{
        leave(){
            if(this.connected){
                this.socket.emit('leave-game', JSON.stringify({"game_id": this.game_id,"user_id": this.user_id}))
            }
            this.alanBtnInstance.remove();
            this.socket.destroy();
            console.log("LEAVING ===");
            this.$router.push("/app/")
        },
        isInCircle(a, b, x, y, r){
            var dist_points = (a - x) * (a - x) + (b - y) * (b - y);
            r *= r;
            if (dist_points < r) {
                return true;
            }
            return false;
        },
        async VerifyRoom(){
            this.user_id = this.$auth.user;
            let result = (await this.$axios.get(`https://d3jenk3g2s9tcm.cloudfront.net/game/verify?code=${this.game_id}&user_id=${this.user_id}`, {headers: {'Content-Type': 'application/json'}})).data
            console.log(result);
            if(result["status"] == "rejoin") {
                this.rejoin = true;
                return;
            }

            if(result["status"] != true){
                console.log("Coudlnt verify room");
                this.$router.push("/app/")
            }
        },
        payOutOfJail(){
            if(this.game.turn == this.user_id && this.isInJail() && !this.waiting){
                this.socket.emit("pay-out-jail", JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
            }
        },
        start() {
            if(this.players < 2) {
                this.addNoti("Must have at least 2 players to start game", "danger");
                return;
            }

            if(!this.game.started && !this.spamProtection.start){
                this.socket.emit("start-game", this.game_id);
                setTimeout(() => {
                    this.spamProtection.start = true;
                }, 1000)
            }   
        },
        finishTurn(){
            if(this.game.turn == this.user_id && this.game.hasRolled && !this.waiting){
                this.socket.emit('end-turn', JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
            } else {
                this.addNoti("You must roll the die first!", "danger")
            }
        },
        rollDice(){
            if(!this.game.hasRolled && this.game.turn == this.user_id && !this.waiting){
                this.socket.emit('roll-dice', JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
            }
        },
        buyHouse(pos){
            if(this.game.turn == this.user_id && !this.waiting){
                this.socket.emit('buy-house', JSON.stringify({"game_id": this.game_id, "user_id": this.user_id, "card_pos": String(pos)}))
            }
        },
        currentPosition(){
            return this.game.data[this.user_id].Pos 
        },
        currentBalance(){
            return this.game.data[this.user_id].Balance
        },
        isInJail(){
            return this.game.data[this.user_id].Jail
        },
        addNoti(text, type){
            if(type == "danger" || type == "error"){
                alertify.error(text);
            }else if(type == "success"){
                alertify.success(text)
            }else if(type == "info"){
                alertify.notify(text, 'custom')
            }else if(type == "warning"){
                alertify.warning(text);
            }
        },
        getUsers(idx){
            if(idx >= 40){
                idx -= 40;
            }
            let users = []
            let ids = Object.keys(this.game.data)
            for(let i = 0; i < ids.length; i++){
                if(this.game.data[ids[i]].Pos == idx)users.push(this.game.data[ids[i]]);
            }
            return users
        },
        getPlayers(){
            return Object.keys(this.game.data)
        },
        getCard(idx){
            if(idx >= 40){
                idx -= 40;
            }
            return board[idx.toString()]
        },
        getClass(dice){
            let arr = ["one", "two", "three", "four", "five", "six"]
            return `fas fa-dice-${arr[dice - 1]}`
        },
        buyProperty(){
            if(this.game.turn == this.user_id && !this.waiting){
                 this.socket.emit("request-buy", JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
            } 
        },
        getPropertyInfo(prop){
            let posistions = Object.keys(board);
            for(let i = 0; i < posistions.length; i++){
                if(board[posistions[i]].name == prop.Name) return {...board[posistions[i]], houses: prop.Houses, mortgaged: prop.Mortgaged};
            }
            console.log(`Couldnt find card ${prop.Name}`)
            return null;
        },
        getPropertyByName(name){
            let posistions = Object.keys(board);
            for(let i = 0; i < posistions.length; i++){
                if(board[posistions[i]].name == name) return board[posistions[i]]
            }
            console.log(`Couldnt find card ${prop.Name}`)
            return null;
        },
        calculateRent(pos, houses){
            if(houses && houses > 0) return board[pos.toString()].multiplied_rent[houses - 1];
            else return board[pos.toString()].rent 
        },
        getProperties(){
            return this.game.data[this.user_id]["Properties"]
        },
        speakMessage(name, data, override = false){
            if(this.speak || override){
                this.alanBtnInstance.callProjectApi(name, {data}, (err, result) => {
                    if(error){
                        console.log(error);
                    }
                })
            }
        },
        range(size, startAt = 0) {
                return [...Array(size).keys()].map(i => i + startAt);
        },
        drawImageOnCell(x, y, path, scaleX = 1, scaleY = 1){ // draws image on cell below text
            var image = new Image();
            image.src = require(`~/assets/${path}`)
            image.addEventListener('load', () => {
                let imgWidth = ((this.canvas.w / 11) / 1.5) * scaleX;
                let imgHeight = ((this.canvas.h / 11) / 1.5) * scaleY;
                //this.canvas.board.drawImage(image, x + (imgWidth / 3), y + (this.canvas.h / 11) / 3, imgWidth, imgHeight)
                this.canvas.board.drawImage(image, x + (((this.canvas.w / 11) - imgWidth) / 2), y + (this.canvas.h / 11) / 3, imgWidth, imgHeight)
            }, false)
           
        },
        drawImage(x, y, path, size, callback){ // draws image to take up whole cell
            var image = new Image();
            image.src = require(`~/assets/${path}`)
            image.addEventListener('load', () => {
                this.canvas.board.drawImage(image, x, y, (this.canvas.w / 11) * size, (this.canvas.h / 11) * size)
                if(callback !== undefined) callback();
                
            }, false)
        },
        getHouses(property){
            if(property){
                if(!(property.Type == "special" || property.Group == "railroad" || property.Group == "utility")){
                    let users = Object.keys(this.game.data)
                    for(let i = 0; i < users.length; i++){
                        for(let j = 0; j < this.game.data[users[i]].Properties.length; j++){
                            if(this.game.data[users[i]].Properties[j].Name == property.name){
                                return this.game.data[users[i]].Properties[j].Houses
                            }
                        }
                    }
                    return 0;
                }else return 0;
            } else {
                return -1;
            }
        },
        whoOwns(property){
            if(property && property.type != "special"){
                let users = Object.keys(this.game.data)
                for(let i = 0 ;i < users.length; i++){
                    for(let j = 0; j < this.game.data[users[i]].Properties.length; j++){
                        if(this.game.data[users[i]].Properties[j].name == property.name){
                            return users[i]
                        }
                    }
                }
                return ""
            }else return ""
        },
        findAll(name){
            let props = []

            if(name){
                let positions = Object.keys(board);
                for(let i = 0;i < positions.length; i++){
                    if(board[positions[i]].name.toLowerCase() == name.toLowerCase()) props.push(board[positions[i]])
                }
            }  

            return props 
        },
        findClosest(name){
            // find closest property
            let props = this.findAll(name);
            if(props.length == 0) return null;
            let min = Infinity;

            props.forEach((prop) => {
                if(Math.abs(prop.posistion - this.game.data[this.user_id].Pos) < min){
                    min = Math.abs(prop.posistion - this.game.data[this.user_id].Pos)
                }
            });

            return min;
        },
        print(obj) {
            console.log(obj);
        },
        drawCell(x, y, card, users, direction){
                let ctx = this.canvas.board;
                let w = this.canvas.w;
                let h = this.canvas.h;
                
                ctx.font = "15px Ariel";
                ctx.textAlign = "center";
                // draw cell
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + (h / 11))
                ctx.lineTo(x + (w / 11),y + (h / 11));
                ctx.lineTo(x + (w / 11),y + 0);
                ctx.lineTo(x, y)
                ctx.closePath();
                ctx.stroke();

                let houses = this.getHouses(card);

                let drawHouses = () => {
                    ctx.beginPath();
                    for(let i = 0;i < houses; i++){
                        ctx.fillStyle = "#208B2D";
                        ctx.fillRect(x + (((w / 11) / 10) * i) + (4 * i), y + (h / 11) / 1.25, (w / 11) / 10, (w / 11) / 10)
                    }
                    ctx.fillStyle = "#000000"
                    ctx.closePath();
                    ctx.stroke();
                }

                // draw users
                let drawUsers = () => {
                    for(let i = 0;i < users.length; i++){
                        ctx.beginPath();
                        ctx.fillStyle = users[i].Color;
                        let aspect = users.length > 4 ? users.length : (w / 11) / 4;
                        // depending on direction draw circle as players icon on respective location on property
                        switch(direction){
                            case directions.BOTTOM:
                                ctx.arc(x + (aspect * i) + (aspect / 2), y + (h / 11) + (aspect / 2) , (aspect / 2), 0, Math.PI * 2)
                                this.canvas.users.push({x: x + (aspect * i) + (aspect / 2),y: y + (h / 11) + (aspect / 2), r: (aspect / 2), user: users[i]})
                                break;
                            case directions.LEFT:
                                ctx.arc(x - (aspect / 2), y + (aspect * i) + (aspect / 2), (aspect / 2), 0, Math.PI * 2)
                                this.canvas.users.push({x: x - (aspect / 2),y: y + (aspect * i) + (aspect / 2), r: (aspect / 2), user: users[i]})
                                break;
                            case directions.TOP:
                                ctx.arc(x + (aspect * i) + (aspect / 2), y - (aspect / 2), (aspect / 2), 0, Math.PI * 2)
                                this.canvas.users.push({x: x + (aspect * i) + (aspect / 2), y: y - (aspect / 2), r: (aspect / 2), user: users[i]})
                                break;
                            case directions.RIGHT:
                                ctx.arc(x + (w / 11) + (aspect / 2), y + (aspect * i) + (aspect / 2), (aspect / 2), 0, Math.PI * 2)
                                this.canvas.users.push({x: x + (w / 11) + (aspect / 2), y: y + (aspect * i) + (aspect / 2), r: (aspect / 2), user: users[i]})
                                break;
                        }
                        ctx.closePath()
                        ctx.fill()
                    }
                }

                
                if(card.posistion == 0){
                    // handle GO
                    this.drawImage(x, y, 'go.png', 1, drawUsers);
                }else if(card.posistion == 20){
                    // handle free parking
                    this.drawImage(x, y, 'free-parking2.png', 1, drawUsers);
                }else if(card.posistion == 30){
                    // handle go to jail
                    this.drawImage(x, y, 'go-to-jail.png', 1,drawUsers);
                }else if(card.posistion == 38){
                    // handle luxury tax
                    this.drawImage(x, y, 'luxury-tax.png', 1, drawUsers);
                }else if(card.posistion == 10){
                    // handle jail
                    this.drawImage(x, y, 'jail.png', 0.75, drawUsers);
                }else{
                    // draw top rect
                    if(card.group == "yellow"){ctx.fillStyle = "#f2dc49"
                    }else if(card.group == "blue"){ctx.fillStyle = "#001aff"
                    }else if(card.group == "red"){ctx.fillStyle = "#ff0000"
                    }else if(card.group == "orange"){ctx.fillStyle = "#ffa200"
                    }else if(card.group == "purple"){ctx.fillStyle = "#6200c4"
                    }else if(card.group == "lightblue"){ctx.fillStyle = "#3bc9f5"
                    }else if(card.group == "green"){ctx.fillStyle = "#396e0d"
                    }else if(card.group == "brown"){ctx.fillStyle = "#6e3e0d"}
                    if(card.type == "property" && (card.group != "railroad" && card.group != "utility")){ctx.fillRect(x, y, (w / 11), (h / 11) / 6)}
                    ctx.fillStyle = "#000000"
                    // draw name
                    ctx.fillText(card.name, x + (w / 11) / 2, y + (h / 11) / 3, (w / 11))
                    // draw price
                    if(card.price) {
                        ctx.textAlign = "start"
                        ctx.fillText(`$${card.price}`, x + 7, y + (h / 11) / 2, (w / 11) / 2)
                        ctx.textAlign = "center"
                    }
                    // handle special cards
                    if(card.type == "special"){
                        if(card.action == "chance"){
                            // handle chance card
                            this.drawImageOnCell(x, y, 'chance.png', 1, 0.9)
                        }else if(card.action == "chest"){
                            // handle chest
                            this.drawImageOnCell(x, y, 'chest.png')
                        }
                    }else if(card.group == "railroad"){
                            // handle railroads
                            this.drawImageOnCell(x, y, 'railroad.png')
                    }else if(card.posistion == 12){
                        // handle electric company
                        this.drawImageOnCell(x, y, 'electric-company.png', 0.8)
                    }else if(card.posistion == 28){
                        // handle water works
                        this.drawImageOnCell(x, y, 'water-works.png')
                    }else{
                        drawHouses();
                    }

                    drawUsers();
                    
                }

                ctx.fillStyle = "#000000"
                ctx.stroke();
        },
        drawBoard(){
                // top row
                let w = this.canvas.w;
                let h = this.canvas.h;
                for(const i of this.range(11)){
                    this.drawCell((w / 11) * i + this.canvas.startW, 0 + this.canvas.startH, this.getCard(i + 20), this.getUsers(i + 20), directions.TOP)
                }
                // bottom row
                for(const i of this.range(11)){
                    this.drawCell((w / 11) * i + this.canvas.startW, h - (h / 11) + this.canvas.startH, this.getCard(10 - i), this.getUsers(10 - i), directions.BOTTOM)
                }
                // left row
                for(const i of this.range(9)){
                    this.drawCell(0 + this.canvas.startW, (h / 11) * (i + 1) + this.canvas.startH, this.getCard(19 - i), this.getUsers(19 - i), directions.LEFT)
                }
                // right row
                for(const i of this.range(9)){
                    this.drawCell(w - (w / 11) + this.canvas.startW, (h / 11) * (i + 1) + + this.canvas.startH, this.getCard(i + 31), this.getUsers(i + 31), directions.RIGHT)
                }

        },
        resize(){
                this.canvas.canvas.height = window.innerHeight * (this.canvas.size / 100);
                this.canvas.canvas.width = window.innerWidth * (this.canvas.size / 100);
                this.canvas.w = this.canvas.canvas.width * (11 / 13);
                this.canvas.h = this.canvas.canvas.height * (11 / 13);
                this.canvas.startW = (this.canvas.canvas.width / 13)
                this.canvas.startH = (this.canvas.canvas.height / 13);
                this.canvas.users = [];
                this.drawBoard();
        },
        rerender(){ 
            // may add more to rerendering
            this.resize();
        },
        prepareText(text){
            const regex = /\s/ig
            return text.replaceAll(regex, "")
        },
        copyToClipboard(str) {
            // create textarea with text not visible to user then copy & remove

            const el = document.createElement('textarea');
            el.value = str;
            el.setAttribute('readonly', '');
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            this.tooltip = "Copied to Clipboard!"

            setTimeout(() => {
                this.tooltip = "Copy to Clipboard";
            }, 2000);
        },
        getLink() {
            return `https://voicemonopoly.netlify.app/app/game/${this.game_id}?game=${this.game_id}`
        },
        updatePlayerCard(user_id, property) {
            for(let j = 0; j < this.game.data[user_id].Properties.length; j++){
                if(this.game.data[user_id].Properties[j].Name == property.name){
                    this.game.data[user_id].Properties[j] = {Name: property.name, Houses: property.houses, Mortgaged: property.mortgaged};
                }
            }
        },
        mortgage(){
            if(this.game.turn == this.user_id && !this.waiting) {
                this.socket.emit("mortgage", JSON.stringify({user_id: this.user_id, game_id: this.game_id, pos: this.activeProperty.posistion.toString()}))    
            }
        },
        buyBack() {
            if(this.game.turn == this.user_id && !this.waiting) {
                this.socket.emit("buy-back", JSON.stringify({user_id: this.user_id, game_id: this.game_id, pos: this.activeProperty.posistion.toString()}))    
            }
        },  
        loadGameStart() {
             this.socket.on("change-turn", (user_id) => {
                console.log(`Turn of ${user_id}`)
                this.game.turn = user_id;
                this.game.hasRolled = false;
                this.game.roll = null
                this.turnInfo = {};
            });

            this.socket.on("game-over", () => {
                // non offical exit
                    alertify.dismissAll();

                    alertify.alert("Game End", `Game Over`);
                    this.leave()
            });

            this.socket.on("game-done", (info) => {
                // official exit w winner
                if(info == this.user_id){
                    // you won
                    alertify.alert("Game End", 'YOU WON!!!')
                }else{
                    // didnt win
                    alertify.dismissAll();
                    encouragingQuotes = [
                        'So Close!',
                        'Almost got it!',
                        "You will get this next time!"
                    ]

                    alertify.alert("Game End", `${this.game.data[info].Username} Won! ${encouragingQuotes[Math.floor(Math.random() * encouragingQuotes.length)]}`);
                    this.leave();
                }
            });

            this.socket.on("dice-roll", (info) => {
               
                console.log(`Dice rolled ${info}`)
                let [ dice1, dice2, pos ] = info.split(".").map(Number)
                if(this.game.turn == this.user_id){
                    if (dice1 != dice2) this.game.hasRolled = true
                    this.speakMessage("general", `You have rolled a ${dice1 + dice2}`)
                    this.game.roll = {
                        "dice1": dice1,
                        "dice2": dice2
                    }  
                }else{
                    this.addNoti(`${this.game.data[this.game.turn].Username} rolled a ${dice1 + dice2}`, 'info')
                }
                this.game.data[this.game.turn] = {...this.game.data[this.game.turn], Pos: pos}
                this.rerender();
            })

            this.socket.on("buy-request", (info) => {
                console.log(`Buy request ${info}`)
                let json = JSON.parse(info);
                if(this.game.turn == this.user_id){
                    this.openPrompt = alertify.confirm('Buy Property', `Would you like to buy ${json["name"]} for ${json["price"]}`, () => {this.buyProperty();this.openPrompt = null},() => {this.openPrompt = null}).autoCancel(30)
                    this.speakMessage("general", `Buy property ${json["name"]} for ${json["price"]}`)
                }
            });

            this.socket.on("passed-go", (info) => {
                console.log(`Passed go ${info}`)
                let [ user_id, bal ] = info.split(".");

                this.game.data[user_id] = {...this.game.data[user_id], Balance :Number(bal)}
                if(user_id == this.user_id){
                    this.addNoti("You got $200 for passing go!", 'success')
                }

                this.$forceUpdate();
            });
            
            this.socket.on("property-bought", (info) => {
                console.log(`Property bought ${info}`)
                let [ user_id, bal, Name ] = info.split(".");

                this.game.data[user_id] = {...this.game.data[user_id], Balance: Number(bal)}
                this.game.data[user_id]["Properties"] = [...this.game.data[user_id]["Properties"], {Name, Houses: 0, Mortgaged: false}]
                if(user_id == this.user_id){
                    this.addNoti("You have bought the property", "success");
                    this.speakMessage("general", `You have bought the property`)
                    this.turnInfo.buyproperty = null;
                    this.$forceUpdate();
                }else{
                    this.addNoti(`${this.game.data[this.game.turn].Username} bought ${Name}`, 'info')
                }
            });

            this.socket.on("payed-rent", (info) => {
                console.log(`Payed rent ${info}`)
                let [ user_id, user_id2, bal, bal2, change] = info.split(".")

                if(user_id == this.user_id){
                    this.addNoti(`You payed ${change} rent`, "danger");
                    this.speakMessage("general", `You payed ${change} rent`)
                }else if(user_id2 == this.user_id){
                    this.addNoti(`You got ${change} from rent`, 'success');
                    this.speakMessage("general", `You got ${change} from rent`)
                }

                this.game.data[user_id] = {...this.game.data[user_id], Balance:Number(bal)}
                this.game.data[user_id2] = {...this.game.data[user_id2], Balance:Number(bal2)}

                if(user_id == this.user_id || user_id2 == this.user_id){
                    this.$forceUpdate()
                }

            });

            this.socket.on("mortgage", (info) => {
                console.log(`Mortgage ${info}`);
                let data = JSON.parse(info);
                let property = JSON.parse(data["update"]);
                this.game.data[data["user_id"]] = {...this.game.data[data["user_id"]], Balance: Number(data["balance"])}
                this.updatePlayerCard(data["user_id"], property);
                this.activeProperty = null;
                this.$forceUpdate();
                this.rerender();
                if(data["user_id"] == this.user_id) {
                    this.addNoti(`You have mortgaged ${property.name}`, 'success')
                    this.speakMessage("general", `You have mortgaged ${property.name}`)
                } else {
                    this.addNoti(`${this.game.data[data["user_id"]].Username} mortgaged ${property.name}`, 'info');
                    this.speakMessage("general", `${this.game.data[data["user_id"]].Username} mortgaged ${property.name}`)
                }
            });

            this.socket.on("bought-back", (info) => {
                console.log(`bought-back ${info}`);
                let data = JSON.parse(info);
                let property = JSON.parse(data["update"]);
                this.game.data[data["user_id"]] = {...this.game.data[data["user_id"]], Balance: Number(data["balance"])}
                this.updatePlayerCard(data["user_id"], property);
                this.activeProperty = null;
                this.$forceUpdate();
                this.rerender();
                if(data["user_id"] == this.user_id) {
                    this.addNoti(`You have bought back ${property.name}`, 'success')
                    this.speakMessage("general", `You have bought back ${property.name}`)
                } else {
                    this.addNoti(`${this.game.data[data["user_id"]].Username} bought back ${property.name}`, 'info');
                    this.speakMessage("general", `${this.game.data[data["user_id"]].Username} bought back ${property.name}`)
                }
            });

            this.socket.on("special", (info) => {
                console.log(`Special ${info}`)
                let result = JSON.parse(info)

                if(result["Action"] == "change"){
                    this.game.data[result["User"]] = {...this.game.data[result["User"]], Balance: Number(result["Balance"])}
                }else if(result["Action"] == "move"){
                    this.game.data[result["User"]] = {...this.game.data[result["User"]], Pos: Number(result["Pos"])}
                    this.rerender();
                }

                this.addNoti(result["Info"], "info")
                
            })

            this.socket.on("jail", (info) => {
                console.log(`${info} was jailed`);
                this.game.data[info] = {...this.game.data[info], Pos: 10, Jail: true}
                if(info == this.user_id){
                    this.$forceUpdate()
                    this.addNoti("You are in jail", "danger")
                    this.speakMessage("general", `You are in jail`)
                }
                this.$forceUpdate();
                this.rerender();
            });

            this.socket.on("free-jail", (info) => {
                console.log(`${info} is free from jail`)
                this.game.data[info] = {...this.game.data[info], Jail: false}
                if(info == this.user_id)  this.$forceUpdate();
            });


            this.socket.on("payment", (info) => {
                console.log(`Payment ${info}`)
                let result = JSON.parse(info)
                // TODO find out if changing state with {...this.game.data} is better than direct change
                this.game.data[info] = {...this.game.data[info], Balance: Number(result["Balance"])}
                if(result["User"] == this.user_id) {
                    this.$forceUpdate()
                    this.addNoti(result["Info"], "warning")
                }

            });

            this.socket.on("bought-house", (info) => {
                console.log(`House bought ${info}`)
                let result = JSON.parse(info);
                let success = false;
                for(let i = 0; i < this.game.data[result["user_id"]]["Properties"].length; i++){
                    if(this.game.data[result["user_id"]]["Properties"][i].Name == result["property"]){
                        this.game.data[result["user_id"]]["Properties"][i].Houses = Number(result["houses"])
                        success = true;
                        break;
                    }
                }
                if(!success){
                    this.addNoti(`There was an error with buying the house`, "danger")
                }else{
                    if(result["user_id"] == this.user_id){
                        this.addNoti(`You have bought a house for ${result["property"]}`, "success")
                        this.activeProperty = null;
                    }else{
                        this.addNoti(`${this.game.data[result["user_id"]].Username} has bought a house for ${result["property"]}`, 'info')
                    }
                    this.rerender();
                }

            })

            this.socket.on("bankrupt", (info) => {
                console.log(`${info} went bankrupt`)
                if(info == this.user_id) this.leave();
                else{
                    this.addNoti(`${this.game.data[info].Username} went bankrupt`, "danger")
                    this.speakMessage("general", `${this.game.data[info].Username} went bankrupt`)
                }                
            })

            this.socket.on("temp-leave", () => {
                console.log(`Someone has left`)
                this.waiting = true;
                this.addNoti("Someone has left the game. They have 1 minute to join before the game goes on", "danger")
            });

            window.addEventListener('resize', this.resize);
            this.canvas.canvas.addEventListener('click', (event) => {
                    const rect = this.canvas.canvas.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;
                    this.canvas.users.forEach((user) => {
                        if(this.isInCircle(x, y, user.x, user.y, user.r)){
                            alertify.alert("User",`Clicked on user ${user.user.Username}`);
                        }
                    })
            });
            this.resize();
        }
    },
    directives: {
        // click outside directive for popups

        clickOutside: {
            bind(el, binding, vnode) {
                var vm = vnode.context;
                var callback = binding.value;

                el.clickOutsideEvent = function (event) {
                    if (!(el == event.target || el.contains(event.target))) {
                        return callback.call(vm, event);
                    }
                };
                document.body.addEventListener('click', el.clickOutsideEvent);
            },
            unbind(el) {
                    document.body.removeEventListener('click', el.clickOutsideEvent);
            }
        }
    }


}
</script>

<style scoped>


.center{
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%)
}

.center-top{
    position: absolute;
    left: 50%;
    top: 20%;
    transform: translate(-50%, -50%)
}

.tab {
  overflow: hidden;
  border: 1px solid #ccc;
  background-color: #f1f1f1;
}


.tab button {
  background-color: inherit;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 14px 16px;
  transition: 0.3s;
  font-size: 17px;
}


.tab button:hover {
  background-color: #ddd;
}


.tab button.active {
  background-color: #ccc;
}


.tabcontent {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-top: none;
  height: 200px;
}

table {
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}

.circle{
  height: 2rem;
  width: 2rem;
  border-radius: 50%;
}

.border-1{
    border-width: 1px;
}
.button{
    border: 1px solid black;
    margin-top: 0.2rem;
    margin-bottom: 0.2rem;
    padding: 0.25rem;
    box-shadow: 1px 2px;
}

.part-border{
    border: 2px solid red;
    border-top: none;
    border-right: none;
}

.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 150px;
  background-color: black;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  position: absolute;
  z-index: 1;
  bottom: 100%;
  left: 50%;
  margin-left: -60px;
}

.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: black transparent transparent transparent;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}

.no-text-dec {
    text-decoration: none;
    border: none;
}

</style>